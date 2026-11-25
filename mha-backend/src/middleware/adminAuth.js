import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../config/db.js';

/**
 * Verifies admin JWT token (separate secret from customer tokens).
 */
export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.mha_admin_token;

    if (!token) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const payload = jwt.verify(token, env.adminJwtSecret);
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.adminId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Admin account inactive or not found' });
    }

    const perms = Array.isArray(admin.permissions)
      ? admin.permissions
      : (() => {
          try {
            return JSON.parse(admin.permissions || '[]');
          } catch {
            return [];
          }
        })();

    req.admin = { ...admin, permissions: perms };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin session' });
  }
}

/**
 * Role/permission guard for admin endpoints.
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    if (
      req.admin.role === 'SUPER_ADMIN' ||
      req.admin.permissions.includes('*') ||
      req.admin.permissions.includes(permission)
    ) {
      return next();
    }
    return res.status(403).json({ error: 'Insufficient admin permissions' });
  };
}
