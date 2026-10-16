import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Target,
  FileCheck2,
  Building2,
  BookOpen,
  BarChart3,
  BookX,
  Settings,
  Clock,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { openFocusTimer, focusTimer, companies } = useApp();

  const workspaceNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'plan', label: 'My Plan', icon: CalendarDays },
    { id: 'practice', label: 'Practice Arena', icon: Target },
    { id: 'mocks', label: 'Mock Test Centre', icon: FileCheck2 },
  ];

  const intelligenceNav = [
    { id: 'companies', label: 'Companies', icon: Building2, badge: companies.length > 0 ? String(companies.length) : undefined },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'mistakes', label: 'Mistake Notebook', icon: BookX },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--blue), var(--cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(46, 165, 201, 0.35)',
          }}
        >
          <Briefcase size={18} />
        </div>
        <div>
          <div className="brand-title">
            JobPrep <span className="card-badge badge-cyan" style={{ margin: 0, padding: '2px 7px', fontSize: '0.6rem' }}>LIVE</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-m)' }}>
            jobprep.live
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label" style={{ fontFamily: 'var(--font-m)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
          01 · CORE WORKSPACE
        </div>
        {workspaceNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon className="nav-icon" style={{ color: isActive ? 'var(--blue)' : 'inherit' }} />
              <span className="nav-text" style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: '16px', fontFamily: 'var(--font-m)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
          02 · TRACKING & INTEL
        </div>
        {intelligenceNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon className="nav-icon" style={{ color: isActive ? 'var(--blue)' : 'inherit' }} />
              <span className="nav-text" style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span
                  className="badge badge-cyan"
                  style={{
                    fontSize: '0.62rem',
                    padding: '2px 6px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: '16px', fontFamily: 'var(--font-m)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
          03 · SETTINGS
        </div>
        <button
          className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
        >
          <Settings className="nav-icon" style={{ color: currentTab === 'settings' ? 'var(--blue)' : 'inherit' }} />
          <span className="nav-text">Settings & Backup</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <button
          className="btn btn-secondary btn-sm"
          style={{
            width: '100%',
            borderColor: focusTimer.running ? 'var(--cyan)' : 'var(--border-subtle)',
            background: focusTimer.running ? 'rgba(46, 165, 201, 0.08)' : 'var(--bg-surface)',
          }}
          onClick={() => openFocusTimer()}
        >
          <Clock size={15} color={focusTimer.running ? 'var(--cyan)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '0.8rem', fontWeight: 500, fontFamily: 'var(--font-m)' }}>
            {focusTimer.running ? `Timer: ${Math.floor(focusTimer.seconds / 60)}m` : 'Focus Timer'}
          </span>
        </button>
      </div>
    </aside>
  );
};
