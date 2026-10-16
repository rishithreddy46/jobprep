import React, { useState } from 'react';
import { Briefcase, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('Rishith');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store token in localStorage as Bearer fallback
      if (data.token) {
        localStorage.setItem('jobprep_token', data.token);
      }

      onLoginSuccess(data.user || { username: 'Rishith' });
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-main)',
        backgroundImage: 'radial-gradient(rgba(46, 165, 201, 0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        padding: '24px 16px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '40px 36px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--blue), var(--cyan))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(27, 94, 181, 0.25)',
            }}
          >
            <Briefcase size={26} />
          </div>

          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 6,
            }}
          >
            JobPrep <span style={{ color: 'var(--cyan)', fontSize: '0.9rem', verticalAlign: 'middle' }}>● LIVE</span>
          </h1>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Single-User Preparation Platform & Assessment Engine
          </p>
        </div>

        {/* Security Alert / Error Notice */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--coral-bg)',
              border: '1px solid var(--coral-border)',
              color: 'var(--coral-error)',
              fontSize: '0.84rem',
              marginBottom: 20,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Preconfigured User Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-m)',
              }}
            >
              Candidate Username
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={17}
                style={{
                  position: 'absolute',
                  left: 13,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                readOnly
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-light)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'default',
                }}
              />
            </div>
          </div>

          {/* Secure Password Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-m)',
              }}
            >
              Access Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                style={{
                  position: 'absolute',
                  left: 13,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }}
              />
              <input
                type="password"
                placeholder="Enter authorized password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: 'var(--radius-md)',
                  border: error ? '1px solid var(--coral-error)' : '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--blue)')}
                onBlur={(e) => (e.target.style.borderColor = error ? 'var(--coral-error)' : 'var(--border)')}
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px 18px',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 6,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <span>{loading ? 'Authenticating...' : 'Enter Preparation Workspace'}</span>
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: '0.74rem',
            color: 'var(--text-tertiary)',
          }}
        >
          <ShieldCheck size={15} color="var(--emerald-success)" />
          <span>Single-User Private Portal · PBKDF2 Secure Session</span>
        </div>
      </div>
    </div>
  );
};
