import { useState } from 'react';
import type { QuizSettings, Category, Difficulty, TimeLimit } from '../types/quiz';

interface SettingsScreenProps {
  onContinue: (settings: Omit<QuizSettings, 'apiKey'>) => void | Promise<void>;
  initialSettings?: Omit<QuizSettings, 'apiKey'>;
  onBack?: () => void;
}

const CATEGORIES: Category[] = [
  'Technology', 'Science', 'History', 'Geography',
  'Mathematics', 'Literature', 'Sports', 'Entertainment',
  'General Knowledge', 'Custom',
];

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', desc: 'Beginner friendly' },
  { value: 'medium', label: 'Medium', desc: 'Requires some knowledge' },
  { value: 'hard', label: 'Hard', desc: 'Expert level' },
];

const TIME_OPTIONS: { value: TimeLimit; label: string }[] = [
  { value: 'none', label: 'No limit' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
];

export default function SettingsScreen({ onContinue, initialSettings, onBack: _onBack }: SettingsScreenProps) {
  const [topic, setTopic] = useState(initialSettings?.topic ?? '');
  const [category, setCategory] = useState<Category>(initialSettings?.category ?? 'Technology');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialSettings?.difficulty ?? 'medium');
  const [questionCount, setQuestionCount] = useState(initialSettings?.questionCount ?? 5);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(initialSettings?.timeLimit ?? 30);

  const handleContinue = () => {
    onContinue({ topic, category, difficulty, questionCount, timeLimit });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-10 px-4 pb-16"
      style={{ background: '#f5f5f7' }}>

      {/* Header / Step Indicator */}
      <div className="w-full max-w-3xl mb-8 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: '#1d1d1f' }}>1</div>
            <span className="font-semibold text-xl" style={{ color: '#1d1d1f' }}>Quiz Settings</span>
          </div>
          <div className="flex-1 h-px" style={{ background: '#d2d2d7' }} />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg border-2"
              style={{ background: 'transparent', color: '#6e6e73', borderColor: '#d2d2d7' }}>2</div>
            <span className="font-medium text-xl" style={{ color: '#6e6e73' }}>API Key</span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-3xl rounded-3xl p-8 md:p-10 shadow-sm animate-fade-in-up delay-100"
        style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>

        {/* TOPIC */}
        <section className="mb-8">
          <label className="block text-xs font-bold tracking-widest mb-3 uppercase" style={{ color: '#6e6e73' }}>
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Quantum Physics, The Beatles, World War II..."
            className="w-full rounded-2xl px-6 py-5 text-xl outline-none border transition-all duration-200 focus:border-gray-400"
            style={{
              background: '#f5f5f7',
              color: '#1d1d1f',
              border: '2px solid #e8e8ed',
              fontSize: '1.15rem',
            }}
          />
        </section>

        {/* CATEGORY */}
        <section className="mb-8">
          <label className="block text-xs font-bold tracking-widest mb-3 uppercase" style={{ color: '#6e6e73' }}>
            Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="rounded-2xl px-6 py-5 text-left font-semibold text-lg transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: category === cat ? '#1d1d1f' : '#f5f5f7',
                  color: category === cat ? '#ffffff' : '#1d1d1f',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* DIFFICULTY */}
        <section className="mb-8">
          <label className="block text-xs font-bold tracking-widest mb-3 uppercase" style={{ color: '#6e6e73' }}>
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className="rounded-2xl px-4 py-5 text-center transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: difficulty === d.value ? '#1d1d1f' : '#f5f5f7',
                  color: difficulty === d.value ? '#ffffff' : '#1d1d1f',
                }}
              >
                <div className="font-bold text-xl mb-1">{d.label}</div>
                <div className="text-sm" style={{ color: difficulty === d.value ? 'rgba(255,255,255,0.65)' : '#6e6e73' }}>
                  {d.desc}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* QUESTIONS + TIME */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Questions */}
          <section>
            <label className="block text-xs font-bold tracking-widest mb-3 uppercase" style={{ color: '#6e6e73' }}>
              Questions
            </label>
            <div className="rounded-2xl px-6 py-5 flex items-center justify-between"
              style={{ background: '#f5f5f7' }}>
              <button
                onClick={() => setQuestionCount((c) => Math.max(3, c - 1))}
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-light transition-all duration-200 hover:bg-gray-200 active:scale-90"
                style={{ background: 'white', color: '#1d1d1f', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                −
              </button>
              <span className="text-5xl font-black" style={{ color: '#1d1d1f' }}>{questionCount}</span>
              <button
                onClick={() => setQuestionCount((c) => Math.min(15, c + 1))}
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-light transition-all duration-200 hover:bg-gray-200 active:scale-90"
                style={{ background: 'white', color: '#1d1d1f', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                +
              </button>
            </div>
          </section>

          {/* Time per Question */}
          <section>
            <label className="block text-xs font-bold tracking-widest mb-3 uppercase" style={{ color: '#6e6e73' }}>
              Time / Q
            </label>
            <div className="rounded-2xl px-5 py-5 flex items-center gap-2 flex-wrap"
              style={{ background: '#f5f5f7' }}>
              {TIME_OPTIONS.map((t) => (
                <button
                  key={String(t.value)}
                  onClick={() => setTimeLimit(t.value)}
                  className="flex-1 min-w-0 px-3 py-3 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-105 text-center"
                  style={{
                    background: timeLimit === t.value ? '#1d1d1f' : 'white',
                    color: timeLimit === t.value ? '#ffffff' : '#1d1d1f',
                    fontSize: '0.95rem',
                    boxShadow: timeLimit === t.value ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full py-6 rounded-2xl font-bold text-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: '#1d1d1f',
            color: '#fff',
            fontSize: '1.2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.16)',
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
