/**
 * Progress tracking interfaces for PreparadorMMA tutoring platform
 * Integrates with existing Question and User models
 */

/**
 * Individual test session data
 */
export interface TestSession {
  id: string;
  userId: string;
  timestamp: number;
  mode: 'practice' | 'test';
  mainSection: string;
  subSection?: string;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  blankAnswers: number;
  timeSpent: number; // in seconds
  completed: boolean;
  score?: number; // percentage
  testScore?: number; // calculated using existing TestService logic
  sectionBreakdown?: SectionProgressData[]; // Section-by-section breakdown
}

/**
 * Progress tracking per section/subsection
 */
export interface SectionProgress {
  mainSection: string;
  subSection?: string;
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  blankAnswers: number;
  accuracyRate: number; // percentage
  lastUpdated: number;
  bestScore: number;
  attemptsCount: number;
  averageTimePerQuestion: number;
  improvementTrend: number; // positive for improvement, negative for decline
}

/**
 * User progress aggregated across all sessions
 */
export interface UserProgress {
  userId: string;
  overallStats: {
    totalSessions: number;
    totalQuestionsAnswered: number;
    totalCorrectAnswers: number;
    totalIncorrectAnswers: number;
    totalBlankAnswers: number;
    overallAccuracy: number;
    totalTimeSpent: number;
    averageSessionTime: number;
    lastActivityDate: number;
    firstActivityDate: number;
  };
  sectionProgress: SectionProgress[];
  recentSessions: TestSession[];
  achievements: Achievement[];
}

/**
 * Performance metrics for analytics
 */
export interface PerformanceMetrics {
  userId: string;
  period: 'week' | 'month' | 'year';
  startDate: number;
  endDate: number;
  totalSessions: number;
  averageAccuracy: number;
  improvementRate: number; // percentage change
  strongestSections: string[];
  weakestSections: string[];
  recommendedSections: string[];
  studyStreak: number; // consecutive days
  goalsAchieved: number;
  testPerformance: {
    averageTestScore: number;
    bestTestScore: number;
    testsTaken: number;
    passingTests: number;
  };
}

/**
 * Achievement system
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
  category: 'accuracy' | 'consistency' | 'improvement' | 'completion' | 'testing';
  progress: number; // 0-100
  target: number;
  isUnlocked: boolean;
}

/**
 * Real-time progress tracking for current session
 */
/**
 * Section-specific progress data for detailed breakdown
 */
export interface SectionProgressData {
  sectionName: string;
  subSection?: string;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  blankAnswers?: number; // For compatibility with test mode
  timeSpent: number; // in milliseconds
  firstQuestionTime?: number;
  lastQuestionTime?: number;
  accuracy?: number; // Calculated accuracy percentage
  avgTimePerQuestion?: number; // Calculated average time
}

export interface SectionProgressDataWithComparison extends SectionProgressData {
  // Comparison data (only present in compare mode)
  historical?: SectionProgressData | null;
  accuracyDiff?: number | null;
  timeDiff?: number | null;
  questionsDiff?: number | null;
  correctDiff?: number | null;
  incorrectDiff?: number | null;
}

export interface CurrentSessionProgress {
  sessionId: string;
  mainSection: string;
  subSection?: string;
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  currentStreak: number;
  longestStreak: number;
  timeElapsed: number;
  startTime: number;
  isActive: boolean;
  mode: 'practice' | 'test';
  currentQuestionIndex?: number;
  sectionBreakdown: SectionProgressData[];
  lastAnswerTimestamp?: number;
}

/**
 * Section completion summary
 */
export interface SectionSummary {
  mainSection: string;
  subSection?: string;
  currentSession: TestSession;
  previousBest?: TestSession;
  improvement: {
    accuracyChange: number;
    timeChange: number;
    scoreChange: number;
  };
  recommendations: string[];
  nextSuggestedSection?: string;
  newAchievements: Achievement[];
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  userId: string;
  totalProgress: number; // overall completion percentage
  recentActivity: TestSession[];
  sectionBreakdown: {
    administrativo: SectionProgress;
    'medio ambiente': SectionProgress;
    costas: SectionProgress;
    aguas: SectionProgress;
  };
  weeklyGoal: {
    target: number;
    current: number;
    streak: number;
  };
  achievements: Achievement[];
  trends: {
    accuracyTrend: number[];
    timeTrend: number[];
    activityTrend: number[];
  };
  overallTestPerformance: {
    totalTests: number;
    averageScore: number;
    bestScore: number;
    improvement: number;
  };
}

/**
 * Question attempt tracking for detailed analytics
 */
export interface QuestionAttempt {
  questionId: string;
  sessionId: string;
  userId: string;
  timestamp: number;
  isCorrect: boolean;
  timeSpent: number;
  attempts: number; // how many times this question was attempted
  mainSection: string;
  subSection?: string;
}

/**
 * Study session goals and targets
 */
export interface StudyGoal {
  id: string;
  userId: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number; // number of questions or minutes
  unit: 'questions' | 'minutes' | 'accuracy';
  currentProgress: number;
  deadline: number; // timestamp
  isActive: boolean;
  achieved: boolean;
  createdAt: number;
}

/**
 * Notification for user engagement
 */
export interface UserNotification {
  id: string;
  userId: string;
  type: 'achievement' | 'goal' | 'reminder' | 'improvement';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Test service answer tracking structure
 */
export interface TestServiceAnswers {
  [key: string]: {
    blank: number;
    correct: number;
    incorrect: number;
  };
}