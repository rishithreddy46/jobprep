import React from 'react';
import { CheckCircle2, AlertCircle, Info, Trophy, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = Info;
        let color = 'var(--cyan-primary)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          color = 'var(--emerald-success)';
        } else if (toast.type === 'warning') {
          Icon = AlertCircle;
          color = 'var(--amber-warning)';
        } else if (toast.type === 'achievement') {
          Icon = Trophy;
          color = 'var(--violet-quest)';
        }

        return (
          <div key={toast.id} className="toast-item" style={{ borderColor: color }}>
            <Icon size={20} color={color} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{toast.title}</div>
              {toast.message && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 4 }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
