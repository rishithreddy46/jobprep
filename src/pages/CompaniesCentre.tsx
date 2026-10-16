import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Download,
  Upload,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  History,
  FileCheck2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { Company, CompanyStage } from '../types';

interface CompaniesCentreProps {
  onNavigate: (tab: string, extra?: any) => void;
  selectedCompanyId?: string;
}

const STAGES: { id: CompanyStage; label: string; color: string } = {
  interested: { id: 'interested', label: 'Interested', color: 'badge-neutral' },
  checking_eligibility: { id: 'checking_eligibility', label: 'Checking Eligibility', color: 'badge-warning' },
  eligible: { id: 'eligible', label: 'Eligible', color: 'badge-success' },
  registered: { id: 'registered', label: 'Registered', color: 'badge-primary' },
  assessment_upcoming: { id: 'assessment_upcoming', label: 'Assessment Upcoming', color: 'badge-warning' },
  assessment_completed: { id: 'assessment_completed', label: 'Assessment Completed', color: 'badge-neutral' },
  shortlisted: { id: 'shortlisted', label: 'Shortlisted', color: 'badge-success' },
  interview_scheduled: { id: 'interview_scheduled', label: 'Interview Scheduled', color: 'badge-primary' },
  interview_completed: { id: 'interview_completed', label: 'Interview Completed', color: 'badge-neutral' },
  offered: { id: 'offered', label: 'Offer Received', color: 'badge-success' },
  rejected: { id: 'rejected', label: 'Rejected', color: 'badge-danger' },
  withdrawn: { id: 'withdrawn', label: 'Withdrawn', color: 'badge-neutral' },
};

