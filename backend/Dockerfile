
FROM node:20 AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --production=false


COPY . .
#################################################
FROM node:20-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app ./

ENV PORT=4000
ENV MONGO_URI=mongodb://chat-network:27017/ai-app
ENV ACCESS_TOKEN_SECRET=replace_with_strong_random_secret
ENV REFRESH_TOKEN_SECRET=replace_with_another_secret
ENV ACCESS_TOKEN_EXPIRES_IN=15m
ENV REFRESH_TOKEN_EXPIRES_IN=7d

USER appuser

EXPOSE 4000

CMD ["node", "server.js"]
