FROM node:20 AS deps

WORKDIR /app

COPY package*.json ./

RUN npm install
#########################################
FROM node:20 AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

##########################################
FROM node:20 AS runner

WORKDIR /app

COPY --from=build /app ./

EXPOSE 3000

CMD ["npm", "start"]
