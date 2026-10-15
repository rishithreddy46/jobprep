import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  Target,
  Play,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

interface CognitiveArenaProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const CognitiveArena: React.FC<CognitiveArenaProps> = ({ onNavigate }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [unseenOnly, setUnseenOnly] = useState<boolean>(false);
  const [topicStats, setTopicStats] = useState<any[]>([]);

  useEffect(() => {
    const loadCognitiveData = async () => {
      try {
        const [qList, analytics] = await Promise.all([
          api.getQuestions({ track: 'cognitive' }),
          api.getAnalytics(),
        ]);
        setQuestions(qList);
        const cogTopics = analytics.topics?.filter((t: any) => t.track === 'cognitive') || [];
        setTopicStats(cogTopics);
      } catch (err) {
        console.error('Error loading cognitive arena:', err);
      }
    };
    loadCognitiveData();
  }, []);

  const uniqueTopics = Array.from(new Set(questions.map((q) => q.topic))).sort();

  const handleLaunchTest = (count: number, timeMins: number, title: string, topic = 'all') => {
    onNavigate('test-runner', {
      config: {
        title,
        test_type: 'cognitive_sectional',
        track: 'cognitive',
        topic,
        difficulty: selectedDifficulty,
        questionCount: count,
        timeLimitMinutes: timeMins,
        shuffleOptions: true,
        unseenOnly,
      },
    });
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card card-cyan-accent" style={{ marginBottom: 24, padding: '26px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 750 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-cyan">Cognitive Test Track</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>35 Verified Original Seed Questions</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Cognitive Ability Arena
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Sharpen mental arithmetic, logical reasoning, data interpretation, and verbal speed. RIL's official listing confirms a dedicated Cognitive Test round.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={() => handleLaunchTest(10, 12, '10-Question Cognitive Speed Sprint')}
            >
              <Zap size={16} />
              <span>10-Question Sprint (12m)</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleLaunchTest(20, 25, 'Full Cognitive Sectional Simulation')}
            >
              <Target size={16} />
              <span>Full Sectional (25m)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtopic Accuracy & Progress Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
            Cognitive Competencies & Mastery
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            Empirical accuracy calculated from your actual submissions
          </span>
        </div>

        <div className="grid-3">
          {uniqueTopics.map((tp) => {
            const stat = topicStats.find((s) => s.topic === tp);
            const countInBank = questions.filter((q) => q.topic === tp).length;
            const accuracy = stat ? stat.accuracy : 0;
            const attempted = stat ? stat.attempted : 0;

            return (
              <div key={tp} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{tp}</span>
                    <span className="badge badge-cyan">{countInBank} in bank</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: attempted > 0 ? (accuracy >= 75 ? 'var(--emerald-success)' : accuracy >= 50 ? 'var(--amber-warning)' : 'var(--coral-error)') : 'var(--text-subtle)' }}>
                      {attempted > 0 ? `${accuracy}%` : 'Unattempted'}
                    </span>
                    {attempted > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        ({stat.correct} / {attempted} correct)
                      </span>
                    )}
                  </div>
                  <div className="progress-bar-bg" style={{ height: 6 }}>
                    <div className="progress-bar-fill" style={{ width: `${accuracy}%` }}></div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => handleLaunchTest(Math.min(countInBank, 10), 12, `Cognitive Drill: ${tp}`, tp)}
                  >
                    <Play size={14} />
                    <span>Practice {tp}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* External Verified Practice Links */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
            External Practice Resources (Attributed Public Links)
          </h3>
          <span className="badge badge-emerald">Free Access</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Per the research brief, public IndiaBIX categories provide supplementary practice for aptitude and reasoning without replicating third-party text locally.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <a
            href="https://www.indiabix.com/online-test/aptitude-test/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ justifyContent: 'space-between', textDecoration: 'none' }}
          >
            <span>IndiaBIX Quantitative Aptitude</span>
            <ExternalLink size={15} />
          </a>
          <a
            href="https://www.indiabix.com/online-test/logical-reasoning-test/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ justifyContent: 'space-between', textDecoration: 'none' }}
          >
            <span>IndiaBIX Logical Reasoning</span>
            <ExternalLink size={15} />
          </a>
          <a
            href="https://www.indiabix.com/online-test/verbal-ability-test/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ justifyContent: 'space-between', textDecoration: 'none' }}
          >
            <span>IndiaBIX Verbal Tests</span>
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </div>
  );
};
