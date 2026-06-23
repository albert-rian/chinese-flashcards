'use client'

import { useEffect, useRef, useState } from 'react'
import { Character } from '@/lib/supabase'

type Sentence = {
  chinese: string
  pinyin: string
  english: string
  indonesian: string
}

const CJK_RE = /[一-鿿㐀-䶿]/

export default function HanziDetails({ char, onClose }: { char: Character; onClose: () => void }) {
  const strokeRef = useRef<HTMLDivElement>(null)
  const writersRef = useRef<any[]>([])
  const [sentences, setSentences] = useState<Sentence[] | null>(null)
  const [sentenceState, setSentenceState] = useState<'loading' | 'ok' | 'no_key' | 'error'>('loading')

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Stroke order
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

  // Sample sentences
  useEffect(() => {
    setSentenceState('loading')
    setSentences(null)
    const params = new URLSearchParams({
      hanzi: char.hanzi,
      english: char.english,
      pinyin: char.pinyin,
    })
    fetch(`/api/sentences?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error === 'no_key') { setSentenceState('no_key'); return }
        if (data.error) { setSentenceState('error'); return }
        setSentences(data.sentences || null)
        setSentenceState('ok')
      })
      .catch(() => setSentenceState('error'))
  }, [char.hanzi, char.english, char.pinyin])

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
          <p style={{ fontSize: hanziSize, fontWeight: 900, color: 'var(--duo-text)', lineHeight: 1.1 }}>
            {char.hanzi}
          </p>
          <p className="font-black text-xl" style={{ color: 'var(--duo-blue)' }}>{char.pinyin}</p>
          <div style={{ borderTop: '2px solid var(--duo-border)', paddingTop: '0.75rem' }}>
            <p className="font-bold" style={{ color: 'var(--duo-text)' }}>{char.english}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--duo-text-light)' }}>{char.indonesian}</p>
          </div>
        </div>

        {/* Stroke order */}
        <div className="duo-card p-4 mb-4">
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

        {/* Sample sentences */}
        <div className="duo-card p-4">
          <p className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: 'var(--duo-text-light)' }}>
            💬 Sample Sentences
          </p>

          {sentenceState === 'loading' && (
            <div className="text-center py-4">
              <p className="text-sm font-bold" style={{ color: 'var(--duo-text-light)' }}>Generating sentences…</p>
            </div>
          )}

          {sentenceState === 'no_key' && (
            <div style={{ background: '#FFF8E1', border: '2px solid #FFC800', borderRadius: '12px', padding: '0.75rem 1rem' }}>
              <p className="text-sm font-bold" style={{ color: '#B8860B' }}>
                Add <code>ANTHROPIC_API_KEY</code> to your environment variables to enable sample sentences.
              </p>
            </div>
          )}

          {sentenceState === 'error' && (
            <p className="text-sm font-semibold text-center" style={{ color: 'var(--duo-text-light)' }}>
              Could not generate sentences. Try again later.
            </p>
          )}

          {sentenceState === 'ok' && sentences && (
            <div className="space-y-4">
              {sentences.map((s, i) => (
                <div
                  key={i}
                  style={{
                    borderBottom: i < sentences.length - 1 ? '2px solid var(--duo-border)' : 'none',
                    paddingBottom: i < sentences.length - 1 ? '1rem' : 0,
                  }}
                >
                  <p className="font-black text-lg" style={{ color: 'var(--duo-text)' }}>{s.chinese}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--duo-blue)' }}>{s.pinyin}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--duo-text)' }}>{s.english}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--duo-text-light)' }}>{s.indonesian}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
