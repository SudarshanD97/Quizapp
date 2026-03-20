import type { UserStreak, LeaderboardEntry, QuizResult, WeaknessReport } from '../types/quiz';

const STREAK_KEY = 'quizai_streak';
const LEADERBOARD_KEY = 'quizai_leaderboard';
const WEAKNESS_KEY = 'quizai_weakness';

// ─── Streak Management ──────────────────────────────────────────────────────

export function getStreak(): UserStreak {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastQuizDate: '',
    totalQuizzes: 0,
    totalCorrect: 0,
    totalQuestions: 0,
  };
}

export function updateStreak(correct: number, total: number): UserStreak {
  const streak = getStreak();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (streak.lastQuizDate === today) {
    // Already played today - just update totals
    streak.totalQuizzes += 1;
    streak.totalCorrect += correct;
    streak.totalQuestions += total;
  } else if (streak.lastQuizDate === yesterday) {
    // Played yesterday - extend streak
    streak.currentStreak += 1;
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.lastQuizDate = today;
    streak.totalQuizzes += 1;
    streak.totalCorrect += correct;
    streak.totalQuestions += total;
  } else if (streak.lastQuizDate === '') {
    // First time
    streak.currentStreak = 1;
    streak.longestStreak = 1;
    streak.lastQuizDate = today;
    streak.totalQuizzes = 1;
    streak.totalCorrect = correct;
    streak.totalQuestions = total;
  } else {
    // Streak broken
    streak.currentStreak = 1;
    streak.lastQuizDate = today;
    streak.totalQuizzes += 1;
    streak.totalCorrect += correct;
    streak.totalQuestions += total;
  }

  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch { /* ignore */ }
  return streak;
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(entry: LeaderboardEntry): void {
  const board = getLeaderboard();
  // Remove old entry for same user + category
  const filtered = board.filter(
    (e) => !(e.uid === entry.uid && e.category === entry.category && e.difficulty === entry.difficulty)
  );
  filtered.push(entry);
  // Sort by score desc, then time asc
  filtered.sort((a, b) => b.score - a.score);
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(filtered.slice(0, 100)));
  } catch { /* ignore */ }
}

// ─── Weakness Tracking ──────────────────────────────────────────────────────

interface WeaknessData {
  [category: string]: {
    [subtopic: string]: { correct: number; total: number };
  };
}

export function getWeaknessData(): WeaknessData {
  try {
    const raw = localStorage.getItem(WEAKNESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function updateWeaknessData(result: QuizResult): WeaknessReport[] {
  const data = getWeaknessData();
  const category = result.settings.category;

  if (!data[category]) data[category] = {};

  result.questions.forEach((q, i) => {
    const subtopic = q.subtopic || category;
    if (!data[category][subtopic]) {
      data[category][subtopic] = { correct: 0, total: 0 };
    }
    data[category][subtopic].total += 1;
    if (result.answers[i]?.isCorrect) {
      data[category][subtopic].correct += 1;
    }
  });

  try {
    localStorage.setItem(WEAKNESS_KEY, JSON.stringify(data));
  } catch { /* ignore */ }

  // Return weakness report for current category
  return Object.entries(data[category] || {})
    .map(([subtopic, { correct, total }]) => ({
      subtopic,
      correct,
      total,
      percent: Math.round((correct / total) * 100),
    }))
    .sort((a, b) => a.percent - b.percent);
}

export function getWeaknessReport(category: string): WeaknessReport[] {
  const data = getWeaknessData();
  return Object.entries(data[category] || {})
    .map(([subtopic, { correct, total }]) => ({
      subtopic,
      correct,
      total,
      percent: Math.round((correct / total) * 100),
    }))
    .sort((a, b) => a.percent - b.percent);
}
