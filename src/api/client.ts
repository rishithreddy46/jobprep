const API_BASE = '/api';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Profile
  getProfile: () => apiFetch<any>('/profile'),
  updateProfile: (data: any) => apiFetch<any>('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Questions
  getQuestions: (params: Record<string, string | number | boolean> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`/questions?${query}`);
  },
  getQuestionStats: () => apiFetch<any>('/questions/stats'),

  // Study Plan
  getStudyPlan: () => apiFetch<any>('/study-plan'),
  updateTask: (taskId: string, data: any) =>
    apiFetch<any>(`/study-plan/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Focus Timer Sessions
  saveStudySession: (data: any) =>
    apiFetch<any>('/study-sessions', { method: 'POST', body: JSON.stringify(data) }),

  // Test Runs
  submitTestRun: (data: any) =>
    apiFetch<any>('/test-runs', { method: 'POST', body: JSON.stringify(data) }),
  getTestRuns: () => apiFetch<any[]>('/test-runs'),
  getTestRun: (id: string) => apiFetch<any>(`/test-runs/${id}`),

  // Mistake Notebook
  getMistakes: () => apiFetch<any[]>('/mistakes'),
  updateMistake: (id: string, data: any) =>
    apiFetch<any>(`/mistakes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resolveMistake: (questionId: string, date?: string) =>
    apiFetch<any>('/mistakes/resolve', { method: 'POST', body: JSON.stringify({ question_id: questionId, date }) }),

  // XP & Streaks
  getXpStreak: () => apiFetch<any>('/xp-streak'),
  getAchievements: () => apiFetch<any[]>('/achievements'),

  // Reports
  getDailyReport: (date: string) => apiFetch<any>(`/reports/daily?date=${date}`),
  getCumulativeReport: (date: string) => apiFetch<any>(`/reports/cumulative?date=${date}`),

  // Analytics
  getAnalytics: () => apiFetch<any>('/analytics'),

  // Sources & Links
  getSources: () => apiFetch<any>('/sources'),
  checkLinks: (urls: string[]) =>
    apiFetch<any>('/sources/check-links', { method: 'POST', body: JSON.stringify({ urls }) }),

  // QA Validator
  validateBank: () => apiFetch<any>('/qa/validate-bank'),

  // AI Question Lab
  getAiStatus: () => apiFetch<any>('/ai/status'),
  generateAiQuestions: (data: any) =>
    apiFetch<any>('/ai/generate', { method: 'POST', body: JSON.stringify(data) }),
  approveAiQuestion: (id: string) =>
    apiFetch<any>(`/ai/approve/${id}`, { method: 'POST' }),
  rejectAiQuestion: (id: string) =>
    apiFetch<any>(`/ai/reject/${id}`, { method: 'POST' }),

  // Companies (JobPrep Multi-Company Architecture)
  getCompanies: () => apiFetch<any[]>('/companies'),
  getCompany: (id: string) => apiFetch<any>(`/companies/${id}`),
  createCompany: (data: any) =>
    apiFetch<any>('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id: string, data: any) =>
    apiFetch<any>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCompanyStage: (id: string, stage_status: string, note?: string) =>
    apiFetch<any>(`/companies/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage_status, note }) }),
  deleteCompany: (id: string) =>
    apiFetch<any>(`/companies/${id}`, { method: 'DELETE' }),
  exportCompanies: () => window.open(`${API_BASE}/companies-export`, '_blank'),
  importCompanies: (companies: any[]) =>
    apiFetch<any>('/companies-import', { method: 'POST', body: JSON.stringify({ companies }) }),

  // Universal Practice
  getPracticeCategories: () => apiFetch<any[]>('/practice/categories'),

  // Reschedule Plan
  rescheduleStudyPlan: (targetDate?: string) =>
    apiFetch<any>('/study-plan/reschedule', { method: 'POST', body: JSON.stringify({ targetDate }) }),

  // Export / Import / Resets
  exportData: () => window.open(`${API_BASE}/export`, '_blank'),
  importData: (payload: any) =>
    apiFetch<any>('/import', { method: 'POST', body: JSON.stringify(payload) }),
  resetProgress: () => apiFetch<any>('/reset-progress', { method: 'POST' }),
  resetBank: () => apiFetch<any>('/reset-bank', { method: 'POST' }),
};
