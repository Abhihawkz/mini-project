import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import promClient from "prom-client";

const router = express.Router();

const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: "auth_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: "auth_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

const authOperations = new promClient.Counter({
  name: "auth_operations_total",
  help: "Total number of auth operations",
  labelNames: ["operation", "status"],
});

const activeUsers = new promClient.Gauge({
  name: "auth_active_users",
  help: "Number of users with active refresh tokens",
});

const registrationErrors = new promClient.Counter({
  name: "auth_registration_errors_total",
  help: "Total number of registration errors",
  labelNames: ["error_type"],
});

const loginAttempts = new promClient.Counter({
  name: "auth_login_attempts_total",
  help: "Total number of login attempts",
  labelNames: ["status"],
});

const tokenOperations = new promClient.Counter({
  name: "auth_token_operations_total",
  help: "Total number of token operations",
  labelNames: ["operation", "status"],
});

const activeRequests = new promClient.Gauge({
  name: "auth_active_requests",
  help: "Number of active requests being processed",
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(authOperations);
register.registerMetric(activeUsers);
register.registerMetric(registrationErrors);
register.registerMetric(loginAttempts);
register.registerMetric(tokenOperations);
register.registerMetric(activeRequests);

function metricsMiddleware(routeName) {
  return async (req, res, next) => {
    const start = Date.now();
    activeRequests.inc();

    const originalJson = res.json.bind(res);
    res.json = function (data) {
      const duration = (Date.now() - start) / 1000;
      const status = res.statusCode;

      httpRequestDuration
        .labels(req.method, routeName, status)
        .observe(duration);
      httpRequestTotal.labels(req.method, routeName, status).inc();

      activeRequests.dec();
      return originalJson(data);
    };

    next();
  };
}

async function updateActiveUsersCount() {
  try {
    const count = await User.countDocuments({ refreshToken: { $exists: true, $ne: null } });
    activeUsers.set(count);
  } catch (err) {
    console.error("Error updating active users count:", err);
  }
}

function signAccessToken(user) {
  tokenOperations.labels("sign_access", "success").inc();
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
  );
}

function signRefreshToken(user) {
  tokenOperations.labels("sign_refresh", "success").inc();
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
  );
}

router.post("/register", metricsMiddleware("/register"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      authOperations.labels("register", "validation_error").inc();
      registrationErrors.labels("missing_fields").inc();
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      authOperations.labels("register", "duplicate_email").inc();
      registrationErrors.labels("duplicate_email").inc();
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = new User({ name, email, password });
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    authOperations.labels("register", "success").inc();
    await updateActiveUsersCount();

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    authOperations.labels("register", "error").inc();
    registrationErrors.labels("server_error").inc();
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", metricsMiddleware("/login"), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      loginAttempts.labels("validation_error").inc();
      authOperations.labels("login", "validation_error").inc();
      return res.status(400).json({ message: "Missing email or password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      loginAttempts.labels("invalid_credentials").inc();
      authOperations.labels("login", "invalid_credentials").inc();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      loginAttempts.labels("invalid_credentials").inc();
      authOperations.labels("login", "invalid_credentials").inc();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    loginAttempts.labels("success").inc();
    authOperations.labels("login", "success").inc();
    await updateActiveUsersCount();

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    loginAttempts.labels("error").inc();
    authOperations.labels("login", "error").inc();
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/refresh", metricsMiddleware("/refresh"), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      authOperations.labels("refresh", "no_token").inc();
      tokenOperations.labels("refresh", "no_token").inc();
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.id);

    if (!user || user.refreshToken !== refreshToken) {
      authOperations.labels("refresh", "invalid_token").inc();
      tokenOperations.labels("refresh", "invalid_token").inc();
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    authOperations.labels("refresh", "success").inc();
    tokenOperations.labels("refresh", "success").inc();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error(err);
    authOperations.labels("refresh", "error").inc();
    tokenOperations.labels("refresh", "error").inc();
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

router.post("/logout", metricsMiddleware("/logout"), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      authOperations.labels("logout", "no_token").inc();
      return res.status(400).json({ message: "No refresh token provided" });
    }

    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = undefined;
      await user.save();
      authOperations.labels("logout", "success").inc();
      await updateActiveUsersCount();
    } else {
      authOperations.labels("logout", "token_not_found").inc();
    }

    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    authOperations.labels("logout", "error").inc();
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

export default router;