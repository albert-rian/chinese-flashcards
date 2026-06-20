'use client'

import { useState, useEffect } from 'react'
import { supabase, Character } from '@/lib/supabase'

export default function Library({ refreshKey }: { refreshKey: number }) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCharacters() {
      setLoading(true)
      const { data } = await supabase.from('characters').select('*').order('created_at', { ascending: true })
      setCharacters(data || [])
      setLoading(false)
    }
    fetchCharacters()
  }, [refreshKey])

  if (loading) {
    return <div className="flex items-center justify-center h-64 font-bold" style={{ color: 'var(--duo-text-light)' }}>Loading...</div>
  }

  if (characters.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-6xl">📚</p>
        <p className="text-xl font-black" style={{ color: 'var(--duo-text)' }}>No characters yet</p>
        <p className="font-semibold" style={{ color: 'var(--duo-text-light)' }}>Add your first character using the + tab.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-5">
      {/* Count badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-black text-2xl" style={{ color: 'var(--duo-text)' }}>{characters.length}</span>
        <span className="font-bold text-sm" style={{ color: 'var(--duo-text-light)' }}>characters saved</span>
      </div>

      {/* Table */}
      <div className="duo-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--duo-green)', borderBottom: '3px solid var(--duo-green-dark)' }}>
              {['Hanzi', 'Pinyin', 'English', 'Indonesian'].map(h => (
                <th key={h} className="text-left px-3 py-3 text-xs font-black uppercase tracking-wider text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {characters.map((char, i) => (
              <tr
                key={char.id}
                style={{
                  background: i % 2 === 0 ? 'white' : '#F8FBFF',
                  borderBottom: '2px solid var(--duo-border)',
                }}
              >
                <td className="px-3 py-3 text-2xl font-black" style={{ color: 'var(--duo-text)' }}>{char.hanzi}</td>
                <td className="px-3 py-2 text-sm font-bold" style={{ color: 'var(--duo-blue)' }}>{char.pinyin}</td>
                <td className="px-3 py-2 text-sm font-semibold" style={{ color: 'var(--duo-text)' }}>{char.english}</td>
                <td className="px-3 py-2 text-sm font-semibold" style={{ color: 'var(--duo-text-light)' }}>{char.indonesian}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
