// src/context/AuthContext.js
// Manages Firebase auth state + backend user profile + persistent session

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMe } from '../api/authApi';

const AuthContext = createContext(null);

const TOKEN_KEY = 'karios_token';
const USER_KEY  = 'karios_user';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // backend user object
  const [token, setToken]     = useState(null);   // Firebase ID token
  const [loading, setLoading] = useState(true);

  // On mount — restore persisted session
  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const [savedToken, savedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // corrupted storage — clear it
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } finally {
      setLoading(false);
    }
  }

  // Called after Firebase signInWithEmailAndPassword succeeds
  async function signIn(firebaseIdToken) {
    await AsyncStorage.setItem(TOKEN_KEY, firebaseIdToken);
    setToken(firebaseIdToken);
    // Fetch the backend user profile
    const profile = await fetchMe();
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
    return profile;
  }

  async function signOut() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }

  // Refresh backend profile (e.g. after submitting a report)
  async function refreshUser() {
    try {
      const profile = await fetchMe();
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
      setUser(profile);
    } catch {
      // silently fail
    }
  }

  const isCEO  = user?.role === 'CEO';
  const isHead = user?.role !== 'CEO' && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isCEO, isHead, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
