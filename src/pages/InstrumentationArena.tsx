import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  Zap,
  Target,
  Thermometer,
  Gauge,
  Activity,
  Cpu,
  ShieldAlert,
  Binary,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client';

interface InstrumentationArenaProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const InstrumentationArena: React.FC<InstrumentationArenaProps> = ({ onNavigate }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [topicStats, setTopicStats] = useState<any[]>([]);

  useEffect(() => {
    const loadTechnicalData = async () => {
      try {
        const [qList, analytics] = await Promise.all([
          api.getQuestions({ track: 'instrumentation' }),
          api.getAnalytics(),
        ]);
        setQuestions(qList);
        const instTopics = analytics.topics?.filter((t: any) => t.track === 'instrumentation') || [];
        setTopicStats(instTopics);
      } catch (err) {
        console.error('Error loading instrumentation arena:', err);
      }
    };
    loadTechnicalData();
  }, []);

  const uniqueTopics = Array.from(new Set(questions.map((q) => q.topic))).sort();

  const handleLaunchTest = (count: number, timeMins: number, title: string, topic = 'all') => {
    onNavigate('test-runner', {
      config: {
        title,
        test_type: 'instrumentation_sectional',
        track: 'instrumentation',
        topic,
        difficulty: 'all',
        questionCount: count,
        timeLimitMinutes: timeMins,
        shuffleOptions: true,
      },
    });
  };

  // Curated engineering quick cheat-cards
  const formulas = [
    { title: '4–20 mA Current Loop Scaling', text: 'I = 4 + 16 * ((P - LRV) / (URV - LRV)) mA. 250 Ω drop converts 4–20 mA to 1–5 V for ADC.' },
    { title: 'Differential Pressure Flow Relation', text: 'Flow rate Q ∝ √(ΔP). If flow drops to 50%, differential pressure drops to 25% (square law).' },
    { title: 'Hydrostatic Level Formula', text: 'P = ρ * g * h. Differential pressure transmitters directly measure level in pressurized vessels.' },
    { title: 'RTD Pt100 Standard', text: 'R(0°C) = 100 Ω. Positive temperature coefficient (PTC), ~0.385 Ω/°C for DIN platinum.' },
    { title: 'PID Controller Action', text: 'MV = Kp * e(t) + Ki * ∫e(t)dt + Kd * (de/dt). Integral eliminates steady-state offset; Derivative counters rate of change.' },
  ];

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card card-emerald-accent" style={{ marginBottom: 24, padding: '26px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 750 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-emerald">Subject Matter: Electronics & Instrumentation</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>70 Verified Synthetic Practice Questions</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Instrumentation Technical Arena
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Master industrial sensors, transmitter scaling, control valves, PID loops, DCS/SCADA plant automation, and analog signal conditioning.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={() => handleLaunchTest(15, 18, '15-Question Technical Speed Sprint')}
            >
              <Zap size={16} />
              <span>15-Question Sprint (18m)</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleLaunchTest(30, 40, 'Full Instrumentation Sectional Simulation')}
            >
              <Target size={16} />
              <span>Full Technical Sectional (40m)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Engineering Quick Reference Hints */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
            Core Instrumentation Formulae & Principles
          </h2>
          <span className="badge badge-amber">NPTEL & Industrial Alignment</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {formulas.map((f, idx) => (
            <div key={idx} className="card" style={{ padding: '16px 18px', background: 'rgba(0, 0, 0, 0.25)' }}>
              <div style={{ fontWeight: 700, color: 'var(--cyan-primary)', fontSize: '0.85rem', marginBottom: 6 }}>
                {f.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {f.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topics Breakdown Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
            Technical Topic Breakdown & Performance
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            Filter and launch targeted drills on individual topics
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
                    <span className="badge badge-emerald">{countInBank} in bank</span>
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
                    <div className="progress-bar-fill" style={{ width: `${accuracy}%`, background: 'linear-gradient(90deg, #10b981, #00e5ff)' }}></div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => handleLaunchTest(Math.min(countInBank, 10), 15, `Instrumentation Drill: ${tp}`, tp)}
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
    </div>
  );
};
