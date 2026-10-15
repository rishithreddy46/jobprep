import React, { useState, useEffect } from 'react';
import {
  Compass,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Target,
  Brain,
  Sliders,
  Flame,
  Award,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { DailyReportData, CumulativeReportData } from '../types';

interface DashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { profile, xpStreak, currentDate, studyPlan, activeTestConfig, openFocusTimer } = useApp();
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [cumulativeReport, setCumulativeReport] = useState<CumulativeReportData | null>(null);
  const [recentMocks, setRecentMocks] = useState<any[]>([]);
  const [unresolvedMistakesCount, setUnresolvedMistakesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [daily, cum, mocks, mistakes] = await Promise.all([
          api.getDailyReport(currentDate),
          api.getCumulativeReport(currentDate),
          api.getTestRuns(),
          api.getMistakes(),
        ]);
        setDailyReport(daily);
        setCumulativeReport(cum);
        setRecentMocks(mocks.slice(0, 3));
        setUnresolvedMistakesCount(mistakes.filter((m) => !m.is_resolved).length);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentDate]);

  // Current day's mission from studyPlan
  const todayMission = studyPlan?.days.find((d) => d.date === currentDate) || studyPlan?.days[0];
  const todayTasks = todayMission?.tasks || [];
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const todayCompletionPct = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;

  // Total plan completion
  const totalTasksCount = studyPlan?.days.reduce((acc, d) => acc + (d.tasks?.length || 0), 0) || 1;
  const totalCompletedTasks = studyPlan?.days.reduce(
    (acc, d) => acc + (d.tasks?.filter((t) => t.status === 'completed').length || 0),
    0
  ) || 0;
  const overallCompletionPct = Math.round((totalCompletedTasks / totalTasksCount) * 100);

  const isZeroState = !cumulativeReport || cumulativeReport.totalQuestionsAttempted === 0;

  return (
    <div className="page-wrapper">
      {/* Active Test Resume Shortcut Banner */}
      {activeTestConfig && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid var(--border-cyan)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <RotateCcw size={24} color="var(--cyan-primary)" className="spin-slow" />
            <div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                Unfinished Test in Progress: {activeTestConfig.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Your responses have been autosaved. Click to resume immediately without losing progress.
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('test-runner')}>
            <Play size={16} />
            <span>Resume Test</span>
          </button>
        </div>
      )}

      {/* Top Welcome & Mission Banner */}
      <div className="card card-cyan-accent" style={{ marginBottom: 24, padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ maxWidth: 750 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-cyan">Mission Control</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentDate}</span>
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 }}>
              {todayMission ? todayMission.label : 'RIL GET 2027 Preparation Arena'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 18 }}>
              {todayMission?.focus || 'Systematic preparation for Reliance Industries Limited Graduate Engineer Trainee recruitment assessment.'}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('missions')}>
                <Compass size={17} />
                <span>Start Today's Mission</span>
              </button>
              <button className="btn btn-secondary" onClick={() => onNavigate('mocks')}>
                <Play size={17} />
                <span>Launch Mock Test</span>
              </button>
              <button className="btn btn-secondary" onClick={() => openFocusTimer(todayMission?.focus)}>
                <Clock size={17} />
                <span>Start Focus Timer</span>
              </button>
            </div>
          </div>

          {/* Level Progress Dial */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            minWidth: 260,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Current Rank & Level
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '6px 0 2px' }}>
              Level {xpStreak?.level || 1}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--cyan-primary)', fontWeight: 600, marginBottom: 12 }}>
              {xpStreak?.title || 'Novice Cadet'}
            </div>

            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${xpStreak?.progressPct || 0}%` }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
              <span>{xpStreak?.totalXP || 0} XP</span>
              <span>Next: {xpStreak?.nextThreshold || 100} XP ({xpStreak?.progressPct || 0}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Key Metrics Grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {/* Today's Completion */}
        <div className="metric-card">
          <div className="metric-label">
            <span>Today's Tasks</span>
            <CheckCircle2 size={16} color="var(--cyan-primary)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--cyan-primary)' }}>
            {todayCompletionPct}%
          </div>
          <div className="metric-subtitle">
            {completedCount} of {todayTasks.length} tasks completed today
          </div>
        </div>

        {/* Overall Plan Completion */}
        <div className="metric-card">
          <div className="metric-label">
            <span>Total Campaign</span>
            <Compass size={16} color="var(--violet-quest)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--violet-quest)' }}>
            {overallCompletionPct}%
          </div>
          <div className="metric-subtitle">
            {totalCompletedTasks} of {totalTasksCount} scheduled tasks
          </div>
        </div>

        {/* Current & Longest Streak */}
        <div className="metric-card">
          <div className="metric-label">
            <span>Prep Streak</span>
            <Flame size={16} color="var(--amber-warning)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--amber-warning)' }}>
            {xpStreak?.currentStreak || 0} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Days</span>
          </div>
          <div className="metric-subtitle">
            Longest recorded: {xpStreak?.longestStreak || 0} days
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="metric-card">
          <div className="metric-label">
            <span>Overall Accuracy</span>
            <Target size={16} color="var(--emerald-success)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--emerald-success)' }}>
            {cumulativeReport ? `${cumulativeReport.cumulativeAccuracy}%` : '0%'}
          </div>
          <div className="metric-subtitle">
            {cumulativeReport?.totalQuestionsCorrect || 0} / {cumulativeReport?.totalQuestionsAttempted || 0} attempted
          </div>
        </div>
      </div>

      {/* Track Accuracy & Speed */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {/* Cognitive Accuracy */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#fff' }}>
              <Brain size={18} color="var(--cyan-primary)" />
              <span>Cognitive Aptitude</span>
            </div>
            <span className="badge badge-cyan">40% Suggested Mix</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              {cumulativeReport?.cognitive.accuracy || 0}%
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              ({cumulativeReport?.cognitive.correct || 0} of {cumulativeReport?.cognitive.attempted || 0} correct)
            </span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${cumulativeReport?.cognitive.accuracy || 0}%` }}></div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => onNavigate('cognitive')}
          >
            Practice Cognitive Sets <ArrowRight size={14} />
          </button>
        </div>

        {/* Instrumentation Accuracy */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#fff' }}>
              <Sliders size={18} color="var(--teal-accent)" />
              <span>Instrumentation Core</span>
            </div>
            <span className="badge badge-emerald">60% Suggested Mix</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              {cumulativeReport?.instrumentation.accuracy || 0}%
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              ({cumulativeReport?.instrumentation.correct || 0} of {cumulativeReport?.instrumentation.attempted || 0} correct)
            </span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${cumulativeReport?.instrumentation.accuracy || 0}%`, background: 'linear-gradient(90deg, #10b981, #00e5ff)' }}></div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => onNavigate('instrumentation')}
          >
            Practice Technical Sets <ArrowRight size={14} />
          </button>
        </div>

        {/* Study Timing & Mistake Backlog */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#fff' }}>
              <Clock size={18} color="var(--amber-warning)" />
              <span>Speed & Review</span>
            </div>
            <span className="badge badge-amber">{unresolvedMistakesCount} In Backlog</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Avg Time / Q</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {cumulativeReport?.avgTimePerQuestion || 0}s
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Total Focused Mins</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {cumulativeReport?.totalStudyMins || 0}m
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', borderColor: unresolvedMistakesCount > 0 ? 'var(--amber-warning)' : 'var(--border-dim)' }}
            onClick={() => onNavigate('mistakes')}
          >
            Review Mistake Notebook ({unresolvedMistakesCount}) <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Remaining Missions for Today & Weakest Topics Section */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Remaining Today Missions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Today's Remaining Missions
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {todayTasks.filter((t) => t.status !== 'completed').length} pending
            </span>
          </div>

          {todayTasks.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              No scheduled missions for this date.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayTasks.slice(0, 4).map((t, idx) => (
                <div
                  key={t.id || idx}
                  style={{
                    background: t.status === 'completed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid',
                    borderColor: t.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-dim)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: t.status === 'completed' ? 'none' : '2px solid var(--border-dim)',
                      background: t.status === 'completed' ? 'var(--emerald-success)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#060a12',
                    }}>
                      {t.status === 'completed' && <CheckCircle2 size={16} color="#060a12" />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: t.status === 'completed' ? 'var(--text-muted)' : '#fff', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                        {t.task_text}
                      </div>
                      {t.block_time && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{t.block_time}</div>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${t.status === 'completed' ? 'badge-emerald' : 'badge-cyan'}`}>
                    {t.status === 'completed' ? 'Done (+10 XP)' : '10 XP'}
                  </span>
                </div>
              ))}

              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: 6 }}
                onClick={() => onNavigate('missions')}
              >
                View Full 11-Day Campaign Roadmap <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Strengths & Weaknesses (Computed from Actual Data) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Topic Mastery & Weaknesses
            </h3>
            <span className="badge badge-amber">Configurable Threshold</span>
          </div>

          {isZeroState ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <Sparkles size={32} color="var(--cyan-primary)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>No Question Attempts Yet</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto 16px' }}>
                Take your first diagnostic or practice set to calculate topic-wise strengths and identify weak areas using empirical evidence.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate('mocks')}>
                Take 10-Question Diagnostic
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Weakest Topics (Requiring Revision)
              </div>
              {cumulativeReport?.weakestTopics && cumulativeReport.weakestTopics.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {cumulativeReport.weakestTopics.map((w) => (
                    <div key={w.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{w.topic}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{w.attempted} attempted</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--coral-error)', fontSize: '1rem' }}>{w.accuracy}%</div>
                        {w.isPreliminary && <span style={{ fontSize: '0.65rem', color: 'var(--amber-warning)' }}>Preliminary</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--emerald-success)', marginBottom: 16 }}>
                  All tested topics are above 70% accuracy! Maintain consistency.
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Strongest Topics
              </div>
              {cumulativeReport?.strongestTopics && cumulativeReport.strongestTopics.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cumulativeReport.strongestTopics.map((s) => (
                    <div key={s.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0, 229, 255, 0.06)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{s.topic}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{s.attempted} attempted</div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--cyan-primary)', fontSize: '1rem' }}>{s.accuracy}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  Need at least 3 attempts per topic to establish strength rankings.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Mock Test History */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
            Recent Practice & Mock Test Runs
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('mocks')}>
            Create New Test <ArrowRight size={14} />
          </button>
        </div>

        {recentMocks.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            No completed mock tests yet. Launch a sectional drill or mixed mock test to record your first baseline score!
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Title</th>
                <th>Format</th>
                <th>Date</th>
                <th>Attempted</th>
                <th>Accuracy</th>
                <th>Time Taken</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentMocks.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{m.title}</td>
                  <td><span className="badge badge-cyan">{m.test_type}</span></td>
                  <td>{m.date}</td>
                  <td>{m.attempted} / {m.total_questions}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: m.accuracy >= 75 ? 'var(--emerald-success)' : m.accuracy >= 50 ? 'var(--amber-warning)' : 'var(--coral-error)' }}>
                      {m.accuracy}%
                    </span>
                  </td>
                  <td>{Math.floor(m.time_taken_seconds / 60)}m {m.time_taken_seconds % 60}s</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onNavigate('test-review', { testId: m.id })}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
