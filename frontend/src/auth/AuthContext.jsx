import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { api, setTokenProvider, setUnauthorizedHandler } from '../api/client.js';
import { auth } from '../config/firebase.js';

// Holds the logged-in user from GET /api/me: { id, role, department, title }
//
// Real login: Firebase email + password → Firebase ID token → backend checks it and returns the user.
// Development only: dev tokens (dev-finance, …) skip Firebase — backend needs ALLOW_DEV_TOKENS=true.
const AuthContext = createContext(null);

const DEV_TOKEN_KEY = 'karios-dev-token';

function readDevToken() {
  try {
    return localStorage.getItem(DEV_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveDevToken(token) {
  try {
    if (token) localStorage.setItem(DEV_TOKEN_KEY, token);
    else localStorage.removeItem(DEV_TOKEN_KEY);
  } catch {
    // storage blocked (private window) — the user just logs in again next time
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const mode = useRef(null); // 'firebase' | 'dev' | null

  const clearSession = useCallback(() => {
    mode.current = null;
    setTokenProvider(null);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    const wasFirebase = mode.current === 'firebase';
    saveDevToken(null);
    clearSession();
    if (wasFirebase && auth) await signOut(auth).catch(() => {});
  }, [clearSession]);

  // Asks the backend who this is. Throws if the account isn't set up in the database.
  const loadMe = useCallback(async (newMode, tokenProvider) => {
    mode.current = newMode;
    setTokenProvider(tokenProvider);
    const me = await api('/me');
    setUser(me);
    return me;
  }, []);

  const loginWithEmail = useCallback(
    async (email, password) => {
      if (!auth) throw new Error('Login is not set up yet (Firebase settings missing in frontend/.env).');
      const { user: fbUser } = await signInWithEmailAndPassword(auth, email.trim(), password);
      try {
        return await loadMe('firebase', () => fbUser.getIdToken());
      } catch (err) {
        await logout(); // signed in to Firebase but not allowed in this app
        throw err;
      }
    },
    [loadMe, logout],
  );

  const loginWithDevToken = useCallback(
    async (token) => {
      try {
        const me = await loadMe('dev', () => token);
        saveDevToken(token);
        return me;
      } catch (err) {
        clearSession();
        throw err;
      }
    },
    [loadMe, clearSession],
  );

  const resetPassword = useCallback(async (email) => {
    if (!auth) throw new Error('Login is not set up yet (Firebase settings missing in frontend/.env).');
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  // Restore the session after a page reload.
  useEffect(() => {
    setUnauthorizedHandler(() => logout());

    const devToken = import.meta.env.DEV ? readDevToken() : null;
    if (devToken) {
      loginWithDevToken(devToken)
        .catch(() => saveDevToken(null))
        .finally(() => setLoading(false));
      return undefined;
    }

    if (!auth) {
      setLoading(false);
      return undefined;
    }

    let firstCheck = true;
    return onAuthStateChanged(auth, async (fbUser) => {
      if (firstCheck) {
        firstCheck = false;
        if (fbUser) {
          await loadMe('firebase', () => fbUser.getIdToken()).catch(() => logout());
        }
        setLoading(false);
      } else if (!fbUser && mode.current === 'firebase') {
        clearSession(); // signed out elsewhere (e.g. another tab)
      }
    });
  }, [loadMe, loginWithDevToken, logout, clearSession]);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, loginWithDevToken, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
