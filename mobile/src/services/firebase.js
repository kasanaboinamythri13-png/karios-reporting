import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Auth with React Native persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };
export default app;

