// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/ToastContext";
import KariosLogo from "../components/shared/KariosLogo";

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === "true";

// Quick-fill buttons for dev convenience
const DEV_ACCOUNTS = [
  { label: "CEO",       email: "ceo@karios.local" },
  { label: "Developer", email: "dev@karios.local" },
  { label: "Sales",     email: "sales@karios.local" },
  { label: "Marketing", email: "marketing@karios.local" },
  { label: "Finance",   email: "finance@karios.local" },
];

// Show / hide password icons (outline style, follow the button's text colour)
const iconProps = {
  width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": true,
};

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.16 3.19" />
      <path d="M6.61 6.61A17.4 17.4 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.39-1.61" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function LoginPage() {
  const [email,    setEmail]    = useState("ceo@karios.local");
  const [password, setPassword] = useState("Password123!");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login, appUser }      = useAuth();
  const navigate                = useNavigate();
  const toast                   = useToast();

  // Redirect if already logged in
  React.useEffect(() => {
    if (appUser) {
      navigate(appUser.role === "CEO" ? "/ceo" : "/head", { replace: true });
    }
  }, [appUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthContext sets appUser; useEffect above will redirect
    } catch (err) {
      const code = err?.code || "";
      let msg = "Invalid email or password.";
      if (code === "auth/user-not-found")    msg = "No account found with this email.";
      if (code === "auth/wrong-password")    msg = "Incorrect password.";
      if (code === "auth/too-many-requests") msg = "Too many attempts. Try again later.";
      if (code === "auth/invalid-email")     msg = "Invalid email address format.";
      toast.error("Login failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (acc) => {
    setEmail(acc.email);
    setPassword("Password123!");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-card__logo" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <KariosLogo size={56} titleSize={28} subtitle="REPORTING" subtitleSize={12} />
          <p style={{ fontSize: 15, color: "var(--color-text-muted)", margin: 0, fontWeight: 500, letterSpacing: "-0.2px" }}>
            Daily Reporting System
          </p>
        </div>

        {/* Quick-login buttons */}
        {USE_MOCK && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginBottom: 8 }}>
              Quick Login
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DEV_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className={`btn btn--sm ${email === acc.email ? "btn--primary" : "btn--outline"}`}
                  onClick={() => fillAccount(acc)}
                  id={`quick-login-${acc.label.toLowerCase()}`}
                  style={{ borderRadius: 20, padding: "5px 14px", fontSize: 12 }}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label" htmlFor="login-email" style={{ fontSize: 13, fontWeight: 600 }}>Company Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="ceo@karios.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              style={{ height: 42, fontSize: 14 }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" htmlFor="login-password" style={{ fontSize: 13, fontWeight: 600 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                className="form-input"
                placeholder="Password123!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ height: 42, fontSize: 14, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                id="toggle-password-btn"
                aria-label={showPass ? "Hide password" : "Show password"}
                style={{
                  position: "absolute", right: 10, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-text-muted)", padding: 4, lineHeight: 0,
                }}
              >
                {showPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary w-full"
            style={{ height: 42, fontSize: 14, fontWeight: 600, marginTop: 4 }}
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>
          Access is by invitation only. Contact your administrator.
        </div>
      </div>
    </div>
  );
}
