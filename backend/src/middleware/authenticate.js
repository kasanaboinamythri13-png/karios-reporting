import { Unauthorized } from '../utils/errors.js';

// Verifies the Firebase ID token and attaches the user from the database to req.user.
// Owner: Member 1
//
// TODO:
//   1. Read "Authorization: Bearer <token>"
//   2. auth.verifyIdToken(token)
//   3. Load the user from the DB by firebaseUid; reject if missing or inactive
//   4. req.user = { id, role, department, title }
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(Unauthorized('Missing token'));
  }
  next(Unauthorized('Authentication not implemented yet'));
}
