import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Brain,
  Sliders,
  FileCheck2,
  BookOpen,
  CalendarCheck,
  BarChart3,
  Flame,
  BookX,
  Settings,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { openFocusTimer, focusTimer } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Mission Control', icon: LayoutDashboard },
    { id: 'missions', label: 'Daily Missions', icon: Compass },
    { id: 'cognitive', label: 'Cognitive Arena', icon: Brain },
    { id: 'instrumentation', label: 'Instrumentation Arena', icon: Sliders },
    { id: 'mocks', label: 'Mock Test Centre', icon: FileCheck2 },
    { id: 'learn', label: 'Learn & Watch', icon: BookOpen },
    { id: 'daily-report', label: 'Daily Report', icon: CalendarCheck },
    { id: 'analytics', label: 'Cumulative Analytics', icon: BarChart3 },
    { id: 'achievements', label: 'Streaks & XP', icon: Flame },
    { id: 'mistakes', label: 'Mistake Notebook', icon: BookX },
    { id: 'settings', label: 'Settings & Sources', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'linear-gradient(135deg, #00e5ff 0%, #0077b6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)' }}>
          <Sparkles size={20} color="#060a12" />
        </div>
        <div>
          <div className="brand-title">
            GET QUEST <span className="brand-badge">2027</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
            E&I PREPARATION ARENA
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Operations</div>
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon className="nav-icon" />
              <span className="nav-text">{item.label}</span>
            </button>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: '12px' }}>Knowledge & Review</div>
        {navItems.slice(5, 7).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon className="nav-icon" />
              <span className="nav-text">{item.label}</span>
            </button>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: '12px' }}>Intelligence & Records</div>
        {navItems.slice(7).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon className="nav-icon" />
              <span className="nav-text">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', borderColor: focusTimer.running ? 'var(--cyan-primary)' : 'var(--border-dim)' }}
          onClick={() => openFocusTimer()}
        >
          <Clock size={15} color={focusTimer.running ? 'var(--cyan-primary)' : 'var(--text-muted)'} />
          <span>{focusTimer.running ? `Timer: ${Math.floor(focusTimer.seconds / 60)}m active` : 'Launch Focus Timer'}</span>
        </button>
      </div>
    </aside>
  );
};
