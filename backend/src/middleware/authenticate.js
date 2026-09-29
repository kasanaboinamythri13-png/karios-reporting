import { Unauthorized } from '../utils/errors.js';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { auth as firebaseAuth } from '../config/firebase.js';

// Verifies the Firebase ID token and attaches the user from the database to req.user.
// Owner: Member 1
//
// TODO:
//   1. Read "Authorization: Bearer <token>"
//   2. auth.verifyIdToken(token)
//   3. Load the user from the DB by firebaseUid; reject if missing or inactive
//   4. req.user = { id, role, department, title }
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return next(Unauthorized('Missing or malformed Authorization header'));
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Dev Token Bypass (for local web testing and Postman)
  // Only when ALLOW_DEV_TOKENS=true in .env — never set it on the live server,
  // otherwise anyone could send "Bearer dev-ceo" and act as the CEO.
  if (env.allowDevTokens && (token.startsWith('dev-') || token.startsWith('mock-'))) {
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

  // Database errors are real server errors (500), not "invalid token" — so they're outside the try above.
  try {
    // Fetch user from Neon PostgreSQL (first login: matched by email, then by firebase_uid)
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

    // Attach firebase_uid on the first login only
    if (!linkedUid) {
      await query('UPDATE users SET firebase_uid = $1 WHERE id = $2;', [uid, user.id]);
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
