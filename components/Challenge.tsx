'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, Character, Lesson } from '@/lib/supabase'

type Mode = 'en-zh' | 'zh-en'
type Phase = 'select' | 'quiz' | 'complete'
type PinyinMode = 'always' | 'after-answer'
type Option = { id: string; hanzi: string; pinyin: string; english: string }
type Question = { prompt: string; promptPinyin?: string; options: Option[]; correctIndex: number }

const SETTINGS_KEY = 'challenge-settings'

function sortLessons(list: Lesson[]) {
  return [...list].sort((a, b) => {
    const na = parseFloat(a.name.match(/[\d.]+/)?.[0] ?? '999')
    const nb = parseFloat(b.name.match(/[\d.]+/)?.[0] ?? '999')
    return na !== nb ? na - nb : a.name.localeCompare(b.name)
  })
}

function loadSavedSettings(): { lessonIds: string[] | null; pinyinMode: PinyinMode } {
  if (typeof window === 'undefined') return { lessonIds: null, pinyinMode: 'always' }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { lessonIds: null, pinyinMode: 'always' }
    const parsed = JSON.parse(raw)
    return {
      lessonIds: Array.isArray(parsed.lessonIds) ? parsed.lessonIds : null,
      pinyinMode: parsed.pinyinMode === 'after-answer' ? 'after-answer' : 'always',
    }
  } catch {
    return { lessonIds: null, pinyinMode: 'always' }
  }
}

