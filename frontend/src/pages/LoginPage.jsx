// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/ToastContext";
import KariosLogo from "../components/shared/KariosLogo";

const iconProps = {
  width: 17, height: 17, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": true,
};

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...iconProps} width={18} height={18}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps} width={18} height={18}>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.16 3.19" />
      <path d="M6.61 6.61A17.4 17.4 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.39-1.61" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg {...iconProps} width={16} height={16}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg {...iconProps} width={44} height={44} stroke="var(--color-success, #10b981)">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function LoginPage() {
  const [email,         setEmail]        = useState("");
  const [password,      setPassword]     = useState("");
  const [loading,       setLoading]      = useState(false);
  const [showPass,      setShowPass]     = useState(false);
  const [isForgot,      setIsForgot]     = useState(false);
  const [resetEmail,    setResetEmail]   = useState("");
  const [resetLoading,  setResetLoading] = useState(false);
  const [resetSuccess,  setResetSuccess] = useState(false);

  const { login, resetPassword, appUser } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Missing email", "Please enter your email address.");
      return;
    }
    setResetLoading(true);
    try {
      if (resetPassword) {
        await resetPassword(resetEmail.trim());
      }
      setResetSuccess(true);
      toast.success("Email sent", "Password reset instructions sent to your email.");
    } catch (err) {
      const code = err?.code || "";
      let msg = "Could not send reset email. Please try again.";
      if (code === "auth/user-not-found") msg = "No account found with this email address.";
      if (code === "auth/invalid-email")  msg = "Please enter a valid email address format.";
      toast.error("Reset failed", msg);
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotMode = () => {
    setResetEmail(email);
    setResetSuccess(false);
    setIsForgot(true);
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

        {isForgot ? (
          /* ── Forgot Password View ── */
          <div>
            <div style={{ marginBottom: 20, textAlign: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px 0", color: "var(--color-text-primary, #1e293b)" }}>
                Reset Password
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
                {resetSuccess
                  ? "Check your inbox for the password reset link."
                  : "Enter your registered email address and we will send you instructions to reset your password."}
              </p>
            </div>

            {resetSuccess ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "12px 0 6px" }}>
                <CheckCircleIcon />
                <div style={{ textAlign: "center", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  We sent a reset link to <strong style={{ color: "var(--color-text-primary, #1e293b)" }}>{resetEmail}</strong>. Please follow the instructions in the email.
                </div>
                <button
                  type="button"
                  className="btn btn--primary w-full"
                  style={{ height: 42, fontSize: 14, fontWeight: 600, marginTop: 10, justifyContent: "center", textAlign: "center" }}
                  onClick={() => { setIsForgot(false); setResetSuccess(false); }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} noValidate>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label" htmlFor="reset-email" style={{ fontSize: 13, fontWeight: 600 }}>
                    Email or username
                  </label>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      color: "var(--color-text-muted)", display: "flex", alignItems: "center", pointerEvents: "none"
                    }}>
                      <MailIcon />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      className="form-input"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      style={{ height: 42, fontSize: 14, paddingLeft: 38 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn--primary w-full"
                  style={{ height: 42, fontSize: 14, fontWeight: 600, justifyContent: "center", textAlign: "center" }}
                  disabled={resetLoading}
                  id="reset-submit-btn"
                >
                  {resetLoading ? "Sending Link…" : "Send Reset Link"}
                </button>

                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => setIsForgot(false)}
                    style={{
                      background: "none", border: "none", color: "var(--color-primary, #6366f1)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex",
                      alignItems: "center", gap: 6, padding: "4px 8px"
                    }}
                  >
                    <ArrowLeftIcon /> Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ── Normal Login View ── */
          <>
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
                <label className="form-label" htmlFor="login-email" style={{ fontSize: 13, fontWeight: 600 }}>
                  Email or username
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    color: "var(--color-text-muted)", display: "flex", alignItems: "center", pointerEvents: "none"
                  }}>
                    <MailIcon />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    style={{ height: 42, fontSize: 14, paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" htmlFor="login-password" style={{ fontSize: 13, fontWeight: 600 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    color: "var(--color-text-muted)", display: "flex", alignItems: "center", pointerEvents: "none"
                  }}>
                    <LockIcon />
                  </div>
                  <input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ height: 42, fontSize: 14, paddingLeft: 38, paddingRight: 44 }}
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

              {/* Forgot Password Link */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
                <button
                  type="button"
                  onClick={openForgotMode}
                  id="forgot-password-link"
                  style={{
                    background: "none", border: "none", padding: 0,
                    color: "var(--color-primary, #6366f1)", fontSize: 13,
                    fontWeight: 600, cursor: "pointer", transition: "color 0.15s ease"
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn--primary w-full"
                style={{ height: 42, fontSize: 14, fontWeight: 600, justifyContent: "center", textAlign: "center" }}
                disabled={loading}
                id="login-submit-btn"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>
          Access is by invitation only. Contact your administrator.
        </div>
      </div>
    </div>
  );
}
