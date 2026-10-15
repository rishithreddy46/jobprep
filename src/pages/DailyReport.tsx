import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Printer,
  Download,
  Clock,
  Target,
  Brain,
  Sliders,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { DailyReportData, CumulativeReportData } from '../types';

export const DailyReport: React.FC = () => {
  const { currentDate, setCurrentDate, addToast } = useApp();
  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'cumulative'>('daily');
  const [dailyData, setDailyData] = useState<DailyReportData | null>(null);
  const [cumulativeData, setCumulativeData] = useState<CumulativeReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [daily, cum] = await Promise.all([
          api.getDailyReport(currentDate),
          api.getCumulativeReport(currentDate),
        ]);
        setDailyData(daily);
        setCumulativeData(cum);
      } catch (err: any) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const payload = activeReportTab === 'daily' ? dailyData : cumulativeData;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `get_quest_${activeReportTab}_report_${currentDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Report Exported as JSON', '', 'success');
  };

  const handleExportCSV = () => {
    const rows: string[] = [];
    if (activeReportTab === 'daily' && dailyData) {
      rows.push('Metric,Value');
      rows.push(`Date,${dailyData.date}`);
      rows.push(`Tasks Planned,${dailyData.tasksPlanned}`);
      rows.push(`Tasks Completed,${dailyData.tasksCompleted}`);
      rows.push(`Plan Adherence,${dailyData.planAdherencePct}%`);
      rows.push(`Measured Study Mins,${dailyData.measuredStudyMins}`);
      rows.push(`Questions Attempted,${dailyData.questionsAttempted}`);
      rows.push(`Questions Correct,${dailyData.questionsCorrect}`);
      rows.push(`Accuracy,${dailyData.accuracy}%`);
      rows.push(`Cognitive Accuracy,${dailyData.cognitive.accuracy}%`);
      rows.push(`Instrumentation Accuracy,${dailyData.instrumentation.accuracy}%`);
      rows.push(`Daily XP Earned,${dailyData.dailyXP}`);
      rows.push(`Streak Qualified,${dailyData.qualifiedStreak ? 'Yes' : 'No'}`);
      rows.push('');
      rows.push('Topic,Track,Attempted,Correct,Accuracy%');
      dailyData.topicBreakdown.forEach((t) => {
        rows.push(`"${t.topic}",${t.track},${t.attempted},${t.correct},${t.accuracy}%`);
      });
    } else if (cumulativeData) {
      rows.push('Metric,Value');
      rows.push(`Cumulative Up To Date,${cumulativeData.upToDate}`);
      rows.push(`Total Planned Tasks,${cumulativeData.totalPlannedTasks}`);
      rows.push(`Total Completed Tasks,${cumulativeData.totalCompletedTasks}`);
      rows.push(`Plan Adherence,${cumulativeData.planAdherencePct}%`);
      rows.push(`Total Study Mins,${cumulativeData.totalStudyMins}`);
      rows.push(`Total Questions Attempted,${cumulativeData.totalQuestionsAttempted}`);
      rows.push(`Total Questions Correct,${cumulativeData.totalQuestionsCorrect}`);
      rows.push(`Cumulative Accuracy,${cumulativeData.cumulativeAccuracy}%`);
      rows.push(`Cognitive Accuracy,${cumulativeData.cognitive.accuracy}%`);
      rows.push(`Instrumentation Accuracy,${cumulativeData.instrumentation.accuracy}%`);
      rows.push(`Cumulative XP,${cumulativeData.cumulativeXP}`);
      rows.push('');
      rows.push('Topic,Track,Attempted,Correct,Accuracy%');
      cumulativeData.topicBreakdown.forEach((t) => {
        rows.push(`"${t.topic}",${t.track},${t.attempted},${t.correct},${t.accuracy}%`);
      });
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `get_quest_${activeReportTab}_report_${currentDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Report Exported as CSV', '', 'success');
  };

  return (
    <div className="page-wrapper">
      {/* Top Controls & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="badge badge-cyan">Auditable Analytics</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily & Cumulative Preparation Records</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Daily & Cumulative Performance Report
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 750, marginTop: 4 }}>
            Empirical calculation engine: Day 1 report contains only Day 1; Day 2 cumulative integrates Day 1 + Day 2. All averages are calculated from raw scored attempts.
          </p>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportJSON}>
            <Download size={15} />
            <span>JSON</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={15} />
            <span>CSV</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print to PDF</span>
          </button>
        </div>
      </div>

      {/* Date & Mode Toggle Bar */}
      <div className="card no-print" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Inspect Report Date:</span>
          <select
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-dim)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            <option value="2026-10-15" style={{ background: '#0b1322' }}>15 Oct (Pre-Sprint Diagnostic)</option>
            <option value="2026-10-16" style={{ background: '#0b1322' }}>16 Oct (Day 0 — Setup Sprint)</option>
            <option value="2026-10-17" style={{ background: '#0b1322' }}>17 Oct (Day 1 — Aptitude & Measurement)</option>
            <option value="2026-10-18" style={{ background: '#0b1322' }}>18 Oct (Day 2 — Temperature & Logic)</option>
            <option value="2026-10-19" style={{ background: '#0b1322' }}>19 Oct (Day 3 — Pressure & Arithmetic)</option>
            <option value="2026-10-20" style={{ background: '#0b1322' }}>20 Oct (Day 4 — Flow & Data)</option>
            <option value="2026-10-21" style={{ background: '#0b1322' }}>21 Oct (Day 5 — Level & Loops)</option>
            <option value="2026-10-22" style={{ background: '#0b1322' }}>22 Oct (Day 6 — Control & PID)</option>
            <option value="2026-10-23" style={{ background: '#0b1322' }}>23 Oct (Day 7 — Plant Automation)</option>
            <option value="2026-10-24" style={{ background: '#0b1322' }}>24 Oct (Day 8 — Electronics & Mocks)</option>
            <option value="2026-10-25" style={{ background: '#0b1322' }}>25 Oct (Day 9 — Mixed Simulation)</option>
            <option value="2026-10-26" style={{ background: '#0b1322' }}>26 Oct (Day 10 — Readiness)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'rgba(0, 0, 0, 0.3)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn btn-sm ${activeReportTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', background: activeReportTab === 'daily' ? 'var(--cyan-primary)' : 'transparent', color: activeReportTab === 'daily' ? '#060a12' : 'var(--text-muted)' }}
            onClick={() => setActiveReportTab('daily')}
          >
            Daily Report ({currentDate})
          </button>
          <button
            className={`btn btn-sm ${activeReportTab === 'cumulative' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', background: activeReportTab === 'cumulative' ? 'var(--cyan-primary)' : 'transparent', color: activeReportTab === 'cumulative' ? '#060a12' : 'var(--text-muted)' }}
            onClick={() => setActiveReportTab('cumulative')}
          >
            Cumulative Report (Up to {currentDate})
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW A: DAILY REPORT
          ========================================================================= */}
      {activeReportTab === 'daily' && dailyData && (
        <div>
          {/* Header Card */}
          <div className="card card-cyan-accent" style={{ marginBottom: 20, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <span className="badge badge-cyan">Single Date Snapshot</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  Activity Report for {dailyData.date}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Reflects strictly actions and scored attempts completed on {dailyData.date}.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Daily Streak</div>
                  <div style={{ fontWeight: 800, color: dailyData.qualifiedStreak ? 'var(--emerald-success)' : 'var(--amber-warning)', fontSize: '1.1rem' }}>
                    {dailyData.qualifiedStreak ? 'Qualified' : 'Pending Goal'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Daily XP Earned</div>
                  <div style={{ fontWeight: 800, color: 'var(--amber-warning)', fontSize: '1.1rem' }}>
                    +{dailyData.dailyXP} XP
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Numbers */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <div className="metric-card">
              <div className="metric-label">Plan Adherence</div>
              <div className="metric-value" style={{ color: 'var(--cyan-primary)' }}>
                {dailyData.planAdherencePct}%
              </div>
              <div className="metric-subtitle">{dailyData.tasksCompleted} of {dailyData.tasksPlanned} tasks finished</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Measured Study Time</div>
              <div className="metric-value" style={{ color: 'var(--text-main)' }}>
                {dailyData.measuredStudyMins}m
              </div>
              <div className="metric-subtitle">Focused stopwatch timer sessions</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Daily Scored Accuracy</div>
              <div className="metric-value" style={{ color: dailyData.accuracy >= 75 ? 'var(--emerald-success)' : dailyData.accuracy >= 50 ? 'var(--amber-warning)' : 'var(--coral-error)' }}>
                {dailyData.questionsAttempted > 0 ? `${dailyData.accuracy}%` : 'N/A'}
              </div>
              <div className="metric-subtitle">{dailyData.questionsCorrect} of {dailyData.questionsAttempted} correct</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Avg Pace per Question</div>
              <div className="metric-value" style={{ color: 'var(--text-main)' }}>
                {dailyData.avgTimePerQuestion}s
              </div>
              <div className="metric-subtitle">Measured solve time</div>
            </div>
          </div>

          {/* Cognitive vs Instrumentation Split */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>Cognitive Performance (Day Only)</span>
                <span className="badge badge-cyan">{dailyData.cognitive.attempted} attempted</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {dailyData.cognitive.attempted > 0 ? `${dailyData.cognitive.accuracy}%` : 'No attempts today'}
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${dailyData.cognitive.accuracy}%` }}></div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>Instrumentation Performance (Day Only)</span>
                <span className="badge badge-emerald">{dailyData.instrumentation.attempted} attempted</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {dailyData.instrumentation.attempted > 0 ? `${dailyData.instrumentation.accuracy}%` : 'No attempts today'}
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${dailyData.instrumentation.accuracy}%`, background: 'linear-gradient(90deg, #10b981, #00e5ff)' }}></div>
              </div>
            </div>
          </div>

          {/* Day Topic Breakdown Table */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
              Topic Breakdown on {dailyData.date}
            </h3>

            {dailyData.topicBreakdown.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                No questions attempted on this date.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Track</th>
                    <th>Attempted</th>
                    <th>Correct</th>
                    <th>Accuracy</th>
                    <th>Reliability / Sample Note</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.topicBreakdown.map((t) => (
                    <tr key={t.topic}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{t.topic}</td>
                      <td><span className="badge badge-cyan">{t.track}</span></td>
                      <td>{t.attempted}</td>
                      <td>{t.correct}</td>
                      <td style={{ fontWeight: 700, color: t.accuracy >= 75 ? 'var(--emerald-success)' : 'var(--amber-warning)' }}>
                        {t.accuracy}%
                      </td>
                      <td>
                        {t.isPreliminary ? (
                          <span style={{ color: 'var(--amber-warning)', fontSize: '0.78rem' }}>
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                            Small sample (&lt;3 Qs) — treat as preliminary
                          </span>
                        ) : (
                          <span style={{ color: 'var(--emerald-success)', fontSize: '0.78rem' }}>
                            Statistically meaningful sample
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recommendations for Next Session */}
          <div className="card" style={{ background: 'rgba(0, 229, 255, 0.04)', borderColor: 'rgba(0, 229, 255, 0.2)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--cyan-primary)" />
              Next Session Strategic Recommendations
            </h3>
            <ul style={{ paddingLeft: 20, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {dailyData.recommendations.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: CUMULATIVE REPORT
          ========================================================================= */}
      {activeReportTab === 'cumulative' && cumulativeData && (
        <div>
          {/* Header Card */}
          <div className="card card-violet-accent" style={{ marginBottom: 20, padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <span className="badge badge-violet">Cumulative Record</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  Cumulative Preparation Audit (Day 1 to {cumulativeData.upToDate})
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Comprehensive performance audit across all active days leading up to {cumulativeData.upToDate}.
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Total Active Days</div>
                <div style={{ fontWeight: 800, color: 'var(--violet-quest)', fontSize: '1.4rem' }}>
                  {cumulativeData.totalDaysRecorded} Days
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <div className="metric-card">
              <div className="metric-label">Cumulative Adherence</div>
              <div className="metric-value" style={{ color: 'var(--violet-quest)' }}>
                {cumulativeData.planAdherencePct}%
              </div>
              <div className="metric-subtitle">{cumulativeData.totalCompletedTasks} of {cumulativeData.totalPlannedTasks} tasks</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Total Focused Study</div>
              <div className="metric-value" style={{ color: 'var(--text-main)' }}>
                {cumulativeData.totalStudyMins}m
              </div>
              <div className="metric-subtitle">Across all recorded sessions</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Weighted Accuracy</div>
              <div className="metric-value" style={{ color: cumulativeData.cumulativeAccuracy >= 75 ? 'var(--emerald-success)' : 'var(--amber-warning)' }}>
                {cumulativeData.cumulativeAccuracy}%
              </div>
              <div className="metric-subtitle">{cumulativeData.totalQuestionsCorrect} / {cumulativeData.totalQuestionsAttempted} correct</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Cumulative XP</div>
              <div className="metric-value" style={{ color: 'var(--amber-warning)' }}>
                {cumulativeData.cumulativeXP}
              </div>
              <div className="metric-subtitle">Total experience earned</div>
            </div>
          </div>

          {/* Track Splits */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>Cumulative Cognitive Aptitude</span>
                <span className="badge badge-cyan">{cumulativeData.cognitive.attempted} attempts</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {cumulativeData.cognitive.attempted > 0 ? `${cumulativeData.cognitive.accuracy}%` : 'N/A'}
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${cumulativeData.cognitive.accuracy}%` }}></div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>Cumulative Instrumentation Core</span>
                <span className="badge badge-emerald">{cumulativeData.instrumentation.attempted} attempts</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {cumulativeData.instrumentation.attempted > 0 ? `${cumulativeData.instrumentation.accuracy}%` : 'N/A'}
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${cumulativeData.instrumentation.accuracy}%`, background: 'linear-gradient(90deg, #10b981, #00e5ff)' }}></div>
              </div>
            </div>
          </div>

          {/* Cumulative Topic Table */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
              Cumulative Topic Performance Matrix
            </h3>

            {cumulativeData.topicBreakdown.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                No question attempts recorded in this date range.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Track</th>
                    <th>Attempts</th>
                    <th>Correct</th>
                    <th>Accuracy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cumulativeData.topicBreakdown.map((t) => (
                    <tr key={t.topic}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{t.topic}</td>
                      <td><span className="badge badge-cyan">{t.track}</span></td>
                      <td>{t.attempted}</td>
                      <td>{t.correct}</td>
                      <td style={{ fontWeight: 700, color: t.accuracy >= 75 ? 'var(--emerald-success)' : t.accuracy >= 50 ? 'var(--amber-warning)' : 'var(--coral-error)' }}>
                        {t.accuracy}%
                      </td>
                      <td>
                        {t.accuracy >= 75 && t.attempted >= 3 ? (
                          <span className="badge badge-emerald">Mastered</span>
                        ) : t.accuracy < 70 && t.attempted >= 3 ? (
                          <span className="badge badge-coral">Needs Revision</span>
                        ) : (
                          <span className="badge badge-amber">In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
