// mobile/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from '@firebase/auth';
import { auth } from '../services/firebase';
import { api, setAuthToken } from '../services/api';

const AUTH_STORAGE_KEY = '@karios_mobile_user';
const TOKEN_STORAGE_KEY = '@karios_auth_token';

// Fallback demo user for offline CEO preview & testing
export const MOCK_USERS = {
  'ceo@karios.local': {
    id: 'mock-ceo-id',
    name: 'Executive Officer',
    email: 'ceo@karios.local',
    role: 'CEO',
    department: null,
    title: 'Chief Executive Officer',
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session and listen to Firebase auth state
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedUser && isMounted) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          if (storedToken) setAuthToken(storedToken);
        }
      } catch (e) {
        console.warn('Failed to load stored auth session:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    restoreSession();

    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setAuthToken(token);
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);

          // Attempt to fetch fresh profile from backend /me
          try {
            const profile = await api.getMe();
            if (profile && isMounted) {
              const fullUser = {
                id: profile.id || fbUser.uid,
                email: fbUser.email,
                role: 'CEO',
                department: null,
                title: profile.title || 'Chief Executive Officer',
                name: profile.name || fbUser.displayName || 'Executive Officer',
              };
              setUser(fullUser);
              await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fullUser));
            }
          } catch {
            // If backend is currently unreachable, fallback to current user or token
          }
        } catch (err) {
          console.warn('Firebase token refresh error:', err);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  /**
   * Log in with Email and Password
   * Connects to the EXACT same Firebase Auth database as the Web App!
   */
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. First attempt live Firebase Auth with your existing Web App credentials
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken();
      setAuthToken(token);

      // Fetch user profile & role from the backend /api/me
      let fullProfile;
      try {
        const backendProfile = await api.getMe();
        fullProfile = {
          id: backendProfile.id || fbUser.uid,
          email: fbUser.email,
          role: 'CEO',
          department: null,
          title: backendProfile.title || 'Chief Executive Officer',
          name: backendProfile.name || fbUser.displayName || 'Executive Officer',
        };
      } catch {
        fullProfile = {
          id: fbUser.uid,
          email: fbUser.email,
          role: 'CEO',
          department: null,
          title: 'Chief Executive Officer',
          name: fbUser.displayName || 'Executive Officer',
        };
      }

      await saveSession(fullProfile, token);
      return fullProfile;
    } catch (firebaseErr) {
      // 2. Fallback to demo local accounts if offline or demo accounts used
      if (MOCK_USERS[cleanEmail]) {
        const demo = MOCK_USERS[cleanEmail];
        const devToken = demo.role === 'CEO' ? 'dev-ceo' : `dev-${(demo.department || 'user').toLowerCase()}`;
        await saveSession(demo, devToken);
        return demo;
      }

      // Convert Firebase error code to user-friendly message
      const code = firebaseErr?.code || '';
      let msg = 'Invalid email or password.';
      if (code === 'auth/user-not-found') msg = 'No account found with this email.';
      if (code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      if (code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      if (code === 'auth/invalid-email') msg = 'Invalid email address format.';
      if (code === 'auth/network-request-failed') msg = 'Network error. Check your connection.';
      throw new Error(msg);
    }
  };

  /**
   * Reset password email using live Firebase
   */
  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email.trim());
  };

  /**
   * Quick 1-tap demo switch for testing UI & role permissions
   */
  const demoLogin = async (key) => {
    const account = MOCK_USERS[key];
    if (account) {
      const devToken = account.role === 'CEO' ? 'dev-ceo' : `dev-${(account.department || 'user').toLowerCase()}`;
      await saveSession(account, devToken);
      return account;
    }
  };

  const saveSession = async (userData, token) => {
    setUser(userData);
    if (token) setAuthToken(token);
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      if (token) await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (e) {
      console.warn('Failed to persist auth session:', e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setAuthToken(null);
    try {
      await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, TOKEN_STORAGE_KEY]);
    } catch (e) {
      console.warn('Failed to clear auth session:', e);
    }
  };

  const isCeo = user?.role === 'CEO';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        isCeo,
        loading,
        login,
        demoLogin,
        resetPassword,
        logout,
        saveSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
