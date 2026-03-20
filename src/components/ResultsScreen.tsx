import { useEffect, useState, useRef } from 'react';
import type { QuizResult, WeaknessReport, GoogleUser } from '../types/quiz';
import { updateWeaknessData } from '../utils/storage';
import { fetchLearningResources } from '../utils/groq';
import { exportQuizToPDF } from '../utils/pdf';

interface ResultsScreenProps {
  result: QuizResult;
  user: GoogleUser | null;
  onRetry: () => void;
  onNewQuiz: () => void;
  onLeaderboard: () => void;
  onBack?: () => void;
}

type Tab = 'overview' | 'review' | 'weaknesses' | 'learn';

const RESOURCE_TYPE_ICONS: Record<string, string> = {
  video: '🎬',
  course: '📚',
  article: '📄',
  documentation: '📖',
};

export default function ResultsScreen({ result, user, onRetry, onNewQuiz, onLeaderboard, onBack }: ResultsScreenProps) {
  const { questions, answers, settings } = result;
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [weaknesses, setWeaknesses] = useState<WeaknessReport[]>([]);
  const [resources, setResources] = useState<{ subtopic: string; explanation: string; resources: { title: string; url: string; type: string }[] }[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scoreAnimated, setScoreAnimated] = useState(0);
  const [_confettiDone, setConfettiDone] = useState(false);
  const confettiRef = useRef(false);

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalQ = questions.length;
  const scorePercent = Math.round((correctCount / totalQ) * 100);
  const avgTime = answers.length ? Math.round(answers.reduce((s, a) => s + a.timeTaken, 0) / answers.length) : 0;
  const totalTime = answers.reduce((s, a) => s + a.timeTaken, 0);
  const timedOut = answers.filter((a) => a.selectedOption === null).length;
  const hintsUsed = answers.filter((a) => a.usedHint).length;
  const fiftyUsed = answers.filter((a) => a.usedFiftyFifty).length;

  const circumference = 2 * Math.PI * 56;
  const dashOffset = circumference - (scoreAnimated / 100) * circumference;

  const getGrade = () => {
    if (scorePercent >= 90) return { label: 'Outstanding!', color: '#34c759', emoji: '🏆', bg: 'linear-gradient(135deg, #34c759, #28a745)' };
    if (scorePercent >= 75) return { label: 'Great Job!', color: '#0071e3', emoji: '🎉', bg: 'linear-gradient(135deg, #0071e3, #0058b8)' };
    if (scorePercent >= 60) return { label: 'Good Effort!', color: '#ff9f0a', emoji: '👍', bg: 'linear-gradient(135deg, #ff9f0a, #e07b00)' };
    if (scorePercent >= 40) return { label: 'Keep Practicing!', color: '#ff6b35', emoji: '📚', bg: 'linear-gradient(135deg, #ff6b35, #e0481a)' };
    return { label: 'Keep Going!', color: '#ff3b30', emoji: '💪', bg: 'linear-gradient(135deg, #ff3b30, #cc2200)' };
  };
  const grade = getGrade();

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
    const weaks = updateWeaknessData(result);
    setWeaknesses(weaks);

    // Animate score counter
    let frame = 0;
    const total = 60;
    const interval = setInterval(() => {
      frame++;
      setScoreAnimated(Math.round((frame / total) * scorePercent));
      if (frame >= total) {
        setScoreAnimated(scorePercent);
        clearInterval(interval);
      }
    }, 16);

    // Confetti on high score
    if (scorePercent >= 70 && !confettiRef.current) {
      confettiRef.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#34c759', '#0071e3', '#ff9f0a', '#ff3b30', '#af52de'] });
        setTimeout(() => {
          confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 }, angle: 60 });
          confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 }, angle: 120 });
        }, 500);
      }).catch(() => {});
      setConfettiDone(true);
    }

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLearnTab = async () => {
    setActiveTab('learn');
    if (resources.length > 0 || loadingResources) return;

    const weakSubs = weaknesses.filter((w) => w.percent < 60).map((w) => w.subtopic);
    if (weakSubs.length === 0) return;

    setLoadingResources(true);
    try {
      const res = await fetchLearningResources(settings.apiKey, weakSubs, settings.category);
      setResources(res);
    } catch {
      setResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportQuizToPDF(result);
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'review', label: 'Review', icon: '📝' },
    { id: 'weaknesses', label: 'Analysis', icon: '🔍' },
    { id: 'learn', label: 'Learn', icon: '🎓' },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: '#f5f5f7' }}>

      {/* Hero Banner */}
      <div
        className="w-full pt-14 pb-10 px-4 text-center"
        style={{
          background: grade.bg,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)',
        }}
      >
        <div className="text-7xl mb-3 animate-bounce-subtle">{grade.emoji}</div>
        <h1 className="text-5xl sm:text-6xl font-black mb-2 text-white" style={{ letterSpacing: '-0.04em' }}>
          {grade.label}
        </h1>
        <p className="text-white/80 text-xl">
          {settings.category} • {settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1)} • {settings.topic || 'General'}
        </p>
        {user && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border-2 border-white/40" />
            <span className="text-white/90 font-semibold">{user.displayName}</span>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 pb-16">
        {onBack && (
          <div className="mb-6 flex items-center">
            <button
              onClick={onBack}
              className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#6e6e73' }}
            >
              <span aria-hidden>←</span> Back
            </button>
          </div>
        )}

        {/* Score + Quick Stats */}
        <div
          className="w-full rounded-3xl p-6 sm:p-10 mb-6"
          style={{
            background: 'white',
            boxShadow: '0 4px 40px rgba(0,0,0,0.12)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.6s ease 0.15s',
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score circle */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative w-36 h-36">
                <svg width="144" height="144" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="56" fill="none" stroke="#f0f0f5" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="56"
                    fill="none"
                    stroke={grade.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 0.05s linear', transformOrigin: '60px 60px', transform: 'rotate(-90deg)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>
                    {scoreAnimated}%
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#6e6e73' }}>
                    {correctCount}/{totalQ}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
              {[
                { icon: '✅', label: 'Correct', value: correctCount.toString(), color: '#34c759' },
                { icon: '❌', label: 'Wrong', value: (totalQ - correctCount - timedOut).toString(), color: '#ff3b30' },
                { icon: '⏰', label: 'Timed Out', value: timedOut.toString(), color: '#ff9f0a' },
                { icon: '⏱️', label: 'Total Time', value: formatTime(totalTime), color: '#0071e3' },
                { icon: '📊', label: 'Avg / Q', value: `${avgTime}s`, color: '#af52de' },
                { icon: '💡', label: 'Hints Used', value: hintsUsed.toString(), color: '#ff6b35' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl p-4 text-center" style={{ background: '#f5f5f7' }}>
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs font-semibold" style={{ color: '#aeaeb2' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex flex-wrap gap-3 mb-6"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease 0.3s',
          }}
        >
          <button
            onClick={onRetry}
            className="flex-1 min-w-[140px] py-4 rounded-2xl font-black text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#1d1d1f', color: 'white' }}
          >
            🔄 Try Again
          </button>
          <button
            onClick={onNewQuiz}
            className="flex-1 min-w-[140px] py-4 rounded-2xl font-black text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'white', color: '#1d1d1f', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}
          >
            ✨ New Quiz
          </button>
          <button
            onClick={onLeaderboard}
            className="flex-1 min-w-[140px] py-4 rounded-2xl font-black text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#0071e3', color: 'white' }}
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex-1 min-w-[140px] py-4 rounded-2xl font-black text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            style={{ background: '#34c759', color: 'white' }}
          >
            {exporting ? '⏳ Exporting...' : '📥 Export PDF'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex gap-2 mb-6 p-1.5 rounded-2xl"
          style={{
            background: 'white',
            boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease 0.35s',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.id === 'learn' ? handleLearnTab() : setActiveTab(tab.id)}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: activeTab === tab.id ? '#1d1d1f' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6e6e73',
              }}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div key={activeTab} className="animate-fade-in-up">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Performance bar */}
              <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
                <h3 className="font-black text-xl mb-6" style={{ color: '#1d1d1f' }}>Performance Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Accuracy', value: scorePercent, color: grade.color, suffix: '%' },
                    { label: 'Answered', value: Math.round(((totalQ - timedOut) / totalQ) * 100), color: '#0071e3', suffix: '%' },
                    { label: 'Speed Score', value: Math.max(0, Math.round(100 - (avgTime / 30) * 100)), color: '#af52de', suffix: '%' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-base" style={{ color: '#1d1d1f' }}>{item.label}</span>
                        <span className="font-black text-base" style={{ color: item.color }}>{item.value}{item.suffix}</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: '#f0f0f5' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.value}%`,
                            background: item.color,
                            transition: 'width 1s cubic-bezier(0.34, 1.2, 0.64, 1)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Power-up usage */}
              <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
                <h3 className="font-black text-xl mb-5" style={{ color: '#1d1d1f' }}>Power-up Usage</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: '⚡', label: '50:50 Used', value: fiftyUsed, color: '#1d1d1f' },
                    { icon: '💡', label: 'Hints Used', value: hintsUsed, color: '#0071e3' },
                  ].map((p) => (
                    <div key={p.label} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#f5f5f7' }}>
                      <span className="text-3xl">{p.icon}</span>
                      <div>
                        <div className="text-2xl font-black" style={{ color: p.color }}>{p.value}</div>
                        <div className="text-sm font-semibold" style={{ color: '#6e6e73' }}>{p.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REVIEW TAB */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const ans = answers[idx];
                const isCorrect = ans?.isCorrect;
                const selected = ans?.selectedOption;
                const letters = ['A', 'B', 'C', 'D'];

                return (
                  <div
                    key={q.id}
                    className="rounded-3xl overflow-hidden"
                    style={{ background: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
                  >
                    {/* Status bar */}
                    <div
                      className="w-full h-1.5"
                      style={{ background: isCorrect ? '#34c759' : selected === null ? '#ff9f0a' : '#ff3b30' }}
                    />

                    <div className="p-5 sm:p-7">
                      <div className="flex items-start gap-4 mb-5">
                        <span
                          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
                          style={{ background: isCorrect ? '#34c759' : '#ff3b30', color: 'white' }}
                        >
                          {isCorrect ? '✓' : '✗'}
                        </span>
                        <div className="flex-1">
                          <div className="text-xs font-bold mb-1 tracking-wider" style={{ color: '#aeaeb2' }}>
                            Q{idx + 1} • {q.subtopic}
                          </div>
                          <p className="font-bold text-lg leading-snug" style={{ color: '#1d1d1f' }}>{q.question}</p>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
                        {q.options.map((opt, oi) => {
                          const isCorrectOpt = oi === q.correctAnswer;
                          const isSelected = oi === selected;
                          let bg = '#f5f5f7', color = '#6e6e73', border = 'transparent';
                          if (isCorrectOpt) { bg = '#f0fff4'; color = '#1a7f37'; border = '#34c759'; }
                          else if (isSelected && !isCorrectOpt) { bg = '#fff2f2'; color = '#c0392b'; border = '#ff3b30'; }

                          return (
                            <div
                              key={oi}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl"
                              style={{ background: bg, border: `1.5px solid ${border}` }}
                            >
                              <span className="font-black text-sm w-6 flex-shrink-0" style={{ color }}>
                                {isCorrectOpt ? '✓' : isSelected ? '✗' : letters[oi]}
                              </span>
                              <span className="text-base font-medium leading-snug" style={{ color }}>{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="p-4 rounded-2xl" style={{ background: '#f5f5f7' }}>
                        <p className="text-xs font-bold mb-1.5 tracking-wider" style={{ color: '#aeaeb2' }}>WHY THIS ANSWER?</p>
                        <p className="text-base leading-relaxed" style={{ color: '#3a3a3a' }}>{q.explanation}</p>
                        {ans?.usedHint && (
                          <p className="mt-2 text-sm italic" style={{ color: '#0071e3' }}>💡 Hint was used: "{q.hint}"</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-semibold" style={{ color: '#aeaeb2' }}>
                          ⏱ {ans?.timeTaken ?? 0}s
                        </span>
                        <div className="flex gap-2">
                          {ans?.usedHint && <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: '#e8f4ff', color: '#0071e3' }}>💡 Hint</span>}
                          {ans?.usedFiftyFifty && <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: '#f5f5f7', color: '#6e6e73' }}>⚡ 50:50</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* WEAKNESSES TAB */}
          {activeTab === 'weaknesses' && (
            <div className="space-y-5">
              <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
                <h3 className="font-black text-xl mb-2" style={{ color: '#1d1d1f' }}>Topic Analysis</h3>
                <p className="text-base mb-6" style={{ color: '#6e6e73' }}>
                  Based on all your quizzes in <strong>{settings.category}</strong>, here's where you stand:
                </p>

                {weaknesses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🎯</div>
                    <p className="font-bold text-lg" style={{ color: '#1d1d1f' }}>Complete more quizzes to see analysis</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {weaknesses.map((w) => {
                      const color = w.percent >= 70 ? '#34c759' : w.percent >= 45 ? '#ff9f0a' : '#ff3b30';
                      const label = w.percent >= 70 ? 'Strong' : w.percent >= 45 ? 'Developing' : 'Needs Work';
                      return (
                        <div key={w.subtopic}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base" style={{ color: '#1d1d1f' }}>{w.subtopic}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${color}20`, color }}>
                                {label}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-base" style={{ color }}>{w.percent}%</span>
                              <span className="text-xs ml-1" style={{ color: '#aeaeb2' }}>({w.correct}/{w.total})</span>
                            </div>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#f0f0f5' }}>
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${w.percent}%`, background: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recommendations to switch tab */}
              {weaknesses.some((w) => w.percent < 60) && (
                <div
                  className="rounded-3xl p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.01] transition-transform"
                  style={{ background: '#1d1d1f', color: 'white' }}
                  onClick={handleLearnTab}
                >
                  <span className="text-4xl">🎓</span>
                  <div>
                    <h4 className="font-black text-lg mb-1">Get Learning Resources</h4>
                    <p className="opacity-70 text-sm">We've identified weak areas. Click to get curated learning resources →</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LEARN TAB */}
          {activeTab === 'learn' && (
            <div className="space-y-5">
              {loadingResources ? (
                <div className="rounded-3xl p-12 text-center" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="font-black text-xl mb-2" style={{ color: '#1d1d1f' }}>Finding Best Resources...</h3>
                  <p style={{ color: '#6e6e73' }}>Our AI is curating personalized learning resources for your weak areas</p>
                  <div className="mt-6 flex justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full animate-bounce"
                        style={{ background: '#1d1d1f', animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : resources.length === 0 && weaknesses.filter((w) => w.percent < 60).length === 0 ? (
                <div className="rounded-3xl p-12 text-center" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
                  <div className="text-5xl mb-4">🌟</div>
                  <h3 className="font-black text-xl mb-2" style={{ color: '#1d1d1f' }}>You're doing great!</h3>
                  <p style={{ color: '#6e6e73' }}>No weak areas detected. Keep challenging yourself with harder quizzes!</p>
                </div>
              ) : resources.length === 0 ? (
                <div className="rounded-3xl p-12 text-center" style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="font-black text-xl mb-2" style={{ color: '#1d1d1f' }}>Couldn't load resources</h3>
                  <p style={{ color: '#6e6e73' }}>Check your API key and try again</p>
                  <button
                    onClick={handleLearnTab}
                    className="mt-4 px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105"
                    style={{ background: '#1d1d1f', color: 'white' }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                resources.map((r) => (
                  <div
                    key={r.subtopic}
                    className="rounded-3xl overflow-hidden"
                    style={{ background: 'white', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}
                  >
                    <div className="p-2 text-center font-black text-base" style={{ background: '#ff3b30', color: 'white' }}>
                      📍 Weak Area: {r.subtopic}
                    </div>
                    <div className="p-6 sm:p-8">
                      <p className="text-base leading-relaxed mb-6" style={{ color: '#3a3a3a' }}>{r.explanation}</p>
                      <h4 className="font-black text-base mb-4" style={{ color: '#1d1d1f' }}>Recommended Resources</h4>
                      <div className="space-y-3">
                        {r.resources.map((res, ri) => (
                          <a
                            key={ri}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.01] group"
                            style={{ background: '#f5f5f7', textDecoration: 'none' }}
                          >
                            <span className="text-2xl flex-shrink-0">{RESOURCE_TYPE_ICONS[res.type] || '🔗'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-base truncate group-hover:text-blue-600 transition-colors" style={{ color: '#1d1d1f' }}>
                                {res.title}
                              </div>
                              <div className="text-xs truncate" style={{ color: '#aeaeb2' }}>{res.url}</div>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: '#e8e8ed', color: '#6e6e73' }}>
                              {res.type}
                            </span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aeaeb2" strokeWidth="2" className="flex-shrink-0">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
