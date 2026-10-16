import React, { useState } from 'react';
import {
  BookOpen,
  Video,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
  Search,
  Plus,
  Building2,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LearnWatch: React.FC = () => {
  const { companies, addToast } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customCategory, setCustomCategory] = useState('Cognitive Aptitude');
  const [customDesc, setCustomDesc] = useState('');

  const [reviewedResources, setReviewedResources] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('jobprep_reviewed_resources');
    return saved ? JSON.parse(saved) : {};
  });

  const [userResources, setUserResources] = useState<any[]>(() => {
    const saved = localStorage.getItem('jobprep_user_resources');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleReviewed = (id: string) => {
    const next = { ...reviewedResources, [id]: !reviewedResources[id] };
    setReviewedResources(next);
    localStorage.setItem('jobprep_reviewed_resources', JSON.stringify(next));
    addToast(next[id] ? 'Marked as Completed' : 'Status Cleared', '', 'info');
  };

  const handleAddCustomResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customUrl) return;

    const newRes = {
      id: `USR_${Date.now()}`,
      title: customTitle.trim(),
      url: customUrl.trim(),
      category: customCategory,
      source: 'User Added Material',
      description: customDesc.trim() || 'Custom study resource.',
      type: 'External Link',
    };

    const updated = [newRes, ...userResources];
    setUserResources(updated);
    localStorage.setItem('jobprep_user_resources', JSON.stringify(updated));
    addToast('Resource Added', `${customTitle} saved to library.`, 'success');
    setIsAddModalOpen(false);
    setCustomTitle('');
    setCustomUrl('');
    setCustomDesc('');
  };

  // Base curated verified resources
  const baseResources = [
    {
      id: 'NPTEL_BARUA_INST',
      category: 'Industrial Instrumentation',
      title: 'NPTEL Industrial Instrumentation Course — Prof. Alok Barua (IIT Kharagpur)',
      source: 'NPTEL / IIT Kharagpur',
      url: 'https://onlinecourses-archive.nptel.ac.in/noc17_ec09/preview',
      type: 'Curriculum Course Archive',
      description: 'Comprehensive industrial measurement curriculum: static/dynamic characteristics, strain gauges, RTDs, thermocouples, pressure, flowmeters, and level sensors.',
      companyTag: 'RIL GET & L&T',
    },
    {
      id: 'INDIABIX_QUANT',
      category: 'Cognitive Aptitude',
      title: 'IndiaBIX Quantitative Aptitude Practice Sets',
      source: 'IndiaBIX Education',
      url: 'https://www.indiabix.com/online-test/aptitude-test/',
      type: 'Practice Portal',
      description: 'Topic-wise practice sets for percentages, ratios, averages, time and work, speed and distance, and interest calculation.',
      companyTag: 'Shared / All Companies',
    },
    {
      id: 'INDIABIX_LOGIC',
      category: 'Logical Reasoning',
      title: 'IndiaBIX Logical Reasoning Practice Sets',
      source: 'IndiaBIX Education',
      url: 'https://www.indiabix.com/online-test/logical-reasoning-test/',
      type: 'Practice Portal',
      description: 'Number and letter series, coding-decoding, logical deduction, directions, and data interpretation questions.',
      companyTag: 'Shared / All Companies',
    },
    {
      id: 'TEMP_SENSORS',
      category: 'Industrial Instrumentation',
      title: 'RTD, Thermocouple & Thermistor Operating Principles',
      source: 'NPTEL Standard Library',
      url: 'https://nptel.ac.in/courses/108105064',
      type: 'Technical Lecture Series',
      description: 'Seebeck effect, Pt100 3-wire/4-wire bridge circuits, cold junction compensation, thermowells, and response times.',
      companyTag: 'Core Engineering',
    },
    {
      id: 'FLOW_PRESSURE',
      category: 'Industrial Instrumentation',
      title: 'Differential Pressure, Orifice, Venturi & Coriolis Mass Flow',
      source: 'Siemens SITRAIN & NPTEL',
      url: 'https://www.sitrain-learning.siemens.com',
      type: 'Industrial Guide',
      description: 'Bernoulli differential pressure flow calculation, square-root extraction, Venturi tube, magnetic flowmeters, and Coriolis mass meters.',
      companyTag: 'Core Engineering',
    },
    {
      id: 'PLC_DCS_SCADA',
      category: 'Process Control & Automation',
      title: 'PLC, DCS and SCADA Architecture for Process Industries',
      source: 'Curriculum Standard',
      url: 'https://archive.org',
      type: 'Industrial Reference Manual',
      description: 'Relay ladder logic basics, distributed control system architecture, fieldbus protocols, HART 4-20mA communication, and control valve characteristics.',
      companyTag: 'Automation / GET',
    },
  ];

  const allResources = [...userResources, ...baseResources];

  const filteredResources = allResources.filter((r) => {
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  const categories = ['all', 'Cognitive Aptitude', 'Logical Reasoning', 'Industrial Instrumentation', 'Process Control & Automation'];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <span className="section-label">08 — Curated Technical Library</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: 4 }}>
            Learning Resources Library
          </h1>
          <p className="section-desc">
            Curated technical guides, verified NPTEL lectures, industry documentation, and high-yield aptitude practice portals.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add Custom Link
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search guides, topics, instrumentation, aptitude..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {cat === 'all' ? 'All Resources' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid-2">
        {filteredResources.map((res) => {
          const isDone = reviewedResources[res.id];
          return (
            <div
              key={res.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: isDone ? 'var(--bg-muted)' : 'var(--bg-surface)',
                borderColor: isDone ? 'var(--border-subtle)' : 'var(--border-hover)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="badge badge-primary">{res.category}</span>
                    {res.companyTag && <span className="badge badge-neutral">{res.companyTag}</span>}
                  </div>

                  <button
                    onClick={() => toggleReviewed(res.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDone ? 'var(--emerald-success)' : 'var(--text-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isDone ? 'Reviewed' : 'Mark Reviewed'}</span>
                  </button>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6, lineHeight: 1.4 }}>
                  {res.title}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: 12 }}>
                  Source: {res.source} • Type: {res.type}
                </div>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                  {res.description}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                  Opens official source
                </span>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Visit Resource <ExternalLink size={13} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Resource Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Add Custom Resource</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddCustomResource} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Resource Title *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Process Dynamics Lecture Notes"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Resource URL *
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Category
                </label>
                <select
                  className="select"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                >
                  <option value="Cognitive Aptitude">Cognitive Aptitude</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                  <option value="Industrial Instrumentation">Industrial Instrumentation</option>
                  <option value="Process Control & Automation">Process Control & Automation</option>
                  <option value="Interview Preparation">Interview Preparation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  Notes / Description
                </label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Key concepts or chapters covered..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
