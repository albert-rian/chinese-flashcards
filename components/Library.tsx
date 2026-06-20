'use client'

import { useState, useEffect } from 'react'
import { supabase, Lesson, Character } from '@/lib/supabase'

type LessonWithChars = Lesson & { characters: Character[] }

export default function Library({ refreshKey }: { refreshKey: number }) {
  const [groups, setGroups] = useState<LessonWithChars[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [{ data: lessonsData }, { data: charsData }] = await Promise.all([
        supabase.from('lessons').select('*'),
        supabase.from('characters').select('*').order('created_at', { ascending: true }),
      ])
      const chars = charsData || []
      const sorted = sortLessons(lessonsData || [])
      setGroups(sorted.map(l => ({
        ...l,
        characters: chars.filter(c => c.lesson_id === l.id),
      })))
      setLoading(false)
    }
    fetchAll()
  }, [refreshKey])

  function sortLessons(list: Lesson[]) {
    return [...list].sort((a, b) => {
      const na = parseFloat(a.name.match(/[\d.]+/)?.[0] ?? '999')
      const nb = parseFloat(b.name.match(/[\d.]+/)?.[0] ?? '999')
      return na !== nb ? na - nb : a.name.localeCompare(b.name)
    })
  }

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalCount = groups.reduce((s, g) => s + g.characters.length, 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64 font-bold" style={{ color: 'var(--duo-text-light)' }}>Loading…</div>
  }

  if (groups.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-6xl">📚</p>
        <p className="text-xl font-black" style={{ color: 'var(--duo-text)' }}>No characters yet</p>
        <p className="font-semibold" style={{ color: 'var(--duo-text-light)' }}>Add your first character using the + tab.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-3">
      {/* Total badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="font-black text-2xl" style={{ color: 'var(--duo-text)' }}>{totalCount}</span>
        <span className="font-bold text-sm" style={{ color: 'var(--duo-text-light)' }}>characters · {groups.length} lessons</span>
      </div>

      {/* Accordion */}
      {groups.map(group => {
        const isOpen = expanded.has(group.id)
        return (
          <div key={group.id} className="duo-card overflow-hidden">
            {/* Header */}
            <button
              onClick={() => toggle(group.id)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{
                background: isOpen ? 'var(--duo-green)' : 'white',
                borderBottom: isOpen ? '3px solid var(--duo-green-dark)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                className="font-black text-sm"
                style={{ color: isOpen ? 'white' : 'var(--duo-text)' }}
              >
                {group.name}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: isOpen ? 'rgba(255,255,255,0.25)' : 'var(--duo-bg)',
                    color: isOpen ? 'white' : 'var(--duo-text-light)',
                  }}
                >
                  {group.characters.length}
                </span>
                <span
                  className="text-sm font-black"
                  style={{ color: isOpen ? 'white' : 'var(--duo-text-light)' }}
                >
                  {isOpen ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {/* Table */}
            {isOpen && group.characters.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F0FFF0', borderBottom: '2px solid var(--duo-border)' }}>
                    {['Hanzi', 'Pinyin', 'English', 'Indonesian'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--duo-green-dark)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.characters.map((char, i) => (
                    <tr
                      key={char.id}
                      style={{
                        background: i % 2 === 0 ? 'white' : '#F8FBFF',
                        borderBottom: '1.5px solid var(--duo-border)',
                      }}
                    >
                      <td className="px-3 py-2 text-2xl font-black" style={{ color: 'var(--duo-text)' }}>{char.hanzi}</td>
                      <td className="px-3 py-2 text-sm font-bold" style={{ color: 'var(--duo-blue)' }}>{char.pinyin}</td>
                      <td className="px-3 py-2 text-sm font-semibold" style={{ color: 'var(--duo-text)' }}>{char.english}</td>
                      <td className="px-3 py-2 text-sm font-semibold" style={{ color: 'var(--duo-text-light)' }}>{char.indonesian}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {isOpen && group.characters.length === 0 && (
              <div className="px-4 py-5 text-center">
                <p className="text-sm font-bold" style={{ color: 'var(--duo-text-light)' }}>No characters in this lesson yet.</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
