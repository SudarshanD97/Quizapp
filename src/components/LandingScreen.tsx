import { useState, useEffect } from 'react';
import type { GoogleUser, UserStreak } from '../types/quiz';

interface LandingScreenProps {
  user: GoogleUser | null;
  streak: UserStreak;
  onStart: () => void;
  onSignIn: () => void;
  onLeaderboard: () => void;
  onCollab: () => void;
}

const FEATURES = [
  { icon: '🤖', title: 'AI-Generated Questions', desc: 'Every quiz is unique, crafted by Groq LLaMA 3.3 in seconds' },
  { icon: '⚡', title: '50:50 & Hints', desc: 'Power-ups to help when you\'re stuck — use them wisely!' },
  { icon: '🎓', title: 'Smart Learning', desc: 'AI identifies your weak spots and suggests learning resources' },
  { icon: '🏆', title: 'Leaderboard', desc: 'Compete with friends and track your global ranking' },
  { icon: '👥', title: 'Collab Mode', desc: 'Host multiplayer quiz rooms and challenge friends live' },
  { icon: '📥', title: 'PDF Export', desc: 'Download your results as a study guide for later review' },
  { icon: '🔥', title: 'Daily Streaks', desc: 'Build habits by playing every day and watching your streak grow' },
  { icon: '📊', title: 'Detailed Analytics', desc: 'Track performance across topics and see your improvement over time' },
];

