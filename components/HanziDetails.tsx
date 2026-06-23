'use client'

import { useEffect, useRef, useState } from 'react'
import { Character } from '@/lib/supabase'

const CJK_RE = /[一-鿿㐀-䶿]/

export default function HanziDetails({
  char,
  onClose,
  onSave,
  saving,
  alreadyInCurrentLesson,
  alreadyInOtherLessons,
}: {
  char: Character
  onClose: () => void
  onSave?: () => void
  saving?: boolean
  alreadyInCurrentLesson?: boolean
  alreadyInOtherLessons?: string[]
}) {
  const strokeRef = useRef<HTMLDivElement>(null)
  const writersRef = useRef<any[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Stroke order animation
  useEffect(() => {
    if (!strokeRef.current) return
    strokeRef.current.innerHTML = ''
    writersRef.current = []

    const cjkChars = [...char.hanzi].filter(c => CJK_RE.test(c))
    if (cjkChars.length === 0) return

    const size = cjkChars.length <= 2 ? 130 : cjkChars.length <= 4 ? 100 : 80

    import('hanzi-writer').then(({ default: HanziWriter }) => {
      cjkChars.forEach(c => {
        if (!strokeRef.current) return
        const wrap = document.createElement('div')
        wrap.style.cssText = 'display:inline-block;margin:4px'
        strokeRef.current.appendChild(wrap)
        try {
          const w = HanziWriter.create(wrap, c, {
            width: size,
            height: size,
            padding: 5,
            showOutline: true,
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 350,
            strokeColor: '#58CC02',
            outlineColor: '#DDDDDD',
          })
          w.animateCharacter()
          writersRef.current.push(w)
        } catch {
          // character not in dataset — skip silently
        }
      })
    })
  }, [char.hanzi])

  // Stop audio when sheet closes
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  async function handlePlay() {
    if (playing) return
    audioRef.current?.pause()
    setPlaying(true)
    const audio = new Audio(`/api/audio?hanzi=${encodeURIComponent(char.hanzi)}`)
    audioRef.current = audio
    audio.onended = () => setPlaying(false)
    audio.onerror = () => setPlaying(false)
    try {
      await audio.play()
    } catch {
      setPlaying(false)
    }
  }

  function handleReplay() {
    writersRef.current.forEach(w => w.animateCharacter())
  }

  const hanziSize = char.hanzi.length > 3 ? '2.8rem' : char.hanzi.length > 1 ? '4rem' : '5.5rem'

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
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
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.25rem 1.25rem 2.5rem',
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--duo-text-light)' }}>
            Character Details
          </span>
          <button
            onClick={onClose}
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

        {/* Identity card */}
        <div className="duo-card p-5 text-center mb-4 space-y-2">
          <p style={{ fontSize: hanziSize, fontWeight: 700, color: 'var(--duo-text)', lineHeight: 1.1 }}>
            {char.hanzi}
          </p>
          <p className="font-black text-xl" style={{ color: 'var(--duo-blue)' }}>{char.pinyin}</p>
          <div style={{ borderTop: '2px solid var(--duo-border)', paddingTop: '0.75rem' }}>
            <p className="font-bold" style={{ color: 'var(--duo-text)' }}>{char.english}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--duo-text-light)' }}>{char.indonesian}</p>
          </div>

          {/* Audio button */}
          <div style={{ paddingTop: '0.5rem' }}>
            <button
              onClick={handlePlay}
              disabled={playing}
              style={{
                background: playing ? '#F0FFF0' : 'white',
                border: `2px solid ${playing ? 'var(--duo-green)' : 'var(--duo-border)'}`,
                borderBottom: `4px solid ${playing ? 'var(--duo-green-dark)' : 'var(--duo-border)'}`,
                borderRadius: '14px',
                padding: '0.55rem 1.5rem',
                fontFamily: 'inherit',
                fontWeight: 800,
                fontSize: '1rem',
                color: playing ? 'var(--duo-green)' : 'var(--duo-text-light)',
                cursor: playing ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {playing ? '🔊 Playing…' : '🔊 Listen'}
            </button>
          </div>
        </div>

        {/* Stroke order */}
        <div className="duo-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-sm uppercase tracking-wider" style={{ color: 'var(--duo-text-light)' }}>
              ✏️ Stroke Order
            </p>
            <button
              onClick={handleReplay}
              style={{
                background: '#F0FFF0',
                border: '2px solid var(--duo-green)',
                borderRadius: '10px',
                padding: '0.25rem 0.75rem',
                fontFamily: 'inherit',
                fontWeight: 800,
                fontSize: '0.8rem',
                color: 'var(--duo-green)',
                cursor: 'pointer',
              }}
            >
              ▶ Replay
            </button>
          </div>
          <div
            ref={strokeRef}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              minHeight: '130px',
            }}
          />
        </div>

        {/* Save section (Add tab only) */}
        {onSave && (
          <div className="space-y-2 pt-1">
            {alreadyInCurrentLesson && (
              <div style={{ background: '#FFF0F0', border: '2px solid var(--duo-red)', borderRadius: '12px', padding: '0.65rem 0.9rem' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--duo-red)' }}>
                  ⚠️ "{char.hanzi}" is already in this lesson.
                </p>
              </div>
            )}
            {!alreadyInCurrentLesson && alreadyInOtherLessons && alreadyInOtherLessons.length > 0 && (
              <div style={{ background: '#FFFBEB', border: '2px solid #F59E0B', borderRadius: '12px', padding: '0.65rem 0.9rem' }}>
                <p className="text-sm font-bold" style={{ color: '#92400E' }}>
                  ℹ️ "{char.hanzi}" already exists in: {alreadyInOtherLessons.join(', ')}.
                </p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: '#B45309' }}>
                  You can still add it to the selected lesson.
                </p>
              </div>
            )}
            <button
              onClick={onSave}
              disabled={saving || alreadyInCurrentLesson}
              className="btn-duo-green"
            >
              {saving ? 'Saving…' : '💾 Save to Library'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
