FROM node:22-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY src ./src
COPY uploads ./uploads

ENV NODE_ENV=production
EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/seed.js && npm start"]
