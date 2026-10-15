import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Play,
  RotateCcw,
  Sliders,
  Brain,
  Zap,
  Target,
  Sparkles,
  AlertTriangle,
  BookX,
  Clock,
  Shield,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

interface MockTestCentreProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const MockTestCentre: React.FC<MockTestCentreProps> = ({ onNavigate }) => {
  const { activeTestConfig } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [unresolvedMistakesCount, setUnresolvedMistakesCount] = useState<number>(0);

  // Custom Builder State
  const [customTrack, setCustomTrack] = useState<string>('all');
  const [customTopic, setCustomTopic] = useState<string>('all');
  const [customDifficulty, setCustomDifficulty] = useState<string>('all');
  const [customCount, setCustomCount] = useState<number>(20);
  const [customTime, setCustomTime] = useState<number>(25);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [unseenOnly, setUnseenOnly] = useState<boolean>(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [qStats, mistakes] = await Promise.all([
          api.getQuestionStats(),
          api.getMistakes(),
        ]);
        setStats(qStats);
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
        title: `Custom Practice: ${customTrack === 'all' ? 'Mixed' : customTrack} (${customCount} Qs)`,
        test_type: 'practice',
        track: customTrack,
        topic: customTopic,
        difficulty: customDifficulty,
        questionCount: customCount,
        timeLimitMinutes: customTime,
        shuffleOptions,
        unseenOnly,
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
        <div style={{
          background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid var(--border-cyan)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <RotateCcw size={24} color="var(--cyan-primary)" />
            <div>
              <div style={{ fontWeight: 800, color: '#fff' }}>Test in Progress: {activeTestConfig.title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Auto-saved responses intact.</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('test-runner')}>
            Resume Active Test
          </button>
        </div>
      )}

      {/* Header */}
      <div className="card card-cyan-accent" style={{ marginBottom: 24, padding: '26px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="badge badge-cyan">Assessment Simulation Engine</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>105 Total Bank Questions (35 Cognitive / 70 Technical)</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Mock Test Centre
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 800, lineHeight: 1.6 }}>
          Experience timed exam conditions with accessible single-choice questions, question palette navigation, mark for review, instant scoring, and step-by-step explanations.
        </p>
      </div>

      {/* Critical Accuracy Disclaimer */}
      <div style={{ background: 'rgba(255, 183, 3, 0.08)', border: '1px solid rgba(255, 183, 3, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <AlertTriangle size={18} color="var(--amber-warning)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--amber-warning)' }}>Assessment Format Notice: </strong>
          The 40% Cognitive / 60% Instrumentation breakdown and time limits are recommended practice configurations based on curriculum fundamentals and candidate interview themes. They are <strong style={{ color: '#fff' }}>not official RIL exam weightages</strong>.
        </div>
      </div>

      {/* Presets Grid */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Recommended Practice Formats
        </h2>

        <div className="grid-3">
          {/* Preset 1: Standard Mixed Mock */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="badge badge-cyan">GET-Style Practice</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>40m limit</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                Standard Mixed Mock
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Balanced preparation: 12 Cognitive + 18 Instrumentation questions (30 questions total).
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: 8 }}>
                • 40% Quant & Logic / 60% Sensors & Loops<br />
                • Safe option shuffling enabled<br />
                • Awards 15 XP + 10 bonus XP on ≥80% score
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14 }}
              onClick={() => handleLaunchPreset({
                title: 'Standard Mixed Mock Test (30 Qs)',
                test_type: 'mixed_mock',
                track: 'mixed',
                questionCount: 30,
                cognitiveCount: 12,
                instrumentationCount: 18,
                timeLimitMinutes: 40,
                shuffleOptions: true,
              })}
            >
              <Play size={16} />
              <span>Launch Mixed Mock</span>
            </button>
          </div>

          {/* Preset 2: 50-Question Comprehensive Simulation */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="badge badge-violet">Full Simulation</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>60m limit</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                Full Exam Endurance Simulation
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Full-scale assessment simulation: 20 Cognitive + 30 Technical items (50 questions total).
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: 8 }}>
                • Tests mental stamina and time management<br />
                • Countdown timer with automatic submission<br />
                • Comprehensive post-test error analysis
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 14, background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', borderColor: 'rgba(168, 85, 247, 0.4)' }}
              onClick={() => handleLaunchPreset({
                title: 'Full Exam Endurance Simulation (50 Qs)',
                test_type: 'mixed_mock',
                track: 'mixed',
                questionCount: 50,
                cognitiveCount: 20,
                instrumentationCount: 30,
                timeLimitMinutes: 60,
                shuffleOptions: true,
              })}
            >
              <Play size={16} />
              <span>Launch 50-Q Simulation</span>
            </button>
          </div>

          {/* Preset 3: Mistake Notebook Retry */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="badge badge-amber">Targeted Recovery</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{unresolvedMistakesCount} In Backlog</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                Mistake Notebook Re-Test
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                Re-solve questions you previously missed until you achieve 2 consecutive correct answers to master them.
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: 8 }}>
                • Automatically pulls from your error log<br />
                • Eliminates recurring concept & calculation errors<br />
                • Earn +2 XP per resolved question
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 14, borderColor: unresolvedMistakesCount > 0 ? 'var(--amber-warning)' : 'var(--border-dim)' }}
              onClick={handleLaunchMistakeRetry}
              disabled={unresolvedMistakesCount === 0}
            >
              <BookX size={16} color={unresolvedMistakesCount > 0 ? 'var(--amber-warning)' : 'var(--text-subtle)'} />
              <span>{unresolvedMistakesCount > 0 ? `Re-Test Mistakes (${unresolvedMistakesCount})` : 'No Mistakes in Log'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Test Builder */}
      <div className="card">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          Custom Assessment Builder
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Track */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Subject Track
            </label>
            <select
              value={customTrack}
              onChange={(e) => setCustomTrack(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', color: '#fff', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }}
            >
              <option value="all">All Tracks (Mixed)</option>
              <option value="cognitive">Cognitive Ability Only</option>
              <option value="instrumentation">Instrumentation Only</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Difficulty Level
            </label>
            <select
              value={customDifficulty}
              onChange={(e) => setCustomDifficulty(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', color: '#fff', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Question Count */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Question Count: {customCount}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={customCount}
              onChange={(e) => setCustomCount(Number(e.target.value))}
              style={{ width: '100%', marginTop: 10, accentColor: 'var(--cyan-primary)' }}
            />
          </div>

          {/* Time Limit */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Time Limit: {customTime} mins
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={customTime}
              onChange={(e) => setCustomTime(Number(e.target.value))}
              style={{ width: '100%', marginTop: 10, accentColor: 'var(--cyan-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                style={{ accentColor: 'var(--cyan-primary)' }}
              />
              <span>Shuffle Option Positions Safely</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={unseenOnly}
                onChange={(e) => setUnseenOnly(e.target.checked)}
                style={{ accentColor: 'var(--cyan-primary)' }}
              />
              <span>Unseen Questions Only</span>
            </label>
          </div>

          <button className="btn btn-primary" onClick={handleLaunchCustom}>
            <Play size={16} />
            <span>Generate & Start Custom Test</span>
          </button>
        </div>
      </div>
    </div>
  );
};
