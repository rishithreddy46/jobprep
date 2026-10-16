import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { Question, QuestionOption, TestResponse } from '../types';
import { VisualQuestionRenderer, VisualOptionCards, hasVisualOptions } from '../components/VisualQuestionRenderer';

interface TestRunnerProps {
  config: any;
  onExit: () => void;
  onNavigate: (tab: string, extra?: any) => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({ config, onExit, onNavigate }) => {
  const { currentDate, exitTest, addToast, triggerConfetti, refreshXpStreak } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, TestResponse>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return (config?.timeLimitMinutes || 30) * 60;
  });
  const [timeTakenTotal, setTimeTakenTotal] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'flagged'>('all');
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Safe Option Shuffle function
  const shuffleOptionsSafely = (q: any) => {
    const originalOptions = [...q.options];
    const correctText = originalOptions.find((o) => o.id === q.correct_option_id)?.text || q.correct_answer;

    const texts = originalOptions.map((o) => o.text);
    for (let i = texts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [texts[i], texts[j]] = [texts[j], texts[i]];
    }

    const newOptions: QuestionOption[] = (['A', 'B', 'C', 'D'] as const).map((id, idx) => ({
      id,
      text: texts[idx],
    }));

    const newCorrect = newOptions.find((o) => o.text.trim() === correctText.trim()) || newOptions[0];

    return {
      ...q,
      options: newOptions,
      correct_option_id: newCorrect.id,
      correct_answer: correctText,
    };
  };

  // Load and prepare questions
  useEffect(() => {
    const initTest = async () => {
      try {
        setLoading(true);

        // Check if saved state exists in localStorage for crash/refresh recovery
        const savedResponses = localStorage.getItem('get_quest_active_test_responses');
        if (savedResponses) {
          try {
            setResponses(JSON.parse(savedResponses));
          } catch (e) {}
        }

        let loadedQuestions: any[] = [];

        if (config?.isMistakeRetry) {
          // Load from mistakes
          const mistakes = await api.getMistakes();
          loadedQuestions = mistakes.filter((m) => !m.is_resolved).slice(0, config.questionCount || 20);
        } else if (config?.test_type === 'mixed_mock') {
          // Mixed Mock: fetch required counts for Cognitive and Instrumentation
          const cogCount = config.cognitiveCount || Math.round((config.questionCount || 30) * 0.4);
          const instCount = config.instrumentationCount || (config.questionCount - cogCount);

          const [cog, inst] = await Promise.all([
            api.getQuestions({ track: 'cognitive', shuffle: 'true', limit: cogCount, unseen_only: config.unseenOnly }),
            api.getQuestions({ track: 'instrumentation', shuffle: 'true', limit: instCount, unseen_only: config.unseenOnly }),
          ]);

          loadedQuestions = [...cog, ...inst];
        } else {
          // Sectional or custom
          const params: any = {
            shuffle: 'true',
            limit: config?.questionCount || 20,
          };
          if (config?.track && config.track !== 'all' && config.track !== 'mixed') {
            params.track = config.track;
          }
          if (config?.topic && config.topic !== 'all') {
            params.topic = config.topic;
          }
          if (config?.difficulty && config.difficulty !== 'all') {
            params.difficulty = config.difficulty;
          }
          if (config?.unseenOnly) {
            params.unseen_only = 'true';
          }

          loadedQuestions = await api.getQuestions(params);
        }

        // Apply safe option shuffle if requested
        let finalQuestions = loadedQuestions;
        if (config?.shuffleOptions !== false) {
          finalQuestions = loadedQuestions.map(shuffleOptionsSafely);
        }

        // Shuffle overall question order
        for (let i = finalQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
        }

        setQuestions(finalQuestions);
      } catch (err: any) {
        addToast('Error loading test questions', err.message, 'warning');
      } finally {
        setLoading(false);
      }
    };

    initTest();
  }, []);

  // Timer interval
  useEffect(() => {
    if (isSubmitted || loading) return;

    const timer = setInterval(() => {
      setTimeTakenTotal((prev) => prev + 1);

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit on timer expiry
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, loading, questions, responses]);

  // Keyboard navigation & option selection
  useEffect(() => {
    if (isSubmitted || loading || questions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      } else if (e.key.toLowerCase() === 'f') {
        handleToggleFlag();
      } else if (['1', 'a', 'A'].includes(e.key)) {
        handleSelectOption('A');
      } else if (['2', 'b', 'B'].includes(e.key)) {
        handleSelectOption('B');
      } else if (['3', 'c', 'C'].includes(e.key)) {
        handleSelectOption('C');
      } else if (['4', 'd', 'D'].includes(e.key)) {
        handleSelectOption('D');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, responses, isSubmitted, loading]);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (optId: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    const currentResp = responses[currentQuestion.id] || { time_spent: 0, flagged: false };
    const updated = {
      ...responses,
      [currentQuestion.id]: {
        ...currentResp,
        chosen_option_id: optId,
      },
    };
    setResponses(updated);
    localStorage.setItem('get_quest_active_test_responses', JSON.stringify(updated));
  };

  const handleClearChoice = () => {
    if (!currentQuestion) return;
    const currentResp = responses[currentQuestion.id] || { time_spent: 0, flagged: false };
    const updated = {
      ...responses,
      [currentQuestion.id]: {
        ...currentResp,
        chosen_option_id: null,
      },
    };
    setResponses(updated);
    localStorage.setItem('get_quest_active_test_responses', JSON.stringify(updated));
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    const currentResp = responses[currentQuestion.id] || { time_spent: 0, chosen_option_id: null };
    const updated = {
      ...responses,
      [currentQuestion.id]: {
        ...currentResp,
        flagged: !currentResp.flagged,
      },
    };
    setResponses(updated);
    localStorage.setItem('get_quest_active_test_responses', JSON.stringify(updated));
  };

  // Submission calculation
  const handleFinalSubmit = async (autoExpired = false) => {
    if (isSubmitted) return;

    let attempted = 0;
    let correct = 0;
    let incorrect = 0;

    for (const q of questions) {
      const resp = responses[q.id];
      if (resp && resp.chosen_option_id !== undefined && resp.chosen_option_id !== null) {
        attempted++;
        if (resp.chosen_option_id === q.correct_option_id) {
          correct++;
        } else {
          incorrect++;
        }
      }
    }

    const unanswered = questions.length - attempted;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const score = correct; // 1 mark per correct answer

    const payload = {
      title: config?.title || 'Practice Test',
      test_type: config?.test_type || 'practice',
      date: currentDate,
      total_questions: questions.length,
      attempted,
      correct,
      incorrect,
      unanswered,
      accuracy,
      time_taken_seconds: timeTakenTotal,
      score,
      config,
      questions,
      responses,
    };

    try {
      const result = await api.submitTestRun(payload);
      setSubmissionResult({ ...payload, id: result.testId, xpAwarded: result.xpAwarded });
      setIsSubmitted(true);
      setShowSubmitModal(false);
      exitTest(); // Clear active test from localStorage

      if (accuracy >= 80) triggerConfetti();
      addToast(
        autoExpired ? 'Time Expired — Test Submitted!' : 'Test Submitted Successfully!',
        `Score: ${correct}/${questions.length} (${accuracy}%). +${result.xpAwarded} XP!`,
        'success'
      );
      await refreshXpStreak();
    } catch (err: any) {
      addToast('Error submitting test', err.message, 'warning');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '100px 0' }}>
        <Clock size={40} color="var(--primary)" className="spin-slow" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: 'var(--text-main)' }}>Configuring Assessment Arena...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Shuffling verified questions and initializing timing engine.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '100px 0' }}>
        <AlertCircle size={40} color="var(--amber-warning)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: 'var(--text-main)' }}>No Questions Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          No unseen questions match your current filter criteria.
        </p>
        <button className="btn btn-primary" onClick={onExit}>Return to Test Centre</button>
      </div>
    );
  }

  // ==========================================
  // RESULT SCREEN AFTER SUBMISSION
  // ==========================================
  if (isSubmitted && submissionResult) {
    const attemptedList = questions.filter((q) => {
      const resp = responses[q.id];
      if (reviewFilter === 'incorrect') {
        return resp && resp.chosen_option_id !== q.correct_option_id;
      }
      if (reviewFilter === 'flagged') {
        return resp && resp.flagged;
      }
      return true;
    });

    return (
      <div className="page-wrapper">
        {/* Scorecard Hero Banner */}
        <div className="card" style={{ marginBottom: 24, padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="badge badge-primary">Assessment Result</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{submissionResult.date}</span>
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                {submissionResult.title}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Completed in {Math.floor(submissionResult.time_taken_seconds / 60)}m {submissionResult.time_taken_seconds % 60}s. Incorrect questions have been automatically added to your Mistake Notebook.
              </p>
            </div>

            <div style={{ textAlign: 'center', background: 'var(--bg-muted)', padding: '16px 28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Overall Accuracy
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.6rem',
                fontWeight: 800,
                color: submissionResult.accuracy >= 80 ? 'var(--emerald-success)' : submissionResult.accuracy >= 60 ? 'var(--primary)' : 'var(--amber-warning)',
              }}>
                {submissionResult.accuracy}%
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                {submissionResult.correct} of {submissionResult.total_questions} questions correct
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Metrics */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="metric-card">
            <div className="metric-label">Correct Answers</div>
            <div className="metric-value" style={{ color: 'var(--emerald-success)' }}>
              {submissionResult.correct}
            </div>
            <div className="metric-subtitle">1 mark per correct answer</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Incorrect Answers</div>
            <div className="metric-value" style={{ color: 'var(--coral-error)' }}>
              {submissionResult.incorrect}
            </div>
            <div className="metric-subtitle">Added to Mistake Notebook</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Unanswered</div>
            <div className="metric-value" style={{ color: 'var(--text-subtle)' }}>
              {submissionResult.unanswered}
            </div>
            <div className="metric-subtitle">Skipped or unattempted</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">XP Earned</div>
            <div className="metric-value" style={{ color: 'var(--amber-warning)' }}>
              +{submissionResult.xpAwarded} <span style={{ fontSize: '1rem' }}>XP</span>
            </div>
            <div className="metric-subtitle">{submissionResult.accuracy >= 80 ? 'Includes +10 high accuracy bonus!' : 'Base completion award'}</div>
          </div>
        </div>

        {/* Action Controls & Review Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`btn ${reviewFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setReviewFilter('all')}
            >
              All Questions ({questions.length})
            </button>
            <button
              className={`btn ${reviewFilter === 'incorrect' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setReviewFilter('incorrect')}
            >
              Incorrect Only ({submissionResult.incorrect})
            </button>
            <button
              className={`btn ${reviewFilter === 'flagged' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setReviewFilter('flagged')}
            >
              Flagged Only
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('mistakes')}>
              Go to Mistake Notebook <ArrowRight size={14} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={onExit}>
              Return to Arena
            </button>
          </div>
        </div>

        {/* Questions Review List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {attemptedList.map((q, idx) => {
            const resp = responses[q.id];
            const isAttempted = resp && resp.chosen_option_id;
            const isCorrect = isAttempted && resp.chosen_option_id === q.correct_option_id;

            return (
              <div
                key={q.id}
                className="card"
                style={{
                  borderLeft: `4px solid ${isCorrect ? 'var(--emerald-success)' : isAttempted ? 'var(--coral-error)' : 'var(--text-subtle)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-cyan">Question {idx + 1}</span>
                    <span className="badge badge-emerald">{q.track}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{q.topic}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>({q.difficulty})</span>
                  </div>

                  <div>
                    {isCorrect ? (
                      <span className="badge badge-emerald"><CheckCircle2 size={13} /> Correct</span>
                    ) : isAttempted ? (
                      <span className="badge badge-coral"><XCircle size={13} /> Incorrect</span>
                    ) : (
                      <span className="badge badge-amber"><HelpCircle size={13} /> Unanswered</span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 16, lineHeight: 1.5 }}>
                  {q.question}
                </div>

                {q.diagram_spec && (
                  <VisualQuestionRenderer spec={q.diagram_spec} />
                )}

                {/* Options Review */}
                {hasVisualOptions(q) ? (
                  <VisualOptionCards
                    options={q.options}
                    selectedOptionId={isAttempted ? resp.chosen_option_id : null}
                    correctOptionId={q.correct_option_id}
                    showResults={true}
                    disabled={true}
                    onSelectOption={() => {}}
                  />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {q.options.map((opt) => {
                      const isCandidateChoice = isAttempted && resp.chosen_option_id === opt.id;
                      const isTrueCorrect = opt.id === q.correct_option_id;

                      let bg = 'var(--bg-card)';
                      let border = 'var(--border-dim)';
                      if (isTrueCorrect) {
                        bg = 'rgba(16, 185, 129, 0.15)';
                        border = 'var(--emerald-success)';
                      } else if (isCandidateChoice) {
                        bg = 'rgba(244, 63, 94, 0.15)';
                        border = 'var(--coral-error)';
                      }

                      return (
                        <div
                          key={opt.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            background: bg,
                            border: `1px solid ${border}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: '0.88rem',
                          }}
                        >
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: isTrueCorrect ? 'var(--emerald-success)' : isCandidateChoice ? 'var(--coral-error)' : 'rgba(255, 255, 255, 0.08)',
                            color: (isTrueCorrect || isCandidateChoice) ? '#060a12' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}>
                            {opt.id}
                          </div>
                          <span style={{ color: isTrueCorrect ? 'var(--emerald-success)' : isCandidateChoice ? 'var(--coral-error)' : 'var(--text-main)', fontWeight: (isTrueCorrect || isCandidateChoice) ? 600 : 400 }}>
                            {opt.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* In-Depth Explanation */}
                <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.15)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan-primary)', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={14} /> Step-by-Step Educational Solution & Explanation
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {q.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE EXAM RUNNER SCREEN
  // ==========================================
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const isTimeCritical = secondsRemaining < 300; // < 5 mins

  const currentResp = responses[currentQuestion?.id] || {};
  const isCurrentFlagged = currentResp.flagged;

  const answeredCount = Object.values(responses).filter((r) => r.chosen_option_id).length;
  const flaggedCount = Object.values(responses).filter((r) => r.flagged).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="page-wrapper" style={{ maxWidth: 1400 }}>
      {/* Top Test Navigation Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        position: 'sticky',
        top: 'calc(var(--header-height) + 10px)',
        zIndex: 30,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>
              {config?.title || 'Practice Mock Test'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Question {currentIndex + 1} of {questions.length} • {currentQuestion?.track} • {currentQuestion?.topic}
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isTimeCritical ? 'var(--coral-bg)' : 'var(--bg-muted)',
          border: '1px solid',
          borderColor: isTimeCritical ? 'var(--coral-border)' : 'var(--border-subtle)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
        }}>
          <Clock size={16} color={isTimeCritical ? 'var(--coral-error)' : 'var(--primary)'} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            fontWeight: 700,
            color: isTimeCritical ? 'var(--coral-error)' : 'var(--text-main)',
            letterSpacing: '0.02em',
          }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>

        {/* Submit Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowSubmitModal(true)}
          style={{ background: 'var(--emerald-success)' }}
        >
          <Send size={14} />
          <span>Submit Test</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Active Question */}
        <div className="card" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-cyan">Question {currentIndex + 1}</span>
              <span className={`badge ${currentQuestion?.difficulty === 'easy' ? 'badge-emerald' : currentQuestion?.difficulty === 'hard' ? 'badge-coral' : 'badge-amber'}`}>
                {currentQuestion?.difficulty}
              </span>
            </div>

            <button
              onClick={handleToggleFlag}
              className={`btn btn-sm ${isCurrentFlagged ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderColor: isCurrentFlagged ? 'var(--violet-quest)' : 'var(--border-dim)',
                background: isCurrentFlagged ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                color: isCurrentFlagged ? 'var(--violet-quest)' : 'var(--text-muted)',
              }}
            >
              <Flag size={14} />
              <span>{isCurrentFlagged ? 'Marked for Review' : 'Mark for Review (F)'}</span>
            </button>
          </div>

          {/* Question Text */}
          <div style={{
            fontSize: '1.15rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            lineHeight: 1.6,
            marginBottom: 20,
            minHeight: 50,
          }}>
            {currentQuestion?.question}
          </div>

          {/* Visual Non-Verbal Diagram */}
          {currentQuestion?.diagram_spec && (
            <VisualQuestionRenderer spec={currentQuestion.diagram_spec} />
          )}

          {/* Options */}
          {hasVisualOptions(currentQuestion) ? (
            <VisualOptionCards
              options={currentQuestion.options}
              selectedOptionId={currentResp.chosen_option_id}
              onSelectOption={(optId) => handleSelectOption(optId)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
              {currentQuestion?.options.map((opt) => {
                const isSelected = currentResp.chosen_option_id === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(opt.id)}
                  >
                    <div className="option-badge">{opt.id}</div>
                    <div style={{ color: isSelected ? 'var(--blue)' : 'var(--text-main)', fontWeight: isSelected ? 600 : 400 }}>
                      {opt.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Question Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-dim)', paddingTop: 20 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearChoice}
              disabled={!currentResp.chosen_option_id}
            >
              Clear Selection
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Question Palette Card */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: 14 }}>
              Question Palette
            </div>

            <div className="palette-grid" style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {questions.map((q, idx) => {
                const resp = responses[q.id];
                const isAnswered = resp && resp.chosen_option_id;
                const isFlagged = resp && resp.flagged;
                const isCurrent = idx === currentIndex;

                let cls = 'palette-btn';
                if (isCurrent) cls += ' current';
                if (isAnswered) cls += ' answered';
                if (isFlagged) cls += ' flagged';

                return (
                  <button
                    key={q.id}
                    className={cls}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--emerald-success)' }}></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--violet-quest)' }}></span>
                <span>Flagged ({flaggedCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}></span>
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, border: '2px solid var(--primary)' }}></span>
                <span>Current</span>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-muted)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Keyboard Navigation
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', lineHeight: 1.6 }}>
              • Keys <code style={{ color: 'var(--primary)', fontWeight: 600 }}>1, 2, 3, 4</code> or <code style={{ color: 'var(--primary)', fontWeight: 600 }}>A, B, C, D</code> select options<br />
              • <code style={{ color: 'var(--primary)', fontWeight: 600 }}>N</code> or <code style={{ color: 'var(--primary)', fontWeight: 600 }}>→</code> moves to Next question<br />
              • <code style={{ color: 'var(--primary)', fontWeight: 600 }}>P</code> or <code style={{ color: 'var(--primary)', fontWeight: 600 }}>←</code> moves to Previous question<br />
              • <code style={{ color: 'var(--primary)', fontWeight: 600 }}>F</code> toggles Flag for Review
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440, textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(5, 150, 105, 0.1)', border: '1px solid var(--emerald-border)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={24} color="var(--emerald-success)" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
              Ready to Submit Your Test?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Review your question status before finalizing. Once submitted, your score will be computed and solutions revealed.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--emerald-success)', fontFamily: 'var(--font-m)' }}>{answeredCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Answered</div>
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--purple)', fontFamily: 'var(--font-m)' }}>{flaggedCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Flagged</div>
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--amber-warning)', fontFamily: 'var(--font-m)' }}>{unansweredCount}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Unanswered</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowSubmitModal(false)}
              >
                Back to Test
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                onClick={() => handleFinalSubmit(false)}
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
