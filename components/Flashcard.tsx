'use client'

import { useState, useEffect } from 'react'
import { supabase, Character } from '@/lib/supabase'

export default function Flashcard({ refreshKey }: { refreshKey: number }) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCharacters() {
      setLoading(true)
      const { data } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: true })
      setCharacters(data || [])
      setIndex(0)
      setFlipped(false)
      setLoading(false)
    }
    fetchCharacters()
  }, [refreshKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-3">
        <p className="text-5xl">📖</p>
        <p className="text-gray-600 font-medium">No characters yet</p>
        <p className="text-gray-400 text-sm">Go to "Add Character" and save your first one.</p>
      </div>
    )
  }

  const card = characters[index]

  function goNext() {
    setFlipped(false)
    setTimeout(() => setIndex((i) => (i + 1) % characters.length), 150)
  }

  function goPrev() {
    setFlipped(false)
    setTimeout(() => setIndex((i) => (i - 1 + characters.length) % characters.length), 150)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Your library</span>
        <span>{index + 1} / {characters.length}</span>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setFlipped((f) => !f)}
        className="cursor-pointer select-none"
        style={{ perspective: '1000px' }}
      >
        <div
          style={{
            transition: 'transform 0.5s',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position: 'relative',
            height: '280px',
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 bg-white border border-gray-200 rounded-3xl shadow-md flex flex-col items-center justify-center"
          >
            <p className="text-8xl font-bold text-gray-900">{card.hanzi}</p>
            <p className="text-gray-400 text-sm mt-4">Tap to reveal</p>
          </div>

          {/* Back */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 bg-red-50 border border-red-100 rounded-3xl shadow-md flex flex-col items-center justify-center gap-3 px-6"
          >
            <p className="text-5xl font-bold text-red-600">{card.hanzi}</p>
            <p className="text-xl text-gray-700 font-medium">{card.pinyin}</p>
            <div className="w-full border-t border-red-100 pt-3 space-y-1 text-center">
              <p className="text-gray-800">{card.english}</p>
              <p className="text-gray-500 text-sm">{card.indonesian}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={goPrev}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={goNext}
          className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
