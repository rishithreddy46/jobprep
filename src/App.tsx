import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { FocusTimerModal } from './components/FocusTimerModal';
import { PasscodeModal } from './components/PasscodeModal';

import { Dashboard } from './pages/Dashboard';
import { DailyMissions } from './pages/DailyMissions';
import { CognitiveArena } from './pages/CognitiveArena';
import { InstrumentationArena } from './pages/InstrumentationArena';
import { MockTestCentre } from './pages/MockTestCentre';
import { TestRunner } from './pages/TestRunner';
import { LearnWatch } from './pages/LearnWatch';
import { DailyReport } from './pages/DailyReport';
import { CumulativeAnalytics } from './pages/CumulativeAnalytics';
import { StreaksAchievements } from './pages/StreaksAchievements';
import { MistakeNotebook } from './pages/MistakeNotebook';
import { SettingsSources } from './pages/SettingsSources';

const MainAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeTestConfig, setActiveTestConfig] = useState<any | null>(null);

  const handleNavigate = (tab: string, extra?: any) => {
    if (tab === 'test-runner' && extra?.config) {
      setActiveTestConfig(extra.config);
      setCurrentTab('test-runner');
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
        {currentTab === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {currentTab === 'missions' && <DailyMissions onNavigate={handleNavigate} />}
        {currentTab === 'cognitive' && <CognitiveArena onNavigate={handleNavigate} />}
        {currentTab === 'instrumentation' && <InstrumentationArena onNavigate={handleNavigate} />}
        {currentTab === 'mocks' && <MockTestCentre onNavigate={handleNavigate} />}
        {currentTab === 'test-runner' && (
          <TestRunner
            config={activeTestConfig}
            onExit={handleExitTest}
            onNavigate={handleNavigate}
          />
        )}
        {currentTab === 'learn' && <LearnWatch />}
        {currentTab === 'daily-report' && <DailyReport />}
        {currentTab === 'analytics' && <CumulativeAnalytics />}
        {currentTab === 'achievements' && <StreaksAchievements />}
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
