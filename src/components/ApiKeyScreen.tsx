import { useState } from 'react';

interface ApiKeyScreenProps {
  onBack: () => void;
  onStart: (apiKey: string) => void;
  savedKey?: string;
  error?: string;
}

export default function ApiKeyScreen({ onBack, onStart, savedKey = '', error: externalError = '' }: ApiKeyScreenProps) {
  const [apiKey, setApiKey] = useState(savedKey);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState(externalError);

  const handleStart = () => {
    if (!apiKey.trim()) {
      setError('Please enter your Groq API key to continue.');
      return;
    }
    if (!apiKey.startsWith('gsk_')) {
      setError('Invalid API key format. Groq API keys start with "gsk_".');
      return;
    }
    setError('');
    onStart(apiKey.trim());
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-10 px-4 pb-16"
      style={{ background: '#f5f5f7' }}>

      {/* Step Indicator */}
      <div className="w-full max-w-3xl mb-8 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg border-2 group-hover:border-gray-400 transition-colors"
              style={{ background: 'transparent', color: '#6e6e73', borderColor: '#d2d2d7' }}>1</div>
            <span className="font-medium text-xl" style={{ color: '#6e6e73' }}>Quiz Settings</span>
          </button>
          <div className="flex-1 h-px" style={{ background: '#1d1d1f' }} />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: '#1d1d1f' }}>2</div>
            <span className="font-semibold text-xl" style={{ color: '#1d1d1f' }}>API Key</span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-3xl rounded-3xl p-8 md:p-12 animate-fade-in-up delay-100"
        style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>

        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
          style={{ background: '#f5f5f7' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </div>

        <h2 className="text-4xl font-bold text-center mb-3" style={{ color: '#1d1d1f', letterSpacing: '-0.02em' }}>
          Groq API Key
        </h2>
        <p className="text-center text-lg mb-10" style={{ color: '#6e6e73' }}>
          Your API key is used to generate quiz questions with AI.<br />
          It stays in your browser and is never stored on any server.
        </p>

        {/* Input */}
        <div className="relative mb-4">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError('');
            }}
            placeholder="gsk_..."
            className="w-full rounded-2xl px-6 py-6 text-lg outline-none border-2 transition-all duration-200 pr-16 font-mono"
            style={{
              background: '#f5f5f7',
              color: '#1d1d1f',
              borderColor: error ? '#ff3b30' : '#e8e8ed',
              fontSize: '1.05rem',
            }}
            onFocus={(e) => {
              if (!error) e.target.style.borderColor = '#1d1d1f';
            }}
            onBlur={(e) => {
              if (!error) e.target.style.borderColor = '#e8e8ed';
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: '#6e6e73' }}
          >
            {showKey ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-4 animate-fade-in"
            style={{ background: '#fff5f5', border: '1.5px solid #ff3b3020' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-sm font-medium" style={{ color: '#ff3b30' }}>{error}</span>
          </div>
        )}

        {/* Info box */}
        <div className="flex items-start gap-4 p-5 rounded-2xl mb-10"
          style={{ background: '#f0f7ff', border: '1.5px solid #0071e320' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#0071e3' }}>How to get a free API key</p>
            <p className="text-sm leading-relaxed" style={{ color: '#3a3a5c' }}>
              Visit{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                className="font-semibold underline hover:no-underline" style={{ color: '#0071e3' }}>
                console.groq.com/keys
              </a>
              , sign up for free, and create a new API key. Groq offers a generous free tier with fast inference.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-shrink-0 px-8 py-5 rounded-2xl font-semibold text-lg transition-all duration-200 hover:bg-gray-100 active:scale-95 border"
            style={{ background: 'white', color: '#1d1d1f', borderColor: '#d2d2d7' }}
          >
            ← Back
          </button>
          <button
            onClick={handleStart}
            disabled={!apiKey.trim()}
            className="flex-1 py-5 rounded-2xl font-bold text-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: '#1d1d1f',
              color: '#fff',
              fontSize: '1.15rem',
              boxShadow: apiKey.trim() ? '0 4px 20px rgba(0,0,0,0.16)' : 'none',
            }}
          >
            Generate Quiz ✦
          </button>
        </div>
      </div>
    </div>
  );
}
