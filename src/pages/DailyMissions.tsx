import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Target,
  Play,
  Calendar,
  RotateCcw,
  Plus,
  Building2,
  Compass,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { StudyDay, StudyTask } from '../types';
import { WindingLearningMap } from '../components/WindingLearningMap';

interface MyPlanProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const DailyMissions: React.FC<MyPlanProps> = ({ onNavigate }) => {
  const { studyPlan, refreshStudyPlan, currentDate, setCurrentDate, companies, activeCompanyId, addToast, triggerConfetti } = useApp();
  const [expandedDate, setExpandedDate] = useState<string>(currentDate);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'journey' | 'daily' | 'timeline'>('journey');
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('2026-10-26');

  const days: StudyDay[] = studyPlan?.days || [];
  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

  const handleToggleTaskStatus = async (task: StudyTask, currentStatus: string) => {
    let nextStatus: 'not_started' | 'in_progress' | 'completed' | 'skipped' = 'completed';
    if (currentStatus === 'completed') {
      nextStatus = 'not_started';
    } else if (currentStatus === 'not_started') {
      nextStatus = 'completed';
    }

    try {
      setUpdatingTaskId(task.id);
      const res = await api.updateTask(task.id, {
        status: nextStatus,
        actual_minutes: nextStatus === 'completed' ? 45 : 0,
      });

      if (nextStatus === 'completed') {
        addToast('Task Completed', `Earned +${res.xpAwarded} XP!`, 'success');
        if (res.xpAwarded > 0) triggerConfetti();
      } else {
        addToast('Task Reopened', 'Status marked as Not Started.', 'info');
      }

      await refreshStudyPlan();
    } catch (err: any) {
      addToast('Error updating task', err.message, 'warning');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleReschedulePlan = async () => {
    try {
      const res = await api.rescheduleStudyPlan(rescheduleDate);
      addToast('Plan Rescheduled', `Redistributed pending tasks across ${res.daysCount} days.`, 'success');
      setIsRescheduleModalOpen(false);
      await refreshStudyPlan();
    } catch (err: any) {
      addToast('Reschedule Error', err.message, 'warning');
    }
  };

  const currentDay = days.find((d) => d.date === currentDate) || days[0];

  const totalCompletedLevels = days.reduce(
    (acc, d) => acc + (d.tasks?.filter((t) => t.status === 'completed').length || 0),
    0
  );
  const isCheckpointUnlocked = totalCompletedLevels >= 5;
  const isDailyAssessmentUnlocked = Boolean(currentDay?.tasks?.length > 0 && currentDay.tasks.every(t => t.status === 'completed'));

  const handleLaunchCheckpoint = async () => {
    try {
      const assessment = await api.generateAssessment('checkpoint', currentDate);
      onNavigate('test-runner', { config: assessment });
    } catch (err: any) {
      addToast('Assessment Error', err.message, 'warning');
    }
  };

  const handleLaunchDailyCumulative = async () => {
    try {
      const assessment = await api.generateAssessment('daily_cumulative', currentDate);
      onNavigate('test-runner', { config: assessment });
    } catch (err: any) {
      addToast('Assessment Error', err.message, 'warning');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <span className="section-label">04 — Structured Study Timeline</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 4 }}>
            My Preparation Plan
          </h1>
          <p className="section-desc">
            Universal preparation roadmap combining cognitive aptitude and {activeCompany?.name || 'company'} technical syllabus.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--bg-muted)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'journey' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setViewMode('journey')}
            >
              <Compass size={14} /> Journey Map
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'daily' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setViewMode('daily')}
            >
              <Target size={14} /> Day Tasks
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setViewMode('timeline')}
            >
              <CalendarDays size={14} /> Full Roadmap
            </button>
          </div>

          <button className="btn btn-secondary" onClick={() => setIsRescheduleModalOpen(true)}>
            <RotateCcw size={15} /> Reschedule Plan
          </button>
        </div>
      </div>

      {viewMode === 'journey' ? (
        <WindingLearningMap onNavigate={onNavigate} />
      ) : viewMode === 'daily' ? (
        /* Daily View */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
          {/* Main Tasks List */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="card-title">
                  {currentDay?.label || 'Preparation Schedule'} — {currentDate}
                </div>
                <div className="card-subtitle">
                  Focus: {currentDay?.focus || 'Core Engineering & Cognitive Practice'}
                </div>
              </div>

              <span className="badge badge-primary">
                {currentDay?.tasks?.filter((t) => t.status === 'completed').length || 0} of {currentDay?.tasks?.length || 0} Done
              </span>
            </div>

            {/* Target Checklist */}
            {currentDay?.targets && currentDay.targets.length > 0 && (
              <div style={{ background: 'var(--bg-muted)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Today's Core Learning Objectives
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {currentDay.targets.map((tgt, i) => (
                    <div key={i} style={{ fontSize: '0.86rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></span>
                      <span>{tgt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentDay?.tasks?.map((task, idx) => {
                const isCompleted = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: isCompleted ? 'var(--border-subtle)' : 'var(--border-hover)',
                      background: isCompleted ? 'var(--bg-muted)' : 'var(--bg-surface)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1, paddingRight: 16 }}>
                      <button
                        onClick={() => handleToggleTaskStatus(task, task.status)}
                        disabled={updatingTaskId === task.id}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: isCompleted ? 'none' : '2px solid var(--border-hover)',
                          background: isCompleted ? 'var(--emerald-success)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          cursor: 'pointer',
                          marginTop: 2,
                          flexShrink: 0,
                        }}
                      >
                        {isCompleted && <CheckCircle2 size={16} />}
                      </button>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 500,
                            color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            lineHeight: 1.5,
                          }}
                        >
                          {task.task_text}
                        </div>

                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4, fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                          {task.block_time && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} /> {task.block_time}
                            </span>
                          )}
                          <span>•</span>
                          <span className="badge badge-neutral" style={{ padding: '1px 6px', fontSize: '0.7rem' }}>
                            {activeCompany?.logo_initials || 'Shared'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onNavigate('practice')}
                      >
                        Practice Topic
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Milestone Assessments: Checkpoint & End-of-Day Cumulative */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Daily Cumulative Assessment */}
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: isDailyAssessmentUnlocked ? 'rgba(5, 150, 105, 0.08)' : 'var(--bg-muted)',
                  border: isDailyAssessmentUnlocked ? '1px solid var(--emerald-border)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge ${isDailyAssessmentUnlocked ? 'badge-emerald' : 'badge-slate'}`} style={{ fontSize: '0.68rem' }}>
                      {isDailyAssessmentUnlocked ? 'Unlocked' : 'Locked'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-m)' }}>
                      End-of-Day Mission Assessment
                    </span>
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Daily Cumulative Assessment ({currentDate})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Synthesizes today's completed topics, spaced revision, and past mistakes.
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  disabled={!isDailyAssessmentUnlocked}
                  onClick={handleLaunchDailyCumulative}
                  style={{
                    background: isDailyAssessmentUnlocked ? 'var(--emerald-success)' : undefined,
                    cursor: isDailyAssessmentUnlocked ? 'pointer' : 'not-allowed',
                    opacity: isDailyAssessmentUnlocked ? 1 : 0.6,
                  }}
                >
                  <Play size={14} /> Start Daily Assessment
                </button>
              </div>

              {/* Checkpoint Milestone (Every 5 completed levels) */}
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: isCheckpointUnlocked ? 'rgba(46, 165, 201, 0.08)' : 'var(--bg-muted)',
                  border: isCheckpointUnlocked ? '1px solid var(--primary-border)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge ${isCheckpointUnlocked ? 'badge-cyan' : 'badge-slate'}`} style={{ fontSize: '0.68rem' }}>
                      {isCheckpointUnlocked ? 'Milestone Unlocked' : `${totalCompletedLevels % 5}/5 Micro-Levels to Unlock`}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-m)' }}>
                      Multi-Subject Checkpoint
                    </span>
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Checkpoint Assignment (10-15 Multi-Discipline Drill)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Comprehensive evaluation combining Quantitative, Logical, Visual, and Technical fundamentals.
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  disabled={!isCheckpointUnlocked}
                  onClick={handleLaunchCheckpoint}
                  style={{
                    cursor: isCheckpointUnlocked ? 'pointer' : 'not-allowed',
                    opacity: isCheckpointUnlocked ? 1 : 0.6,
                  }}
                >
                  <Play size={14} /> Take Checkpoint
                </button>
              </div>
            </div>
          </div>

          {/* Right Navigation Panel: All Days Quick Select */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
              Plan Calendar ({days.length} Days)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {days.map((day) => {
                const isSelected = day.date === currentDate;
                const doneCount = day.tasks?.filter((t) => t.status === 'completed').length || 0;
                const totalCount = day.tasks?.length || 0;
                const isAllDone = totalCount > 0 && doneCount === totalCount;

                return (
                  <div
                    key={day.date}
                    onClick={() => setCurrentDate(day.date)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {day.label}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                        {day.date}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: isAllDone ? 'var(--emerald-bg)' : 'var(--bg-muted)',
                        color: isAllDone ? 'var(--emerald-success)' : 'var(--text-muted)',
                      }}
                    >
                      {doneCount}/{totalCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Full Roadmap / Timeline View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {days.map((day) => {
            const isExpanded = expandedDate === day.date;
            const completedCount = day.tasks?.filter((t) => t.status === 'completed').length || 0;
            const totalCount = day.tasks?.length || 0;

            return (
              <div key={day.date} className="card" style={{ padding: 20 }}>
                <div
                  onClick={() => setExpandedDate(isExpanded ? '' : day.date)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-sm)',
                        background: completedCount === totalCount ? 'var(--emerald-bg)' : 'var(--primary-light)',
                        color: completedCount === totalCount ? 'var(--emerald-success)' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {completedCount}/{totalCount}
                    </div>

                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {day.label} ({day.date})
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Focus: {day.focus}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentDate(day.date);
                        setViewMode('daily');
                      }}
                    >
                      Open Day
                    </button>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {day.tasks?.map((t) => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                        <CheckCircle2
                          size={16}
                          color={t.status === 'completed' ? 'var(--emerald-success)' : 'var(--text-subtle)'}
                        />
                        <span style={{ color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                          {t.task_text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Plan Modal */}
      {isRescheduleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Reschedule Incomplete Tasks
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsRescheduleModalOpen(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Our deterministic local scheduler redistributes your uncompleted study tasks evenly across remaining days up to your assessment deadline without deleting completed tasks.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
                Target Assessment Date
              </label>
              <input
                type="date"
                className="input"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setIsRescheduleModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleReschedulePlan}>
                Recalculate Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
