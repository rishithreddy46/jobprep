import React, { useState, useEffect } from 'react';
import { Flame, Zap, Shield, Clock, Calendar, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { profile, xpStreak, currentDate, setCurrentDate, focusTimer, openFocusTimer, lockApp } = useApp();

  // Countdown Calculation
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number }>({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });

  useEffect(() => {
    const target = new Date(profile?.target_date || '2026-10-26T00:00:00').getTime();

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
  }, [profile?.target_date]);

  // Determine Day Label
  const getDayLabel = (dateStr: string) => {
    if (dateStr === '2026-10-15') return 'Pre-Sprint Diagnostic (15 Oct)';
    if (dateStr === '2026-10-16') return 'Day 0 — Setup Sprint (Post-NPTEL)';
    if (dateStr === '2026-10-17') return 'Day 1 — Aptitude & Measurement';
    if (dateStr === '2026-10-18') return 'Day 2 — Temperature & Logic';
    if (dateStr === '2026-10-19') return 'Day 3 — Pressure & Arithmetic';
    if (dateStr === '2026-10-20') return 'Day 4 — Flow & Data Interpretation';
    if (dateStr === '2026-10-21') return 'Day 5 — Level & 4–20 mA Loops';
    if (dateStr === '2026-10-22') return 'Day 6 — PID & Control Valves';
    if (dateStr === '2026-10-23') return 'Day 7 — PLC, DCS, SCADA & P&ID';
    if (dateStr === '2026-10-24') return 'Day 8 — Electronics & Mocks';
    if (dateStr === '2026-10-25') return 'Day 9 — Full Mixed Simulation';
    if (dateStr === '2026-10-26') return 'Day 10 — Final Readiness';
    return `Prep Date: ${dateStr}`;
  };

  return (
    <header className="top-header">
      <div className="header-left">
        {/* Date Selector / Current Day Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '5px 12px', borderRadius: 'var(--radius-md)' }}>
            <Calendar size={15} color="var(--cyan-primary)" />
            <select
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="2026-10-15" style={{ background: '#0b1322', color: '#fff' }}>15 Oct (Today / Pre-Sprint)</option>
              <option value="2026-10-16" style={{ background: '#0b1322', color: '#fff' }}>16 Oct (Day 0 — Post NPTEL)</option>
              <option value="2026-10-17" style={{ background: '#0b1322', color: '#fff' }}>17 Oct (Day 1 — Aptitude & Measurement)</option>
              <option value="2026-10-18" style={{ background: '#0b1322', color: '#fff' }}>18 Oct (Day 2 — Temperature & Logic)</option>
              <option value="2026-10-19" style={{ background: '#0b1322', color: '#fff' }}>19 Oct (Day 3 — Pressure & Arithmetic)</option>
              <option value="2026-10-20" style={{ background: '#0b1322', color: '#fff' }}>20 Oct (Day 4 — Flow & Data)</option>
              <option value="2026-10-21" style={{ background: '#0b1322', color: '#fff' }}>21 Oct (Day 5 — Level & Loops)</option>
              <option value="2026-10-22" style={{ background: '#0b1322', color: '#fff' }}>22 Oct (Day 6 — Control Valves & PID)</option>
              <option value="2026-10-23" style={{ background: '#0b1322', color: '#fff' }}>23 Oct (Day 7 — PLC, DCS, SCADA)</option>
              <option value="2026-10-24" style={{ background: '#0b1322', color: '#fff' }}>24 Oct (Day 8 — Electronics & Mocks)</option>
              <option value="2026-10-25" style={{ background: '#0b1322', color: '#fff' }}>25 Oct (Day 9 — Full Mixed Simulation)</option>
              <option value="2026-10-26" style={{ background: '#0b1322', color: '#fff' }}>26 Oct (Day 10 — Readiness)</option>
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald-success)', display: 'inline-block' }}></span>
            <span>{getDayLabel(currentDate)}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-dim)', padding: '5px 12px', borderRadius: 'var(--radius-md)' }}>
          <Clock size={15} color="var(--amber-warning)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>RIL GET Window:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--amber-warning)' }}>
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.mins}m {timeLeft.secs}s
          </span>
        </div>

        {/* Streak Chip */}
        <div className="header-stat-chip streak" title="Consecutive Qualifying Days">
          <Flame size={16} />
          <span>{xpStreak ? xpStreak.currentStreak : 0} Day Streak</span>
        </div>

        {/* Level & XP Chip */}
        <div className="header-stat-chip level" title={`${xpStreak?.title || 'Cadet'} (${xpStreak?.progressPct || 0}% to next level)`}>
          <Shield size={16} />
          <span>Lvl {xpStreak ? xpStreak.level : 1}: {xpStreak?.title?.split(' ')[0] || 'Cadet'}</span>
        </div>

        {/* Total XP */}
        <div className="header-stat-chip xp" title="Cumulative Preparation XP">
          <Zap size={16} />
          <span>{xpStreak ? xpStreak.totalXP : 0} XP</span>
        </div>

        {/* Privacy Lock button if passcode is configured */}
        {profile?.passcode_hash && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={lockApp}
            title="Lock local session"
            style={{ padding: '6px 10px' }}
          >
            <Lock size={15} />
          </button>
        )}
      </div>
    </header>
  );
};
