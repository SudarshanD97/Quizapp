import { useState, useEffect } from 'react';
import type { GoogleUser, QuizSettings } from '../types/quiz';

interface CollabScreenProps {
  user: GoogleUser | null;
  onJoinAsHost: (code: string, settings: Omit<QuizSettings, 'apiKey'>) => void;
  onJoinAsGuest: (code: string) => void;
  onBack: () => void;
}

const categories = [
  'Technology', 'Science', 'History', 'Geography',
  'Mathematics', 'Literature', 'Sports', 'Entertainment', 'General Knowledge',
];

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function CollabScreen({ user, onJoinAsHost, onJoinAsGuest, onBack }: CollabScreenProps) {
  const [mode, setMode] = useState<'choose' | 'host' | 'join'>('choose');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [hostSettings, setHostSettings] = useState({
    category: 'Technology' as any,
    difficulty: 'medium' as any,
    questionCount: 5,
    topic: '',
    timeLimit: 30 as any,
  });
  const [participants, setParticipants] = useState<{ name: string; avatar: string; ready: boolean }[]>([]);
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (mode === 'host') {
      const code = generateCode();
      setRoomCode(code);
      // Simulate other participants joining
      const timer = setTimeout(() => {
        setParticipants([
          { name: user?.displayName || 'You (Host)', avatar: user?.photoURL || '', ready: true },
        ]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mode, user]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartQuiz = () => {
    onJoinAsHost(roomCode, hostSettings);
  };

  const handleJoin = () => {
    if (joinCode.trim().length < 4) {
      setJoinError('Please enter a valid room code');
      return;
    }
    onJoinAsGuest(joinCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen w-full" style={{ background: '#f5f5f7' }}>
      {/* Header */}
      <div className="w-full glass sticky top-0 z-40 border-b" style={{ borderColor: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-4">
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
          <span className="text-xl font-black" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>
            Collab Quiz 👥
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {mode === 'choose' && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="text-6xl mb-4">🤝</div>
              <h1 className="text-4xl font-black mb-3" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>
                Play with Friends
              </h1>
              <p className="text-lg" style={{ color: '#6e6e73' }}>
                Host a room or join an existing one with a code
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Host */}
              <button
                onClick={() => setMode('host')}
                className="group p-8 rounded-3xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                style={{ background: '#1d1d1f', color: 'white' }}
              >
                <div className="text-4xl mb-4">🏆</div>
                <h2 className="text-2xl font-black mb-2">Host a Room</h2>
                <p className="text-base opacity-70">
                  Create a room, pick your settings, and share the code with friends
                </p>
                <div className="mt-6 flex items-center gap-2 font-semibold opacity-70 group-hover:opacity-100 transition-opacity">
                  Get started →
                </div>
              </button>

              {/* Join */}
              <button
                onClick={() => setMode('join')}
                className="group p-8 rounded-3xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                style={{ background: 'white', color: '#1d1d1f', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}
              >
                <div className="text-4xl mb-4">🎯</div>
                <h2 className="text-2xl font-black mb-2">Join a Room</h2>
                <p className="text-base" style={{ color: '#6e6e73' }}>
                  Enter the room code shared by your host and jump in
                </p>
                <div className="mt-6 flex items-center gap-2 font-semibold group-hover:opacity-70 transition-opacity">
                  Join now →
                </div>
              </button>
            </div>

            {/* Info */}
            <div className="mt-8 p-6 rounded-3xl" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: '#1d1d1f' }}>How it works</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: '1️⃣', title: 'Create Room', desc: 'Host creates a room and shares the 6-digit code' },
                  { icon: '2️⃣', title: 'Friends Join', desc: 'Up to 10 friends join using the room code' },
                  { icon: '3️⃣', title: 'Compete!', desc: 'Everyone gets the same questions — may the best brain win!' },
                ].map((item) => (
                  <div key={item.title} className="text-center">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="font-bold text-base mb-1" style={{ color: '#1d1d1f' }}>{item.title}</div>
                    <div className="text-sm" style={{ color: '#6e6e73' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'host' && (
          <div className="animate-fade-in-up">
            <div className="mb-8 flex items-center gap-3">
              <button onClick={() => setMode('choose')} className="font-semibold hover:opacity-60 transition-opacity" style={{ color: '#6e6e73' }}>← Back</button>
              <h2 className="text-2xl font-black" style={{ color: '#1d1d1f' }}>Host a Room</h2>
            </div>

            {/* Room code display */}
            <div
              className="w-full p-8 rounded-3xl mb-6 text-center"
              style={{ background: '#1d1d1f', color: 'white' }}
            >
              <p className="text-sm font-bold opacity-60 mb-3 tracking-widest">YOUR ROOM CODE</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-6xl font-black tracking-[0.15em]" style={{ letterSpacing: '0.15em' }}>
                  {roomCode}
                </span>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
                style={{ background: copied ? '#34c759' : 'rgba(255,255,255,0.15)', color: 'white' }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Code'}
              </button>
              <p className="text-xs opacity-50 mt-3">Share this code with your friends</p>
            </div>

            {/* Settings */}
            <div className="p-6 rounded-3xl mb-6" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
              <h3 className="font-black text-xl mb-5" style={{ color: '#1d1d1f' }}>Quiz Settings</h3>

              {/* Topic */}
              <div className="mb-5">
                <label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: '#6e6e73' }}>TOPIC (optional)</label>
                <input
                  value={hostSettings.topic}
                  onChange={(e) => setHostSettings({ ...hostSettings, topic: e.target.value })}
                  placeholder="e.g. World War II, Machine Learning..."
                  className="w-full px-4 py-3 rounded-2xl text-base outline-none"
                  style={{ background: '#f5f5f7', color: '#1d1d1f', border: '2px solid transparent' }}
                />
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: '#6e6e73' }}>CATEGORY</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setHostSettings({ ...hostSettings, category: cat as any })}
                      className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{
                        background: hostSettings.category === cat ? '#1d1d1f' : '#f5f5f7',
                        color: hostSettings.category === cat ? 'white' : '#1d1d1f',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-5">
                <label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: '#6e6e73' }}>DIFFICULTY</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setHostSettings({ ...hostSettings, difficulty: d })}
                      className="py-3 rounded-xl font-bold text-base transition-all duration-200"
                      style={{
                        background: hostSettings.difficulty === d ? '#1d1d1f' : '#f5f5f7',
                        color: hostSettings.difficulty === d ? 'white' : '#1d1d1f',
                      }}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions count */}
              <div>
                <label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: '#6e6e73' }}>
                  QUESTIONS: {hostSettings.questionCount}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setHostSettings(s => ({ ...s, questionCount: Math.max(3, s.questionCount - 1) }))}
                    className="w-12 h-12 rounded-2xl text-2xl font-bold flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{ background: '#f5f5f7' }}
                  >-</button>
                  <span className="flex-1 text-center text-3xl font-black" style={{ color: '#1d1d1f' }}>
                    {hostSettings.questionCount}
                  </span>
                  <button
                    onClick={() => setHostSettings(s => ({ ...s, questionCount: Math.min(20, s.questionCount + 1) }))}
                    className="w-12 h-12 rounded-2xl text-2xl font-bold flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{ background: '#f5f5f7' }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="p-6 rounded-3xl mb-6" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg" style={{ color: '#1d1d1f' }}>Participants</h3>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: '#f5f5f7', color: '#6e6e73' }}>
                  {participants.length} / 10
                </span>
              </div>
              {participants.length === 0 ? (
                <div className="text-center py-6" style={{ color: '#aeaeb2' }}>
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="text-sm">Waiting for friends to join...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#f5f5f7' }}>
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black" style={{ background: '#1d1d1f', color: 'white' }}>
                          {p.name[0]}
                        </div>
                      )}
                      <span className="font-semibold flex-1" style={{ color: '#1d1d1f' }}>{p.name}</span>
                      {i === 0 && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#1d1d1f', color: 'white' }}>HOST</span>
                      )}
                      <span className="text-lg">{p.ready ? '✅' : '⏳'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full py-5 rounded-2xl font-black text-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#1d1d1f', color: 'white' }}
            >
              Start Quiz for Everyone 🚀
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="animate-fade-in-up">
            <div className="mb-8 flex items-center gap-3">
              <button onClick={() => setMode('choose')} className="font-semibold hover:opacity-60 transition-opacity" style={{ color: '#6e6e73' }}>← Back</button>
              <h2 className="text-2xl font-black" style={{ color: '#1d1d1f' }}>Join a Room</h2>
            </div>

            <div className="p-8 rounded-3xl text-center" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-black mb-2" style={{ color: '#1d1d1f' }}>Enter Room Code</h3>
              <p className="text-base mb-8" style={{ color: '#6e6e73' }}>
                Ask your host for the 6-character room code
              </p>

              <input
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. ABC123"
                maxLength={8}
                className="w-full text-center px-4 py-5 rounded-2xl text-3xl font-black tracking-[0.2em] outline-none mb-4"
                style={{
                  background: '#f5f5f7',
                  color: '#1d1d1f',
                  letterSpacing: '0.2em',
                  border: joinError ? '2px solid #ff3b30' : '2px solid transparent',
                }}
                autoFocus
              />
              {joinError && <p className="text-sm font-medium mb-4" style={{ color: '#ff3b30' }}>{joinError}</p>}

              <div className="p-4 rounded-2xl mb-6 text-sm" style={{ background: '#fff8f0', border: '1px solid #ff9f0a30' }}>
                <p style={{ color: '#b45309' }}>
                  💡 Note: In this demo, joining a room will create a new quiz with the host's settings. In a production app with a backend, you'd sync in real-time.
                </p>
              </div>

              <button
                onClick={handleJoin}
                className="w-full py-4 rounded-2xl font-black text-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: '#1d1d1f', color: 'white' }}
              >
                Join Room →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
