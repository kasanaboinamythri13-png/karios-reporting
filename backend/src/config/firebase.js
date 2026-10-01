// ============================================================
// Karios Backend — Firebase Admin SDK Setup
// ============================================================
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { env } from './env.js';

let app = null;
let auth = null;
let bucket = null;

try {
  if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    app = initializeApp({
      credential: cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey,
      }),
      storageBucket: env.firebase.storageBucket,
    });
    auth = getAuth(app);
    bucket = env.firebase.storageBucket ? getStorage(app).bucket() : null;
    console.log('[Firebase] Admin SDK initialized with service account.');
  } else {
    const missing = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'].filter(
      (name) => !process.env[name],
    );
    console.error(`[Firebase] NOT configured — real logins will fail. Missing: ${missing.join(', ')}`);
  }
} catch (err) {
  console.error('[Firebase] NOT configured — real logins will fail. The key could not be read:', err.message);
}

export { app, auth, bucket };
