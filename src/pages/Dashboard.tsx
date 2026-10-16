import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  ArrowRight,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck2,
  BookX,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { DailyReportData, CumulativeReportData } from '../types';

interface DashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { profile, xpStreak, currentDate, studyPlan, activeTestConfig, companies, activeCompanyId } = useApp();
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [cumulativeReport, setCumulativeReport] = useState<CumulativeReportData | null>(null);
  const [recentMocks, setRecentMocks] = useState<any[]>([]);
  const [unresolvedMistakes, setUnresolvedMistakes] = useState<any[]>([]);
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
        setRecentMocks(mocks.slice(0, 4));
        setUnresolvedMistakes(mistakes.filter((m) => !m.is_resolved).slice(0, 5));
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

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  return (
    <div className="page-wrapper">
      {/* Active Test Resume Banner */}
      {activeTestConfig && (
        <div
          style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RotateCcw size={20} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                Unfinished Test in Progress: {activeTestConfig.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Your responses are autosaved. Resume immediately to continue.
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('test-runner')}>
            <Play size={14} /> Resume Test
          </button>
        </div>
      )}

      {/* Greeting & Main Objective */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="section-label">01 — Overview & Workspace</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 4 }}>
            Welcome back, <span className="gradient-text">{profile?.name ? profile.name.split(' ')[0] : 'Candidate'}</span>
          </h1>
          <p className="section-desc">
            Continuous job readiness loop. Currently active track: <strong style={{ color: 'var(--blue)' }}>{activeCompany?.name || 'General Preparation'}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => onNavigate('mocks')}>
            <Play size={15} /> Take a Mock Test
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('plan')}>
            <Calendar size={15} /> View Schedule
          </button>
        </div>
      </div>

      {/* Key Metrics Row with Polymath Tinted Icon Boxes */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="metric-card">
          <div className="metric-label">
            <span>Today's Plan</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(27, 94, 181, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={16} color="var(--blue)" />
            </div>
          </div>
          <div className="metric-value" style={{ fontFamily: 'var(--font-m)' }}>{todayCompletionPct}%</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${todayCompletionPct}%`, background: 'var(--blue)' }}></div>
          </div>
          <div className="metric-subtitle" style={{ fontFamily: 'var(--font-m)', fontSize: '0.74rem' }}>
            {completedCount}/{todayTasks.length} tasks completed today
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Overall Roadmap</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(46, 165, 201, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="var(--cyan)" />
            </div>
          </div>
          <div className="metric-value" style={{ fontFamily: 'var(--font-m)' }}>{overallCompletionPct}%</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${overallCompletionPct}%`, background: 'var(--cyan)' }}></div>
          </div>
          <div className="metric-subtitle" style={{ fontFamily: 'var(--font-m)', fontSize: '0.74rem' }}>
            {totalCompletedTasks}/{totalTasksCount} roadmap tasks finished
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Question Accuracy</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(5, 150, 105, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="var(--emerald-success)" />
            </div>
          </div>
          <div className="metric-value" style={{ fontFamily: 'var(--font-m)' }}>
            {cumulativeReport ? cumulativeReport.cumulativeAccuracy : 0}%
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${cumulativeReport ? cumulativeReport.cumulativeAccuracy : 0}%`, background: 'var(--emerald-success)' }}></div>
          </div>
          <div className="metric-subtitle" style={{ fontFamily: 'var(--font-m)', fontSize: '0.74rem' }}>
            {cumulativeReport ? cumulativeReport.totalQuestionsCorrect : 0} correct / {cumulativeReport ? cumulativeReport.totalQuestionsAttempted : 0} attempted
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <span>Active Streak</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(217, 119, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={16} color="var(--amber-warning)" />
            </div>
          </div>
          <div className="metric-value" style={{ fontFamily: 'var(--font-m)' }}>{xpStreak ? xpStreak.currentStreak : 0}d</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${Math.min(100, (xpStreak ? xpStreak.currentStreak : 0) * 10)}%`, background: 'var(--amber-warning)' }}></div>
          </div>
          <div className="metric-subtitle" style={{ fontFamily: 'var(--font-m)', fontSize: '0.74rem' }}>
            {xpStreak ? xpStreak.totalXP : 0} XP earned across runs
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Tasks + Upcoming Assessments */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Today's Tasks */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Today's Scheduled Tasks</div>
              <div className="card-subtitle">
                {todayTasks.length} study block(s) scheduled for {currentDate}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('plan')}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayTasks.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
                No tasks planned for today. Click "View Schedule" to add or reschedule.
              </div>
            ) : (
              todayTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: task.status === 'completed' ? 'var(--bg-muted)' : 'var(--bg-surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: task.status === 'completed' ? 'none' : '2px solid var(--border-hover)',
                        background: task.status === 'completed' ? 'var(--emerald-success)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {task.status === 'completed' && <CheckCircle2 size={16} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 500,
                          color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-main)',
                          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.task_text}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', display: 'flex', gap: 8, marginTop: 2 }}>
                        {task.block_time && <span>{task.block_time}</span>}
                        <span>•</span>
                        <span className="badge badge-neutral" style={{ padding: '1px 5px', fontSize: '0.68rem' }}>
                          {activeCompany?.logo_initials || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {task.status !== 'completed' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flexShrink: 0 }}
                      onClick={() => onNavigate('practice')}
                    >
                      Start
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tracked Companies & Upcoming Assessments */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Target Companies & Drives</div>
              <div className="card-subtitle">
                {companies.length} recruitment track(s) currently being monitored
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('companies')}>
              Manage <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {companies.map((comp) => {
              const assessmentDate = comp.assessment_date
                ? new Date(comp.assessment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'TBD';
              return (
                <div
                  key={comp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: comp.id === activeCompanyId ? 'var(--primary-light)' : 'var(--bg-surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-md)',
                        background: comp.id === activeCompanyId ? 'var(--primary)' : 'var(--bg-elevated)',
                        color: comp.id === activeCompanyId ? '#fff' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {comp.logo_initials}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {comp.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Assessment: <strong style={{ color: 'var(--text-main)' }}>{assessmentDate}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${comp.stage_status === 'assessment_upcoming' ? 'badge-warning' : comp.stage_status === 'eligible' ? 'badge-success' : 'badge-neutral'}`}>
                      {comp.stage_status.replace(/_/g, ' ')}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onNavigate('companies', { companyId: comp.id })}
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Row: Weak Topics & Recent Activity */}
      <div className="grid-2">
        {/* Topics Needing Revision */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Mistake Review & Weak Areas</div>
              <div className="card-subtitle">
                Based on actual test question attempts
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('mistakes')}>
              Review All <ArrowRight size={13} />
            </button>
          </div>

          {unresolvedMistakes.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
              No unresolved mistakes recorded yet. Excellent work!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unresolvedMistakes.map((m) => (
                <div
                  key={m.question_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: 12 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.question}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                      Topic: {m.topic} • Missed {m.retry_count} time(s)
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => onNavigate('mistakes')}
                  >
                    Revise
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Mocks & Performance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Assessment Runs</div>
              <div className="card-subtitle">Authoritative scores and accuracy logs</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('analytics')}>
              Analytics <ArrowRight size={13} />
            </button>
          </div>

          {recentMocks.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
              No test runs completed yet. Take your first sectional or full mock.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentMocks.map((run) => (
                <div
                  key={run.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {run.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                      {run.date} • {Math.round(run.time_taken_seconds / 60)} mins • {run.attempted}/{run.total_questions} answered
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: run.accuracy >= 75 ? 'var(--emerald-success)' : 'var(--amber-warning)' }}>
                        {run.accuracy}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>accuracy</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
