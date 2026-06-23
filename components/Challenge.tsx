'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, Character } from '@/lib/supabase'

type Mode = 'en-zh' | 'zh-en'
type Phase = 'select' | 'quiz' | 'complete'
type Option = { id: string; hanzi: string; pinyin: string; english: string }
type Question = { prompt: string; promptPinyin?: string; options: Option[]; correctIndex: number }

function buildQuestions(chars: Character[], mode: Mode): Question[] {
  if (chars.length < 4) return []
  const shuffled = [...chars].sort(() => Math.random() - 0.5)
  const count = Math.min(10, Math.floor(chars.length / 4))
  const targets = shuffled.slice(0, count)
  const pool = shuffled.slice(count)

  return targets.map((target, qi) => {
    const d = [
      pool[(qi * 3) % pool.length],
      pool[(qi * 3 + 1) % pool.length],
      pool[(qi * 3 + 2) % pool.length],
    ].filter((x, idx, arr) =>
      x.id !== target.id && arr.findIndex(y => y.id === x.id) === idx
    )
    const opts = [target, ...d.slice(0, 3)].sort(() => Math.random() - 0.5)
    return {
      prompt: mode === 'en-zh' ? target.english : target.hanzi,
      promptPinyin: mode === 'zh-en' ? target.pinyin : undefined,
      options: opts.map(c => ({ id: c.id, hanzi: c.hanzi, pinyin: c.pinyin, english: c.english })),
      correctIndex: opts.findIndex(o => o.id === target.id),
    }
  })
}

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 65 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: ['#58CC02', '#1CB0F6', '#FF4B4B', '#FFC800', '#CE82FF', '#FF9600'][i % 6],
      delay: Math.random() * 2.5,
      duration: 2.5 + Math.random() * 2,
      size: 7 + Math.floor(Math.random() * 9),
      round: Math.random() > 0.5,
    }))
  ).current

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? '50%' : '3px',
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in both`,
          }}
        />
      ))}
    </div>
  )
}

export default function Challenge({ refreshKey }: { refreshKey: number }) {
  const [allChars, setAllChars] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('select')
  const [mode, setMode] = useState<Mode>('en-zh')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    supabase.from('characters').select('*').then(({ data }) => {
      setAllChars(data || [])
      setLoading(false)
    })
  }, [refreshKey])

  function startQuiz(m: Mode) {
    setMode(m)
    setQuestions(buildQuestions(allChars, m))
    setCurrentIndex(0)
    setSelected(null)
    setScore(0)
    setPhase('quiz')
  }

  function handleSelect(i: number) {
    if (selected !== null) return
    setSelected(i)
    if (i === questions[currentIndex].correctIndex) setScore(s => s + 1)
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(idx => idx + 1)
      setSelected(null)
    } else {
      setPhase('complete')
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-black" style={{ color: 'var(--duo-text-light)' }}>
        Loading…
      </div>
    )
  }

  // ── Not enough words ──
  if (allChars.length < 4) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-6xl">📚</p>
        <p className="text-xl font-black" style={{ color: 'var(--duo-text)' }}>Not enough words yet</p>
        <p className="font-semibold" style={{ color: 'var(--duo-text-light)' }}>Add at least 4 characters to start a challenge.</p>
      </div>
    )
  }

  // ── Selection screen ──
  if (phase === 'select') {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <p style={{ fontSize: '3.5rem', lineHeight: 1 }}>🎯</p>
          <h1 className="text-3xl font-black" style={{ color: 'var(--duo-text)' }}>Challenge</h1>
          <p className="font-semibold" style={{ color: 'var(--duo-text-light)' }}>
            {allChars.length} words · 10 questions
          </p>
        </div>

        <div className="space-y-3">
          {([
            {
              m: 'en-zh' as Mode,
              badge: 'EN',
              badgeColor: '#1CB0F6',
              title: 'English → Chinese',
              desc: 'See English, pick the right Hanzi',
            },
            {
              m: 'zh-en' as Mode,
              badge: '汉',
              badgeColor: '#58CC02',
              title: 'Chinese → English',
              desc: 'See Hanzi, pick the right meaning',
            },
          ] as const).map(opt => (
            <button
              key={opt.m}
              onClick={() => startQuiz(opt.m)}
              style={{
                width: '100%',
                height: '80px',
                padding: '0 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                textAlign: 'left',
                background: 'white',
                border: '2.5px solid var(--duo-border)',
                borderBottom: '4px solid var(--duo-border)',
                borderRadius: '20px',
                boxShadow: '0 2px 0 var(--duo-border)',
                fontFamily: 'inherit',
                transition: 'transform 0.08s, border-bottom 0.08s',
                flexShrink: 0,
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.borderBottomWidth = '1px' }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderBottomWidth = '4px' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderBottomWidth = '4px' }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: opt.badgeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'white',
                fontWeight: 900,
                fontSize: opt.m === 'zh-en' ? '1.4rem' : '0.9rem',
                letterSpacing: opt.m === 'en-zh' ? '-0.5px' : '0',
              }}>
                {opt.badge}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black" style={{ fontSize: '1rem', color: 'var(--duo-text)', whiteSpace: 'nowrap' }}>{opt.title}</p>
                <p className="font-semibold" style={{ fontSize: '0.8rem', color: 'var(--duo-text-light)', whiteSpace: 'nowrap' }}>{opt.desc}</p>
              </div>
              <span style={{ color: 'var(--duo-text-light)', fontSize: '1.2rem', flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Complete screen ──
  if (phase === 'complete') {
    const pct = Math.round((score / questions.length) * 100)
    const medal = pct === 100 ? '🏆' : pct >= 70 ? '🥈' : pct >= 40 ? '🥉' : '📖'
    const msg = pct === 100 ? 'Perfect score!' : pct >= 70 ? 'Great job!' : pct >= 40 ? 'Good effort!' : 'Keep practicing!'

    return (
      <>
        <Confetti />
        <div className="max-w-md mx-auto px-4 py-10 text-center space-y-6">
          <p style={{ fontSize: '5rem', lineHeight: 1 }}>{medal}</p>
          <div className="space-y-1">
            <h2 className="text-3xl font-black" style={{ color: 'var(--duo-green)' }}>{msg}</h2>
            <p className="text-xl font-bold mt-2" style={{ color: 'var(--duo-text)' }}>
              {score} / {questions.length} correct
            </p>
            <p className="font-semibold" style={{ color: 'var(--duo-text-light)' }}>{pct}% accuracy</p>
          </div>

          {/* Score breakdown bar */}
          <div style={{ background: 'var(--duo-border)', borderRadius: '99px', height: '12px', overflow: 'hidden', margin: '0 1rem' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: pct >= 70 ? 'var(--duo-green)' : pct >= 40 ? 'var(--duo-yellow)' : 'var(--duo-red)',
              borderRadius: '99px',
              transition: 'width 0.8s ease',
            }} />
          </div>

          <div className="space-y-3">
            <button onClick={() => startQuiz(mode)} className="btn-duo-green">
              🔄 Try again
            </button>
            <button
              onClick={() => setPhase('select')}
              style={{
                display: 'block',
                width: '100%',
                background: 'white',
                border: '2.5px solid var(--duo-border)',
                borderBottom: '4px solid var(--duo-border)',
                borderRadius: '16px',
                padding: '0.9rem',
                fontFamily: 'inherit',
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--duo-text-light)',
                cursor: 'pointer',
              }}
            >
              ← Go back
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Quiz screen ──
  const q = questions[currentIndex]
  const progress = (currentIndex / questions.length) * 100

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">

      {/* Header: quit / counter / score */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPhase('select')}
          style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.85rem', color: 'var(--duo-text-light)', cursor: 'pointer', padding: 0 }}
        >
          ✕ Quit
        </button>
        <span className="font-black text-sm" style={{ color: 'var(--duo-text-light)' }}>
          {currentIndex + 1} / {questions.length}
        </span>
        <span className="font-black text-sm" style={{ color: 'var(--duo-green)' }}>
          ✓ {score}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--duo-border)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--duo-green)',
          borderRadius: '99px',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Question card */}
      <div className="duo-card p-5 text-center">
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'var(--duo-text-light)' }}>
          {mode === 'en-zh' ? 'Which Chinese word means…' : 'What does this mean?'}
        </p>
        {mode === 'en-zh' ? (
          <p className="text-3xl font-black" style={{ color: 'var(--duo-text)' }}>{q.prompt}</p>
        ) : (
          <>
            {q.promptPinyin && (
              <p className="font-bold mb-1" style={{ fontSize: '1.1rem', color: 'var(--duo-blue)' }}>
                {q.promptPinyin}
              </p>
            )}
            <p style={{ fontSize: '4.5rem', fontWeight: 700, color: 'var(--duo-text)', lineHeight: 1.1 }}>{q.prompt}</p>
          </>
        )}
      </div>

      {/* Options 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = i === q.correctIndex
          const revealed = selected !== null

          let bg = 'white'
          let borderColor = 'var(--duo-border)'
          let shadowColor = 'var(--duo-border)'

          if (revealed) {
            if (isCorrect) { bg = '#F0FFF0'; borderColor = 'var(--duo-green)'; shadowColor = 'var(--duo-green-dark)' }
            else if (isSelected) { bg = '#FFF0F0'; borderColor = 'var(--duo-red)'; shadowColor = '#EA2B2B' }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              style={{
                background: bg,
                border: `2.5px solid ${borderColor}`,
                borderBottom: `4px solid ${shadowColor}`,
                borderRadius: '16px',
                padding: mode === 'en-zh' ? '0.75rem 0.5rem' : '1rem 0.75rem',
                fontFamily: 'inherit',
                cursor: selected !== null ? 'default' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                minHeight: '88px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              {mode === 'en-zh' ? (
                <>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: revealed && isCorrect ? 'var(--duo-green)' : 'var(--duo-blue)',
                    lineHeight: 1.3,
                    display: 'block',
                  }}>
                    {opt.pinyin}
                  </span>
                  <span style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: revealed && isCorrect ? 'var(--duo-green)' : revealed && isSelected ? 'var(--duo-red)' : 'var(--duo-text)',
                    lineHeight: 1.1,
                    display: 'block',
                  }}>
                    {opt.hanzi}
                  </span>
                </>
              ) : (
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: revealed && isCorrect ? 'var(--duo-green)' : revealed && isSelected ? 'var(--duo-red)' : 'var(--duo-text)',
                  lineHeight: 1.3,
                }}>
                  {opt.english}
                </span>
              )}
              {revealed && isCorrect && (
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--duo-green)', marginTop: '2px' }}>✓</span>
              )}
              {revealed && isSelected && !isCorrect && (
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--duo-red)', marginTop: '2px' }}>✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Next / Results button */}
      {selected !== null && (
        <button onClick={handleNext} className="btn-duo-green">
          {currentIndex < questions.length - 1 ? 'Next →' : '🏁 See Results'}
        </button>
      )}
    </div>
  )
}
