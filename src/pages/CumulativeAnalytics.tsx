import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

export const CumulativeAnalytics: React.FC = () => {
  const { currentDate } = useApp();
  const [activeTab, setActiveTab] = useState<'cumulative' | 'daily'>('cumulative');
  const [analytics, setAnalytics] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  useEffect(() => {
    const loadAllReports = async () => {
      try {
        setLoading(true);
        const [cum, day] = await Promise.all([
          api.getAnalytics(),
          api.getDailyReport(currentDate).catch(() => null),
        ]);
        setAnalytics(cum);
        setDailyData(day);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAllReports();
  }, [currentDate]);

  const topics = analytics?.topics || [];
  const accuracyTrend = analytics?.accuracyTrend || [];
  const mockScores = analytics?.mockScores || [];

  const handleExportCSV = () => {
    if (!topics || topics.length === 0) return;
    const headers = ['Topic', 'Track', 'Attempted', 'Correct', 'Accuracy (%)'];
    const rows = topics.map((t: any) => [
      `"${t.topic}"`,
      t.track,
      t.attempted,
      t.correct,
      t.accuracy,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jobprep_analytics_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-wrapper">
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }} className="no-print">
        <div>
          <span className="section-label">06 — Performance & Mastery Metrics</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 4 }}>
            Performance Analytics & Reports
          </h1>
          <p className="section-desc">
            Mathematically rigorous performance tracking across daily activity and cumulative topic mastery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--bg-muted)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`btn btn-sm ${activeTab === 'cumulative' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', boxShadow: 'none' }}
              onClick={() => setActiveTab('cumulative')}
            >
              Cumulative Analytics
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'daily' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', boxShadow: 'none' }}
              onClick={() => setActiveTab('daily')}
            >
              Daily Report ({currentDate})
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {activeTab === 'cumulative' ? (
        /* Cumulative Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Accuracy Trend Chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Daily Accuracy Progression</div>
                <div className="card-subtitle">Calculated from raw scored question attempts per date</div>
              </div>
              <button className="btn btn-outline btn-sm no-print" onClick={() => setShowFormulaModal(true)}>
                <HelpCircle size={14} /> Formula
              </button>
            </div>

            {accuracyTrend.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                No attempt data recorded yet. Complete practice questions or a test to render your accuracy curve.
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 180, padding: '20px 10px 0' }}>
                {accuracyTrend.map((d: any) => (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: d.accuracy >= 75 ? 'var(--emerald-success)' : 'var(--amber-warning)', marginBottom: 6 }}>
                      {d.accuracy}%
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 42,
                        height: `${Math.max(10, d.accuracy)}%`,
                        background: d.accuracy >= 75 ? 'var(--emerald-success)' : 'var(--primary)',
                        borderRadius: '4px 4px 0 0',
                      }}
                    ></div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 8 }}>
                      {d.date.slice(5)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topic-Wise Breakdown Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Topic-Wise Performance Breakdown</div>
                <div className="card-subtitle">Granular accuracy across cognitive and engineering subjects</div>
              </div>
            </div>

            {topics.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.88rem' }}>
                No topic attempts recorded yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Topic Name</th>
                      <th>Subject Track</th>
                      <th>Attempted</th>
                      <th>Correct</th>
                      <th>Accuracy</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.map((t: any) => (
                      <tr key={t.topic}>
                        <td style={{ fontWeight: 600 }}>{t.topic}</td>
                        <td>
                          <span className="badge badge-neutral">
                            {t.track}
                          </span>
                        </td>
                        <td>{t.attempted}</td>
                        <td>{t.correct}</td>
                        <td>
                          <strong style={{ color: t.accuracy >= 75 ? 'var(--emerald-success)' : t.accuracy >= 55 ? 'var(--amber-warning)' : 'var(--coral-error)' }}>
                            {t.accuracy}%
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${t.accuracy >= 75 ? 'badge-success' : t.accuracy >= 55 ? 'badge-warning' : 'badge-danger'}`}>
                            {t.accuracy >= 75 ? 'Proficient' : t.accuracy >= 55 ? 'Review Needed' : 'Weak Area'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Daily Report Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {dailyData ? (
            <>
              {/* Daily Overview Card */}
              <div className="grid-4">
                <div className="metric-card">
                  <div className="metric-label">Tasks Completed</div>
                  <div className="metric-value">{dailyData.tasksCompleted}/{dailyData.tasksPlanned}</div>
                  <div className="metric-subtitle">{dailyData.planAdherencePct}% adherence today</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Questions Attempted</div>
                  <div className="metric-value">{dailyData.questionsAttempted}</div>
                  <div className="metric-subtitle">{dailyData.questionsCorrect} correct answers</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Today's Accuracy</div>
                  <div className="metric-value" style={{ color: dailyData.accuracy >= 75 ? 'var(--emerald-success)' : 'var(--primary)' }}>
                    {dailyData.accuracy}%
                  </div>
                  <div className="metric-subtitle">Avg {dailyData.avgTimePerQuestion}s per question</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">XP Earned Today</div>
                  <div className="metric-value" style={{ color: 'var(--amber-warning)' }}>
                    +{dailyData.dailyXP}
                  </div>
                  <div className="metric-subtitle">
                    {dailyData.qualifiedStreak ? 'Streak criteria satisfied' : 'Goal in progress'}
                  </div>
                </div>
              </div>

              {/* Tasks Completed Today */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Study Tasks Logged for {currentDate}</div>
                </div>
                {dailyData.tasksList?.length === 0 ? (
                  <div style={{ color: 'var(--text-subtle)', padding: '16px 0', fontSize: '0.88rem' }}>
                    No tasks scheduled for this date.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dailyData.tasksList?.map((t: any) => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{t.task_text}</span>
                        <span className={`badge ${t.status === 'completed' ? 'badge-success' : 'badge-neutral'}`}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              No recorded activity for {currentDate}. Select another date from the header.
            </div>
          )}
        </div>
      )}

      {/* Formula Modal */}
      {showFormulaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Calculation Rigor & Metrics
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowFormulaModal(false)}>✕</button>
            </div>

            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p>
                <strong>Cumulative Accuracy:</strong> Calculated as <code style={{ color: 'var(--primary)' }}>(Total Correct / Total Attempted) × 100</code> across all genuine attempts. We never take an "average of daily averages," ensuring mathematical accuracy.
              </p>
              <p>
                <strong>Daily Accuracy:</strong> Restriced strictly to scored attempts whose timestamp matches the calendar date in your local timezone.
              </p>
              <p>
                <strong>Streak Qualification:</strong> Awarded on dates with at least 1 completed study task or 1 completed mock test.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowFormulaModal(false)}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
