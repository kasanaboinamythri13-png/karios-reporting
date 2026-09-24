// ============================================================
// Karios Backend — Role-Based Access Control (RBAC)
// ============================================================
import { Forbidden } from '../utils/errors.js';

const HEAD_ROLES = ['DEVELOPER_HEAD', 'SALES_HEAD', 'MARKETING_HEAD', 'FINANCE_HEAD', 'HEAD'];

/**
 * RBAC middleware guard
 * Usage: router.get('/overview', authenticate, requireRole('CEO'), handler)
 *        router.get('/reports', authenticate, requireRole('HEAD', 'CEO'), handler)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(Forbidden('Authentication required'));
    }

    const userRole = req.user.role;
    
    // Check direct match
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Check generic 'HEAD' permission matching specific head roles
    if (allowedRoles.includes('HEAD') && (HEAD_ROLES.includes(userRole) || userRole.endsWith('_HEAD'))) {
      return next();
    }

    return next(Forbidden(`Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your role is ${userRole}.`));
  };
}
