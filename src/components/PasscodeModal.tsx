import React, { useState } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PasscodeModal: React.FC = () => {
  const { isLocked, unlockApp, profile } = useApp();
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Compare hash or pin
    if (profile?.passcode_hash === enteredPin || !profile?.passcode_hash) {
      unlockApp();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(0, 229, 255, 0.15)', border: '1px solid var(--border-cyan)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={24} color="var(--cyan-primary)" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          GET Quest Locked
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          Enter your local access passcode to resume your preparation arena.
        </p>

        <form onSubmit={handleUnlock}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <KeyRound size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: 14, top: 13 }} />
            <input
              type="password"
              placeholder="Enter passcode"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: error ? '1px solid var(--coral-error)' : '1px solid var(--border-dim)',
                color: '#fff',
                padding: '10px 14px 10px 42px',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                letterSpacing: '0.2em',
                textAlign: 'center',
                outline: 'none',
              }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ color: 'var(--coral-error)', fontSize: '0.8rem', marginBottom: 12 }}>
              Incorrect passcode. Please try again.
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Unlock Arena
          </button>
        </form>
      </div>
    </div>
  );
};
