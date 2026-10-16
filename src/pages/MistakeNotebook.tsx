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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <span className="section-label">07 — Targeted Weakness Elimination</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 4 }}>
            Mistake Notebook & Mastery Queue
          </h1>
          <p className="section-desc">
            Continuous error revision loop. Analyze error categories, annotate root causes, and re-test until you achieve 2 consecutive correct answers.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleLaunchRetryQuiz}
          disabled={unresolvedCount === 0}
        >
          <Play size={15} /> Re-Test Mistakes ({unresolvedCount})
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', background: 'var(--bg-muted)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn btn-sm ${filterStatus === 'unresolved' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', boxShadow: 'none' }}
            onClick={() => setFilterStatus('unresolved')}
          >
            Pending Review ({unresolvedCount})
          </button>
          <button
            className={`btn btn-sm ${filterStatus === 'resolved' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', boxShadow: 'none' }}
            onClick={() => setFilterStatus('resolved')}
          >
            Mastered ({resolvedCount})
          </button>
          <button
            className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', boxShadow: 'none' }}
            onClick={() => setFilterStatus('all')}
          >
            All Mistakes ({mistakes.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Track:</span>
          <select
            value={filterTrack}
            onChange={(e) => setFilterTrack(e.target.value)}
            className="select"
            style={{ width: 'auto', padding: '5px 12px', fontSize: '0.84rem' }}
          >
            <option value="all">All Tracks</option>
            <option value="cognitive">Cognitive Ability</option>
            <option value="instrumentation">Electronics & Instrumentation</option>
          </select>
        </div>
      </div>

      {/* Mistakes List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <CheckCircle2 size={40} color="var(--emerald-success)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
            {filterStatus === 'unresolved' ? 'All Mistakes Mastered!' : 'No Logged Mistakes'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 450, margin: '0 auto' }}>
            {filterStatus === 'unresolved'
              ? 'Your mistake backlog is completely clear. Keep up the high accuracy across future practice sessions!'
              : 'Incorrect answers will automatically show up here for targeted revision.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((m) => {
            const isEditing = editingId === m.question_id;

            return (
              <div key={m.question_id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge badge-primary">{m.track}</span>
                    <span className="badge badge-neutral">{m.topic}</span>
                    <span className={`badge ${m.difficulty === 'hard' ? 'badge-danger' : m.difficulty === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                      {m.difficulty}
                    </span>
                    <span className={`badge ${m.is_resolved ? 'badge-success' : 'badge-warning'}`}>
                      {m.is_resolved ? 'Mastered' : `Consecutive: ${m.consecutive_correct}/2`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!m.is_resolved && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleResolve(m.question_id)}
                      >
                        <CheckCircle2 size={13} /> Mark Mastered
                      </button>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleStartEdit(m)}
                    >
                      <Edit3 size={13} /> Notes
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 14, lineHeight: 1.5 }}>
                  {m.question}
                </div>

                {/* Options List with Correct Marked */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                  {m.options?.map((opt) => (
                    <div
                      key={opt.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.84rem',
                        border: '1px solid',
                        borderColor: opt.id === m.correct_option_id ? 'var(--emerald-border)' : 'var(--border-subtle)',
                        background: opt.id === m.correct_option_id ? 'var(--emerald-bg)' : 'var(--bg-muted)',
                        color: opt.id === m.correct_option_id ? 'var(--emerald-success)' : 'var(--text-muted)',
                        fontWeight: opt.id === m.correct_option_id ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <strong>{opt.id}.</strong> {opt.text}
                      {opt.id === m.correct_option_id && <CheckCircle2 size={14} style={{ marginLeft: 'auto' }} />}
                    </div>
                  ))}
                </div>

                {/* Solution Explanation */}
                <div style={{ background: 'var(--bg-muted)', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 2 }}>Solution:</strong>
                  {m.explanation}
                </div>

                {/* Personal Notes / Editing Area */}
                {isEditing ? (
                  <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                          Error Category
                        </label>
                        <select
                          className="select"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as any)}
                        >
                          <option value="concept">Conceptual Misunderstanding</option>
                          <option value="calculation">Calculation / Formula Error</option>
                          <option value="misread">Misread Question Stem</option>
                          <option value="time_pressure">Time Pressure Rush</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                        Key Takeaway / Formula Note
                      </label>
                      <textarea
                        className="textarea"
                        rows={2}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Write down the exact formula or pitfall to avoid..."
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(m.question_id)}>
                        <Save size={13} /> Save Note
                      </button>
                    </div>
                  </div>
                ) : m.personal_notes ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--amber-warning)', background: 'var(--amber-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--amber-border)', marginTop: 6 }}>
                    <strong>Personal Note ({m.error_category}):</strong> {m.personal_notes}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
