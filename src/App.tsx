import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { FocusTimerModal } from './components/FocusTimerModal';
import { PasscodeModal } from './components/PasscodeModal';

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
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [activeTestConfig, setActiveTestConfig] = useState<any | null>(null);
  const [targetCompanyId, setTargetCompanyId] = useState<string | undefined>(undefined);

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
    setCurrentTab('mocks');
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
      />

      <Header onOpenSettings={() => handleNavigate('settings')} />

      <main className="main-content">
        {(currentTab === 'overview' || currentTab === 'dashboard') && (
          <Dashboard onNavigate={handleNavigate} />
        )}
        {(currentTab === 'plan' || currentTab === 'missions') && (
          <DailyMissions onNavigate={handleNavigate} />
        )}
        {(currentTab === 'practice' || currentTab === 'cognitive' || currentTab === 'instrumentation') && (
          <PracticeCentre onNavigate={handleNavigate} />
        )}
        {currentTab === 'mocks' && <MockTestCentre onNavigate={handleNavigate} />}
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
        {(currentTab === 'analytics' || currentTab === 'daily-report' || currentTab === 'achievements') && (
          <CumulativeAnalytics />
        )}
        {currentTab === 'mistakes' && <MistakeNotebook onNavigate={handleNavigate} />}
        {currentTab === 'settings' && <SettingsSources />}
      </main>

      <FocusTimerModal />
      <PasscodeModal />
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
