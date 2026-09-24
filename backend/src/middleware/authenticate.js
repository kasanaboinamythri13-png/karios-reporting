// ============================================================
// Karios Backend — Authentication Middleware
// Verifies Firebase JWT or Dev Token, loads user from Neon DB
// ============================================================
import { Unauthorized } from '../utils/errors.js';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { auth as firebaseAuth } from '../config/firebase.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return next(Unauthorized('Missing or malformed Authorization header'));
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Dev Token Bypass (Convenient for Local Android / React testing)
  if (token.startsWith('dev-') || token.startsWith('mock-')) {
    const roleSlug = token.replace(/^(dev-|mock-)/, '').toLowerCase();
    
    let roleQuery = "role = 'CEO'";
    if (roleSlug.includes('dev')) roleQuery = "role = 'DEVELOPER_HEAD'";
    else if (roleSlug.includes('sale')) roleQuery = "role = 'SALES_HEAD'";
    else if (roleSlug.includes('market')) roleQuery = "role = 'MARKETING_HEAD'";
    else if (roleSlug.includes('finan')) roleQuery = "role = 'FINANCE_HEAD'";
    else if (roleSlug.includes('ceo')) roleQuery = "role = 'CEO'";

    try {
      const result = await query(`SELECT id, email, role, department, title, is_active FROM users WHERE ${roleQuery} LIMIT 1;`);
      if (result.rows.length === 0) {
        return next(Unauthorized(`Dev user for role '${roleSlug}' not found in database. Run migrations first.`));
      }

      req.user = result.rows[0];
      return next();
    } catch (err) {
      return next(err);
    }
  }

  // 2. Firebase ID Token Verification
  try {
    if (!firebaseAuth) {
      return next(Unauthorized('Firebase Admin not configured. Use dev token (e.g. Bearer dev-ceo) for development.'));
    }

    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const { uid, email } = decodedToken;

    // Fetch user from Neon PostgreSQL
    let result = await query('SELECT id, email, role, department, title, is_active FROM users WHERE firebase_uid = $1 OR email = $2 LIMIT 1;', [uid, email]);

    if (result.rows.length === 0) {
      return next(Unauthorized('User account not provisioned in database. Contact administrator.'));
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return next(Unauthorized('User account is deactivated'));
    }

    // Attach firebase_uid if not yet linked
    if (!user.firebase_uid) {
      await query('UPDATE users SET firebase_uid = $1 WHERE id = $2;', [uid, user.id]);
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return next(Unauthorized('Firebase token has expired'));
    }
    return next(Unauthorized('Invalid authentication token: ' + error.message));
  }
}
