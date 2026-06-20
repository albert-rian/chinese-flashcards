'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, Character } from '@/lib/supabase'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Flashcard({ refreshKey }: { refreshKey: number }) {
  const [allCards, setAllCards] = useState<Character[]>([])
  const [deck, setDeck] = useState<Character[]>([])
  const [rememberedSet, setRememberedSet] = useState(new Set<string>())
  const [relearnSet, setRelearnSet] = useState(new Set<string>())
  const [flipped, setFlipped] = useState(false)
  const [fading, setFading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    async function fetchCharacters() {
      setLoading(true)
      const { data } = await supabase.from('characters').select('*').order('created_at', { ascending: true })
      const cards = data || []
      setAllCards(cards)
      setDeck(shuffle(cards))
      setRememberedSet(new Set())
      setRelearnSet(new Set())
      setFlipped(false)
      setCompleted(false)
      setLoading(false)
    }
    fetchCharacters()
  }, [refreshKey])

  useEffect(() => {
    if (!completed) return
    const t = setTimeout(() => {
      setDeck(shuffle([...allCards]))
      setRememberedSet(new Set())
      setRelearnSet(new Set())
      setCompleted(false)
      setFlipped(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [completed, allCards])

  function handleFlip() {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      setFlipped(f => !f)
      setFading(false)
    }, 150)
  }

  function doSwipe(dir: 'left' | 'right') {
    if (!deck.length || exiting) return
    const card = deck[0]
    setExiting(dir)
    setTimeout(() => {
      if (dir === 'right') {
        setRememberedSet(prev => new Set([...prev, card.hanzi]))
        setRelearnSet(prev => { const n = new Set(prev); n.delete(card.hanzi); return n })
        setDeck(prev => {
          const next = prev.slice(1)
          if (next.length === 0) setCompleted(true)
          return next
        })
      } else {
        setRelearnSet(prev => new Set([...prev, card.hanzi]))
        setDeck(prev => [...prev.slice(1), card])
      }
      setFlipped(false)
      setDragX(0)
      setExiting(null)
    }, 300)
  }

  function onDragStart(clientX: number) {
    if (exiting) return
    startXRef.current = clientX
    isDraggingRef.current = true
    setIsDragging(true)
  }

  function onDragMove(clientX: number) {
    if (!isDraggingRef.current) return
    setDragX(clientX - startXRef.current)
  }

  function onDragEnd() {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    if (dragX > 80) doSwipe('right')
    else if (dragX < -80) doSwipe('left')
    else setDragX(0)
  }

  function getCardStyle(): React.CSSProperties {
    if (exiting === 'right') return { transform: 'translateX(130%) rotate(20deg)', opacity: 0, transition: 'all 0.3s ease' }
    if (exiting === 'left') return { transform: 'translateX(-130%) rotate(-20deg)', opacity: 0, transition: 'all 0.3s ease' }
    if (isDragging) return { transform: `translateX(${dragX}px) rotate(${dragX * 0.08}deg)`, transition: 'none' }
    return { transform: 'translateX(0) rotate(0deg)', transition: 'transform 0.3s ease' }
  }

  const overlayOpacity = Math.min(Math.abs(dragX) / 150, 0.65)
  const overlayColor = dragX > 0 ? `rgba(34,197,94,${overlayOpacity})` : `rgba(239,68,68,${overlayOpacity})`

  if (loading) return (
    <div className="flex items-center justify-center h-64 font-black" style={{ color: 'var(--duo-text-light)' }}>Loading...</div>
  )

  if (allCards.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-6xl">📖</p>
        <p className="text-xl font-black" style={{ color: 'var(--duo-text)' }}>No characters yet</p>
        <p className="font-semibold" style={{ color: 'var(--duo-text-light)' }}>Go to the + tab and save your first one.</p>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-7xl">🎉</p>
        <p className="text-2xl font-black" style={{ color: 'var(--duo-green)' }}>You remembered them all!</p>
        <p className="font-bold" style={{ color: 'var(--duo-text-light)' }}>Reshuffling in a moment...</p>
      </div>
    )
  }

  const card = deck[0]
  const total = allCards.length
  const rememberedCount = rememberedSet.size
  const relearnCount = relearnSet.size

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 select-none">

      {/* Tracker */}
      <div className="grid grid-cols-2 gap-3">
        <div className="duo-card p-3 text-center" style={{ borderColor: '#77DD77', boxShadow: '0 3px 0 #46A302' }}>
          <p className="text-3xl font-black" style={{ color: 'var(--duo-green)' }}>{rememberedCount}</p>
          <p className="text-xs font-black uppercase tracking-wide mt-0.5" style={{ color: 'var(--duo-green)' }}>
            Remembered · {total > 0 ? Math.round(rememberedCount / total * 100) : 0}%
          </p>
        </div>
        <div className="duo-card p-3 text-center" style={{ borderColor: '#FFB3B3', boxShadow: '0 3px 0 #EA2B2B' }}>
          <p className="text-3xl font-black" style={{ color: 'var(--duo-red)' }}>{relearnCount}</p>
          <p className="text-xs font-black uppercase tracking-wide mt-0.5" style={{ color: 'var(--duo-red)' }}>
            Relearn · {total > 0 ? Math.round(relearnCount / total * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Cards left + Shuffle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: 'var(--duo-text-light)' }}>{deck.length} cards left</span>
        <button
          onClick={() => { setDeck(prev => shuffle([...prev])); setFlipped(false) }}
          className="flex items-center gap-1.5 px-4 py-2 font-black text-sm"
          style={{
            background: 'white',
            border: '2.5px solid var(--duo-border)',
            borderBottom: '4px solid var(--duo-border)',
            borderRadius: '12px',
            color: 'var(--duo-text-light)',
          }}
        >
          🔀 Shuffle
        </button>
      </div>

      {/* Card area */}
      <div
        className="relative h-72"
        onMouseDown={e => onDragStart(e.clientX)}
        onMouseMove={e => { if (isDraggingRef.current) onDragMove(e.clientX) }}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchMove={e => { e.preventDefault(); onDragMove(e.touches[0].clientX) }}
        onTouchEnd={onDragEnd}
      >
        {/* KNOW label */}
        <div
          className="absolute left-4 top-6 z-10 text-lg pointer-events-none"
          style={{
            opacity: dragX > 20 ? Math.min(dragX / 80, 1) : 0,
            transform: 'rotate(-20deg)',
            color: 'var(--duo-green)',
            border: '3px solid var(--duo-green)',
            borderRadius: '10px',
            padding: '2px 10px',
            fontWeight: 900,
            background: 'white',
          }}
        >
          KNOW ✓
        </div>

        {/* RELEARN label */}
        <div
          className="absolute right-4 top-6 z-10 text-lg pointer-events-none"
          style={{
            opacity: dragX < -20 ? Math.min(-dragX / 80, 1) : 0,
            transform: 'rotate(20deg)',
            color: 'var(--duo-red)',
            border: '3px solid var(--duo-red)',
            borderRadius: '10px',
            padding: '2px 10px',
            fontWeight: 900,
            background: 'white',
          }}
        >
          RELEARN ✗
        </div>

        {/* Card */}
        <div
          className="absolute inset-0 cursor-pointer"
          style={getCardStyle()}
          onClick={() => { if (Math.abs(dragX) < 5) handleFlip() }}
        >
          {/* Color overlay when dragging */}
          {isDragging && dragX !== 0 && (
            <div className="absolute inset-0 z-10 pointer-events-none" style={{ backgroundColor: overlayColor, borderRadius: '20px' }} />
          )}

          {/* Front */}
          {!flipped && (
            <div
              className="duo-card absolute inset-0 flex flex-col items-center justify-center"
              style={{
                opacity: fading ? 0 : 1,
                transition: 'opacity 0.15s ease',
                boxShadow: '0 4px 0 var(--duo-border)',
              }}
            >
              <p style={{ fontSize: '5.5rem', fontWeight: 900, color: 'var(--duo-text)', lineHeight: 1 }}>{card.hanzi}</p>
              <p className="text-sm font-bold mt-4" style={{ color: 'var(--duo-text-light)' }}>Tap to reveal · Swipe to judge</p>
            </div>
          )}

          {/* Back */}
          {flipped && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6"
              style={{
                opacity: fading ? 0 : 1,
                transition: 'opacity 0.15s ease',
                background: '#F0FFF0',
                border: '2px solid #77DD77',
                borderRadius: '20px',
                boxShadow: '0 4px 0 var(--duo-green-dark)',
              }}
            >
              <p style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--duo-green)', lineHeight: 1 }}>{card.hanzi}</p>
              <p className="font-black text-xl" style={{ color: 'var(--duo-blue)' }}>{card.pinyin}</p>
              <div className="w-full pt-3 space-y-1 text-center" style={{ borderTop: '2px solid #CCEECC' }}>
                <p className="font-bold" style={{ color: 'var(--duo-text)' }}>{card.english}</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--duo-text-light)' }}>{card.indonesian}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={() => doSwipe('left')} className="btn-duo-outline-red flex-1">
          ✗ Relearn
        </button>
        <button onClick={() => doSwipe('right')} className="btn-duo-outline-green flex-1">
          ✓ Know it
        </button>
      </div>
    </div>
  )
}
