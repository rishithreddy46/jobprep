import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Play,
  RotateCcw,
  Clock,
  Target,
  BookX,
  AlertCircle,
  Brain,
  Sliders,
  History,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

interface MockTestCentreProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const MockTestCentre: React.FC<MockTestCentreProps> = ({ onNavigate }) => {
  const { activeTestConfig, companies, activeCompanyId } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [unresolvedMistakesCount, setUnresolvedMistakesCount] = useState<number>(0);

  // Custom Builder State
  const [customTrack, setCustomTrack] = useState<string>('all');
  const [customTopic, setCustomTopic] = useState<string>('all');
  const [customDifficulty, setCustomDifficulty] = useState<string>('all');
  const [customCount, setCustomCount] = useState<number>(20);
  const [customTime, setCustomTime] = useState<number>(25);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [qStats, runs, mistakes] = await Promise.all([
          api.getQuestionStats(),
          api.getTestRuns(),
          api.getMistakes(),
        ]);
        setStats(qStats);
        setTestRuns(runs);
        setUnresolvedMistakesCount(mistakes.filter((m) => !m.is_resolved).length);
      } catch (err) {
        console.error('Error loading mock stats:', err);
      }
    };
    loadStats();
  }, []);

  const handleLaunchPreset = (config: any) => {
    onNavigate('test-runner', { config });
  };

  const handleLaunchCustom = () => {
    onNavigate('test-runner', {
      config: {
        title: `Custom Test: ${customTrack === 'all' ? 'Mixed' : customTrack} (${customCount} Qs)`,
        test_type: 'practice',
        track: customTrack,
        topic: customTopic,
        difficulty: customDifficulty,
        questionCount: customCount,
        timeLimitMinutes: customTime,
        shuffleOptions,
      },
    });
  };

  const handleLaunchMistakeRetry = () => {
    onNavigate('test-runner', {
      config: {
        title: 'Mistake Notebook Re-Test & Mastery Challenge',
        test_type: 'mistake_retry',
        track: 'all',
        topic: 'all',
        difficulty: 'all',
        isMistakeRetry: true,
        questionCount: Math.min(20, Math.max(1, unresolvedMistakesCount)),
        timeLimitMinutes: 25,
        shuffleOptions: true,
      },
    });
  };

  return (
    <div className="page-wrapper">
      {/* Resume Banner */}
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
                Test in Progress: {activeTestConfig.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Your responses have been autosaved.
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('test-runner')}>
            Resume Active Test
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <span className="section-label">05 — Mock Test Centre & Speed Arena</span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 4 }}>
          Timed Assessment Arena
        </h1>
        <p className="section-desc">
          Strictly timed assessments with automatic score calculation, negative marking (-0.25), mistake tracking, and authoritative server persistence.
        </p>
      </div>

      {/* Recommended Test Presets */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 14 }}>
          Standard Assessment Formats
        </h2>

        <div className="grid-3">
          {/* Preset 1: Full Company Assessment */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="badge badge-primary">{activeCompany?.logo_initials || 'Company'} Track</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>40m limit</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                {activeCompany?.name ? `${activeCompany.name.split('(')[0].trim()} Full Mock` : 'Full Company Mock'}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Timed mixed test: 12 Cognitive questions + 18 Technical engineering questions (30 questions total).
              </p>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', lineHeight: 1.6 }}>
                • 40% Cognitive / 60% Core Engineering<br />
                • Countdown timer with safe autosaving<br />
                • Authoritative server-side scoring
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 18 }}
              onClick={() => handleLaunchPreset({
                title: `${activeCompany?.name || 'Company'} Full Assessment Mock (30 Qs)`,
                test_type: 'mixed_mock',
                track: 'mixed',
                questionCount: 30,
                cognitiveCount: 12,
                instrumentationCount: 18,
                timeLimitMinutes: 40,
                shuffleOptions: true,
              })}
            >
              <Play size={15} /> Launch Assessment
            </button>
          </div>

          {/* Preset 2: Cognitive Sectional */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="badge badge-neutral">Cognitive Ability</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>20m limit</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                Cognitive Aptitude Sectional
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                15 questions focused on quantitative aptitude, logical reasoning, and data interpretation.
              </p>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', lineHeight: 1.6 }}>
                • Speed and numerical calculations<br />
                • Syllogisms, series, and logic patterns<br />
                • Explanations provided on submission
              </div>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 18 }}
              onClick={() => handleLaunchPreset({
                title: 'Cognitive Aptitude Sectional (15 Qs)',
                test_type: 'cognitive_sectional',
                track: 'cognitive',
                questionCount: 15,
                timeLimitMinutes: 20,
                shuffleOptions: true,
              })}
            >
              <Play size={15} /> Launch Sectional
            </button>
          </div>

          {/* Preset 3: Mistake Re-Test */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="badge badge-warning">Targeted Revision</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>25m limit</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                Mistake Mastery Challenge
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Test yourself on questions you previously missed until you achieve 2 consecutive correct answers.
              </p>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', lineHeight: 1.6 }}>
                • {unresolvedMistakesCount} question(s) awaiting mastery<br />
                • Automatically resolves mastered items<br />
                • Re-tests only genuine errors
              </div>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 18 }}
              disabled={unresolvedMistakesCount === 0}
              onClick={handleLaunchMistakeRetry}
            >
              <BookX size={15} /> {unresolvedMistakesCount > 0 ? 'Start Re-Test' : 'No Mistakes Pending'}
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Custom Test Builder + Past Assessment Runs */}
      <div className="grid-2">
        {/* Custom Test Builder */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Custom Test Builder</div>
            <div className="card-subtitle">Configure topics, questions, and duration</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid-2">
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Subject Track
                </label>
                <select
                  className="select"
                  value={customTrack}
                  onChange={(e) => setCustomTrack(e.target.value)}
                >
                  <option value="all">Mixed (Cognitive + Technical)</option>
                  <option value="cognitive">Cognitive Ability</option>
                  <option value="instrumentation">Electronics & Instrumentation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Difficulty
                </label>
                <select
                  className="select"
                  value={customDifficulty}
                  onChange={(e) => setCustomDifficulty(e.target.value)}
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Question Count
                </label>
                <select
                  className="select"
                  value={customCount}
                  onChange={(e) => setCustomCount(parseInt(e.target.value, 10))}
                >
                  <option value="10">10 Questions</option>
                  <option value="15">15 Questions</option>
                  <option value="20">20 Questions</option>
                  <option value="30">30 Questions</option>
                  <option value="50">50 Questions</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Time Limit (Minutes)
                </label>
                <select
                  className="select"
                  value={customTime}
                  onChange={(e) => setCustomTime(parseInt(e.target.value, 10))}
                >
                  <option value="15">15 Minutes</option>
                  <option value="25">25 Minutes</option>
                  <option value="40">40 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="shuffleCheckbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
              />
              <label htmlFor="shuffleCheckbox" style={{ fontSize: '0.84rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                Shuffle option order (preserves correct answer key)
              </label>
            </div>

            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleLaunchCustom}>
              <Play size={15} /> Launch Custom Test
            </button>
          </div>
        </div>

        {/* Past Assessment Runs */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Completed Assessment Runs</div>
              <div className="card-subtitle">{testRuns.length} recorded session(s)</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('analytics')}>
              Full Analytics
            </button>
          </div>

          {testRuns.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.88rem' }}>
              No completed tests yet. Launch your first assessment above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '340px', overflowY: 'auto' }}>
              {testRuns.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-muted)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {run.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                      {run.date} • {Math.round(run.time_taken_seconds / 60)}m taken • {run.correct}/{run.attempted} correct
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: run.accuracy >= 75 ? 'var(--emerald-success)' : 'var(--amber-warning)' }}>
                      {run.accuracy}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>accuracy</div>
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