const CATEGORIES = [
  { name: 'Technology', emoji: '💻' },
  { name: 'Science', emoji: '🔬' },
  { name: 'History', emoji: '🏛️' },
  { name: 'Geography', emoji: '🌍' },
  { name: 'Mathematics', emoji: '📐' },
  { name: 'Literature', emoji: '📖' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Entertainment', emoji: '🎬' },
];

export default function LandingScreen({ user, streak, onStart, onSignIn, onLeaderboard, onCollab }: LandingScreenProps) {
  const [visible, setVisible] = useState(false);
  const [heroWord, setHeroWord] = useState(0);
  const HERO_WORDS = ['smarter.', 'faster.', 'together.', 'every day.'];

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const interval = setInterval(() => {
      setHeroWord((w) => (w + 1) % HERO_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full" style={{ background: '#f5f5f7' }}>

      {/* Nav */}
      <nav className="w-full glass sticky top-0 z-50 border-b" style={{ borderColor: 'rgba(210,210,215,0.5)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
              style={{ background: '#1d1d1f', color: 'white' }}
            >
              Q
            </div>
            <span className="text-xl font-black" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>QuizAI</span>
          </div>

          <div className="flex items-center gap-3">
            {streak.currentStreak > 0 && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ background: '#fff8f0', border: '1.5px solid #ff9f0a30' }}
              >
                <span>🔥</span>
                <span className="font-black text-sm" style={{ color: '#ff9f0a' }}>{streak.currentStreak}</span>
              </div>
            )}

            <button
              onClick={onLeaderboard}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:bg-gray-200"
              style={{ color: '#1d1d1f' }}
            >
              🏆 Leaderboard
            </button>

            <button
              onClick={onCollab}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:bg-gray-200"
              style={{ color: '#1d1d1f' }}
            >
              👥 Collab
            </button>

            {user ? (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl" style={{ background: 'white', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
                <span className="text-sm font-semibold hidden sm:block" style={{ color: '#1d1d1f' }}>{user.displayName}</span>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                style={{ background: '#1d1d1f', color: 'white' }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        {/* Streak badge */}
        {streak.currentStreak > 0 && (
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-bold mb-8 animate-fade-in-up"
            style={{ background: '#fff8f0', border: '2px solid #ff9f0a30', color: '#ff9f0a' }}
          >
            🔥 {streak.currentStreak}-day streak — keep it up!
          </div>
        )}

        {!streak.currentStreak && (
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-bold mb-8 animate-fade-in-up"
            style={{ background: 'white', border: '2px solid #e8e8ed', color: '#6e6e73', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            ✨ Powered by Groq LLaMA 3.3
          </div>
        )}

        <h1
          className="font-black mb-4"
          style={{
            color: '#1d1d1f',
            fontSize: 'clamp(3rem, 8vw, 6.5rem)',
            letterSpacing: '-0.05em',
            lineHeight: 1.05,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)',
          }}
        >
          Learn{' '}
          <span
            style={{
              display: 'inline-block',
              color: '#1d1d1f',
              borderBottom: '5px solid #0071e3',
              transition: 'all 0.4s ease',
            }}
          >
            {HERO_WORDS[heroWord]}
          </span>
        </h1>

        <p
          className="max-w-2xl mx-auto mb-10"
          style={{
            color: '#6e6e73',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            lineHeight: 1.6,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.7s ease 0.2s',
          }}
        >
          AI-powered quizzes on any topic. Track your progress, challenge friends, identify weaknesses, and grow every single day.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease 0.35s',
          }}
        >
          <button
            onClick={onStart}
            className="px-10 py-5 rounded-2xl font-black text-xl transition-all duration-300 hover:scale-105 active:scale-[0.98] hover:shadow-2xl"
            style={{ background: '#1d1d1f', color: 'white', minWidth: '200px' }}
          >
            Start Quiz →
          </button>
          <button
            onClick={onCollab}
            className="px-10 py-5 rounded-2xl font-black text-xl transition-all duration-300 hover:scale-105 active:scale-[0.98]"
            style={{ background: 'white', color: '#1d1d1f', boxShadow: '0 2px 24px rgba(0,0,0,0.10)', minWidth: '200px' }}
          >
            👥 Play with Friends
          </button>
        </div>

        {/* Stats */}
        {streak.totalQuizzes > 0 && (
          <div
            className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-10 border-t"
            style={{ borderColor: '#e8e8ed' }}
          >
            {[
              { value: streak.totalQuizzes.toString(), label: 'Quizzes Played' },
              { value: streak.totalQuestions > 0 ? `${Math.round((streak.totalCorrect / streak.totalQuestions) * 100)}%` : '—', label: 'Accuracy' },
              { value: `${streak.longestStreak}🔥`, label: 'Best Streak' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>{s.value}</div>
                <div className="text-sm font-semibold" style={{ color: '#aeaeb2' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-black text-center mb-8" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>
          Pick Any Topic
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={onStart}
              className="group p-5 rounded-3xl text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
              style={{
                background: 'white',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div className="text-4xl mb-2">{cat.emoji}</div>
              <div className="font-bold text-base" style={{ color: '#1d1d1f' }}>{cat.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-black text-center mb-3" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>
          Everything You Need
        </h2>
        <p className="text-center text-lg mb-10" style={{ color: '#6e6e73' }}>Built for learners who take their growth seriously</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="p-6 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              style={{
                background: i % 2 === 0 ? 'white' : '#f5f5f7',
                boxShadow: i % 2 === 0 ? '0 2px 16px rgba(0,0,0,0.07)' : 'none',
              }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-black text-base mb-1.5" style={{ color: '#1d1d1f' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6e6e73' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-20">
        <div
          className="w-full rounded-3xl p-10 sm:p-16 text-center"
          style={{ background: '#1d1d1f', color: 'white' }}
        >
          <div className="text-5xl mb-4">🧠</div>
          <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ letterSpacing: '-0.04em' }}>
            Ready to test your knowledge?
          </h2>
          <p className="text-xl mb-8 opacity-70">Generate a personalized quiz in under 10 seconds.</p>
          <button
            onClick={onStart}
            className="px-12 py-5 rounded-2xl font-black text-xl transition-all duration-300 hover:scale-105 active:scale-[0.98]"
            style={{ background: 'white', color: '#1d1d1f' }}
          >
            Start for Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t py-8 px-6 text-center" style={{ borderColor: '#e8e8ed' }}>
        <p className="text-sm" style={{ color: '#aeaeb2' }}>
          QuizAI — Built with Groq LLaMA 3.3 · React · Tailwind CSS
        </p>
      </footer>
    </div>
  );
}
