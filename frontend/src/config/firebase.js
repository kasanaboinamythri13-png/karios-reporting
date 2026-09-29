// Firebase web setup (login only). Values come from frontend/.env — see .env.example.
// These are not secrets; Firebase protects the project with "Authorized domains" + the backend checks.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Email/password login only needs the Web API Key + project ID (Project settings → General).
// VITE_FIREBASE_APP_ID is optional.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  ...(import.meta.env.VITE_FIREBASE_APP_ID ? { appId: import.meta.env.VITE_FIREBASE_APP_ID } : {}),
};

// false until the three required values are in frontend/.env — the login form then explains what's missing.
export const firebaseReady = Boolean(config.apiKey && config.authDomain && config.projectId);

export const auth = firebaseReady ? getAuth(initializeApp(config)) : null;
