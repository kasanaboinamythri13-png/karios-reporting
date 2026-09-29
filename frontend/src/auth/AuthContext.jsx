import { createContext, useContext, useState } from 'react';

// Holds the logged-in user: { role: 'HEAD' | 'CEO', department, title }
//
// TEMPORARY: "dev login" lets the frontend team build pages before the backend + Firebase are ready.
// TODO (Member 1 + 2): replace devLogin with Firebase signInWithEmailAndPassword, then call GET /api/me.
const AuthContext = createContext(null);

const STORAGE_KEY = 'karios-dev-user';

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  function devLogin(devUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devUser));
    setUser(devUser);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, devLogin, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
