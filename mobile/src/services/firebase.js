// mobile/src/services/firebase.js
import { initializeApp, getApps, getApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';

/**
 * EXACT Firebase Project Configuration matching Web App:
 * Project: karios-reporting-a62df
 */
export const firebaseConfig = {
  apiKey: "AIzaSyD69LLvJpqc5rVY4P74mDyaPZwauQGyIYk",
  authDomain: "karios-reporting-a62df.firebaseapp.com",
  projectId: "karios-reporting-a62df",
  storageBucket: "karios-reporting-a62df.firebasestorage.app",
  messagingSenderId: "328742477959",
  appId: "1:328742477959:web:d1d5d7c15dfcda4b7ed822",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export default app;
