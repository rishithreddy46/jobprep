import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Brain,
  Sliders,
  Clock,
  Flame,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

export const CumulativeAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const topics = analytics?.topics || [];
  const accuracyTrend = analytics?.accuracyTrend || [];
  const mockScores = analytics?.mockScores || [];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="badge badge-cyan">Performance Intelligence</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Empirical Assessment Insights</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Cumulative Performance Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 750, marginTop: 4 }}>
            Detailed trends across accuracy, topic strengths and weaknesses, time progression, and mock test scores.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowFormulaModal(true)}
        >
          <HelpCircle size={15} />
          <span>How Metrics Are Calculated</span>
        </button>
      </div>

      {/* Accuracy Trend Over Dates */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--cyan-primary)" />
            Daily Accuracy Progression
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            Calculated from raw scored question attempts per calendar date
          </span>
        </div>

        {accuracyTrend.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            No date-wise attempt data recorded yet. Complete practice questions or a mock test to render your accuracy curve.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200, padding: '20px 10px 0' }}>
            {accuracyTrend.map((d: any) => (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: d.accuracy >= 75 ? 'var(--emerald-success)' : 'var(--amber-warning)', marginBottom: 6 }}>
                  {d.accuracy}%
                </div>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 48,
                    height: `${Math.max(10, d.accuracy)}%`,
                    background: d.accuracy >= 75 ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' : 'linear-gradient(180deg, #00e5ff 0%, #0077b6 100%)',
                    borderRadius: '4px 4px 0 0',
                    boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)',
                  }}
                ></div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 8, whiteSpace: 'nowrap' }}>
                  {d.date.split('-').slice(1).join('/')}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  ({d.attempted} Qs)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mock Test Score Progression */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
          Mock Test Score Progression
        </h3>

        {mockScores.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            No mock test runs recorded yet.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mock Title</th>
                <th>Date</th>
                <th>Questions</th>
                <th>Score</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {mockScores.map((m: any) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{m.title}</td>
                  <td>{m.date}</td>
                  <td>{m.total_questions}</td>
                  <td style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>{m.score}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: m.accuracy >= 75 ? 'var(--emerald-success)' : m.accuracy >= 50 ? 'var(--amber-warning)' : 'var(--coral-error)' }}>
                      {m.accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Topic Strengths & Weaknesses Ranking */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
            Comprehensive Topic Mastery Matrix
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            Ranked by total practice volume and accuracy
          </span>
        </div>

        {topics.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            No topic attempts recorded yet.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Track</th>
                <th>Attempted</th>
                <th>Accuracy</th>
                <th>Avg Seconds</th>
                <th>Mastery Level</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t: any) => (
                <tr key={t.topic}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{t.topic}</td>
                  <td><span className="badge badge-cyan">{t.track}</span></td>
                  <td>{t.attempted}</td>
                  <td style={{ fontWeight: 700, color: t.accuracy >= 75 ? 'var(--emerald-success)' : t.accuracy >= 50 ? 'var(--amber-warning)' : 'var(--coral-error)' }}>
                    {t.accuracy}%
                  </td>
                  <td>{t.avgSeconds}s</td>
                  <td>
                    {t.isPreliminary ? (
                      <span className="badge badge-amber">Preliminary (&lt;3 Qs)</span>
                    ) : t.accuracy >= 75 ? (
                      <span className="badge badge-emerald">Mastered</span>
                    ) : (
                      <span className="badge badge-coral">Focus Area</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Metric Calculation Formulas Modal */}
      {showFormulaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={20} color="var(--cyan-primary)" />
                How Metrics Are Calculated
              </h3>
              <button onClick={() => setShowFormulaModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <div>
                <strong style={{ color: '#fff' }}>Accuracy: </strong>
                <code>correct / attempted</code>, where attempted strictly excludes unanswered or abandoned items.
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Plan Completion: </strong>
                <code>completed tasks / total applicable tasks</code>. Skipped tasks remain visible and are excluded from completion numerator.
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Topic Mastery: </strong>
                <code>correct answers for topic / attempted answers for topic</code>. Scores with fewer than 3 attempts are explicitly labeled preliminary.
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Average Time per Question: </strong>
                Sum of measured answer durations divided by questions attempted.
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Preparation Streak: </strong>
                Consecutive calendar days (Asia/Kolkata) with at least 15 focused study minutes OR 5 practice questions attempted.
              </div>
              <div>
                <strong style={{ color: '#fff' }}>No Invented Metrics: </strong>
                All percentages are derived from actual local database rows, never mocked demonstration averages.
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 22 }}
              onClick={() => setShowFormulaModal(false)}
            >
              Close Metric Definitions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
