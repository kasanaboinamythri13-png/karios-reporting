// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

const MOCK_USERS = {
  "ceo@karios.local":       { password: "Password123!", user: { id: "mock-ceo-id",   role: "CEO",            department: null,          title: "CEO" } },
  "dev@karios.local":       { password: "Password123!", user: { id: "mock-dev-id",   role: "DEVELOPER_HEAD", department: "DEVELOPMENT", title: "Developer Head" } },
  "sales@karios.local":     { password: "Password123!", user: { id: "mock-sales-id", role: "SALES_HEAD",     department: "SALES",       title: "Sales Head" } },
  "marketing@karios.local": { password: "Password123!", user: { id: "mock-mktg-id",  role: "MARKETING_HEAD", department: "MARKETING",   title: "Marketing Head" } },
  "finance@karios.local":   { password: "Password123!", user: { id: "mock-fin-id",   role: "FINANCE_HEAD",   department: "FINANCE",     title: "Finance Head" } },
};

const USE_MOCK    = import.meta.env.VITE_USE_MOCK_AUTH === "true";
const SESSION_KEY = "karios_mock_user";

export const AuthContext = createContext(null);

function MockAuthProvider({ children }) {
  const [appUser, setAppUser] = useState(() => {
    try {
      const s = sessionStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const login = async (email, password) => {
    const record = MOCK_USERS[email.trim().toLowerCase()];
    if (!record || record.password !== password) {
      const err = new Error("Invalid email or password.");
      err.code = "auth/wrong-password";
      throw err;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(record.user));
    setAppUser(record.user);
  };

  const logout = async () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAppUser(null);
  };

  const resetPassword = async (email) => {
    const record = MOCK_USERS[email?.trim().toLowerCase()];
    if (!record) {
      const err = new Error("No account found with this email.");
      err.code = "auth/user-not-found";
      throw err;
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ appUser, user: appUser, loading: false, login, logout, resetPassword, refreshUser: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

function FirebaseAuthProvider({ children }) {
  const [appUser, setAppUser] = useState(undefined);

  useEffect(() => {
    let unsub;
    (async () => {
      const { onAuthStateChanged } = await import("firebase/auth");
      const { auth }               = await import("../services/firebase");
      const api                    = (await import("../services/api")).default;
      unsub = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try { const { data } = await api.get("/me"); setAppUser(data); }
          catch { setAppUser(null); }
        } else { setAppUser(null); }
      });
    })();
    return () => unsub?.();
  }, []);

  const login = async (email, password) => {
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const { auth } = await import("../services/firebase");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    const { signOut } = await import("firebase/auth");
    const { auth }    = await import("../services/firebase");
    return signOut(auth);
  };

  const resetPassword = async (email) => {
    const { sendPasswordResetEmail } = await import("firebase/auth");
    const { auth } = await import("../services/firebase");
    return sendPasswordResetEmail(auth, email.trim());
  };

  const refreshUser = async () => {
    const api = (await import("../services/api")).default;
    const { getAuth } = await import("firebase/auth");
    if (getAuth().currentUser) {
      const { data } = await api.get("/me");
      setAppUser(data);
    }
  };

  return (
    <AuthContext.Provider value={{ appUser, user: appUser, loading: appUser === undefined, login, logout, resetPassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }) {
  return USE_MOCK
    ? <MockAuthProvider>{children}</MockAuthProvider>
    : <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}