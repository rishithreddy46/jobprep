import React, { useState, useEffect } from 'react';
import {
  Target,
  Brain,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  BookX,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Filter,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { Question, PracticeCategory } from '../types';

interface PracticeCentreProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const PracticeCentre: React.FC<PracticeCentreProps> = ({ onNavigate }) => {
  const { addToast } = useApp();
  const [categories, setCategories] = useState<PracticeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active question solving state
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  useEffect(() => {
    const fetchCategoriesAndQuestions = async () => {
      try {
        setLoading(true);
        const [cats, qList] = await Promise.all([
          api.getPracticeCategories().catch(() => []),
          api.getQuestions(),
        ]);
        setCategories(cats);
        setQuestions(qList);
      } catch (err) {
        console.error('Error fetching practice data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndQuestions();
  }, []);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
    if (selectedCategory !== 'all') {
      const cat = categories.find((c) => c.id === selectedCategory);
      if (cat) {
        const matchesTopic = cat.topics?.some((t) => q.topic.toLowerCase().includes(t.toLowerCase()));
        const matchesTrack = cat.track && q.track === cat.track;
        if (!matchesTopic && !matchesTrack) return false;
      }
    }
    return true;
  });

  const currentQ = filteredQuestions[activeQuestionIndex];

  const handleSelectOption = (optId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleCheckAnswer = async () => {
    if (!selectedOptionId || !currentQ || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    setSolvedCount((prev) => prev + 1);

    const isCorrect = selectedOptionId === currentQ.correct_option_id;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      addToast('Correct!', 'Great job, explanation unlocked below.', 'success');
    } else {
      // Add to mistake notebook automatically
      try {
        await api.submitTestRun({
          title: 'Practice Session Check',
          test_type: 'practice',
          date: new Date().toISOString().split('T')[0],
          total_questions: 1,
          attempted: 1,
          correct: 0,
          incorrect: 1,
          unanswered: 0,
          accuracy: 0,
          time_taken_seconds: 30,
          score: 0,
          questions: [currentQ],
          responses: {
            [currentQ.id]: { chosen_option_id: selectedOptionId, time_spent: 30 },
          },
        });
        addToast('Saved to Mistakes', 'Added to your mistake revision queue.', 'warning');
      } catch (_) {}
    }
  };

  const handleNextQuestion = () => {
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    if (activeQuestionIndex < filteredQuestions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
    } else {
      setActiveQuestionIndex(0);
      addToast('Set Completed', 'Looped back to the start of this practice batch.', 'info');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <span className="section-label">03 — Practice Arena & Question Vault</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 4 }}>
            Universal Practice Centre
          </h1>
          <p className="section-desc">
            Granular practice across quantitative aptitude, logical reasoning, verbal ability, and engineering core subjects.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('mistakes')}>
            <BookX size={15} /> Mistake Notebook
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('mocks')}>
            <Target size={15} /> Full Timed Mocks
          </button>
        </div>
      </div>

      {/* Category Selection Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div
          onClick={() => { setSelectedCategory('all'); setActiveQuestionIndex(0); setIsAnswerSubmitted(false); }}
          className="card"
          style={{
            padding: 16,
            cursor: 'pointer',
            borderColor: selectedCategory === 'all' ? 'var(--primary)' : 'var(--border-subtle)',
            background: selectedCategory === 'all' ? 'var(--primary-light)' : 'var(--bg-surface)',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-main)' }}>
            All Topics
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, margin: '6px 0 2px' }}>
            {questions.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Combined Question Bank
          </div>
        </div>

        {categories.slice(0, 3).map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setActiveQuestionIndex(0); setIsAnswerSubmitted(false); }}
              className="card"
              style={{
                padding: 16,
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cat.title}
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, margin: '6px 0 2px' }}>
                {cat.questionCount}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {cat.attemptedCount > 0 ? `${cat.accuracy}% personal accuracy` : 'Not attempted yet'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Practice Question Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'flex-start' }}>
        {/* Main Question Card */}
        <div className="card">
          {currentQ ? (
            <div>
              {/* Question Meta & Tags */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-primary">
                    {currentQ.track === 'cognitive' ? 'Cognitive' : 'Technical'}
                  </span>
                  <span className="badge badge-neutral">{currentQ.topic}</span>
                  <span className={`badge ${currentQ.difficulty === 'hard' ? 'badge-danger' : currentQ.difficulty === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                    {currentQ.difficulty}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} />
                  <span>{currentQ.recommended_time_seconds || 60}s suggested</span>
                </div>
              </div>

              {/* Question Text */}
              <div style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.6, color: 'var(--text-main)', marginBottom: 24 }}>
                <span style={{ color: 'var(--primary)', marginRight: 6 }}>Q{activeQuestionIndex + 1}.</span>
                {currentQ.question}
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {currentQ.options?.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  let cardClass = 'option-card';
                  if (isSelected) cardClass += ' selected';
                  if (isAnswerSubmitted) {
                    if (opt.id === currentQ.correct_option_id) cardClass += ' correct';
                    else if (isSelected && opt.id !== currentQ.correct_option_id) cardClass += ' incorrect';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={cardClass}
                      onClick={() => handleSelectOption(opt.id)}
                    >
                      <div className="option-badge">{opt.id}</div>
                      <div style={{ flex: 1, fontSize: '0.92rem' }}>{opt.text}</div>
                      {isAnswerSubmitted && opt.id === currentQ.correct_option_id && (
                        <CheckCircle2 size={18} color="var(--emerald-success)" />
                      )}
                      {isAnswerSubmitted && isSelected && opt.id !== currentQ.correct_option_id && (
                        <XCircle size={18} color="var(--coral-error)" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                  Question {activeQuestionIndex + 1} of {filteredQuestions.length}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {!isAnswerSubmitted ? (
                    <button
                      className="btn btn-primary"
                      disabled={!selectedOptionId}
                      onClick={handleCheckAnswer}
                      style={{ opacity: selectedOptionId ? 1 : 0.6 }}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleNextQuestion}>
                      Next Question <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Step-by-Step Explanation Banner */}
              {isAnswerSubmitted && (
                <div
                  style={{
                    marginTop: 24,
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: selectedOptionId === currentQ.correct_option_id ? 'var(--emerald-bg)' : 'var(--amber-bg)',
                    border: '1px solid',
                    borderColor: selectedOptionId === currentQ.correct_option_id ? 'var(--emerald-border)' : 'var(--amber-border)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: selectedOptionId === currentQ.correct_option_id ? 'var(--emerald-success)' : 'var(--amber-warning)', marginBottom: 6 }}>
                    {selectedOptionId === currentQ.correct_option_id ? 'Correct Answer' : 'Incorrect Selection'} — Correct: Option {currentQ.correct_option_id}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                    {currentQ.explanation}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-subtle)' }}>
              No practice questions found matching your filter criteria.
            </div>
          )}
        </div>

        {/* Right Filter & Session Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Session Tracker */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title" style={{ fontSize: '0.92rem' }}>Session Progress</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Attempted:</span>
              <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{solvedCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Accuracy:</span>
              <strong style={{ fontSize: '0.84rem', color: solvedCount > 0 && Math.round((correctCount / solvedCount) * 100) >= 70 ? 'var(--emerald-success)' : 'var(--amber-warning)' }}>
                {solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0}%
              </strong>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title" style={{ fontSize: '0.92rem' }}>Difficulty</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['all', 'easy', 'medium', 'hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => { setSelectedDifficulty(diff); setActiveQuestionIndex(0); setIsAnswerSubmitted(false); }}
                  className={`btn btn-sm ${selectedDifficulty === diff ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', textTransform: 'capitalize' }}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
