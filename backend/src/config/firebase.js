// ============================================================
// Karios Backend — Firebase Admin SDK Setup
// ============================================================
import admin from 'firebase-admin';
import { env } from './env.js';

let app = null;
let auth = null;
let bucket = null;

try {
  if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey,
      }),
      storageBucket: env.firebase.storageBucket,
    });
    auth = admin.auth(app);
    bucket = env.firebase.storageBucket ? admin.storage(app).bucket() : null;
    console.log('[Firebase] Admin SDK initialized with service account.');
  } else {
    console.log('[Firebase] Running in DEV mode (no service account). Dev bypass tokens enabled.');
  }
} catch (err) {
  console.warn('[Firebase] Initialization warning:', err.message);
}

export { app, auth, bucket };
