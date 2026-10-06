// mobile/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { api, setAuthToken } from '../services/api';

const AUTH_STORAGE_KEY = '@karios_mobile_user';
const TOKEN_STORAGE_KEY = '@karios_auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedUser && isMounted) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          if (storedToken) {
            setToken(storedToken);
            setAuthToken(storedToken);
          }
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
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          setAuthToken(idToken);
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, idToken);

          try {
            const profile = await api.getMe();
            if (profile && isMounted) {
              const email = fbUser.email?.toLowerCase() || '';
              const role = profile.role || (email.includes('ceo') ? 'CEO' : 'HEAD');
              const department = profile.department || (email.includes('ceo') ? null : 'DEVELOPMENT');
              const fullUser = {
                id: profile.id || fbUser.uid,
                email: fbUser.email,
                role,
                department,
                title: profile.title || (role === 'CEO' ? 'CEO' : `${department} Head`),
                name: profile.name || fbUser.displayName || email.split('@')[0],
              };
              setUser(fullUser);
              await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fullUser));
            }
          } catch {
            // Backend offline fallback
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

  const saveSession = async (userData, authToken) => {
    setUser(userData);
    if (authToken) {
      setToken(authToken);
      setAuthToken(authToken);
    }
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem('karios_user', JSON.stringify(userData));
      if (authToken) {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, authToken);
        await AsyncStorage.setItem('karios_token', authToken);
      }
    } catch (e) {
      console.warn('Failed to persist auth session:', e);
    }
  };

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Please enter both email and password.');
    }

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } catch (firstErr) {
        if (firstErr?.code === 'auth/invalid-credential' && cleanPassword.length > 0) {
          // If first letter is lowercase, try capitalized (e.g. finance@123 -> Finance@123)
          const firstChar = cleanPassword.charAt(0);
          const isLower = firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase();
          const altPassword = isLower
            ? firstChar.toUpperCase() + cleanPassword.slice(1)
            : firstChar.toLowerCase() + cleanPassword.slice(1);

          try {
            userCredential = await signInWithEmailAndPassword(auth, cleanEmail, altPassword);
          } catch {
            throw firstErr;
          }
        } else {
          throw firstErr;
        }
      }

      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();
      setToken(idToken);
      setAuthToken(idToken);

      let fullProfile;
      try {
        const backendProfile = await api.getMe();
        const role = backendProfile.role || (cleanEmail.includes('ceo') ? 'CEO' : 'DEVELOPER_HEAD');
        const department = backendProfile.department || (role === 'CEO' ? null : 'DEVELOPMENT');
        fullProfile = {
          id: backendProfile.id || fbUser.uid,
          email: fbUser.email,
          role,
          department,
          title: backendProfile.title || (role === 'CEO' ? 'CEO' : `${department} Head`),
          name: backendProfile.name || fbUser.displayName || cleanEmail.split('@')[0],
        };
      } catch {
        const isCeo = cleanEmail.includes('ceo');
        let role = 'DEVELOPER_HEAD';
        let department = 'DEVELOPMENT';
        let title = 'Developer Head';

        if (isCeo) {
          role = 'CEO';
          department = null;
          title = 'CEO';
        } else if (cleanEmail.includes('sale')) {
          role = 'SALES_HEAD';
          department = 'SALES';
          title = 'Sales Head';
        } else if (cleanEmail.includes('market') || cleanEmail.includes('mktg')) {
          role = 'MARKETING_HEAD';
          department = 'MARKETING';
          title = 'Marketing Head';
        } else if (cleanEmail.includes('fin')) {
          role = 'FINANCE_HEAD';
          department = 'FINANCE';
          title = 'Finance Head';
        }

        fullProfile = {
          id: fbUser.uid,
          email: fbUser.email,
          role,
          department,
          title,
          name: fbUser.displayName || cleanEmail.split('@')[0],
        };
      }

      await saveSession(fullProfile, idToken);
      return fullProfile;
    } catch (firebaseErr) {
      console.warn('[Firebase Auth Login Error]:', firebaseErr?.code, firebaseErr?.message);
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

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {}
    setUser(null);
    setToken(null);
    setAuthToken(null);
    try {
      await AsyncStorage.multiRemove([
        AUTH_STORAGE_KEY,
        TOKEN_STORAGE_KEY,
        'karios_user',
        'karios_token',
      ]);
    } catch (e) {
      console.warn('Failed to clear auth session:', e);
    }
  };

  const refreshUser = async () => {
    try {
      const profile = await api.getMe();
      if (profile) {
        setUser((prev) => ({ ...prev, ...profile }));
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...user, ...profile }));
      }
    } catch {}
  };

  const isCeo = user?.role === 'CEO';
  const isCEO = isCeo;
  const isHead = !isCeo && Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role,
        token,
        loading,
        isCeo,
        isCEO,
        isHead,
        login,
        signIn: login,
        logout,
        signOut: logout,
        resetPassword,
        refreshUser,
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