function persistSettings(lessonIds: string[], pinyinMode: PinyinMode) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lessonIds, pinyinMode }))
  } catch {}
}

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
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [allChars, setAllChars] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('select')
  const [mode, setMode] = useState<Mode>('en-zh')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)

  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set())
  const [pinyinMode, setPinyinMode] = useState<PinyinMode>('always')
  const [showSettings, setShowSettings] = useState(false)
  const [draftLessonIds, setDraftLessonIds] = useState<Set<string>>(new Set())
  const [draftPinyinMode, setDraftPinyinMode] = useState<PinyinMode>('always')
  const [lessonWarning, setLessonWarning] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [{ data: lessonsData }, { data: charsData }] = await Promise.all([
        supabase.from('lessons').select('*'),
        supabase.from('characters').select('*'),
      ])
      const ls = sortLessons(lessonsData || [])
      setLessons(ls)
      setAllChars(charsData || [])

      const allIds = ls.map(l => l.id)
      const saved = loadSavedSettings()
      const validSaved = (saved.lessonIds || []).filter(id => allIds.includes(id))
      setSelectedLessonIds(new Set(validSaved.length > 0 ? validSaved : allIds))
      setPinyinMode(saved.pinyinMode)

      setLoading(false)
    }
    fetchData()
  }, [refreshKey])

  const filteredChars = allChars.filter(c => selectedLessonIds.has(c.lesson_id))

  function startQuiz(m: Mode) {
    setMode(m)
    setQuestions(buildQuestions(filteredChars, m))
    setCurrentIndex(0)
    setSelected(null)
    setChecked(false)
    setScore(0)
    setPhase('quiz')
  }

  function openSettings() {
    setDraftLessonIds(new Set(selectedLessonIds))
    setDraftPinyinMode(pinyinMode)
    setLessonWarning(false)
    setShowSettings(true)
  }

  function toggleDraftLesson(id: string) {
    setLessonWarning(false)
    setDraftLessonIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSaveSettings() {
    if (draftLessonIds.size === 0) {
      setLessonWarning(true)
      return
    }
    setSelectedLessonIds(new Set(draftLessonIds))
    setPinyinMode(draftPinyinMode)
    persistSettings([...draftLessonIds], draftPinyinMode)
    setShowSettings(false)
  }

  function handleSelect(i: number) {
    if (checked) return
    setSelected(i)
  }

  function handleNext() {
    if (!checked) {
      // First press: reveal feedback and update score
      setChecked(true)
      if (selected === questions[currentIndex].correctIndex) setScore(s => s + 1)
    } else {
      // Second press: advance
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(idx => idx + 1)
        setSelected(null)
        setChecked(false)
      } else {
        setPhase('complete')
      }
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
    const notEnough = filteredChars.length < 4
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2 relative">
          <button
            onClick={openSettings}
            title="Challenge settings"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'white',
              border: '2px solid var(--duo-border)',
              borderBottom: '3px solid var(--duo-border)',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            ⚙️
          </button>
          <p style={{ fontSize: '3.5rem', lineHeight: 1 }}>🎯</p>
          <h1 className="text-3xl font-black" style={{ color: 'var(--duo-text)' }}>Challenge</h1>
          <p className="font-semibold" style={{ color: 'var(--duo-text-light)' }}>
            {filteredChars.length} words · 10 questions
          </p>
        </div>

        {notEnough && (
          <div style={{ background: '#FFF0F0', border: '2px solid var(--duo-red)', borderRadius: '16px', padding: '0.75rem 1rem' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--duo-red)' }}>
              ⚠️ Not enough words in the selected lessons. Choose more lessons in ⚙️ Settings.
            </p>
          </div>
        )}

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
              onClick={() => !notEnough && startQuiz(opt.m)}
              disabled={notEnough}
              style={{
                width: '100%',
                height: '80px',
                padding: '0 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                cursor: notEnough ? 'not-allowed' : 'pointer',
                opacity: notEnough ? 0.5 : 1,
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

        {showSettings && (
          <div
            onClick={e => { if (e.target === e.currentTarget) setShowSettings(false) }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                background: 'var(--duo-bg)',
                borderRadius: '24px 24px 0 0',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '85vh',
                overflowY: 'auto',
                padding: '1.25rem 1.25rem 2rem',
                animation: 'slideUp 0.25s ease',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--duo-text-light)' }}>
                  Challenge Settings
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    background: 'white',
                    border: '2.5px solid var(--duo-border)',
                    borderBottom: '4px solid var(--duo-border)',
                    borderRadius: '12px',
                    padding: '0.3rem 0.8rem',
                    fontFamily: 'inherit',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    color: 'var(--duo-text-light)',
                    cursor: 'pointer',
                  }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Lesson checklist */}
              <div className="duo-card p-4 mb-4">
                <p className="font-black text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--duo-text-light)' }}>
                  Lessons to include
                </p>
                <div className="space-y-0.5">
                  {lessons.map(l => {
                    const isChecked = draftLessonIds.has(l.id)
                    return (
                      <button
                        key={l.id}
                        onClick={() => toggleDraftLesson(l.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.55rem 0.25rem',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1.5px solid var(--duo-border)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: `2px solid ${isChecked ? 'var(--duo-green)' : 'var(--duo-border)'}`,
                          background: isChecked ? 'var(--duo-green)' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {isChecked && <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
                        </div>
                        <span className="font-bold text-sm" style={{ color: 'var(--duo-text)' }}>{l.name}</span>
                      </button>
                    )
                  })}
                </div>
                {lessonWarning && (
                  <p className="text-sm font-bold" style={{ color: 'var(--duo-red)', paddingTop: '0.6rem' }}>
                    ⚠️ Select at least one lesson.
                  </p>
                )}
              </div>

              {/* Pinyin display mode */}
              <div className="duo-card p-4 mb-4">
                <p className="font-black text-sm uppercase tracking-wider mb-2" style={{ color: 'var(--duo-text-light)' }}>
                  Pinyin display
                </p>
                <div className="space-y-0.5">
                  {([
                    { v: 'always' as PinyinMode, label: 'Always show pinyin above Hanzi' },
                    { v: 'after-answer' as PinyinMode, label: 'Show pinyin only after answering' },
                  ]).map(opt => {
                    const active = draftPinyinMode === opt.v
                    return (
                      <button
                        key={opt.v}
                        onClick={() => setDraftPinyinMode(opt.v)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.55rem 0.25rem',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: `2px solid ${active ? 'var(--duo-green)' : 'var(--duo-border)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {active && <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: 'var(--duo-green)' }} />}
                        </div>
                        <span className="font-bold text-sm" style={{ color: 'var(--duo-text)' }}>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button onClick={handleSaveSettings} className="btn-duo-green">
                Save Settings
              </button>
            </div>
          </div>
        )}
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
            <p className="font-bold mb-1" style={{ fontSize: '1.1rem', color: 'var(--duo-blue)', minHeight: '1.4rem' }}>
              {q.promptPinyin && (pinyinMode === 'always' || checked) ? q.promptPinyin : ' '}
            </p>
            <p style={{ fontSize: '4.5rem', fontWeight: 700, color: 'var(--duo-text)', lineHeight: 1.1 }}>{q.prompt}</p>
          </>
        )}
      </div>

      {/* Options 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = i === q.correctIndex

          let bg = 'white'
          let borderColor = 'var(--duo-border)'
          let shadowColor = 'var(--duo-border)'
          let textColor = 'var(--duo-text)'
          let pinyinColor = 'var(--duo-blue)'

          if (checked) {
            if (isCorrect) {
              bg = '#F0FFF0'; borderColor = 'var(--duo-green)'; shadowColor = 'var(--duo-green-dark)'
              textColor = 'var(--duo-green)'; pinyinColor = 'var(--duo-green)'
            } else if (isSelected) {
              bg = '#FFF0F0'; borderColor = 'var(--duo-red)'; shadowColor = '#EA2B2B'
              textColor = 'var(--duo-red)'
            }
          } else if (isSelected) {
            // Selected but not yet revealed — neutral blue highlight
            bg = '#EEF9FF'; borderColor = 'var(--duo-blue)'; shadowColor = 'var(--duo-blue-dark)'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={checked}
              style={{
                background: bg,
                border: `2.5px solid ${borderColor}`,
                borderBottom: `4px solid ${shadowColor}`,
                borderRadius: '16px',
                padding: mode === 'en-zh' ? '0.75rem 0.5rem' : '1rem 0.75rem',
                fontFamily: 'inherit',
                cursor: checked ? 'default' : 'pointer',
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
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: pinyinColor, lineHeight: 1.3, display: 'block' }}>
                    {pinyinMode === 'always' || checked ? opt.pinyin : ' '}
                  </span>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: textColor, lineHeight: 1.1, display: 'block' }}>
                    {opt.hanzi}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: textColor, lineHeight: 1.3 }}>
                  {opt.english}
                </span>
              )}
              {checked && isCorrect && (
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--duo-green)', marginTop: '2px' }}>✓</span>
              )}
              {checked && isSelected && !isCorrect && (
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--duo-red)', marginTop: '2px' }}>✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Next / Continue / Results button */}
      {selected !== null && (
        <button onClick={handleNext} className="btn-duo-green">
          {!checked
            ? 'Next →'
            : currentIndex < questions.length - 1 ? 'Continue →' : '🏁 See Results'}
        </button>
      )}
    </div>
  )
}
