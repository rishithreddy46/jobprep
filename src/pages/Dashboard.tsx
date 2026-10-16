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
  Lock,
  Compass,
  Zap,
  Sparkles,
  BookOpen,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { DailyReportData } from '../types';

interface DashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { profile, xpStreak, currentDate, studyPlan, activeTestConfig, companies, activeCompanyId, updateTaskStatus } = useApp();
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Format today's date in Indian Standard Time
  const istDateFormatted = new Date(currentDate + 'T00:00:00+05:30').toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        const daily = await api.getDailyReport(currentDate);
        setDailyReport(daily);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, [currentDate]);

  // Current day's mission from studyPlan
  const todayMission = studyPlan?.days.find((d) => d.date === currentDate) || studyPlan?.days[0];
  const todayTasks = todayMission?.tasks || [];
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const todayCompletionPct = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;

  // Identify next actionable task in chain
  const nextPendingTask = todayTasks.find((t) => t.status !== 'completed');
  const allTasksDone = todayTasks.length > 0 && completedCount === todayTasks.length;

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

  const handleStartTask = async (task: any) => {
    if (task.status === 'not_started') {
      await updateTaskStatus(task.id, 'in_progress');
    }

    // Route to appropriate activity depending on task nature
    const text = task.task_text.toLowerCase();
    if (text.includes('practice') || text.includes('solve') || text.includes('questions')) {
      onNavigate('practice');
    } else if (text.includes('mock') || text.includes('test') || text.includes('assessment')) {
      onNavigate('assessments');
    } else if (text.includes('watch') || text.includes('review') || text.includes('read') || text.includes('theory')) {
      onNavigate('resources');
    } else {
      onNavigate('plan');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Active Test Resume Banner (if any) */}
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
                Unfinished Assessment in Progress: {activeTestConfig.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Your selected responses are saved. Resume to complete evaluation.
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('test-runner')}>
            <Play size={14} /> Resume Now
          </button>
        </div>
      )}

      {/* TODAY HERO CARD — Answers the 3 Essential Questions */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 36px',
          marginBottom: 32,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          {/* Left: What do I need to do today? */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Compass size={16} color="var(--cyan)" />
              <span className="section-label" style={{ margin: 0 }}>
                TODAY’S MISSION · {istDateFormatted}
              </span>
            </div>

            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: 8,
                fontFamily: 'var(--font-display)',
              }}
            >
              {todayMission?.mission || 'Baseline Cognitive & Technical Foundations'}
            </h1>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: 640, lineHeight: 1.6, marginBottom: 20 }}>
              {todayMission?.theme || 'Establish starting diagnostic benchmarks across Quantitative, Logical, Visual Reasoning, and Core Engineering.'}
            </p>

            {/* Answer 2: How do I start the next task? */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {allTasksDone ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--emerald-bg)',
                    border: '1px solid var(--emerald-border)',
                    color: 'var(--emerald-success)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>All Today’s Learning Levels Completed!</span>
                </div>
              ) : nextPendingTask ? (
                <button
                  className="btn btn-primary"
                  onClick={() => handleStartTask(nextPendingTask)}
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(27, 94, 181, 0.25)',
                  }}
                >
                  <Play size={16} />
                  <span>
                    Continue: {nextPendingTask.task_text.slice(0, 32)}
                    {nextPendingTask.task_text.length > 32 ? '...' : ''}
                  </span>
                  <ArrowRight size={16} />
                </button>
              ) : null}

              <button className="btn btn-secondary" onClick={() => onNavigate('plan')}>
                <span>View Full 11-Day Plan</span>
              </button>
            </div>
          </div>

          {/* Right: How much preparation have I completed? */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 24px',
              minWidth: 260,
            }}
          >
            {/* Progress Percentage Ring / Number */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-m)',
                  color: todayCompletionPct === 100 ? 'var(--emerald-success)' : 'var(--blue)',
                }}
              >
                {todayCompletionPct}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-m)' }}>
                Today's Progress
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {completedCount} of {todayTasks.length} levels
              </div>
            </div>

            <div style={{ width: 1, height: 48, background: 'var(--border)' }} />

            {/* Streak & Active Track */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Flame size={18} color="var(--amber-warning)" />
                <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-m)', color: 'var(--text-primary)' }}>
                  {xpStreak?.currentStreak || 0} Days
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-m)' }}>
                Active Streak
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--blue)', fontWeight: 500, marginTop: 4 }}>
                {activeCompany?.name.slice(0, 16)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S ORDERED TASK CHAIN */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Ordered Micro-Level Learning Chain
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Complete each stage sequentially to unlock cumulative mastery and checkpoint assignments.
            </p>
          </div>
        </div>

        {todayTasks.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tasks scheduled for today. Select a study plan date or run a self-paced practice drill.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayTasks.map((task, idx) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';
              const isLocked = idx > 0 && todayTasks[idx - 1].status !== 'completed';

              return (
                <div
                  key={task.id}
                  className="card"
                  style={{
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: isCompleted
                      ? '4px solid var(--emerald-success)'
                      : isInProgress
                      ? '4px solid var(--blue)'
                      : isLocked
                      ? '4px solid var(--border)'
                      : '4px solid var(--cyan)',
                    background: isLocked ? 'var(--bg-light)' : 'var(--bg-surface)',
                    opacity: isLocked ? 0.75 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    {/* Level index badge */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: isCompleted
                          ? 'var(--emerald-bg)'
                          : isInProgress
                          ? 'var(--blue-bg)'
                          : 'var(--bg-alt)',
                        color: isCompleted
                          ? 'var(--emerald-success)'
                          : isInProgress
                          ? 'var(--blue)'
                          : 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontFamily: 'var(--font-m)',
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? <CheckCircle2 size={20} /> : isLocked ? <Lock size={16} /> : `0${idx + 1}`}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span
                          className={`badge ${
                            isCompleted ? 'badge-emerald' : isInProgress ? 'badge-blue' : 'badge-slate'
                          }`}
                          style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                        >
                          {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : isLocked ? 'Locked' : 'Available'}
                        </span>
                        {task.block_time && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-m)' }}>
                            {task.block_time}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {task.task_text}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Estimated Duration: <strong>45 mins</strong> · Core Track:{' '}
                        <strong>{activeCompany?.name || 'General Preparation'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isCompleted ? (
                      <span
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--emerald-success)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <CheckCircle2 size={16} /> Verified
                      </span>
                    ) : isLocked ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled
                        style={{ cursor: 'not-allowed', opacity: 0.6 }}
                      >
                        <Lock size={14} /> Locked
                      </button>
                    ) : (
                      <button
                        className={`btn ${isInProgress ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => handleStartTask(task)}
                      >
                        <Play size={13} /> {isInProgress ? 'Resume' : 'Start Level'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK WORKSPACE TILES */}
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {/* Practice Tile */}
        <div
          className="card card-hover"
          onClick={() => onNavigate('practice')}
          style={{ cursor: 'pointer', padding: '22px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(27, 94, 181, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue)',
              }}
            >
              <Target size={20} />
            </div>
            <ArrowRight size={16} color="var(--text-tertiary)" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Practice Arena
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Drill Quantitative Aptitude, Logical Reasoning, and 20 types of Non-Verbal Visual Puzzles.
          </p>
        </div>

        {/* Checkpoint & Assessments Tile */}
        <div
          className="card card-hover"
          onClick={() => onNavigate('assessments')}
          style={{ cursor: 'pointer', padding: '22px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(46, 165, 201, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan)',
              }}
            >
              <Award size={20} />
            </div>
            <ArrowRight size={16} color="var(--text-tertiary)" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Assessments
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Take Checkpoint Assignments every 5 levels and the Daily Cumulative Assessment with instant scoring.
          </p>
        </div>

        {/* Progress & Reports Tile */}
        <div
          className="card card-hover"
          onClick={() => onNavigate('progress')}
          style={{ cursor: 'pointer', padding: '22px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(5, 150, 105, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald-success)',
              }}
            >
              <Zap size={20} />
            </div>
            <ArrowRight size={16} color="var(--text-tertiary)" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Progress & Analytics
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Cumulative reports, topic mastery profiles, accurate aggregated accuracy, and JSON data export.
          </p>
        </div>
      </div>
    </div>
  );
};
