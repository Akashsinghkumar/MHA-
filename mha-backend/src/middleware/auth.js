import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../config/db.js';

/**
 * Verifies customer JWT token from Authorization Bearer header or httpOnly cookie.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.mha_token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        kycStatus: true,
        isBlocked: true,
        carryForward: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User account not found' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Attaches req.user if a valid token is present, otherwise continues as guest.
 */
export async function optionalAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.mha_token;

    if (token) {
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true, phone: true, isBlocked: true },
      });
      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
}
