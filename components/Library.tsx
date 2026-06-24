'use client'

import { useState, useEffect } from 'react'
import { supabase, Lesson, Character } from '@/lib/supabase'
import { DEMO_MODE, DEMO_MESSAGE } from '@/lib/demoMode'
import HanziDetails from './HanziDetails'
import DemoToast from './DemoToast'

type LessonWithChars = Lesson & { characters: Character[] }

type ConfirmState =
  | { type: 'lesson'; lesson: Lesson; count: number }
  | { type: 'char'; char: Character }
  | null

export default function Library({ refreshKey }: { refreshKey: number }) {
  const [groups, setGroups] = useState<LessonWithChars[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [deleting, setDeleting] = useState(false)
  const [detailChar, setDetailChar] = useState<Character | null>(null)
  const [showDemoToast, setShowDemoToast] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [refreshKey])

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

  async function openLessonDelete(lesson: Lesson) {
    if (DEMO_MODE) { setShowDemoToast(true); return }
    const { count } = await supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lesson.id)
    setConfirm({ type: 'lesson', lesson, count: count ?? 0 })
  }

  async function handleDeleteLesson() {
    if (confirm?.type !== 'lesson') return
    setDeleting(true)
    await supabase.from('lessons').delete().eq('id', confirm.lesson.id)
    setGroups(prev => prev.filter(g => g.id !== confirm.lesson.id))
    setExpanded(prev => { const n = new Set(prev); n.delete(confirm.lesson.id); return n })
    setConfirm(null)
    setDeleting(false)
  }

  async function handleDeleteChar() {
    if (confirm?.type !== 'char') return
    setDeleting(true)
    await supabase.from('characters').delete().eq('id', confirm.char.id)
    setGroups(prev => prev.map(g => ({
      ...g,
      characters: g.characters.filter(c => c.id !== confirm.char.id),
    })))
    setConfirm(null)
    setDeleting(false)
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
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: isOpen ? 'var(--duo-green)' : 'white',
                borderBottom: isOpen ? '3px solid var(--duo-green-dark)' : 'none',
              }}
            >
              <button
                onClick={() => toggle(group.id)}
                className="flex items-center gap-2 flex-1 text-left"
                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                <span className="font-black text-sm" style={{ color: isOpen ? 'white' : 'var(--duo-text)' }}>
                  {group.name}
                </span>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: isOpen ? 'rgba(255,255,255,0.25)' : 'var(--duo-bg)',
                    color: isOpen ? 'white' : 'var(--duo-text-light)',
                  }}
                >
                  {group.characters.length}
                </span>
                <span className="text-sm font-black ml-1" style={{ color: isOpen ? 'white' : 'var(--duo-text-light)' }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Delete lesson button */}
              <button
                onClick={e => { e.stopPropagation(); openLessonDelete(group) }}
                title="Delete this lesson"
                style={{
                  background: isOpen ? 'rgba(255,255,255,0.2)' : 'var(--duo-bg)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.3rem 0.55rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                  lineHeight: 1,
                }}
              >
                🗑️
              </button>
            </div>

            {/* Table */}
            {isOpen && group.characters.length > 0 && (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '480px' }}>
                <thead>
                  <tr style={{ background: '#F0FFF0', borderBottom: '2px solid var(--duo-border)' }}>
                    {[
                      { label: 'Hanzi', nowrap: true },
                      { label: 'Pinyin', nowrap: true },
                      { label: 'English', nowrap: false },
                      { label: 'Indonesian', nowrap: false },
                      { label: '', nowrap: true },
                    ].map(h => (
                      <th key={h.label} className="text-left px-3 py-2 text-xs font-black uppercase tracking-wider" style={{ color: 'var(--duo-green-dark)', whiteSpace: h.nowrap ? 'nowrap' : 'normal' }}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.characters.map((char, i) => (
                    <tr
                      key={char.id}
                      onClick={() => setDetailChar(char)}
                      style={{
                        background: i % 2 === 0 ? 'white' : '#F8FBFF',
                        borderBottom: '1.5px solid var(--duo-border)',
                        cursor: 'pointer',
                      }}
                    >
                      <td className="px-3 py-2 text-2xl font-bold" style={{ color: 'var(--duo-text)', whiteSpace: 'nowrap', width: '1%' }}>{char.hanzi}</td>
                      <td className="px-3 py-2 text-sm font-bold" style={{ color: 'var(--duo-blue)', whiteSpace: 'nowrap', width: '1%' }}>{char.pinyin}</td>
                      <td className="px-3 py-2 text-sm font-semibold" style={{ color: 'var(--duo-text)' }}>{char.english}</td>
                      <td className="px-3 py-2 text-sm font-semibold" style={{ color: 'var(--duo-text-light)' }}>{char.indonesian}</td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (DEMO_MODE) { setShowDemoToast(true); return }
                            setConfirm({ type: 'char', char })
                          }}
                          title="Delete this character"
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            opacity: 0.5,
                            padding: '0.2rem 0.4rem',
                            borderRadius: '8px',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}

            {isOpen && group.characters.length === 0 && (
              <div className="px-4 py-5 text-center">
                <p className="text-sm font-bold" style={{ color: 'var(--duo-text-light)' }}>No characters in this lesson yet.</p>
              </div>
            )}
          </div>
        )
      })}

      {/* ── Hanzi Details Sheet ── */}
      {detailChar && (
        <HanziDetails char={detailChar} onClose={() => setDetailChar(null)} />
      )}

      {/* ── Confirmation Modal ── */}
      {confirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div className="duo-card p-6 space-y-4" style={{ maxWidth: '320px', width: '100%' }}>
            {confirm.type === 'lesson' ? (
              <>
                <p className="text-xl font-black" style={{ color: 'var(--duo-text)' }}>Delete lesson?</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--duo-text-light)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--duo-text)' }}>"{confirm.lesson.name}"</span> will be deleted
                  along with <span style={{ fontWeight: 800, color: 'var(--duo-red)' }}>{confirm.count} hanzi</span>.
                  This cannot be undone.
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-black" style={{ color: 'var(--duo-text)' }}>Delete hanzi?</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--duo-text-light)' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--duo-text)' }}>{confirm.char.hanzi}</span>
                  {' '}({confirm.char.pinyin} – {confirm.char.english}) will be permanently deleted.
                </p>
              </>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                style={{
                  flex: 1,
                  background: 'white',
                  border: '2.5px solid var(--duo-border)',
                  borderBottom: '4px solid var(--duo-border)',
                  borderRadius: '14px',
                  padding: '0.65rem',
                  fontFamily: 'inherit',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--duo-text-light)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirm.type === 'lesson' ? handleDeleteLesson : handleDeleteChar}
                disabled={deleting}
                className="btn-duo-red"
                style={{ flex: 1, width: 'auto' }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDemoToast && (
        <DemoToast message={DEMO_MESSAGE} onDone={() => setShowDemoToast(false)} />
      )}
    </div>
  )
}
