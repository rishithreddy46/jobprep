import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  Shield,
  KeyRound,
  FileCheck2,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Bot,
  Trash2,
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

export const SettingsSources: React.FC = () => {
  const { profile, updateProfile, addToast, refreshAll } = useApp();

  // Profile Form State
  const [name, setName] = useState<string>(profile?.name || 'Candidate');
  const [branch, setBranch] = useState<string>(profile?.branch || 'Electronics & Instrumentation Engineering');
  const [targetDate, setTargetDate] = useState<string>(profile?.target_date || '2026-10-26T00:00:00');
  const [dailyGoalMins, setDailyGoalMins] = useState<number>(profile?.daily_goal_mins || 60);
  const [passcode, setPasscode] = useState<string>('');

  // Source Register State
  const [sourcesData, setSourcesData] = useState<any[]>([]);
  const [linkStatuses, setLinkStatuses] = useState<Record<string, any>>({});
  const [checkingLinks, setCheckingLinks] = useState<boolean>(false);

  // QA Validator State
  const [qaReport, setQaReport] = useState<any>(null);

  // AI Question Lab State
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [genTopic, setGenTopic] = useState<string>('Flow Measurement');
  const [genTrack, setGenTrack] = useState<string>('instrumentation');
  const [genDifficulty, setGenDifficulty] = useState<string>('medium');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);

  // Modals
  const [showResetProgressModal, setShowResetProgressModal] = useState<boolean>(false);
  const [showResetBankModal, setShowResetBankModal] = useState<boolean>(false);

  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        const [sources, qa, ai] = await Promise.all([
          api.getSources(),
          api.validateBank(),
          api.getAiStatus(),
        ]);
        setSourcesData(sources.sources || []);
        setQaReport(qa);
        setAiStatus(ai);
      } catch (err) {
        console.error('Error loading settings data:', err);
      }
    };
    loadSettingsData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name,
      branch,
      target_date: targetDate,
      daily_goal_mins: dailyGoalMins,
      passcode_hash: passcode ? passcode : (profile?.passcode_hash || null),
    });
  };

  const handleClearPasscode = async () => {
    await updateProfile({ passcode_hash: null });
    setPasscode('');
    addToast('Passcode Lock Removed', '', 'info');
  };

  const handleCheckLinks = async () => {
    try {
      setCheckingLinks(true);
      const urls = sourcesData.map((s) => s.url).filter(Boolean);
      const statuses = await api.checkLinks(urls);
      setLinkStatuses(statuses);
      addToast('Link Status Check Finished', `Tested ${urls.length} source URLs`, 'info');
    } catch (err: any) {
      addToast('Link check failed', err.message, 'warning');
    } finally {
      setCheckingLinks(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const res = await api.importData(json);
        addToast('Import Successful', res.message, 'success');
        await refreshAll();
      } catch (err: any) {
        addToast('Import Failed', err.message || 'Invalid JSON format', 'warning');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetProgressConfirm = async () => {
    try {
      await api.resetProgress();
      setShowResetProgressModal(false);
      addToast('User Progress Reset', 'Attempts, streaks, and XP cleared. Question bank preserved.', 'info');
      await refreshAll();
    } catch (err: any) {
      addToast('Reset failed', err.message, 'warning');
    }
  };

  const handleResetBankConfirm = async () => {
    try {
      const res = await api.resetBank();
      setShowResetBankModal(false);
      addToast('Question Bank Reset', `Re-seeded ${res.count} canonical practice questions.`, 'success');
      await refreshAll();
    } catch (err: any) {
      addToast('Bank reset failed', err.message, 'warning');
    }
  };

  const handleGenerateQuestions = async () => {
    try {
      setIsGenerating(true);
      const res = await api.generateAiQuestions({
        track: genTrack,
        topic: genTopic,
        difficulty: genDifficulty,
        count: 1,
      });
      setGeneratedItems(res.questions);
      addToast('Question Generated for Review', 'Item placed in review queue.', 'success');
      const ai = await api.getAiStatus();
      setAiStatus(ai);
    } catch (err: any) {
      addToast('Generation Notice', err.message, 'warning');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAi = async (id: string) => {
    try {
      await api.approveAiQuestion(id);
      addToast('Question Approved', 'Item added to active question bank.', 'success');
      setGeneratedItems((prev) => prev.filter((q) => q.id !== id));
      const ai = await api.getAiStatus();
      setAiStatus(ai);
    } catch (err: any) {
      addToast('Approval failed', err.message, 'warning');
    }
  };

  const handleRejectAi = async (id: string) => {
    try {
      await api.rejectAiQuestion(id);
      addToast('Question Rejected', 'Item discarded.', 'info');
      setGeneratedItems((prev) => prev.filter((q) => q.id !== id));
      const ai = await api.getAiStatus();
      setAiStatus(ai);
    } catch (err: any) {
      addToast('Rejection failed', err.message, 'warning');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card card-cyan-accent" style={{ marginBottom: 24, padding: '26px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="badge badge-cyan">System Configuration</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Local Persistence & Source Integrity</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Settings, Data Management & Sources
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 800, lineHeight: 1.6 }}>
          Configure your candidate profile, manage local backups, inspect question bank QA metrics, review source citations, and explore practice question generation.
        </p>
      </div>

      {/* Grid: Profile & Passcode */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Profile Settings */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 16 }}>
            Candidate Profile & Goals
          </h2>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Candidate Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '9px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Engineering Discipline
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '9px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Target Assessment Window (Countdown Target)
              </label>
              <input
                type="text"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                placeholder="2026-10-26T00:00:00"
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '9px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Daily Focus Study Goal (Minutes)
              </label>
              <input
                type="number"
                value={dailyGoalMins}
                onChange={(e) => setDailyGoalMins(Number(e.target.value))}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '9px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Local Passcode Lock */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="var(--primary)" />
              Local Access Passcode Lock
            </h2>
            {profile?.passcode_hash && <span className="badge badge-emerald">Lock Enabled</span>}
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            Set an optional local PIN to guard your test scores and preparation data on shared computers.
            <br />
            <em style={{ color: 'var(--text-subtle)' }}>Note: This is a local single-user convenience lock and does not claim to provide cloud multi-tenant authentication.</em>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                {profile?.passcode_hash ? 'Update Passcode PIN' : 'Set New Passcode PIN'}
              </label>
              <input
                type="password"
                placeholder="e.g. 1234"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '9px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (passcode.trim()) {
                    updateProfile({ passcode_hash: passcode });
                    setPasscode('');
                    addToast('Passcode Set', 'Your session is now protected by PIN.', 'success');
                  }
                }}
                disabled={!passcode.trim()}
              >
                Save Passcode
              </button>

              {profile?.passcode_hash && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleClearPasscode}
                >
                  Remove Passcode
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Management & Backups */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={18} color="var(--purple)" />
          Data Management & Local Backups
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          All your question attempts, streaks, XP transactions, and study plans are stored in the database.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={api.exportData}>
            <Download size={16} />
            <span>Export All Progress (JSON Backup)</span>
          </button>

          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            <span>Import Progress Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </label>

          <button
            className="btn btn-danger"
            onClick={() => setShowResetProgressModal(true)}
          >
            <RotateCcw size={16} />
            <span>Reset User Progress</span>
          </button>

          <button
            className="btn btn-danger"
            onClick={() => setShowResetBankModal(true)}
            style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}
          >
            <RotateCcw size={16} />
            <span>Reset Question Bank to Seed</span>
          </button>
        </div>
      </div>

      {/* Question Bank QA Inspector */}
      {qaReport && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck2 size={18} color="var(--emerald-success)" />
              Question Bank QA Validator
            </h2>
            <span className={`badge ${qaReport.valid ? 'badge-emerald' : 'badge-coral'}`}>
              {qaReport.valid ? 'All 105 Questions Validated' : `${qaReport.errorsCount} Errors Found`}
            </span>
          </div>

          <div className="grid-4" style={{ marginBottom: 14 }}>
            <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Total Verified Bank</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-m)' }}>{qaReport.totalQuestions}</div>
            </div>
            <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Cognitive Items</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--blue)', fontFamily: 'var(--font-m)' }}>{qaReport.cognitiveCount}</div>
            </div>
            <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Instrumentation Items</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--emerald-success)', fontFamily: 'var(--font-m)' }}>{qaReport.instrumentationCount}</div>
            </div>
            <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Difficulties (E/M/H)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--amber-warning)', fontFamily: 'var(--font-m)' }}>
                {qaReport.difficulties?.easy} / {qaReport.difficulties?.medium} / {qaReport.difficulties?.hard}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ✓ Checked for: Unique IDs, exactly 4 distinct options, valid answer keys, non-empty explanations, and topic taxonomy pointers.
          </div>
        </div>
      )}

      {/* Optional AI Question Lab (Phase 11) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={18} color="var(--violet-quest)" />
            Optional AI Practice Question Lab
          </h2>
          <span className={`badge ${aiStatus?.enabled ? 'badge-emerald' : 'badge-cyan'}`}>
            {aiStatus?.enabled ? `Enabled (${aiStatus.provider})` : 'Offline Mode (No API Key Required)'}
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
          {aiStatus?.notice || 'AI-generated questions are original synthetic practice items and must be reviewed before admission into active mocks. Never label them as real previous-year RIL questions.'}
          <br />
          To enable on-demand question generation, set <code>AI_API_KEY</code> and <code>AI_PROVIDER</code> in your local <code>.env</code> file.
        </p>

        {aiStatus?.enabled ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Track</label>
                <select
                  value={genTrack}
                  onChange={(e) => setGenTrack(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '8px', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="instrumentation">Instrumentation</option>
                  <option value="cognitive">Cognitive</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Topic</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '8px', borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Difficulty</label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '8px', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleGenerateQuestions}
              disabled={isGenerating}
            >
              <Sparkles size={14} />
              <span>{isGenerating ? 'Generating Question...' : 'Generate Original Practice Question'}</span>
            </button>

            {/* Generated Items Review Queue */}
            {generatedItems.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>
                  Pending Review Queue
                </h4>
                {generatedItems.map((q) => (
                  <div key={q.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>{q.question}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {q.options?.map((o: any) => (
                        <div key={o.id}>{o.id}: {o.text} {o.id === q.correct_option_id && '✓'}</div>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: 12 }}>{q.explanation}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleApproveAi(q.id)}>Approve & Add to Bank</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRejectAi(q.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
            The app operates 100% offline with the canonical 105 verified questions. To enable AI generation, add <code>AI_API_KEY=your_key</code> in <code>server/.env</code>.
          </div>
        )}
      </div>

      {/* Source Register & Attribution Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Source Registry & Evidence Audit
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              From sources.json • Provenance and reliability labels
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCheckLinks}
            disabled={checkingLinks}
          >
            <Activity size={14} />
            <span>{checkingLinks ? 'Checking URLs...' : 'Check Link Status'}</span>
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Source Title</th>
              <th>Type</th>
              <th>Reliability</th>
              <th>Observed Evidence</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {sourcesData.map((s) => {
              const linkCheck = linkStatuses[s.url];
              return (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.78rem' }}>{s.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.title}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.source_type}</td>
                  <td>
                    <span className={`badge ${s.reliability?.includes('High') ? 'badge-emerald' : 'badge-amber'}`}>
                      {s.reliability?.includes('High') ? 'High' : 'Candidate Report'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', maxWidth: 300 }}>
                    {s.observed_facts?.[0] || s.recency}
                  </td>
                  <td>
                    {s.url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
                          <span>Open</span>
                          <ExternalLink size={12} />
                        </a>
                        {linkCheck && (
                          <span style={{ fontSize: '0.7rem', color: linkCheck.ok ? 'var(--emerald-success)' : 'var(--coral-error)' }}>
                            ({linkCheck.ok ? '200 OK' : 'Failed'})
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal: Reset Progress */}
      {showResetProgressModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440, textAlign: 'center' }}>
            <AlertTriangle size={36} color="var(--coral-error)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
              Reset User Progress Data?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              This will permanently delete your test attempts, active streaks, earned XP, timer logs, and mistake notebook entries. Your 105-item question bank will remain intact.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowResetProgressModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleResetProgressConfirm}>
                Confirm Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Bank */}
      {showResetBankModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440, textAlign: 'center' }}>
            <AlertTriangle size={36} color="var(--coral-error)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
              Reset Question Bank to Seed?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              This will reload the original 105 questions from <code>question_bank.json</code>, removing any custom or AI-generated items.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowResetBankModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleResetBankConfirm}>
                Confirm Reset Bank
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
