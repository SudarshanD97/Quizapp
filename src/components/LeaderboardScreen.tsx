import { useState, useEffect } from 'react';
import type { LeaderboardEntry, GoogleUser, UserStreak } from '../types/quiz';
import { getLeaderboard } from '../utils/storage';

interface LeaderboardScreenProps {
  user: GoogleUser | null;
  streak: UserStreak;
  onBack: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const DIFF_COLORS: Record<string, string> = {
  easy: '#34c759',
  medium: '#ff9f0a',
  hard: '#ff3b30',
};

export default function LeaderboardScreen({ user, streak, onBack }: LeaderboardScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [visible, setVisible] = useState(false);

  const categories = ['all', 'Technology', 'Science', 'History', 'Geography', 'Mathematics', 'Literature', 'Sports', 'Entertainment', 'General Knowledge'];

  useEffect(() => {
    const raw = getLeaderboard();

    // Add some demo entries if leaderboard is empty
    if (raw.length === 0) {
      const demo: LeaderboardEntry[] = [
        { uid: 'demo1', displayName: 'Arjun Sharma', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', score: 9, totalQuestions: 10, category: 'Technology', difficulty: 'hard', topic: 'Machine Learning', completedAt: new Date(Date.now() - 3600000).toISOString() },
        { uid: 'demo2', displayName: 'Priya Patel', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily', score: 8, totalQuestions: 10, category: 'Science', difficulty: 'medium', topic: 'Physics', completedAt: new Date(Date.now() - 7200000).toISOString() },
        { uid: 'demo3', displayName: 'Rahul Kumar', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max', score: 7, totalQuestions: 10, category: 'History', difficulty: 'hard', topic: 'World Wars', completedAt: new Date(Date.now() - 86400000).toISOString() },
        { uid: 'demo4', displayName: 'Sneha Gupta', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe', score: 6, totalQuestions: 10, category: 'Technology', difficulty: 'medium', topic: 'JavaScript', completedAt: new Date(Date.now() - 172800000).toISOString() },
        { uid: 'demo5', displayName: 'Vikram Singh', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam', score: 5, totalQuestions: 10, category: 'Mathematics', difficulty: 'easy', topic: 'Algebra', completedAt: new Date(Date.now() - 259200000).toISOString() },
      ];
      setEntries(demo);
    } else {
      setEntries(raw);
    }
    setTimeout(() => setVisible(true), 100);
  }, []);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.category === filter);
  const sorted = [...filtered].sort((a, b) => {
    const aP = (a.score / a.totalQuestions) * 100;
    const bP = (b.score / b.totalQuestions) * 100;
    return bP - aP;
  });

  const userRank = user
    ? sorted.findIndex((e) => e.uid === user.uid) + 1
    : -1;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
    return `${Math.round(diff / 86400000)}d ago`;
  };

  return (
    <div className="min-h-screen w-full" style={{ background: '#f5f5f7' }}>
      {/* Header */}
      <div className="w-full glass sticky top-0 z-40 border-b" style={{ borderColor: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-semibold text-base transition-opacity hover:opacity-60"
            style={{ color: '#6e6e73' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div className="flex-1" />
          <h1 className="text-xl font-black" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>
            🏆 Leaderboard
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* User Stats & Streak Banner */}
        {user && (
          <div
            className="w-full rounded-3xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center gap-6"
            style={{
              background: '#1d1d1f',
              color: 'white',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease',
            }}
          >
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-20 h-20 rounded-2xl border-2 border-white/20"
            />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm opacity-60 mb-1 font-semibold tracking-wider">YOUR PROFILE</p>
              <h2 className="text-2xl font-black mb-1">{user.displayName}</h2>
              {userRank > 0 && (
                <p className="text-base opacity-70">Ranked #{userRank} in {filter === 'all' ? 'Overall' : filter}</p>
              )}
            </div>
            <div className="flex gap-6 sm:gap-8">
              {[
                { label: 'Streak', value: `${streak.currentStreak}🔥`, sub: 'days' },
                { label: 'Quizzes', value: streak.totalQuizzes.toString(), sub: 'played' },
                { label: 'Accuracy', value: streak.totalQuestions > 0 ? `${Math.round((streak.totalCorrect / streak.totalQuestions) * 100)}%` : '—', sub: 'overall' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-black">{s.value}</div>
                  <div className="text-xs opacity-60 font-semibold tracking-wider">{s.sub.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streak Info (no user) */}
        {!user && streak.currentStreak > 0 && (
          <div
            className="w-full rounded-3xl p-5 mb-6 flex items-center gap-4"
            style={{ background: '#fff8f0', border: '2px solid #ff9f0a30' }}
          >
            <span className="text-4xl">🔥</span>
            <div>
              <p className="font-black text-lg" style={{ color: '#1d1d1f' }}>{streak.currentStreak} Day Streak!</p>
              <p className="text-sm" style={{ color: '#6e6e73' }}>Sign in to save your streak and appear on the leaderboard</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div
          className="mb-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.1s',
          }}
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{
                  background: filter === cat ? '#1d1d1f' : 'white',
                  color: filter === cat ? 'white' : '#6e6e73',
                  boxShadow: filter === cat ? 'none' : '0 1px 8px rgba(0,0,0,0.06)',
                }}
              >
                {cat === 'all' ? '🌍 All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard list */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'white',
            boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.2s',
          }}
        >
          {sorted.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-5xl mb-4">🏜️</div>
              <h3 className="text-xl font-black mb-2" style={{ color: '#1d1d1f' }}>No entries yet</h3>
              <p style={{ color: '#6e6e73' }}>Complete a quiz to appear on the leaderboard!</p>
            </div>
          ) : (
            <div>
              {/* Header row */}
              <div
                className="grid px-6 py-4 text-xs font-bold tracking-widest border-b"
                style={{ gridTemplateColumns: '60px 1fr 100px 100px 80px 70px', color: '#aeaeb2', borderColor: '#f5f5f7' }}
              >
                <span>RANK</span>
                <span>PLAYER</span>
                <span>CATEGORY</span>
                <span>DIFFICULTY</span>
                <span className="text-right">SCORE</span>
                <span className="text-right">TIME</span>
              </div>

              {sorted.map((entry, rank) => {
                const isCurrentUser = user?.uid === entry.uid;
                const pct = Math.round((entry.score / entry.totalQuestions) * 100);
                return (
                  <div
                    key={`${entry.uid}-${rank}`}
                    className="grid px-6 py-4 border-b items-center transition-colors duration-200 hover:bg-gray-50"
                    style={{
                      gridTemplateColumns: '60px 1fr 100px 100px 80px 70px',
                      borderColor: '#f5f5f7',
                      background: isCurrentUser ? '#f0f8ff' : undefined,
                      animationDelay: `${rank * 0.05}s`,
                    }}
                  >
                    {/* Rank */}
                    <div className="flex items-center">
                      {rank < 3 ? (
                        <span className="text-2xl">{MEDALS[rank]}</span>
                      ) : (
                        <span className="text-lg font-black" style={{ color: '#6e6e73' }}>#{rank + 1}</span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={entry.photoURL} alt={entry.displayName} className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-base truncate" style={{ color: '#1d1d1f' }}>
                          {entry.displayName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#0071e3', color: 'white' }}>YOU</span>
                          )}
                        </div>
                        <div className="text-xs truncate" style={{ color: '#aeaeb2' }}>{entry.topic || 'General'} • {formatDate(entry.completedAt)}</div>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="text-sm font-semibold truncate" style={{ color: '#6e6e73' }}>{entry.category}</div>

                    {/* Difficulty */}
                    <div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{
                          background: `${DIFF_COLORS[entry.difficulty]}20`,
                          color: DIFF_COLORS[entry.difficulty],
                        }}
                      >
                        {entry.difficulty.toUpperCase()}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="font-black text-base" style={{ color: '#1d1d1f' }}>{pct}%</div>
                      <div className="text-xs" style={{ color: '#aeaeb2' }}>{entry.score}/{entry.totalQuestions}</div>
                    </div>

                    {/* Time */}
                    <div className="text-right text-sm font-semibold" style={{ color: '#6e6e73' }}>
                      {formatDate(entry.completedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
