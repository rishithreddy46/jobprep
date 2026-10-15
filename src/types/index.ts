export interface LearnerProfile {
  id: number;
  name: string;
  branch: string;
  target_date: string;
  daily_goal_mins: number;
  daily_goal_questions: number;
  passcode_hash: string | null;
  sound_effects: number;
  reduced_motion: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  track: 'cognitive' | 'instrumentation';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: QuestionOption[];
  correct_option_id: 'A' | 'B' | 'C' | 'D';
  correct_answer: string;
  explanation: string;
  recommended_time_seconds: number;
  provenance?: {
    kind?: string;
    source_refs?: string[];
    notes?: string;
  };
}

export interface StudyTask {
  id: string;
  date: string;
  task_index: number;
  block_time: string;
  task_text: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  actual_minutes: number;
  notes: string;
  score_verified: number;
  completed_at: string | null;
}

export interface StudyDay {
  date: string;
  label: string;
  focus: string;
  blocks: { time: string; task: string }[];
  targets: string[];
  tasks: StudyTask[];
}

export interface StudyPlanData {
  start: string;
  end: string;
  timezone: string;
  special_note: string;
  days: StudyDay[];
}

export interface TestResponse {
  chosen_option_id?: 'A' | 'B' | 'C' | 'D' | null;
  time_spent: number;
  flagged?: boolean;
}

export interface TestRun {
  id: string;
  title: string;
  test_type: 'practice' | 'cognitive_sectional' | 'instrumentation_sectional' | 'mixed_mock' | 'boss_battle' | 'mistake_retry';
  date: string;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  time_taken_seconds: number;
  score: number;
  config?: any;
  questions?: Question[];
  responses?: Record<string, TestResponse>;
  created_at?: string;
}

export interface MistakeItem {
  question_id: string;
  first_failed_at: string;
  last_failed_at: string;
  retry_count: number;
  consecutive_correct: number;
  is_resolved: number;
  error_category: 'concept' | 'calculation' | 'misread' | 'time_pressure';
  personal_notes: string;
  last_tested_date?: string;
  track: 'cognitive' | 'instrumentation';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: QuestionOption[];
  correct_option_id: 'A' | 'B' | 'C' | 'D';
  correct_answer: string;
  explanation: string;
}

export interface XpStreakData {
  totalXP: number;
  level: number;
  title: string;
  threshold: number;
  nextThreshold: number;
  progressPct: number;
  currentStreak: number;
  longestStreak: number;
  activityCalendar: {
    date: string;
    qualified_streak: number;
    total_active_seconds: number;
    questions_attempted: number;
  }[];
  recentEvents: {
    id: string;
    date: string;
    action_type: string;
    xp_awarded: number;
    created_at: string;
  }[];
}

export interface UserAchievement {
  badge_id: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface DailyReportData {
  date: string;
  tasksPlanned: number;
  tasksCompleted: number;
  tasksRemaining: number;
  planAdherencePct: number;
  tasksList: StudyTask[];
  measuredStudyMins: number;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  avgTimePerQuestion: number;
  cognitive: { attempted: number; correct: number; accuracy: number };
  instrumentation: { attempted: number; correct: number; accuracy: number };
  topicBreakdown: { topic: string; track: string; attempted: number; correct: number; accuracy: number; isPreliminary: boolean }[];
  mocks: any[];
  dailyXP: number;
  qualifiedStreak: boolean;
  recommendations: string[];
}

export interface CumulativeReportData {
  upToDate: string;
  totalDaysRecorded: number;
  totalPlannedTasks: number;
  totalCompletedTasks: number;
  planAdherencePct: number;
  totalStudyMins: number;
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
  cumulativeAccuracy: number;
  avgTimePerQuestion: number;
  cognitive: { attempted: number; correct: number; accuracy: number };
  instrumentation: { attempted: number; correct: number; accuracy: number };
  topicBreakdown: { topic: string; track: string; attempted: number; correct: number; accuracy: number; isPreliminary: boolean }[];
  cumulativeXP: number;
  strongestTopics: any[];
  weakestTopics: any[];
}
