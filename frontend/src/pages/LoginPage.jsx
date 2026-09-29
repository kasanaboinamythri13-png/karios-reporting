import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { firebaseReady } from '../config/firebase.js';
import { ErrorBanner } from '../components/Feedback.jsx';
import logo from '../assets/karios-logo.png';

// Dev login buttons are hidden unless VITE_SHOW_DEV_LOGIN=true in frontend/.env (and never in a production build).
const SHOW_DEV_LOGIN = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEV_LOGIN === 'true';

// Company email + password → Firebase → GET /api/me.
// Development only: buttons that log in with backend dev tokens (needs ALLOW_DEV_TOKENS=true).
const DEV_USERS = [
  { token: 'dev-developer', title: 'Developer Head' },
  { token: 'dev-sales', title: 'Sales Head' },
  { token: 'dev-marketing', title: 'Marketing Head' },
  { token: 'dev-finance', title: 'Finance Head' },
];

export default function LoginPage() {
  const { user, loading, loginWithEmail, loginWithDevToken, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function run(key, action) {
    setError(null);
    setNotice(null);
    setPending(key);
    try {
      await action();
    } catch (err) {
      setError(loginMessage(err));
    } finally {
      setPending(null);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your company email and password.');
      return;
    }
    run('email', () => loginWithEmail(email, password));
  }

  function onForgotPassword() {
    if (!email.trim()) {
      setError('Enter your company email first, then click "Forgot password?".');
      return;
    }
    run('reset', async () => {
      await resetPassword(email);
      setNotice('If this email has an account, a password reset link has been sent to it.');
    });
  }

  const busy = Boolean(pending);

  return (
    <div className="login">
      <div className="login-header">
        <img className="login-logo" src={logo} alt="Karios" />
        <p className="muted">Daily reporting</p>
      </div>

      <form className="card" onSubmit={onSubmit} noValidate>
        {!firebaseReady && (
          <div className="alert alert-error">
            Email login isn't set up yet. Add the Firebase web settings to frontend/.env and restart the website.
          </div>
        )}
        <ErrorBanner error={error} />
        {notice && <div className="alert alert-success">{notice}</div>}

        <label className="field">
          Company email
          <input
            type="email"
            autoComplete="username"
            placeholder="you@karios.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy || !firebaseReady}
          />
        </label>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <div className="password-input">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy || !firebaseReady}
            />
            <button
              type="button"
              className="eye-button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              disabled={!firebaseReady}
              onClick={() => setShowPassword((v) => !v)}
            >
              <EyeIcon crossed={showPassword} />
            </button>
          </div>
        </div>
        <button type="submit" disabled={busy || !firebaseReady}>
          {pending === 'email' ? 'Logging in…' : 'Log in'}
        </button>
        <button type="button" className="link-button" disabled={busy || !firebaseReady} onClick={onForgotPassword}>
          {pending === 'reset' ? 'Sending…' : 'Forgot password?'}
        </button>
      </form>

      {SHOW_DEV_LOGIN && (
        <div className="card">
          <p className="muted small">Development only — continue as:</p>
          <div className="dev-users">
            {DEV_USERS.map((u) => (
              <button
                key={u.token}
                type="button"
                className="button-secondary"
                disabled={busy}
                onClick={() => run(u.token, () => loginWithDevToken(u.token))}
              >
                {pending === u.token ? 'Signing in…' : u.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Open eye = password hidden (click to show). Crossed eye = password visible (click to hide).
function EyeIcon({ crossed }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M3 3l18 18" />}
    </svg>
  );
}

// Firebase / backend errors → plain words.
function loginMessage(err) {
  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact the CEO.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes, or use "Forgot password?".';
    case 'auth/network-request-failed':
      return 'Cannot reach the login service. Check your connection.';
    default:
      break;
  }
  if (err?.status === 401) {
    return /not provisioned/i.test(err.message)
      ? "Your account isn't set up in Karios yet. Contact the CEO."
      : err.message;
  }
  return err?.message || 'Login failed. Please try again.';
}
