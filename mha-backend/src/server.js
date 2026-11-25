import app from './app.js';
import env from './config/env.js';
import prisma from './config/db.js';

const server = app.listen(env.port, () => {
  console.log(`MHA Backend API running on http://127.0.0.1:${env.port}`);
});

async function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
