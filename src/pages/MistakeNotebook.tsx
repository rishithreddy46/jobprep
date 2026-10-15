import React, { useState, useEffect } from 'react';
import {
  BookX,
  Play,
  CheckCircle2,
  AlertCircle,
  Tag,
  Edit3,
  Save,
  RotateCcw,
  BookOpen,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { MistakeItem } from '../types';

interface MistakeNotebookProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({ onNavigate }) => {
  const { addToast, refreshXpStreak, triggerConfetti } = useApp();
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<'unresolved' | 'resolved' | 'all'>('unresolved');
  const [filterTrack, setFilterTrack] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editCategory, setEditCategory] = useState<MistakeItem['error_category']>('concept');

  const loadMistakes = async () => {
    try {
      setLoading(true);
      const list = await api.getMistakes();
      setMistakes(list);
    } catch (err) {
      console.error('Error loading mistake notebook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMistakes();
  }, []);

  const handleStartEdit = (m: MistakeItem) => {
    setEditingId(m.question_id);
    setEditNotes(m.personal_notes || '');
    setEditCategory(m.error_category || 'concept');
  };

  const handleSaveEdit = async (questionId: string) => {
    try {
      await api.updateMistake(questionId, {
        personal_notes: editNotes,
        error_category: editCategory,
      });
      setEditingId(null);
      addToast('Mistake Notes Updated', '', 'success');
      loadMistakes();
    } catch (err: any) {
      addToast('Error saving note', err.message, 'warning');
    }
  };

  const handleResolve = async (questionId: string) => {
    try {
      const res = await api.resolveMistake(questionId);
      addToast('Question Marked Resolved!', `+${res.xpAwarded} XP awarded for error review`, 'success');
      if (res.xpAwarded > 0) triggerConfetti();
      await refreshXpStreak();
      loadMistakes();
    } catch (err: any) {
      addToast('Error resolving mistake', err.message, 'warning');
    }
  };

  const handleLaunchRetryQuiz = () => {
    const unresolved = mistakes.filter((m) => !m.is_resolved);
    if (unresolved.length === 0) {
      addToast('No Unresolved Mistakes', 'All recorded errors have been mastered!', 'info');
      return;
    }

    onNavigate('test-runner', {
      config: {
        title: 'Mistake Notebook Re-Test & Mastery Challenge',
        test_type: 'mistake_retry',
        track: 'all',
        topic: 'all',
        difficulty: 'all',
        isMistakeRetry: true,
        questionCount: Math.min(20, unresolved.length),
        timeLimitMinutes: 25,
        shuffleOptions: true,
      },
    });
  };

  const filtered = mistakes.filter((m) => {
    if (filterStatus === 'unresolved' && m.is_resolved) return false;
    if (filterStatus === 'resolved' && !m.is_resolved) return false;
    if (filterTrack !== 'all' && m.track !== filterTrack) return false;
    return true;
  });

  const unresolvedCount = mistakes.filter((m) => !m.is_resolved).length;
  const resolvedCount = mistakes.filter((m) => m.is_resolved).length;

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card card-amber-accent" style={{ marginBottom: 24, padding: '26px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 750 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-amber">Error Log & Mastery Loop</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {unresolvedCount} In Backlog • {resolvedCount} Mastered
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Personal Mistake Notebook
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Every incorrect answer from practice sets and mocks is automatically logged here. Classify your error types, note down formulas, and re-test until you score two consecutive correct answers.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleLaunchRetryQuiz}
            disabled={unresolvedCount === 0}
            style={{
              background: unresolvedCount > 0 ? 'linear-gradient(135deg, #ffb703 0%, #d97706 100%)' : 'var(--bg-card)',
              color: unresolvedCount > 0 ? '#060a12' : 'var(--text-subtle)',
              borderColor: 'rgba(255, 183, 3, 0.4)',
            }}
          >
            <Play size={16} />
            <span>Re-Test Unresolved Mistakes ({unresolvedCount})</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${filterStatus === 'unresolved' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilterStatus('unresolved')}
          >
            Unresolved ({unresolvedCount})
          </button>
          <button
            className={`btn ${filterStatus === 'resolved' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilterStatus('resolved')}
          >
            Mastered ({resolvedCount})
          </button>
          <button
            className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilterStatus('all')}
          >
            All Errors ({mistakes.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Filter Track:</span>
          <select
            value={filterTrack}
            onChange={(e) => setFilterTrack(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-dim)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="all">All Tracks</option>
            <option value="cognitive">Cognitive Ability</option>
            <option value="instrumentation">Instrumentation</option>
          </select>
        </div>
      </div>

      {/* Mistake Items List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <CheckCircle2 size={44} color="var(--emerald-success)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            {filterStatus === 'unresolved' ? 'Mistake Backlog Cleared!' : 'No Logged Mistakes'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 450, margin: '0 auto' }}>
            {filterStatus === 'unresolved'
              ? 'Outstanding performance! You have no pending unresolved errors in your notebook.'
              : 'Incorrect answers from test runs will automatically populate here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {filtered.map((m) => {
            const isEditing = editingId === m.question_id;

            return (
              <div
                key={m.question_id}
                className="card"
                style={{
                  borderLeft: `4px solid ${m.is_resolved ? 'var(--emerald-success)' : 'var(--coral-error)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="badge badge-cyan">{m.track}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{m.topic}</span>
                    <span className="badge badge-amber">Missed {m.retry_count}x</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      Consecutive correct: {m.consecutive_correct}/2
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {m.is_resolved ? (
                      <span className="badge badge-emerald"><CheckCircle2 size={13} /> Mastered</span>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleResolve(m.question_id)}
                        title="Mark as resolved and earn review XP"
                      >
                        <CheckCircle2 size={14} color="var(--emerald-success)" />
                        <span>Mark Mastered (+2 XP)</span>
                      </button>
                    )}

                    {!isEditing && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStartEdit(m)}
                        title="Edit error classification & personal takeaways"
                      >
                        <Edit3 size={14} />
                        <span>Edit Notes</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Prompt */}
                <div style={{ fontSize: '1.02rem', fontWeight: 600, color: '#fff', marginBottom: 14, lineHeight: 1.5 }}>
                  {m.question}
                </div>

                {/* Correct Answer Preview */}
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: 'var(--emerald-success)' }}>
                  <strong>Correct Key ({m.correct_option_id}): </strong> {m.correct_answer}
                </div>

                {/* Explanation */}
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 14, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan-primary)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Solution & Engineering Logic
                  </div>
                  {m.explanation}
                </div>

                {/* Error Categorization & Personal Notes */}
                {isEditing ? (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-cyan)', borderRadius: 'var(--radius-md)', padding: '16px', marginTop: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          Error Category
                        </label>
                        <select
                          value={editCategory}
                          onChange={(e: any) => setEditCategory(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-dim)',
                            color: '#fff',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.82rem',
                            outline: 'none',
                          }}
                        >
                          <option value="concept">Concept Misunderstanding</option>
                          <option value="calculation">Calculation / Unit Error</option>
                          <option value="misread">Question Misread</option>
                          <option value="time_pressure">Time Pressure / Rushed</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          Personal Key Takeaway & Formula Reminder
                        </label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="e.g., Remember square-root relationship in DP flow; check 3-wire RTD lead resistance."
                          style={{
                            width: '100%',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-dim)',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(m.question_id)}>
                        <Save size={14} />
                        <span>Save Takeaways</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: 'var(--text-subtle)', paddingTop: 6 }}>
                    <div>
                      <Tag size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      <span style={{ color: 'var(--text-muted)' }}>Category: </span>
                      <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{m.error_category || 'Concept'}</strong>
                    </div>

                    {m.personal_notes && (
                      <div style={{ color: 'var(--cyan-primary)' }}>
                        <strong>Note: </strong> {m.personal_notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
