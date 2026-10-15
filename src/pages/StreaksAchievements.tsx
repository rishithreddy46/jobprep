import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Award,
  Shield,
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

export const StreaksAchievements: React.FC = () => {
  const { xpStreak, triggerConfetti } = useApp();
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const list = await api.getAchievements();
        setAchievements(list);
      } catch (err) {
        console.error('Error loading achievements:', err);
      }
    };
    loadAchievements();
  }, []);

  const allPossibleBadges = [
    { id: 'first_step', title: 'First Step', description: 'Attempt your first practice question in the Arena.', icon: Target },
    { id: 'mock_pioneer', title: 'Mock Pioneer', description: 'Complete your first practice test or simulation.', icon: Award },
    { id: 'centurion', title: 'Centurion', description: 'Attempt 100 questions across Cognitive and Instrumentation.', icon: Shield },
    { id: 'streak_3', title: 'Ignition Streak', description: 'Maintain a 3-day active preparation streak.', icon: Flame },
    { id: 'streak_7', title: 'Unstoppable Momentum', description: 'Maintain a 7-day active preparation streak.', icon: Zap },
    { id: 'deep_focus', title: 'Deep Focus', description: 'Accumulate over 60 minutes of measured study timer.', icon: Clock },
    { id: 'mistake_slayer', title: 'Mistake Slayer', description: 'Resolve and master 5 questions in your Mistake Notebook.', icon: CheckCircle2 },
    { id: 'cognitive_sharpness', title: 'Cognitive Sharpness', description: 'Achieve >= 80% accuracy across 20+ cognitive questions.', icon: Sparkles },
    { id: 'instrument_virtuoso', title: 'Industrial Virtuoso', description: 'Achieve >= 80% accuracy across 30+ instrumentation questions.', icon: Trophy },
  ];

  const unlockedIds = new Set(achievements.map((a) => a.badge_id));

  return (
    <div className="page-wrapper">
      {/* Header Banner */}
      <div className="card card-amber-accent" style={{ marginBottom: 24, padding: '26px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-amber">Gamification System</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Deterministic XP & Milestone Badges</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Streaks, XP & Milestones
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 750 }}>
              Transparent rewards designed to foster consistent, disciplined daily study habits without manipulative arcade noise.
            </p>
          </div>

          <div style={{ textAlign: 'center', background: 'rgba(0, 0, 0, 0.35)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Cumulative Level
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--cyan-primary)' }}>
              Level {xpStreak?.level || 1}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
              {xpStreak?.title || 'Cadet'}
            </div>
          </div>
        </div>
      </div>

      {/* Streak Details & Activity Calendar */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={18} color="var(--amber-warning)" />
              Streak Mechanics & Rules
            </h3>
            <span className="badge badge-amber">{xpStreak?.currentStreak || 0} Day Active Streak</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            A day qualifies towards your streak when you complete <strong style={{ color: '#fff' }}>at least 15 focused study minutes</strong> with the stopwatch, OR <strong style={{ color: '#fff' }}>attempt 5 practice questions</strong>, OR <strong style={{ color: '#fff' }}>complete 2 scheduled study tasks</strong>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(0, 0, 0, 0.25)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Current Streak</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--amber-warning)' }}>
                {xpStreak?.currentStreak || 0} Days
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Longest Streak</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {xpStreak?.longestStreak || 0} Days
              </div>
            </div>
          </div>
        </div>

        {/* XP Rules Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--cyan-primary)" />
            Deterministic XP Rewards Table
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: '#fff' }}>Complete Scheduled Study Task</span>
              <span className="badge badge-cyan">+10 XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: '#fff' }}>Finish All Scheduled Day Tasks</span>
              <span className="badge badge-amber">+25 Bonus XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: '#fff' }}>Complete Focused Study Session (≥15 mins)</span>
              <span className="badge badge-cyan">+5 XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: '#fff' }}>Complete Practice Mock / Boss Battle</span>
              <span className="badge badge-cyan">+15 XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: '#fff' }}>High Accuracy Benchmark (≥80% on mock)</span>
              <span className="badge badge-emerald">+10 Bonus XP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ color: '#fff' }}>Review Mistake in Notebook (Max 20 XP/day)</span>
              <span className="badge badge-violet">+2 XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges Grid */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Milestone Achievement Badges ({achievements.length} of {allPossibleBadges.length} Unlocked)
        </h3>

        <div className="grid-3">
          {allPossibleBadges.map((b) => {
            const Icon = b.icon;
            const isUnlocked = unlockedIds.has(b.id);

            return (
              <div
                key={b.id}
                style={{
                  background: isUnlocked ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid',
                  borderColor: isUnlocked ? 'var(--cyan-primary)' : 'var(--border-dim)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md)',
                    background: isUnlocked ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isUnlocked ? <Icon size={22} color="var(--cyan-primary)" /> : <Lock size={20} color="var(--text-subtle)" />}
                </div>

                <div>
                  <div style={{ fontWeight: 700, color: isUnlocked ? '#fff' : 'var(--text-subtle)', fontSize: '0.95rem' }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    {b.description}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {isUnlocked ? (
                      <span className="badge badge-emerald">Unlocked</span>
                    ) : (
                      <span className="badge badge-cyan" style={{ opacity: 0.6 }}>Locked</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent XP Audit Trail */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
          Recent XP Audit Trail (Idempotent Ledger)
        </h3>

        {(!xpStreak?.recentEvents || xpStreak.recentEvents.length === 0) ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            No XP events recorded yet. Complete study blocks or test runs to earn experience points!
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Action</th>
                <th>Preparation Date</th>
                <th>XP Awarded</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {xpStreak.recentEvents.map((evt: any) => (
                <tr key={evt.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{evt.action_type.replace(/_/g, ' ')}</td>
                  <td>{evt.date}</td>
                  <td style={{ fontWeight: 700, color: 'var(--amber-warning)' }}>+{evt.xp_awarded} XP</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{new Date(evt.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
