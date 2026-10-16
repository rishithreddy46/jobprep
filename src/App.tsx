import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { FocusTimerModal } from './components/FocusTimerModal';

import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { DailyMissions } from './pages/DailyMissions';
import { PracticeCentre } from './pages/PracticeCentre';
import { MockTestCentre } from './pages/MockTestCentre';
import { TestRunner } from './pages/TestRunner';
import { CompaniesCentre } from './pages/CompaniesCentre';
import { LearnWatch } from './pages/LearnWatch';
import { CumulativeAnalytics } from './pages/CumulativeAnalytics';
import { MistakeNotebook } from './pages/MistakeNotebook';
import { SettingsSources } from './pages/SettingsSources';

const MainAppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('today');
  const [activeTestConfig, setActiveTestConfig] = useState<any | null>(null);
  const [targetCompanyId, setTargetCompanyId] = useState<string | undefined>(undefined);

  // Check authentication session on initial mount
  useEffect(() => {
    const verifyAuthSession = async () => {
      try {
        const token = localStorage.getItem('jobprep_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/auth/me', { headers });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user || { username: 'Rishith' });
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Auth verification error:', err);
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };

    verifyAuthSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore network errors on logout
    }
    localStorage.removeItem('jobprep_token');
    setCurrentUser(null);
  };

  const handleNavigate = (tab: string, extra?: any) => {
    if (tab === 'test-runner' && extra?.config) {
      setActiveTestConfig(extra.config);
      setCurrentTab('test-runner');
    } else if (tab === 'companies' && extra?.companyId) {
      setTargetCompanyId(extra.companyId);
      setCurrentTab('companies');
    } else {
      setCurrentTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitTest = () => {
    setActiveTestConfig(null);
    setCurrentTab('assessments');
  };

  // If checking authentication status, show minimalist calm splash
  if (authChecking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-main)',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-m)',
          fontSize: '0.84rem',
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--blue)', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
        <span>Verifying authorized session...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If unauthenticated, gate all access behind Single-User LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        onLogout={handleLogout}
      />

      <Header onOpenSettings={() => handleNavigate('settings')} />

      <main className="main-content">
        {(currentTab === 'today' || currentTab === 'overview' || currentTab === 'dashboard') && (
          <Dashboard onNavigate={handleNavigate} />
        )}
        {(currentTab === 'plan' || currentTab === 'missions') && (
          <DailyMissions onNavigate={handleNavigate} />
        )}
        {(currentTab === 'practice' || currentTab === 'cognitive' || currentTab === 'instrumentation') && (
          <PracticeCentre onNavigate={handleNavigate} />
        )}
        {(currentTab === 'assessments' || currentTab === 'mocks') && (
          <MockTestCentre onNavigate={handleNavigate} />
        )}
        {currentTab === 'test-runner' && (
          <TestRunner
            config={activeTestConfig}
            onExit={handleExitTest}
            onNavigate={handleNavigate}
          />
        )}
        {currentTab === 'companies' && (
          <CompaniesCentre
            onNavigate={handleNavigate}
            selectedCompanyId={targetCompanyId}
          />
        )}
        {(currentTab === 'resources' || currentTab === 'learn') && <LearnWatch />}
        {(currentTab === 'progress' || currentTab === 'analytics' || currentTab === 'daily-report' || currentTab === 'achievements') && (
          <CumulativeAnalytics />
        )}
        {currentTab === 'mistakes' && <MistakeNotebook onNavigate={handleNavigate} />}
        {currentTab === 'settings' && <SettingsSources />}
      </main>

      <FocusTimerModal />
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
};

export default App;
