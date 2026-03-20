import { useState, useEffect, useCallback, useRef } from 'react';
import type { QuizQuestion, QuizSettings, QuizAnswer } from '../types/quiz';

interface QuizScreenProps {
  questions: QuizQuestion[];
  settings: QuizSettings;
  onComplete: (answers: QuizAnswer[]) => void;
  onBack?: () => void;
  userName?: string;
  userPhoto?: string;
}

type AnswerState = 'idle' | 'correct' | 'wrong' | 'timeout';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizScreen({ questions, settings, onComplete, onBack, userName, userPhoto }: QuizScreenProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(
    settings.timeLimit !== 'none' ? settings.timeLimit : 0
  );
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showExplanation, setShowExplanation] = useState(false);

  // ─── Power-ups: once per ENTIRE quiz, never reset between questions ───
  const [hintUsedGlobal, setHintUsedGlobal] = useState(false);   // consumed forever once clicked
  const [fiftyUsedGlobal, setFiftyUsedGlobal] = useState(false); // consumed forever once clicked
  const [showHint, setShowHint] = useState(false);               // visibility of hint box this Q
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]); // eliminated this Q
  // track whether current-question used each (for QuizAnswer recording)
  const [hintUsedThisQ, setHintUsedThisQ] = useState(false);
  const [fiftyUsedThisQ, setFiftyUsedThisQ] = useState(false);

  // Animation
  const [cardVisible, setCardVisible] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [bounceCorrect, setBounceCorrect] = useState(false);
  const [powerUpAnimation, setPowerUpAnimation] = useState<string | null>(null);
  const [powerUpToast, setPowerUpToast] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const hasTimeLimit = settings.timeLimit !== 'none';
  const maxTime = hasTimeLimit ? (settings.timeLimit as number) : 0;

  // Card enter animation on question change
  useEffect(() => {
    setCardVisible(false);
    const t = setTimeout(() => setCardVisible(true), 50);
    return () => clearTimeout(t);
  }, [currentIdx]);

  const goNext = useCallback(
    (
      finalSelectedOption: number | null,
      finalState: AnswerState,
      usedHintArg: boolean,
      usedFiftyArg: boolean
    ) => {
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
      const isCorrect =
        finalSelectedOption !== null
          ? finalSelectedOption === currentQuestion.correctAnswer
          : false;

      const newAnswer: QuizAnswer = {
        questionId: currentQuestion.id,
        selectedOption: finalSelectedOption,
        isCorrect,
        timeTaken,
        usedHint: usedHintArg,
        usedFiftyFifty: usedFiftyArg,
      };
      const updatedAnswers = [...answers, newAnswer];

      setTimeout(() => {
        if (currentIdx + 1 >= totalQuestions) {
          onComplete(updatedAnswers);
        } else {
          setAnswers(updatedAnswers);
          setCurrentIdx((i) => i + 1);
          setSelectedOption(null);
          setAnswerState('idle');
          setShowExplanation(false);
          // ── Reset per-question state ONLY (not global powerup flags) ──
          setShowHint(false);
          setEliminatedOptions([]);
          setHintUsedThisQ(false);
          setFiftyUsedThisQ(false);
          setTimeLeft(hasTimeLimit ? maxTime : 0);
          setQuestionStartTime(Date.now());
        }
      }, finalState === 'timeout' ? 1400 : 2000);
    },
    [answers, currentIdx, currentQuestion, hasTimeLimit, maxTime, onComplete, questionStartTime, totalQuestions]
  );

  // Timer
  useEffect(() => {
    if (!hasTimeLimit || answerState !== 'idle') return;
    setTimeLeft(maxTime);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setAnswerState('timeout');
          setShowExplanation(true);
          goNext(null, 'timeout', hintUsedThisQ, fiftyUsedThisQ);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  const handleSelect = (optionIdx: number) => {
    if (answerState !== 'idle') return;
    if (eliminatedOptions.includes(optionIdx)) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIdx);
    const isCorrect = optionIdx === currentQuestion.correctAnswer;
    const state = isCorrect ? 'correct' : 'wrong';
    setAnswerState(state);
    setShowExplanation(true);

    if (isCorrect) {
      setBounceCorrect(true);
      setTimeout(() => setBounceCorrect(false), 800);
    } else {
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 600);
    }

    goNext(optionIdx, state, hintUsedThisQ, fiftyUsedThisQ);
  };

  const showToast = (msg: string) => {
    setPowerUpToast(msg);
    setTimeout(() => setPowerUpToast(null), 2200);
  };

  const handleHint = () => {
    // Block if already used globally OR answer is in progress
    if (hintUsedGlobal || answerState !== 'idle') return;
    setHintUsedGlobal(true);   // mark consumed for the rest of the quiz
    setHintUsedThisQ(true);
    setShowHint(true);
    setPowerUpAnimation('hint');
    setTimeout(() => setPowerUpAnimation(null), 1000);
    showToast('💡 Hint used — power-up spent for this quiz!');
  };

  const handleFiftyFifty = () => {
    // Block if already used globally OR answer is in progress
    if (fiftyUsedGlobal || answerState !== 'idle') return;
    setFiftyUsedGlobal(true);   // mark consumed for the rest of the quiz
    setFiftyUsedThisQ(true);
    setPowerUpAnimation('fifty');
    setTimeout(() => setPowerUpAnimation(null), 1000);
    showToast('⚡ 50:50 used — power-up spent for this quiz!');

    // Remove 2 wrong options randomly
    const wrongOptions = [0, 1, 2, 3].filter((i) => i !== currentQuestion.correctAnswer);
    const shuffled = wrongOptions.sort(() => Math.random() - 0.5);
    setEliminatedOptions(shuffled.slice(0, 2));
  };

  const progressPct = (currentIdx / totalQuestions) * 100;
  const timerPct = hasTimeLimit ? (timeLeft / maxTime) * 100 : 100;
  const circumference = 2 * Math.PI * 22;
  const timerColor = timerPct > 50 ? '#34c759' : timerPct > 25 ? '#ff9f0a' : '#ff3b30';
  const correctCount = answers.filter((a) => a.isCorrect).length;

  const getOptionStyle = (idx: number): React.CSSProperties => {
    const isEliminated = eliminatedOptions.includes(idx);

    if (answerState === 'idle') {
      if (isEliminated) {
        return {
          background: '#f5f5f7',
          color: '#aeaeb2',
          border: '2px solid #e8e8ed',
          opacity: 0.4,
          textDecoration: 'line-through',
        };
      }
      return { background: 'white', color: '#1d1d1f', border: '2px solid #e8e8ed' };
    }
    if (idx === currentQuestion.correctAnswer) {
      return { background: '#34c759', color: 'white', border: '2px solid #34c759' };
    }
    if (idx === selectedOption && answerState === 'wrong') {
      return { background: '#ff3b30', color: 'white', border: '2px solid #ff3b30' };
    }
    return { background: 'white', color: '#6e6e73', border: '2px solid #e8e8ed', opacity: 0.5 };
  };

  const getOptionIcon = (idx: number) => {
    if (answerState === 'idle') return null;
    if (idx === currentQuestion.correctAnswer) {
      return (
        <span className="ml-auto flex-shrink-0 animate-bounce-in">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      );
    }
    if (idx === selectedOption && answerState === 'wrong') {
      return (
        <span className="ml-auto flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: '#f5f5f7' }}>

      {/* ── Toast Notification ── */}
      {powerUpToast && (
        <div
          className="fixed top-6 left-1/2 z-50 animate-fade-in-up"
          style={{
            transform: 'translateX(-50%)',
            background: '#1d1d1f',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '999px',
            fontSize: '0.95rem',
            fontWeight: 700,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            whiteSpace: 'nowrap',
          }}
        >
          {powerUpToast}
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="w-full glass sticky top-0 z-40 border-b border-white/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-shrink-0 font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#6e6e73' }}
            >
              ← Back
            </button>
          )}
          {/* User avatar */}
          {(userName || userPhoto) && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {userPhoto ? (
                <img src={userPhoto} alt={userName} className="w-9 h-9 rounded-full border-2" style={{ borderColor: '#e8e8ed' }} />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black" style={{ background: '#1d1d1f', color: 'white' }}>
                  {userName?.[0]}
                </div>
              )}
              <span className="text-sm font-semibold hidden sm:block" style={{ color: '#1d1d1f' }}>{userName}</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#6e6e73' }}>
              {currentIdx + 1} / {totalQuestions}
            </span>
            <div className="flex-1 h-3 rounded-full overflow-hidden relative" style={{ background: '#e8e8ed' }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #1d1d1f, #3a3a3f)',
                }}
              />
            </div>
            <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#34c759' }}>
              ✓ {correctCount}
            </span>
          </div>

          {/* Category badge */}
          <span
            className="hidden md:block text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: '#1d1d1f', color: 'white', letterSpacing: '0.05em' }}
          >
            {settings.category.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col px-4 sm:px-6 pt-8 pb-16 gap-6">

        {/* Question Card */}
        <div
          key={`card-${currentIdx}`}
          className={`w-full rounded-3xl overflow-hidden ${shakeWrong ? 'animate-shake' : ''} ${bounceCorrect ? 'animate-bounce-subtle' : ''}`}
          style={{
            background: 'white',
            boxShadow: '0 4px 40px rgba(0,0,0,0.10)',
            opacity: cardVisible ? 1 : 0,
            transform: cardVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
            transition: 'opacity 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Top colour bar */}
          <div
            className="w-full h-2"
            style={{
              background:
                answerState === 'correct' ? '#34c759'
                  : answerState === 'wrong' ? '#ff3b30'
                  : answerState === 'timeout' ? '#ff9f0a'
                  : `linear-gradient(90deg, #1d1d1f ${progressPct}%, #e8e8ed ${progressPct}%)`,
              transition: 'background 0.4s ease',
            }}
          />

          <div className="p-6 sm:p-10">
            {/* Question header row */}
            <div className="flex items-start gap-5 mb-8">
              {/* Timer ring or Q number */}
              <div className="flex-shrink-0">
                {hasTimeLimit ? (
                  <div className="relative w-16 h-16">
                    <svg width="64" height="64" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="22" fill="none" stroke="#e8e8ed" strokeWidth="4" />
                      <circle
                        cx="24" cy="24" r="22"
                        fill="none"
                        stroke={timerColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - timerPct / 100)}
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                        transform="rotate(-90 24 24)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-xl font-black"
                        style={{
                          color: timerColor,
                          transform: timeLeft <= 5 ? 'scale(1.2)' : 'scale(1)',
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
                    style={{ background: '#f5f5f7', color: '#1d1d1f' }}
                  >
                    Q{currentIdx + 1}
                  </div>
                )}
              </div>

              {/* Question text */}
              <div className="flex-1">
                <div className="text-xs font-bold mb-2 tracking-widest" style={{ color: '#aeaeb2' }}>
                  QUESTION {currentIdx + 1} OF {totalQuestions}
                </div>
                <h2
                  className="font-bold leading-snug"
                  style={{ color: '#1d1d1f', fontSize: 'clamp(1.2rem, 2.8vw, 1.65rem)', letterSpacing: '-0.02em' }}
                >
                  {currentQuestion.question}
                </h2>
              </div>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6">
              {currentQuestion.options.map((option, idx) => {
                const optStyle = getOptionStyle(idx);
                const isEliminated = eliminatedOptions.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={answerState !== 'idle' || isEliminated}
                    className="option-btn rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-left disabled:cursor-default relative overflow-hidden group"
                    style={{
                      ...optStyle,
                      transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      minHeight: '72px',
                    }}
                  >
                    {/* Hover shimmer */}
                    {answerState === 'idle' && !isEliminated && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                        style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.03) 0%, transparent 50%)' }}
                      />
                    )}

                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-black"
                      style={{
                        background: optStyle.color === 'white' ? 'rgba(255,255,255,0.22)' : '#f5f5f7',
                        color: optStyle.color === 'white' ? 'white' : '#1d1d1f',
                        minWidth: '40px',
                      }}
                    >
                      {isEliminated ? '✕' : OPTION_LETTERS[idx]}
                    </span>
                    <span
                      className="font-semibold leading-snug flex-1"
                      style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)' }}
                    >
                      {option}
                    </span>
                    {getOptionIcon(idx)}
                  </button>
                );
              })}
            </div>

            {/* Hint box */}
            {showHint && (
              <div
                className="mb-4 p-4 rounded-2xl flex items-start gap-3 animate-fade-in-up"
                style={{ background: '#f0f9ff', border: '1.5px solid #0071e330' }}
              >
                <span className="text-xl flex-shrink-0">💡</span>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: '#0071e3' }}>HINT</p>
                  <p className="text-base leading-relaxed" style={{ color: '#1d1d1f' }}>
                    {currentQuestion.hint}
                  </p>
                </div>
              </div>
            )}

            {/* Explanation */}
            {showExplanation && (
              <div
                className="p-5 sm:p-6 rounded-2xl flex items-start gap-4 animate-fade-in-up"
                style={{
                  background:
                    answerState === 'correct' ? '#f0fff4'
                      : answerState === 'timeout' ? '#fff8f0'
                      : '#fff2f2',
                  border: `1.5px solid ${answerState === 'correct' ? '#34c75940' : answerState === 'timeout' ? '#ff9f0a40' : '#ff3b3040'}`,
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {answerState === 'correct' ? (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center animate-pop" style={{ background: '#34c759' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : answerState === 'timeout' ? (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#ff9f0a' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#ff3b30' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className="font-black text-base mb-2"
                    style={{
                      color:
                        answerState === 'correct' ? '#1a7f37'
                          : answerState === 'timeout' ? '#b45309'
                          : '#c0392b',
                    }}
                  >
                    {answerState === 'correct'
                      ? '🎉 Correct!'
                      : answerState === 'timeout'
                      ? "⏰ Time's Up!"
                      : '❌ Not Quite!'}
                    {answerState === 'wrong' && selectedOption !== null && (
                      <span className="font-normal text-sm ml-2" style={{ color: '#6e6e73' }}>
                        You chose {OPTION_LETTERS[selectedOption]} — correct was {OPTION_LETTERS[currentQuestion.correctAnswer]}
                      </span>
                    )}
                  </p>
                  <p className="text-base leading-relaxed" style={{ color: '#3a3a3a' }}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Power-ups + Progress Dots Row ── */}
        <div className="flex items-center justify-between gap-4">
          {/* Power-ups */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-wider hidden sm:block" style={{ color: '#aeaeb2' }}>POWER-UPS</span>

            {/* 50-50 button */}
            <button
              onClick={handleFiftyFifty}
              disabled={fiftyUsedGlobal || answerState !== 'idle'}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:scale-100"
              style={{
                background: fiftyUsedGlobal ? '#f0f0f3' : '#1d1d1f',
                color: fiftyUsedGlobal ? '#aeaeb2' : 'white',
                opacity: fiftyUsedGlobal ? 0.6 : 1,
              }}
              title={fiftyUsedGlobal ? '50:50 already used this quiz' : 'Eliminate 2 wrong answers (once per quiz)'}
            >
              {powerUpAnimation === 'fifty' && (
                <span className="absolute inset-0 rounded-xl animate-ping" style={{ background: 'rgba(29,29,31,0.3)' }} />
              )}
              <span className="text-base">⚡</span>
              <span>50 : 50</span>
              {fiftyUsedGlobal && (
                <span
                  className="ml-1 text-xs font-black px-1.5 py-0.5 rounded-md"
                  style={{ background: '#ff3b30', color: 'white', fontSize: '0.65rem', letterSpacing: '0.04em' }}
                >
                  USED
                </span>
              )}
            </button>

            {/* Hint button */}
            <button
              onClick={handleHint}
              disabled={hintUsedGlobal || answerState !== 'idle'}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:scale-100"
              style={{
                background: hintUsedGlobal ? '#f0f0f3' : '#0071e3',
                color: hintUsedGlobal ? '#aeaeb2' : 'white',
                opacity: hintUsedGlobal ? 0.6 : 1,
              }}
              title={hintUsedGlobal ? 'Hint already used this quiz' : 'Reveal a hint (once per quiz)'}
            >
              {powerUpAnimation === 'hint' && (
                <span className="absolute inset-0 rounded-xl animate-ping" style={{ background: 'rgba(0,113,227,0.3)' }} />
              )}
              <span className="text-base">💡</span>
              <span>Hint</span>
              {hintUsedGlobal && (
                <span
                  className="ml-1 text-xs font-black px-1.5 py-0.5 rounded-md"
                  style={{ background: '#ff3b30', color: 'white', fontSize: '0.65rem', letterSpacing: '0.04em' }}
                >
                  USED
                </span>
              )}
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {questions.map((_, idx) => {
              const ans = answers[idx];
              let bg = '#d2d2d7';
              if (ans) bg = ans.isCorrect ? '#34c759' : '#ff3b30';
              if (idx === currentIdx) bg = '#1d1d1f';
              return (
                <div
                  key={idx}
                  className="rounded-full transition-all duration-400"
                  style={{
                    width: idx === currentIdx ? '24px' : '9px',
                    height: '9px',
                    background: bg,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ── Power-up legend ── */}
        <div
          className="flex items-center gap-6 px-5 py-3 rounded-2xl"
          style={{ background: 'white', border: '1.5px solid #e8e8ed' }}
        >
          <span className="text-xs font-bold tracking-wider" style={{ color: '#aeaeb2' }}>POWER-UP RULES</span>
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
              style={{ background: fiftyUsedGlobal ? '#ff3b30' : '#34c759', color: 'white', fontWeight: 900 }}
            >
              {fiftyUsedGlobal ? '✕' : '1'}
            </span>
            <span className="text-xs font-semibold" style={{ color: fiftyUsedGlobal ? '#aeaeb2' : '#1d1d1f' }}>
              {fiftyUsedGlobal ? '50:50 spent' : '50:50 available'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
              style={{ background: hintUsedGlobal ? '#ff3b30' : '#0071e3', color: 'white', fontWeight: 900 }}
            >
              {hintUsedGlobal ? '✕' : '1'}
            </span>
            <span className="text-xs font-semibold" style={{ color: hintUsedGlobal ? '#aeaeb2' : '#1d1d1f' }}>
              {hintUsedGlobal ? 'Hint spent' : 'Hint available'}
            </span>
          </div>
          <span className="text-xs ml-auto" style={{ color: '#aeaeb2' }}>Each power-up can only be used once per quiz</span>
        </div>
      </div>
    </div>
  );
}
