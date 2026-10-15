import React, { useState } from 'react';
import {
  BookOpen,
  Video,
  ExternalLink,
  Clock,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
  Search,
  Sparkles,
  Play,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LearnWatch: React.FC = () => {
  const { openFocusTimer, addToast } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'P0' | 'P1' | 'P2'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reviewedResources, setReviewedResources] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('get_quest_reviewed_resources');
    return saved ? JSON.parse(saved) : {};
  });

  const toggleReviewed = (id: string) => {
    const next = { ...reviewedResources, [id]: !reviewedResources[id] };
    setReviewedResources(next);
    localStorage.setItem('get_quest_reviewed_resources', JSON.stringify(next));
    addToast(next[id] ? 'Resource Marked as Reviewed' : 'Review status cleared', '', 'info');
  };

  // Curated resource library backed strictly by sources.json & topic_blueprint.json
  const resources = [
    // P0 Resources
    {
      id: 'NPTEL_BARUA_INST',
      priority: 'P0',
      category: 'Industrial Instrumentation',
      title: 'NPTEL Industrial Instrumentation Course — Prof. Alok Barua (IIT Kharagpur)',
      source: 'NPTEL / IIT Kharagpur (NPTEL-IND-INST)',
      url: 'https://onlinecourses-archive.nptel.ac.in/noc17_ec09/preview',
      type: 'Curriculum Course Archive',
      reliability: 'High',
      description: 'Comprehensive undergraduate industrial measurement curriculum: static/dynamic characteristics, strain gauges, RTDs, thermocouples, pressure, flowmeters, and level sensors.',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=NPTEL+Industrial+Instrumentation+Alok+Barua',
    },
    {
      id: 'INDIABIX_QUANT',
      priority: 'P0',
      category: 'Cognitive Aptitude',
      title: 'IndiaBIX Quantitative Aptitude Practice Sets',
      source: 'IndiaBIX (INDIABIX-APTITUDE)',
      url: 'https://www.indiabix.com/online-test/aptitude-test/',
      type: 'External Practice Portal',
      reliability: 'Useful Practice (Third-party)',
      description: 'Topic-wise practice sets for percentages, ratios, averages, time and work, speed and distance, and interest calculation.',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=quantitative+aptitude+percentages+ratios+time+work+placement+practice',
    },
    {
      id: 'INDIABIX_LOGIC',
      priority: 'P0',
      category: 'Logical Reasoning',
      title: 'IndiaBIX Logical Reasoning Practice Sets',
      source: 'IndiaBIX (INDIABIX-LOGIC)',
      url: 'https://www.indiabix.com/online-test/logical-reasoning-test/',
      type: 'External Practice Portal',
      reliability: 'Useful Practice (Third-party)',
      description: 'Number and letter series, coding-decoding, logical deduction, directions, and data interpretation questions.',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=logical+reasoning+series+coding+decoding+placement+practice',
    },
    {
      id: 'TEMP_SENSORS',
      priority: 'P0',
      category: 'Temperature Measurement',
      title: 'RTD, Thermocouple & Thermistor Operating Principles',
      source: 'NPTEL & Domain Standard',
      url: 'https://nptel.ac.in/courses/108105064',
      type: 'Technical Lecture Series',
      reliability: 'High',
      description: 'Seebeck effect, Pt100 3-wire/4-wire bridge circuits, cold junction compensation, thermowells, and response times.',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=NPTEL+RTD+thermocouple+thermistor+instrumentation',
    },
    {
      id: 'FLOW_PRESSURE',
      priority: 'P0',
      category: 'Flow & Pressure Measurement',
      title: 'Differential Pressure, Orifice, Venturi & Coriolis Mass Flow',
      source: 'NPTEL & SITRAIN (SIEMENS-PI)',
      url: 'https://www.sitrain-learning.siemens.com/en/product/chapter/QAKA0CA/course/QJDXAQN/description.do',
      type: 'Industrial Guide',
      reliability: 'High',
      description: 'Bernoulli differential pressure flow calculation, square-root extraction, Venturi tube, magnetic flowmeters, and Coriolis mass meters.',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=NPTEL+flow+measurement+orifice+venturi+pressure+transmitter',
    },
    {
      id: 'PLC_DCS_SCADA',
      priority: 'P0',
      category: 'Automation & Plant Systems',
      title: 'PLC, DCS and SCADA Architecture for Process Industries',
      source: 'Curriculum & Candidate Topic Signal (RIL-GLASSDOOR-INST-2025)',
      url: 'https://nptel.ac.in/courses/108105064',
      type: 'Engineering Concept Map',
      reliability: 'Candidate Reported & Standard Curriculum',
      description: 'Differences between PLC (high-speed discrete interlocks), DCS (distributed analog PID control), and SCADA (geographical supervisory data acquisition).',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=PLC+DCS+SCADA+basics+instrumentation+engineering',
    },
    {
      id: 'CONTROL_VALVES_PID',
      priority: 'P0',
      category: 'Control Systems & Valves',
      title: 'Control Valves, Positioners & PID Tuning Fundamentals',
      source: 'NPTEL Process Control',
      url: 'https://onlinecourses-archive.nptel.ac.in/noc17_ec09/preview',
      type: 'Technical Lecture Series',
      reliability: 'High',
      description: 'Fail-open (air-to-close) vs fail-closed (air-to-open) valve safety decisions, electro-pneumatic positioners, and P/I/D tuning effects on overshoot and offset.',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=control+systems+feedback+PID+controller+NPTEL',
    },

    // P1 Resources
    {
      id: 'SIGNAL_CONDITIONING_OPAMPS',
      priority: 'P1',
      category: 'Electronics & Conditioning',
      title: 'Instrumentation Amplifier, Filters & 4–20 mA Current Loops',
      source: 'NPTEL Electronics for Instrumentation',
      url: 'https://nptel.ac.in/courses/108105064',
      type: 'Core Curriculum',
      reliability: 'High',
      description: '3-opamp instrumentation amplifier, CMRR, 2-wire vs 4-wire transmitters, live zero advantages (fault detection), and active filter design.',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=instrumentation+amplifier+CMRR+4-20mA+transmitter+NPTEL',
    },
    {
      id: 'PID_ISA_TAGS',
      priority: 'P1',
      category: 'P&ID & Documentation',
      title: 'ISA 5.1 Instrumentation Symbols & Identification Tags',
      source: 'Industrial Documentation Standard',
      url: 'https://nptel.ac.in/courses/108105064',
      type: 'Reference Guide',
      reliability: 'High',
      description: 'Decoding PT, TT, FT, LT, FIC, TIC tags, discrete vs shared display symbols, field-mounted vs control room instruments, and interlock lines.',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=PID+symbols+ISA+5.1+instrumentation+tags+tutorial',
    },

    // P2 Resources
    {
      id: 'ANALYTICAL_PH',
      priority: 'P2',
      category: 'Analytical Instrumentation',
      title: 'pH & Analytical Sensors in Petrochemical Processes',
      source: 'NPTEL Advanced Instrumentation',
      url: 'https://onlinecourses-archive.nptel.ac.in/noc17_ec09/preview',
      type: 'Specialized Topic',
      reliability: 'High',
      description: 'Nernst equation, glass electrode, reference calomel electrode, temperature compensation, and conductivity measurement.',
      videoSearchUrl: 'https://www.youtube.com/results?search_query=pH+measurement+glass+electrode+instrumentation+NPTEL',
    },
  ];

  const filtered = resources.filter((r) => {
    if (selectedFilter !== 'all' && r.priority !== selectedFilter) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div className="card card-cyan-accent" style={{ marginBottom: 24, padding: '26px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 750 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-cyan">Curated Learning Library</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified Educational Resources & Video Searches</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Learn & Watch
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Strengthen conceptual foundations using validated NPTEL curricula, industrial guides, and external practice portals. Follow the <strong>Learn 20m → Practice 10 Qs → Review Mistakes</strong> cycle.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => openFocusTimer()}>
            <Clock size={16} />
            <span>Launch Study Timer</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${selectedFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSelectedFilter('all')}
          >
            All Resources ({resources.length})
          </button>
          <button
            className={`btn ${selectedFilter === 'P0' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSelectedFilter('P0')}
          >
            Priority P0 (Core)
          </button>
          <button
            className={`btn ${selectedFilter === 'P1' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSelectedFilter('P1')}
          >
            Priority P1 (Breadth)
          </button>
          <button
            className={`btn ${selectedFilter === 'P2' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSelectedFilter('P2')}
          >
            Priority P2 (Depth)
          </button>
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            placeholder="Search topic or concept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-dim)',
              color: '#fff',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {filtered.map((r) => {
          const isReviewed = reviewedResources[r.id];
          return (
            <div
              key={r.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: isReviewed ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-dim)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${r.priority === 'P0' ? 'badge-coral' : r.priority === 'P1' ? 'badge-cyan' : 'badge-amber'}`}>
                      {r.priority}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.category}</span>
                  </div>

                  <button
                    onClick={() => toggleReviewed(r.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: isReviewed ? 'var(--emerald-success)' : 'var(--text-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.75rem',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isReviewed ? 'Reviewed' : 'Mark Reviewed'}</span>
                  </button>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.4 }}>
                  {r.title}
                </h3>

                <div style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontWeight: 600, marginBottom: 10 }}>
                  Source: {r.source}
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                  {r.description}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} />
                    <span>Open Resource</span>
                  </a>

                  {r.videoSearchUrl && (
                    <a
                      href={r.videoSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, textDecoration: 'none', borderColor: 'rgba(255, 68, 68, 0.4)' }}
                    >
                      <Video size={14} color="#ff4444" />
                      <span>YouTube Search</span>
                    </a>
                  )}

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => openFocusTimer(r.title)}
                    title="Launch 20m focus study session on this topic"
                  >
                    <Clock size={14} />
                    <span>Timer</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
