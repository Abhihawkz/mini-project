import express from "express";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import 'dotenv/config'
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin:"*",
}))

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-app";

await connectDB(MONGO_URI);

app.use("/api/auth", authRoutes);
app.get("/",(req,res)=>{
  res.json({msg:"server is running..!"})
})
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({ message: "This is protected", user: req.user });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
