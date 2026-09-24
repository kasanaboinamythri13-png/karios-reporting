import { Forbidden } from '../utils/errors.js';

// Usage: router.get('/overview', authenticate, requireRole('CEO'), handler)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(Forbidden('You do not have access to this resource'));
    }
    next();
  };
}
