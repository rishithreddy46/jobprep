import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  Swords,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
  Flame,
  CheckSquare,
  Square,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { StudyDay, StudyTask } from '../types';

interface DailyMissionsProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const DailyMissions: React.FC<DailyMissionsProps> = ({ onNavigate }) => {
  const { studyPlan, refreshStudyPlan, currentDate, setCurrentDate, addToast, triggerConfetti, openFocusTimer } = useApp();
  const [expandedDate, setExpandedDate] = useState<string>(currentDate);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const days: StudyDay[] = studyPlan?.days || [];

  const handleToggleTaskStatus = async (task: StudyTask, currentStatus: string) => {
    // Check if task is score-dependent:
    // If task requires solving or scoring (e.g. "Take 10 untimed diagnostic questions", "Solve 15 technical MCQs", "Timed mixed set"),
    // check if it requires taking a test
    const isTestRequired = /MCQs|diagnostic questions|timed|test|quiz|score/i.test(task.task_text);

    // If clicking from not_started to completed and it's a test task without verification, warn or prompt
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
      });

      if (nextStatus === 'completed') {
        addToast('Mission Task Completed!', `Earned +${res.xpAwarded} XP`, 'success');
        if (res.xpAwarded > 0) triggerConfetti();
      } else {
        addToast('Task Reverted', 'Status set to Not Started', 'info');
      }

      await refreshStudyPlan();
    } catch (err: any) {
      addToast('Error updating task', err.message, 'warning');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleLaunchBossBattle = (day: StudyDay) => {
    // Parse focus to extract topics for a custom test
    let track: 'cognitive' | 'instrumentation' | 'mixed' = 'mixed';
    let topic = 'all';

    if (day.date === '2026-10-18') {
      topic = 'Temperature Measurement';
      track = 'instrumentation';
    } else if (day.date === '2026-10-19') {
      topic = 'Pressure Measurement';
      track = 'instrumentation';
    } else if (day.date === '2026-10-20') {
      topic = 'Flow Measurement';
      track = 'instrumentation';
    } else if (day.date === '2026-10-21') {
      topic = 'Level Measurement';
      track = 'instrumentation';
    } else if (day.date === '2026-10-22') {
      topic = 'Control Systems';
      track = 'instrumentation';
    } else if (day.date === '2026-10-23') {
      topic = 'Industrial Automation';
      track = 'instrumentation';
    }

    onNavigate('test-runner', {
      config: {
        title: `${day.label} — Daily Boss Battle Quiz`,
        test_type: 'boss_battle',
        track,
        topic,
        difficulty: 'all',
        questionCount: 15,
        timeLimitMinutes: 20,
        shuffleOptions: true,
      },
    });
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="badge badge-cyan">Daily Preparation Missions</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>16–26 October 2026</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            GET 2027 Quest Campaign Roadmap
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 750, marginTop: 4 }}>
            An 11-day structured preparation roadmap starting after your NPTEL exam on 16 October and concluding with the assessment-readiness protocol on 26 October.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openFocusTimer()}>
            <Clock size={16} />
            <span>Launch Study Timer</span>
          </button>
        </div>
      </div>

      {/* Special Schedule Notice */}
      <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <AlertCircle size={20} color="var(--cyan-primary)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: '#fff' }}>Candidate Note: </strong>
          {studyPlan?.special_note || '16 October schedule starts after your morning NPTEL exam (09:00–12:00). Routines are flexible, sleep is prioritized, and progress is never erased when dates change.'}
        </div>
      </div>

      {/* Days Campaign List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {days.map((day) => {
          const isExpanded = expandedDate === day.date;
          const isSelectedDate = currentDate === day.date;
          const dayTasks = day.tasks || [];
          const completedCount = dayTasks.filter((t) => t.status === 'completed').length;
          const progressPct = dayTasks.length > 0 ? Math.round((completedCount / dayTasks.length) * 100) : 0;

          return (
            <div
              key={day.date}
              className="card"
              style={{
                borderColor: isSelectedDate ? 'var(--cyan-primary)' : isExpanded ? 'rgba(255, 255, 255, 0.18)' : 'var(--border-dim)',
                boxShadow: isSelectedDate ? '0 0 25px rgba(0, 229, 255, 0.12)' : 'none',
              }}
            >
              {/* Day Header Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
                onClick={() => setExpandedDate(isExpanded ? '' : day.date)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: progressPct === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 229, 255, 0.1)',
                      border: '1px solid',
                      borderColor: progressPct === 100 ? 'var(--emerald-success)' : 'rgba(0, 229, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: progressPct === 100 ? 'var(--emerald-success)' : 'var(--cyan-primary)',
                    }}
                  >
                    {progressPct === 100 ? <CheckCircle2 size={24} /> : day.date.split('-')[2]}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                        {day.label}
                      </h3>
                      {isSelectedDate && <span className="badge badge-cyan">Active Date</span>}
                      {progressPct === 100 && <span className="badge badge-emerald">Completed</span>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {day.focus}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Progress bar */}
                  <div style={{ width: 140, textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>
                      {completedCount} / {dayTasks.length} Tasks ({progressPct}%)
                    </div>
                    <div className="progress-bar-bg" style={{ height: 6, margin: '4px 0 0' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${progressPct}%`,
                          background: progressPct === 100 ? 'var(--emerald-success)' : 'linear-gradient(90deg, #00b4d8, #00e5ff)',
                        }}
                      ></div>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentDate(day.date);
                      addToast('Preparation Date Switched', `Set mission view to ${day.date}`, 'info');
                    }}
                    title="Set as active prep date"
                  >
                    Set Active
                  </button>

                  {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--border-dim)' }}>
                  {/* Targets & Boss Battle Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, background: 'rgba(0, 0, 0, 0.25)', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Key Day Benchmark Targets
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                        {day.targets.map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.82rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Target size={14} color="var(--amber-warning)" /> {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleLaunchBossBattle(day)}
                    >
                      <Swords size={16} />
                      <span>Launch Day Boss Battle Quiz</span>
                    </button>
                  </div>

                  {/* Tasks Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Scheduled Study Blocks & Checkable Tasks
                    </div>

                    {dayTasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      return (
                        <div
                          key={task.id}
                          style={{
                            background: isCompleted ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid',
                            borderColor: isCompleted ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-dim)',
                            borderRadius: 'var(--radius-md)',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 260 }}>
                            <button
                              onClick={() => handleToggleTaskStatus(task, task.status)}
                              disabled={updatingTaskId === task.id}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: isCompleted ? 'var(--emerald-success)' : 'var(--text-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0,
                              }}
                            >
                              {isCompleted ? <CheckSquare size={22} /> : <Square size={22} />}
                            </button>

                            <div>
                              <div style={{
                                fontSize: '0.92rem',
                                fontWeight: 600,
                                color: isCompleted ? 'var(--text-muted)' : '#fff',
                                textDecoration: isCompleted ? 'line-through' : 'none',
                              }}>
                                {task.task_text}
                              </div>
                              {task.block_time && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                                  <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                  {task.block_time} IST
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openFocusTimer(task.task_text)}
                              title="Time this specific study block"
                            >
                              <Clock size={14} />
                              <span>Timer</span>
                            </button>

                            <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-cyan'}`}>
                              {isCompleted ? 'Completed (+10 XP)' : '10 XP'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
