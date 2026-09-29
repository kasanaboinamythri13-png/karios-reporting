// src/context/ToastContext.jsx
import React, { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const toast = {
    success: (title, msg) => addToast("success", title, msg),
    error:   (title, msg) => addToast("error",   title, msg),
    info:    (title, msg) => addToast("info",     title, msg),
    warn:    (title, msg) => addToast("warning",  title, msg),
  };

  const ICONS = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast__icon">{ICONS[t.type]}</span>
            <div className="toast__body">
              <div className="toast__title">{t.title}</div>
              {t.message && <div className="toast__msg">{t.message}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
