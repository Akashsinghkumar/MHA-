import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import env from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(
  cors({
    origin: [env.publicSiteUrl, env.adminPanelUrl, 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/admin/register', authLimiter);

app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mha-backend',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
