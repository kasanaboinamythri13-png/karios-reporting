// Firebase Admin SDK setup (verifies login tokens, private file storage).
// Owner: Member 1
//
// firebase-admin v12+ uses modular imports ('firebase-admin/app', '/auth', '/storage');
// the old `admin.credential.cert(...)` style no longer exists.

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
    console.log('[Firebase] Running in DEV mode (no service account). Dev bypass tokens enabled.');
  }
} catch (err) {
  console.warn('[Firebase] Initialization warning:', err.message);
}

export { app, auth, bucket };