export const CompaniesCentre: React.FC<CompaniesCentreProps> = ({ onNavigate, selectedCompanyId }) => {
  const { companies, activeCompanyId, setActiveCompanyId, refreshCompanies, addToast } = useApp();
  const [selectedId, setSelectedId] = useState<string>(selectedCompanyId || activeCompanyId || companies[0]?.id || 'ril_get_2027');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string>('');
  const [selectedNewStage, setSelectedNewStage] = useState<CompanyStage>('interested');

  // New Company Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formRoles, setFormRoles] = useState('');
  const [formMinCgpa, setFormMinCgpa] = useState('6.0 / 60%');
  const [formBranches, setFormBranches] = useState('All Engineering Disciplines');
  const [formBacklogs, setFormBacklogs] = useState('0');
  const [formDeadline, setFormDeadline] = useState('');
  const [formAssessmentDate, setFormAssessmentDate] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const currentCompany = companies.find((c) => c.id === selectedId) || companies[0];

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCategory.trim()) {
      addToast('Validation Error', 'Company name and category are required.', 'warning');
      return;
    }

    try {
      const rolesArray = formRoles.split(',').map((r) => r.trim()).filter(Boolean);
      const branchesArray = formBranches.split(',').map((b) => b.trim()).filter(Boolean);

      await api.createCompany({
        name: formName.trim(),
        category: formCategory.trim(),
        roles: rolesArray.length > 0 ? rolesArray : ['Graduate Engineer Trainee'],
        eligibility: {
          min_cgpa: formMinCgpa,
          branches: branchesArray,
          backlogs_allowed: parseInt(formBacklogs, 10) || 0,
        },
        registration_deadline: formDeadline || null,
        assessment_date: formAssessmentDate || null,
        opportunity_url: formUrl.trim(),
        notes: formNotes.trim(),
        stage_status: 'interested',
      });

      addToast('Company Created', `${formName} added to tracking workspace.`, 'success');
      setIsAddModalOpen(false);
      await refreshCompanies();
    } catch (err: any) {
      addToast('Error adding company', err.message, 'warning');
    }
  };

  const handleUpdateStage = async () => {
    if (!currentCompany) return;
    try {
      await api.updateCompanyStage(currentCompany.id, selectedNewStage, statusNote);
      addToast('Stage Updated', `Updated ${currentCompany.name} to ${selectedNewStage.replace(/_/g, ' ')}.`, 'success');
      setIsStatusModalOpen(false);
      setStatusNote('');
      await refreshCompanies();
    } catch (err: any) {
      addToast('Error updating stage', err.message, 'warning');
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from tracking?`)) return;
    try {
      await api.deleteCompany(id);
      addToast('Company Removed', `${name} removed from tracking.`, 'info');
      await refreshCompanies();
      setSelectedId('ril_get_2027');
    } catch (err: any) {
      addToast('Cannot delete', err.message, 'warning');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const content = JSON.parse(evt.target?.result as string);
          const companiesArray = Array.isArray(content) ? content : content.companies;
          if (!Array.isArray(companiesArray)) {
            throw new Error('Invalid JSON format: expected an array of companies');
          }
          const res = await api.importCompanies(companiesArray);
          addToast('Import Successful', res.message, 'success');
          await refreshCompanies();
        } catch (err: any) {
          addToast('Import Failed', err.message, 'warning');
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      addToast('Error reading file', err.message, 'warning');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <span className="section-label">02 — Target Companies & Hiring Tracks</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 4 }}>
            Companies & Recruitment Drives
          </h1>
          <p className="section-desc">
            Monitor target organizations, application stages, eligibility criteria, and company-specific preparation tracks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add Company
          </button>
          <button className="btn btn-secondary" onClick={() => api.exportCompanies()}>
            <Download size={15} /> Export JSON
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
            <Upload size={15} /> Import JSON
            <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Main Layout: Left Directory List, Right Company Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* Left Column: Companies Directory */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12, paddingLeft: 4 }}>
            Tracked Companies ({companies.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {companies.map((comp) => {
              const isSelected = comp.id === selectedId;
              const isActiveTrack = comp.id === activeCompanyId;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedId(comp.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-subtle)',
                    background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--primary)' : 'var(--bg-elevated)',
                        color: isSelected ? '#fff' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        flexShrink: 0,
                      }}
                    >
                      {comp.logo_initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {comp.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: 2 }}>
                        {comp.category}
                      </div>
                    </div>
                  </div>

                  {isActiveTrack && (
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '1px 5px', flexShrink: 0 }}>
                      Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Company Detail Workspace */}
        {currentCompany ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Main Company Header Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                    }}
                  >
                    {currentCompany.logo_initials}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {currentCompany.name}
                      </h2>
                      {currentCompany.is_verified ? (
                        <span className="badge badge-success" title="Verified against official circular">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span className="badge badge-neutral">User Entry</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {currentCompany.category} • Source: {currentCompany.source || 'Campus Drive Record'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {currentCompany.id !== activeCompanyId && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setActiveCompanyId(currentCompany.id);
                        addToast('Active Track Changed', `${currentCompany.name} is now your primary target.`, 'info');
                      }}
                    >
                      Set as Primary Target
                    </button>
                  )}

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSelectedNewStage(currentCompany.stage_status);
                      setIsStatusModalOpen(true);
                    }}
                  >
                    Update Stage
                  </button>

                  {currentCompany.id !== 'ril_get_2027' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteCompany(currentCompany.id, currentCompany.name)}
                      title="Remove from tracking"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Status and Recruitment Stage Bar */}
              <div
                style={{
                  marginTop: 20,
                  padding: '14px 18px',
                  background: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Recruitment Stage:
                  </span>
                  <span className={`badge ${STAGES[currentCompany.stage_status]?.color || 'badge-neutral'}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                    {STAGES[currentCompany.stage_status]?.label || currentCompany.stage_status}
                  </span>
                </div>

                {currentCompany.opportunity_url && (
                  <a
                    href={currentCompany.opportunity_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Official Portal <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>

            {/* Two Column Section: Eligibility & Dates */}
            <div className="grid-2">
              {/* Eligibility & Roles */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Eligible Roles & Academic Criteria</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Recruiting Roles
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {currentCompany.roles?.map((role, idx) => (
                      <span key={idx} className="badge badge-neutral" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                        <Briefcase size={12} /> {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Minimum CGPA / %</span>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{currentCompany.eligibility?.min_cgpa || 'Not specified'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Eligible Branches</span>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)', textAlign: 'right', maxWidth: '60%' }}>
                      {currentCompany.eligibility?.branches?.join(', ') || 'All Disciplines'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Active Backlogs Allowed</span>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{currentCompany.eligibility?.backlogs_allowed ?? '0'}</strong>
                  </div>
                  {currentCompany.restrictions && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--amber-warning)', background: 'var(--amber-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--amber-border)' }}>
                      <strong>Restriction:</strong> {currentCompany.restrictions}
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Timeline & Dates */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Assessment Timeline</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
                    <Calendar size={18} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Registration Deadline</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {currentCompany.registration_deadline
                          ? new Date(currentCompany.registration_deadline).toLocaleString()
                          : 'Check campus notice board'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius-md)' }}>
                    <Calendar size={18} color="var(--amber-warning)" />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Online Assessment Date</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--amber-warning)' }}>
                        {currentCompany.assessment_date
                          ? new Date(currentCompany.assessment_date).toLocaleString()
                          : 'Tentative / To be scheduled'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
                    <Calendar size={18} color="var(--teal-accent)" />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Interview Window</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {currentCompany.interview_dates || 'Following shortlisting'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preparation Track & Actions */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Company Preparation Track</div>
                  <div className="card-subtitle">Recommended assessment syllabus & mock tests</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => onNavigate('mocks')}>
                  <FileCheck2 size={15} /> Launch Mock Test
                </button>
              </div>

              {currentCompany.syllabus && currentCompany.syllabus.length > 0 ? (
                <div className="grid-2">
                  {currentCompany.syllabus.map((s, idx) => (
                    <div key={idx} style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                        {s.subject}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {s.topics?.map((topic, tIdx) => (
                          <span key={tIdx} className="badge badge-neutral" style={{ fontSize: '0.76rem', background: '#fff' }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-subtle)', fontSize: '0.88rem', padding: '12px 0' }}>
                  Shared cognitive and technical syllabus applies for this recruitment drive.
                </div>
              )}
            </div>

            {/* Activity History Timeline */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Application Activity & Stage History</div>
              </div>

              {currentCompany.activity_history && currentCompany.activity_history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {currentCompany.activity_history.map((act, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: idx < currentCompany.activity_history.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          Stage: {act.stage?.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {act.note}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                        {new Date(act.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No activity logged yet.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Building2 size={36} color="var(--text-subtle)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>No Company Selected</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
              Select a company from the left panel or click "Add Company" to track a new recruitment drive.
            </p>
          </div>
        )}
      </div>

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>Add Target Company</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Schneider Electric, Siemens, Infosys"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Industry / Category *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Industrial Automation, IT, Core"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Recruiting Roles (comma separated)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="GET Automation, Systems Engineer"
                    value={formRoles}
                    onChange={(e) => setFormRoles(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Minimum CGPA / %
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 6.5 / 65%"
                    value={formMinCgpa}
                    onChange={(e) => setFormMinCgpa(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Eligible Branches
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. E&I, EEE, ECE, Mech"
                    value={formBranches}
                    onChange={(e) => setFormBranches(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Registration Deadline
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    Assessment Date
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formAssessmentDate}
                    onChange={(e) => setFormAssessmentDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Official Portal / Application URL
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Notes & Syllabus Specifics
                </label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Exam format, negative marking, section cutoffs..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Stage Modal */}
      {isStatusModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Update Stage: {currentCompany?.name}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsStatusModalOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Select Recruitment Stage
                </label>
                <select
                  className="select"
                  value={selectedNewStage}
                  onChange={(e) => setSelectedNewStage(e.target.value as CompanyStage)}
                >
                  {Object.entries(STAGES).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Activity Log Note (Optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Registered on campus portal, admit card received"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button className="btn btn-secondary" onClick={() => setIsStatusModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpdateStage}>
                  Record Stage Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
