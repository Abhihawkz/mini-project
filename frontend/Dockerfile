# -------------------------------
# Stage 1: Build
# -------------------------------
FROM node:22.12.0-alpine AS build

WORKDIR /app

# Copy dependency files first (for better caching)
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy project files
COPY . .

# Build the project
RUN npm run build


# -------------------------------
# Stage 2: Serve with NGINX
# -------------------------------
FROM nginx:alpine

# Copy built files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Configure NGINX
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
