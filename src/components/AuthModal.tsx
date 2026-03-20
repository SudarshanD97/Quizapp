import { useState } from 'react';
import type { GoogleUser } from '../types/quiz';
import { saveUser } from '../utils/auth';

interface AuthModalProps {
  onAuth: (user: GoogleUser) => void;
  onSkip: () => void;
}

const AVATARS = [
  'Felix', 'Aneka', 'Jasper', 'Lily', 'Max', 'Zoe', 'Alex', 'Sam',
  'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor', 'Drew', 'Quinn', 'Avery',
];

export default function AuthModal({ onAuth, onSkip }: AuthModalProps) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [step, setStep] = useState<'main' | 'name'>('main');
  const [error, setError] = useState('');

  const handleGoogleSignIn = () => {
    setStep('name');
  };

  const handleConfirm = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    const user: GoogleUser = {
      uid: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      displayName: name.trim(),
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@quizai.app`,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${AVATARS[selectedAvatar]}&backgroundColor=b6e3f4,c0aede,d1f4e0,ffd5dc,ffdfbf`,
    };
    saveUser(user);
    onAuth(user);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden animate-scale-in"
        style={{ background: 'white', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
      >
        {step === 'main' ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🧠</div>
            <h2 className="text-3xl font-black mb-2" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>
              Join QuizAI
            </h2>
            <p className="text-base mb-8" style={{ color: '#6e6e73' }}>
              Sign in to track your streaks, appear on the leaderboard, and unlock all features.
            </p>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg mb-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#1d1d1f', color: 'white' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={onSkip}
              className="w-full py-3 px-6 rounded-2xl font-medium text-base transition-all duration-200 hover:bg-gray-100"
              style={{ color: '#6e6e73', background: 'transparent' }}
            >
              Skip for now
            </button>

            <p className="text-xs mt-4" style={{ color: '#aeaeb2' }}>
              Your data stays in your browser. No real Google account required for this demo.
            </p>
          </div>
        ) : (
          <div className="p-8">
            <button
              onClick={() => setStep('main')}
              className="flex items-center gap-2 mb-6 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#6e6e73' }}
            >
              ← Back
            </button>

            <h2 className="text-2xl font-black mb-2" style={{ color: '#1d1d1f' }}>
              Set up your profile
            </h2>
            <p className="text-sm mb-6" style={{ color: '#6e6e73' }}>
              Choose an avatar and enter your display name
            </p>

            {/* Avatar grid */}
            <div className="grid grid-cols-8 gap-2 mb-6">
              {AVATARS.map((seed, i) => (
                <button
                  key={seed}
                  onClick={() => setSelectedAvatar(i)}
                  className="rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    border: selectedAvatar === i ? '3px solid #1d1d1f' : '3px solid transparent',
                    transform: selectedAvatar === i ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1f4e0,ffd5dc,ffdfbf`}
                    alt={seed}
                    className="w-full h-auto"
                  />
                </button>
              ))}
            </div>

            {/* Name input */}
            <div className="mb-2">
              <label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: '#6e6e73' }}>
                DISPLAY NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                placeholder="e.g. Alex Johnson"
                maxLength={30}
                className="w-full px-4 py-4 rounded-2xl text-lg font-medium outline-none transition-all duration-200"
                style={{
                  background: '#f5f5f7',
                  color: '#1d1d1f',
                  border: error ? '2px solid #ff3b30' : '2px solid transparent',
                }}
                autoFocus
              />
              {error && <p className="text-sm mt-1 font-medium" style={{ color: '#ff3b30' }}>{error}</p>}
            </div>

            <button
              onClick={handleConfirm}
              className="w-full mt-4 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#1d1d1f', color: 'white' }}
            >
              Start Playing →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
