import React, { useState, useEffect } from 'react';
import { Flame, Zap, Shield, Clock, Calendar, Lock, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { profile, xpStreak, currentDate, setCurrentDate, companies, activeCompanyId, setActiveCompanyId, lockApp } = useApp();

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  // Target assessment countdown
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number }>({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });

  useEffect(() => {
    const targetDateStr = activeCompany?.assessment_date || profile?.target_date || '2026-10-26T10:00:00';
    const target = new Date(targetDateStr).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, mins, secs });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeCompany?.assessment_date, profile?.target_date]);

  return (
    <header className="top-header">
      <div className="header-left">
        {/* Target Company Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 'var(--radius-full)' }}>
          <span className="poly-badge-dot" />
          <Building2 size={15} color="var(--blue)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Track</span>
          <select
            value={activeCompanyId}
            onChange={(e) => setActiveCompanyId(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.84rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '220px',
            }}
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 'var(--radius-full)' }}>
          <Calendar size={14} color="var(--cyan)" />
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-m)',
              fontSize: '0.78rem',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      <div className="header-right">
        {/* Target Assessment Countdown */}
        {activeCompany && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(217, 119, 87, 0.08)',
              border: '1px solid rgba(217, 119, 87, 0.25)',
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <Clock size={14} color="var(--coral)" />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-m)', textTransform: 'uppercase' }}>
              {activeCompany.logo_initials}
            </span>
            <span style={{ fontFamily: 'var(--font-m)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--coral)' }}>
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.mins}m
            </span>
          </div>
        )}

        {/* Streak Chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.25)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            color: 'var(--amber-warning)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-m)',
            fontWeight: 700,
          }}
          title="Consecutive Qualifying Days"
        >
          <Flame size={14} />
          <span>{xpStreak ? xpStreak.currentStreak : 0}d streak</span>
        </div>

        {/* Level / XP */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(46, 165, 201, 0.08)',
            border: '1px solid rgba(46, 165, 201, 0.25)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            color: 'var(--cyan)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-m)',
            fontWeight: 700,
          }}
          title={`${xpStreak?.title || 'Cadet'} (Level ${xpStreak?.level || 1})`}
        >
          <Zap size={14} />
          <span>{xpStreak ? xpStreak.totalXP : 0} XP</span>
        </div>

        {/* Settings button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenSettings}
          title="Candidate Profile"
          style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600, borderRadius: 'var(--radius-full)' }}
        >
          {profile?.name ? profile.name.split(' ')[0] : 'Profile'}
        </button>

        {/* Passcode Lock button if passcode configured */}
        {profile?.passcode_hash && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={lockApp}
            title="Lock session"
            style={{ padding: '6px 10px' }}
          >
            <Lock size={14} />
          </button>
        )}
      </div>
    </header>
  );
};
