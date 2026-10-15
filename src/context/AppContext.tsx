import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { LearnerProfile, XpStreakData, StudyPlanData } from '../types';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'achievement';
}

interface FocusTimerState {
  running: boolean;
  seconds: number;
  topic: string;
  isOpen: boolean;
}

interface AppContextType {
  profile: LearnerProfile | null;
  updateProfile: (data: Partial<LearnerProfile>) => Promise<void>;
  xpStreak: XpStreakData | null;
  refreshXpStreak: () => Promise<void>;
  currentDate: string;
  setCurrentDate: (date: string) => void;
  studyPlan: StudyPlanData | null;
  refreshStudyPlan: () => Promise<void>;
  activeTestConfig: any | null;
  startTest: (config: any) => void;
  exitTest: () => void;
  toasts: Toast[];
  addToast: (title: string, message?: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  triggerConfetti: () => void;
  focusTimer: FocusTimerState;
  openFocusTimer: (topic?: string) => void;
  closeFocusTimer: () => void;
  startFocusTimer: (topic?: string) => void;
  pauseFocusTimer: () => void;
  saveFocusSession: () => Promise<void>;
  isLocked: boolean;
  unlockApp: () => void;
  lockApp: () => void;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [xpStreak, setXpStreak] = useState<XpStreakData | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlanData | null>(null);
  
  // Current local preparation date - default to today's local date (e.g. 2026-10-15)
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  const [activeTestConfig, setActiveTestConfig] = useState<any | null>(() => {
    const saved = localStorage.getItem('get_quest_active_test');
    return saved ? JSON.parse(saved) : null;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Focus Timer
  const [focusTimer, setFocusTimer] = useState<FocusTimerState>({
    running: false,
    seconds: 0,
    topic: 'Instrumentation Fundamentals',
    isOpen: false,
  });

  const addToast = (title: string, message?: string, type: Toast['type'] = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00e5ff', '#00b4d8', '#ffb703', '#10b981', '#a855f7'],
    });
  };

  const loadData = async () => {
    try {
      const [profData, xpData, planData] = await Promise.all([
        api.getProfile(),
        api.getXpStreak(),
        api.getStudyPlan(),
      ]);
      setProfile(profData);
      setXpStreak(xpData);
      setStudyPlan(planData);

      if (profData?.passcode_hash && !sessionStorage.getItem('get_quest_unlocked')) {
        setIsLocked(true);
      }
    } catch (err) {
      console.error('Error loading initial app data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (focusTimer.running) {
      interval = setInterval(() => {
        setFocusTimer((prev) => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusTimer.running]);

  const updateProfile = async (data: Partial<LearnerProfile>) => {
    const updated = await api.updateProfile(data);
    setProfile(updated);
    addToast('Profile Updated', 'Your settings and goals have been saved.', 'success');
  };

  const refreshXpStreak = async () => {
    const data = await api.getXpStreak();
    setXpStreak(data);
  };

  const refreshStudyPlan = async () => {
    const plan = await api.getStudyPlan();
    setStudyPlan(plan);
  };

  const startTest = (config: any) => {
    setActiveTestConfig(config);
    localStorage.setItem('get_quest_active_test', JSON.stringify(config));
  };

  const exitTest = () => {
    setActiveTestConfig(null);
    localStorage.removeItem('get_quest_active_test');
    localStorage.removeItem('get_quest_active_test_responses');
  };

  const openFocusTimer = (topic?: string) => {
    setFocusTimer((prev) => ({
      ...prev,
      isOpen: true,
      topic: topic || prev.topic,
    }));
  };

  const closeFocusTimer = () => {
    setFocusTimer((prev) => ({ ...prev, isOpen: false }));
  };

  const startFocusTimer = (topic?: string) => {
    setFocusTimer((prev) => ({
      ...prev,
      running: true,
      isOpen: true,
      topic: topic || prev.topic,
    }));
  };

  const pauseFocusTimer = () => {
    setFocusTimer((prev) => ({ ...prev, running: false }));
  };

  const saveFocusSession = async () => {
    if (focusTimer.seconds < 30) {
      addToast('Session Too Short', 'Sessions under 30 seconds are not logged.', 'warning');
      setFocusTimer((prev) => ({ ...prev, running: false, seconds: 0, isOpen: false }));
      return;
    }

    try {
      const res = await api.saveStudySession({
        date: currentDate,
        topic: focusTimer.topic,
        duration_seconds: focusTimer.seconds,
        session_type: 'focus_timer',
      });

      const mins = Math.round(focusTimer.seconds / 60);
      addToast('Focus Session Logged!', `Recorded ${mins} min(s) on ${focusTimer.topic}. +${res.xpAwarded} XP!`, 'success');
      if (res.xpAwarded > 0) triggerConfetti();

      setFocusTimer((prev) => ({ ...prev, running: false, seconds: 0, isOpen: false }));
      await refreshXpStreak();
    } catch (err: any) {
      addToast('Error saving session', err.message, 'warning');
    }
  };

  const unlockApp = () => {
    sessionStorage.setItem('get_quest_unlocked', 'true');
    setIsLocked(false);
  };

  const lockApp = () => {
    sessionStorage.removeItem('get_quest_unlocked');
    setIsLocked(true);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        updateProfile,
        xpStreak,
        refreshXpStreak,
        currentDate,
        setCurrentDate,
        studyPlan,
        refreshStudyPlan,
        activeTestConfig,
        startTest,
        exitTest,
        toasts,
        addToast,
        removeToast,
        triggerConfetti,
        focusTimer,
        openFocusTimer,
        closeFocusTimer,
        startFocusTimer,
        pauseFocusTimer,
        saveFocusSession,
        isLocked,
        unlockApp,
        lockApp,
        refreshAll: loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
