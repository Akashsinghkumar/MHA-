FROM node:22-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev

RUN npx prisma generate

COPY src ./src
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
