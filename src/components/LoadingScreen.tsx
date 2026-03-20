import { useEffect, useState } from 'react';
import type { QuizSettings } from '../types/quiz';

interface LoadingScreenProps {
  settings: QuizSettings;
  onBack?: () => void;
}

const loadingMessages = [
  'Crafting your questions with AI...',
  'Researching facts and details...',
  'Preparing your quiz experience...',
  'Almost ready — finalizing answers...',
];

export default function LoadingScreen({ settings, onBack }: LoadingScreenProps) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % loadingMessages.length);
    }, 2200);

    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);

    return () => {
      clearInterval(msgTimer);
      clearInterval(dotTimer);
    };
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6"
      style={{ background: '#f5f5f7' }}
    >
      {onBack && (
        <div className="w-full max-w-lg flex justify-start mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-70"
            style={{ color: '#6e6e73' }}
          >
            <span aria-hidden>←</span> Back
          </button>
        </div>
      )}
      <div className="flex flex-col items-center gap-10 max-w-lg w-full animate-fade-in">

        {/* Animated Loader */}
        <div className="relative w-28 h-28">
          {/* Outer spinning ring */}
          <div
            className="absolute inset-0 rounded-full border-4 animate-spin-slow"
            style={{ borderColor: '#e8e8ed', borderTopColor: '#1d1d1f' }}
          />
          {/* Inner icon */}
          <div className="absolute inset-4 rounded-full flex items-center justify-center"
            style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            Generating Quiz
          </h2>
          <p className="text-xl" style={{ color: '#6e6e73', minHeight: '1.75rem' }}>
            {loadingMessages[msgIdx]}{dots}
          </p>
        </div>

        {/* Quiz Summary Card */}
        <div className="w-full rounded-3xl p-7 grid grid-cols-2 gap-4"
          style={{ background: 'white', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
          {[
            { label: 'Category', value: settings.category },
            { label: 'Difficulty', value: settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1) },
            { label: 'Questions', value: `${settings.questionCount}` },
            { label: 'Time / Q', value: settings.timeLimit === 'none' ? 'No limit' : `${settings.timeLimit}s` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl p-4 text-center" style={{ background: '#f5f5f7' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6e6e73' }}>{item.label}</div>
              <div className="text-lg font-semibold capitalize" style={{ color: '#1d1d1f' }}>{item.value}</div>
            </div>
          ))}
          {settings.topic && (
            <div className="col-span-2 rounded-2xl p-4 text-center" style={{ background: '#f5f5f7' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6e6e73' }}>Topic</div>
              <div className="text-lg font-semibold" style={{ color: '#1d1d1f' }}>{settings.topic}</div>
            </div>
          )}
        </div>

        {/* Pulsing dots */}
        <div className="flex items-center gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                background: '#1d1d1f',
                animationDelay: `${i * 200}ms`,
                animationDuration: '1.2s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
