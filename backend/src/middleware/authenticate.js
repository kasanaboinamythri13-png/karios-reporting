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
  if (!token) {
    return next(Unauthorized('Missing token'));
  }

  // 1. Test logins ("Bearer dev-sales") for local development, tests and Postman.
  //    Refused unless ALLOW_DEV_TOKENS=true — which must never be set on the live server.
  const lower = token.toLowerCase();
  if (lower.startsWith('dev-') || lower.startsWith('mock-')) {
    if (!env.allowDevTokens) {
      return next(Unauthorized('Test logins are turned off on this server'));
    }

    // Look only at the part after "dev-" / "mock-", so "dev-sales" is the Sales Head
    // (not the Developer Head just because the token starts with "dev").
    const who = lower.replace(/^(dev|mock)-/, '');
    let role = null;
    if (who.includes('ceo')) role = 'CEO';
    else if (who.includes('sale')) role = 'SALES_HEAD';
    else if (who.includes('market') || who.includes('mktg')) role = 'MARKETING_HEAD';
    else if (who.includes('fin')) role = 'FINANCE_HEAD';
    else if (who.includes('dev')) role = 'DEVELOPER_HEAD';
    if (!role) {
      return next(Unauthorized(`Unknown test login '${token}'. Use dev-ceo, dev-development, dev-sales, dev-marketing or dev-finance.`));
    }

    try {
      const result = await query(
        'SELECT id, email, role, department, title, is_active FROM users WHERE role = $1 LIMIT 1;',
        [role],
      );
      if (result.rows.length === 0) {
        return next(Unauthorized(`Dev user for token '${token}' not found in database. Run migrations first.`));
      }

      req.user = result.rows[0];
      return next();
    } catch (err) {
      return next(err);
    }
  }

  // 2. Firebase ID Token Verification
  if (!firebaseAuth) {
    return next(Unauthorized('Firebase Admin not configured. Use dev token (e.g. Bearer dev-ceo) for development.'));
  }

  let uid;
  let email;
  try {
    ({ uid, email } = await firebaseAuth.verifyIdToken(token));
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return next(Unauthorized('Firebase token has expired'));
    }
    return next(Unauthorized('Invalid authentication token: ' + error.message));
  }

  try {
    // Fetch user from Neon PostgreSQL (matched by firebase_uid or email)
    const result = await query(
      `SELECT id, email, role, department, title, is_active, firebase_uid
       FROM users
       WHERE firebase_uid = $1 OR lower(email) = lower($2)
       ORDER BY (firebase_uid = $1) DESC NULLS LAST
       LIMIT 1;`,
      [uid, email ?? ''],
    );

    if (result.rows.length === 0) {
      return next(Unauthorized('User account not provisioned in database. Contact administrator.'));
    }

    const { firebase_uid: linkedUid, ...user } = result.rows[0];
    if (!user.is_active) {
      return next(Unauthorized('User account is deactivated'));
    }

    // Attach firebase_uid on first login if not yet attached
    if (!linkedUid) {
      await query('UPDATE users SET firebase_uid = $1 WHERE id = $2;', [uid, user.id]);
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
