import React from 'react';
import {
  Compass,
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
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onLogout }) => {
  const { openFocusTimer, focusTimer, companies } = useApp();

  // Primary 7 navigation routes requested in Phase 4
  const primaryNav = [
    { id: 'today', label: 'Today', icon: Compass },
    { id: 'plan', label: 'My Plan', icon: CalendarDays },
    { id: 'practice', label: 'Practice', icon: Target },
    { id: 'assessments', label: 'Assessments', icon: FileCheck2 },
    { id: 'companies', label: 'Companies', icon: Building2, badge: companies.length > 0 ? String(companies.length) : undefined },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
  ];

  const secondaryNav = [
    { id: 'mistakes', label: 'Mistake Notebook', icon: BookX },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
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
          <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>JobPrep</span>
            <span className="card-badge badge-cyan" style={{ margin: 0, padding: '2px 6px', fontSize: '0.62rem' }}>
              LIVE
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-m)' }}>
            jobprep.live
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-label" style={{ fontFamily: 'var(--font-m)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
          PRIMARY
        </div>
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'today' && (currentTab === 'overview' || currentTab === 'dashboard')) ||
            (item.id === 'assessments' && (currentTab === 'mocks' || currentTab === 'test-runner')) ||
            (item.id === 'progress' && (currentTab === 'analytics' || currentTab === 'daily-report' || currentTab === 'achievements'));

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

        <div className="nav-section-label" style={{ marginTop: '20px', fontFamily: 'var(--font-m)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>
          WORKSPACE & TOOLS
        </div>
        {secondaryNav.map((item) => {
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

        {onLogout && (
          <button
            className="nav-item"
            style={{ marginTop: '8px', color: 'var(--coral-error)' }}
            onClick={onLogout}
          >
            <LogOut className="nav-icon" style={{ color: 'var(--coral-error)' }} />
            <span className="nav-text">Sign Out</span>
          </button>
        )}
      </nav>

      {/* Focus Timer Footer */}
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
