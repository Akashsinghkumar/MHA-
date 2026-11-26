FROM node:22-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
# prisma is a devDependency and the postinstall script runs "prisma generate",
# so dev dependencies must be installed for the CLI to be available.
RUN npm install

COPY src ./src
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
