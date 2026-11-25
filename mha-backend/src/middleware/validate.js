import { AppError } from './errorHandler.js';

/**
 * Validates req.body against a Zod schema.
 */
export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return next(new AppError(msg, 400));
    }
    req.body = result.data;
    next();
  };
}
