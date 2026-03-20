import type { GoogleUser } from '../types/quiz';

export function signOut(): void {
  localStorage.removeItem('quizai_user');
}

export function getSavedUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem('quizai_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: GoogleUser): void {
  try {
    localStorage.setItem('quizai_user', JSON.stringify(user));
  } catch { /* ignore */ }
}
