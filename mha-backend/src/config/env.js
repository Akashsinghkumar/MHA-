import dotenv from 'dotenv';
dotenv.config();

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'dev_admin_jwt_secret_key',
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '12h',
  adminInviteCode: process.env.ADMIN_INVITE_CODE || 'MHA-ADMIN-2026',
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'http://127.0.0.1:5174',
  adminPanelUrl: process.env.ADMIN_PANEL_URL || 'http://127.0.0.1:5175',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
};

export default env;
