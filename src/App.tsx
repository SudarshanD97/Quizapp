import { useState, useCallback, useEffect } from 'react';
import type { AppScreen, QuizSettings, QuizQuestion, QuizAnswer, QuizResult, GoogleUser, UserStreak } from './types/quiz';
import LandingScreen from './components/LandingScreen';
import SettingsScreen from './components/SettingsScreen';
import ApiKeyScreen from './components/ApiKeyScreen';
import LoadingScreen from './components/LoadingScreen';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import CollabScreen from './components/CollabScreen';
import AuthModal from './components/AuthModal';
import { generateQuizQuestions } from './utils/groq';
import { getSavedUser, saveUser } from './utils/auth';
import { getStreak, updateStreak, addLeaderboardEntry } from './utils/storage';

const STORAGE_KEY = 'quizai_api_key';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [settings, setSettings] = useState<Omit<QuizSettings, 'apiKey'>>({
    topic: '',
    category: 'Technology',
    difficulty: 'medium',
    questionCount: 5,
    timeLimit: 30,
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<GoogleUser | null>(() => getSavedUser());
  const [streak, setStreak] = useState<UserStreak>(() => getStreak());
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Refresh streak on mount
  useEffect(() => {
    setStreak(getStreak());
  }, []);

  const handleAuth = useCallback((newUser: GoogleUser) => {
    setUser(newUser);
    saveUser(newUser);
    setShowAuthModal(false);
  }, []);



  const handleSettingsDone = useCallback((s: Omit<QuizSettings, 'apiKey'>) => {
    setSettings(s);
    setScreen('apikey');
  }, []);

  const startQuiz = useCallback(async (key: string, quizSettings: Omit<QuizSettings, 'apiKey'>) => {
    const fullSettings: QuizSettings = { ...quizSettings, apiKey: key };
    setScreen('loading');
    setError('');
    try {
      const qs = await generateQuizQuestions(fullSettings);
      setQuestions(qs);
      setScreen('quiz');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate questions. Please try again.';
      setError(msg);
      setScreen('apikey');
    }
  }, []);

  const handleApiKeyDone = useCallback(async (key: string) => {
    setApiKey(key);
    try { localStorage.setItem(STORAGE_KEY, key); } catch { /* ignore */ }
    await startQuiz(key, settings);
  }, [settings, startQuiz]);

  const handleQuizComplete = useCallback((answers: QuizAnswer[]) => {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const result: QuizResult = {
      settings: { ...settings, apiKey },
      questions,
      answers,
      totalScore: correctCount,
      totalTime: answers.reduce((s, a) => s + a.timeTaken, 0),
      completedAt: new Date(),
    };
    setQuizResult(result);

    // Update streak
    const newStreak = updateStreak(correctCount, questions.length);
    setStreak(newStreak);

    // Add to leaderboard if user is signed in
    if (user) {
      addLeaderboardEntry({
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        score: correctCount,
        totalQuestions: questions.length,
        category: settings.category,
        difficulty: settings.difficulty,
        topic: settings.topic || 'General',
        completedAt: new Date().toISOString(),
      });
    }

    setScreen('results');
  }, [settings, apiKey, questions, user]);

  const handleRetry = useCallback(async () => {
    await startQuiz(apiKey, settings);
  }, [apiKey, settings, startQuiz]);

  const handleNewQuiz = useCallback(() => {
    setQuestions([]);
    setQuizResult(null);
    setScreen('settings');
  }, []);

  const handleCollabHost = useCallback(async (code: string, collabSettings: Omit<QuizSettings, 'apiKey'>) => {
    setSettings({ ...collabSettings, collabCode: code } as any);
    if (!apiKey) {
      setScreen('apikey');
      return;
    }
    await startQuiz(apiKey, { ...collabSettings, collabCode: code } as any);
  }, [apiKey, startQuiz]);

  const handleCollabJoin = useCallback((_code: string) => {
    // In a real app with backend, we'd sync via WebSockets
    // For demo: just go to settings then start
    setScreen('settings');
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <AuthModal
          onAuth={handleAuth}
          onSkip={() => setShowAuthModal(false)}
        />
      )}

      {screen === 'landing' && (
        <LandingScreen
          user={user}
          streak={streak}
          onStart={() => setScreen('settings')}
          onSignIn={() => setShowAuthModal(true)}
          onLeaderboard={() => setScreen('leaderboard')}
          onCollab={() => setScreen('collab')}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          onContinue={handleSettingsDone}
          initialSettings={settings}
          onBack={() => setScreen('landing')}
        />
      )}

      {screen === 'apikey' && (
        <ApiKeyScreen
          onBack={() => setScreen('settings')}
          onStart={handleApiKeyDone}
          savedKey={apiKey}
          error={error}
        />
      )}

      {screen === 'loading' && <LoadingScreen settings={settings as QuizSettings} />}

      {screen === 'quiz' && questions.length > 0 && (
        <QuizScreen
          questions={questions}
          settings={{ ...settings, apiKey }}
          onComplete={handleQuizComplete}
          userName={user?.displayName}
          userPhoto={user?.photoURL}
        />
      )}

      {screen === 'results' && quizResult && (
        <ResultsScreen
          result={quizResult}
          user={user}
          onRetry={handleRetry}
          onNewQuiz={handleNewQuiz}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'leaderboard' && (
        <LeaderboardScreen
          user={user}
          streak={streak}
          onBack={() => setScreen(quizResult ? 'results' : 'landing')}
        />
      )}

      {screen === 'collab' && (
        <CollabScreen
          user={user}
          onJoinAsHost={handleCollabHost}
          onJoinAsGuest={handleCollabJoin}
          onBack={() => setScreen('landing')}
        />
      )}
    </div>
  );
}
