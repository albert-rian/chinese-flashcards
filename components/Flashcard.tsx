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

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>

  if (allCards.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-3">
        <p className="text-5xl">📖</p>
        <p className="text-gray-600 font-medium">No characters yet</p>
        <p className="text-gray-400 text-sm">Go to the + tab and save your first one.</p>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-6xl">🎉</p>
        <p className="text-2xl font-bold text-gray-800">You remembered them all!</p>
        <p className="text-gray-400 text-sm">Reshuffling in a moment...</p>
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
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{rememberedCount}</p>
          <p className="text-xs text-green-500 mt-0.5">
            Remembered · {total > 0 ? Math.round(rememberedCount / total * 100) : 0}%
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{relearnCount}</p>
          <p className="text-xs text-red-400 mt-0.5">
            Relearn · {total > 0 ? Math.round(relearnCount / total * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Cards left + Shuffle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{deck.length} cards left</span>
        <button
          onClick={() => { setDeck(prev => shuffle([...prev])); setFlipped(false) }}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-xl hover:bg-gray-100"
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
          className="absolute left-4 top-6 z-10 font-bold text-green-500 text-lg border-2 border-green-500 rounded-lg px-2 py-1 pointer-events-none"
          style={{ opacity: dragX > 20 ? Math.min(dragX / 80, 1) : 0, transform: 'rotate(-20deg)' }}
        >
          KNOW ✓
        </div>

        {/* RELEARN label */}
        <div
          className="absolute right-4 top-6 z-10 font-bold text-red-500 text-lg border-2 border-red-500 rounded-lg px-2 py-1 pointer-events-none"
          style={{ opacity: dragX < -20 ? Math.min(-dragX / 80, 1) : 0, transform: 'rotate(20deg)' }}
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
            <div className="absolute inset-0 rounded-3xl z-10 pointer-events-none" style={{ backgroundColor: overlayColor }} />
          )}

          {/* Front */}
          {!flipped && (
            <div
              className="absolute inset-0 bg-white border border-gray-200 rounded-3xl shadow-md flex flex-col items-center justify-center"
              style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.15s ease' }}
            >
              <p className="text-8xl font-bold text-gray-900">{card.hanzi}</p>
              <p className="text-gray-400 text-sm mt-4">Tap to reveal · Swipe to judge</p>
            </div>
          )}

          {/* Back */}
          {flipped && (
            <div
              className="absolute inset-0 bg-red-50 border border-red-100 rounded-3xl shadow-md flex flex-col items-center justify-center gap-3 px-6"
              style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.15s ease' }}
            >
              <p className="text-5xl font-bold text-red-600">{card.hanzi}</p>
              <p className="text-xl text-gray-700 font-medium">{card.pinyin}</p>
              <div className="w-full border-t border-red-100 pt-3 space-y-1 text-center">
                <p className="text-gray-800">{card.english}</p>
                <p className="text-gray-500 text-sm">{card.indonesian}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => doSwipe('left')}
          className="flex-1 border-2 border-red-300 text-red-400 py-3 rounded-xl font-medium hover:bg-red-50 transition-colors"
        >
          ✗ Relearn
        </button>
        <button
          onClick={() => doSwipe('right')}
          className="flex-1 border-2 border-green-300 text-green-500 py-3 rounded-xl font-medium hover:bg-green-50 transition-colors"
        >
          ✓ Know it
        </button>
      </div>
    </div>
  )
}
