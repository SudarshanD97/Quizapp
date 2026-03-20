export type Difficulty = 'easy' | 'medium' | 'hard';
export type Category =
  | 'Technology'
  | 'Science'
  | 'History'
  | 'Geography'
  | 'Mathematics'
  | 'Literature'
  | 'Sports'
  | 'Entertainment'
  | 'General Knowledge'
  | 'Custom';

export type TimeLimit = 'none' | 15 | 30 | 45 | 60;

export interface QuizSettings {
  topic: string;
  category: Category;
  difficulty: Difficulty;
  questionCount: number;
  timeLimit: TimeLimit;
  apiKey: string;
  collabCode?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  hint: string;
  subtopic: string;
}

export interface QuizAnswer {
  questionId: number;
  selectedOption: number | null;
  isCorrect: boolean;
  timeTaken: number;
  usedHint: boolean;
  usedFiftyFifty: boolean;
}

export interface QuizResult {
  settings: QuizSettings;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  totalScore: number;
  totalTime: number;
  completedAt: Date;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  score: number;
  totalQuestions: number;
  category: string;
  difficulty: string;
  topic: string;
  completedAt: string;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastQuizDate: string;
  totalQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
}

export interface WeaknessReport {
  subtopic: string;
  correct: number;
  total: number;
  percent: number;
}

export interface GoogleUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export interface CollabRoom {
  code: string;
  host: string;
  participants: { uid: string; name: string; photo: string; score: number; done: boolean }[];
  settings: Omit<QuizSettings, 'apiKey'>;
  questions: QuizQuestion[];
  started: boolean;
  createdAt: number;
}

export type AppScreen =
  | 'landing'
  | 'settings'
  | 'apikey'
  | 'loading'
  | 'quiz'
  | 'results'
  | 'leaderboard'
  | 'collab';
