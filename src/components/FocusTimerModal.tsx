import React from 'react';
import { Play, Pause, Save, X, Clock, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FocusTimerModal: React.FC = () => {
  const { focusTimer, closeFocusTimer, startFocusTimer, pauseFocusTimer, saveFocusSession } = useApp();

  if (!focusTimer.isOpen) return null;

  const hours = Math.floor(focusTimer.seconds / 3600);
  const mins = Math.floor((focusTimer.seconds % 3600) / 60);
  const secs = focusTimer.seconds % 60;

  const formatDigits = (val: number) => String(val).padStart(2, '0');

  const topics = [
    'Instrumentation Fundamentals',
    'Temperature Sensors (RTD, Thermocouple, Thermistor)',
    'Pressure Measurement & Manometers',
    'Flowmeters (DP, Orifice, Venturi, Coriolis, Magnetic)',
    'Level Measurement & Hydrostatic Head',
    '4–20 mA Current Loops & Scaling',
    'Control Valves & Positioners',
    'Feedback & PID Tuning Basics',
    'PLC, DCS & SCADA Plant Automation',
    'P&ID Symbols & Instrument Tags',
    'Quantitative Aptitude & Arithmetic',
    'Logical Reasoning & Coding-Decoding',
    'Data Interpretation & Tables',
    'Verbal Ability & Technical Comprehension',
    'Mistake Review & Formula Recall',
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan-primary)', fontWeight: 700 }}>
            <Clock size={20} />
            <span>FOCUSED STUDY SESSION TIMER</span>
          </div>
          <button onClick={closeFocusTimer} style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Stopwatch Display */}
        <div style={{
          background: 'var(--bg-muted)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 0',
          margin: '16px 0',
        }}>
          <div style={{
            fontFamily: 'var(--font-m)',
            fontSize: '3.4rem',
            fontWeight: 800,
            color: focusTimer.running ? 'var(--blue)' : 'var(--text-main)',
            letterSpacing: '0.04em',
          }}>
            {formatDigits(hours)}:{formatDigits(mins)}:{formatDigits(secs)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {focusTimer.running ? 'Active focus time measuring...' : 'Timer paused'}
          </div>
        </div>

        {/* Topic Selector */}
        <div style={{ textAlign: 'left', marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
            Study Focus Topic
          </label>
          <select
            value={focusTimer.topic}
            onChange={(e) => startFocusTimer(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          >
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ background: 'rgba(217, 119, 6, 0.08)', border: '1px dashed var(--amber-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.78rem', color: 'var(--amber-warning)', marginBottom: 20 }}>
          <Flame size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          <span>Sessions of 15+ minutes award 5 XP and qualify towards your daily streak!</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {focusTimer.running ? (
            <button className="btn btn-secondary" onClick={pauseFocusTimer} style={{ minWidth: 120 }}>
              <Pause size={18} />
              <span>Pause</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => startFocusTimer()} style={{ minWidth: 120 }}>
              <Play size={18} />
              <span>{focusTimer.seconds > 0 ? 'Resume' : 'Start Timer'}</span>
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={saveFocusSession}
            disabled={focusTimer.seconds < 30}
            style={{
              background: focusTimer.seconds >= 30 ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'var(--bg-muted)',
              color: focusTimer.seconds >= 30 ? '#fff' : 'var(--text-subtle)',
              border: '1px solid var(--border-subtle)',
              cursor: focusTimer.seconds >= 30 ? 'pointer' : 'not-allowed',
            }}
          >
            <Save size={18} />
            <span>Save & Log Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
