'use client'

import { useState, useEffect } from 'react'
import { supabase, Lesson } from '@/lib/supabase'

type LookupResult = {
  hanzi: string
  pinyin: string
  english: string
  indonesian: string
}

export default function AddCharacter({ onSaved }: { onSaved: () => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [showNewLesson, setShowNewLesson] = useState(false)
  const [newLessonName, setNewLessonName] = useState('')
  const [creatingLesson, setCreatingLesson] = useState(false)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchLessons()
  }, [])

  async function fetchLessons() {
    const { data } = await supabase.from('lessons').select('*')
    const sorted = sortLessons(data || [])
    setLessons(sorted)
  }

  function sortLessons(list: Lesson[]) {
    return [...list].sort((a, b) => {
      const na = parseFloat(a.name.match(/[\d.]+/)?.[0] ?? '999')
      const nb = parseFloat(b.name.match(/[\d.]+/)?.[0] ?? '999')
      return na !== nb ? na - nb : a.name.localeCompare(b.name)
    })
  }

  async function handleCreateLesson() {
    if (!newLessonName.trim()) return
    setCreatingLesson(true)
    const { data, error: err } = await supabase
      .from('lessons')
      .insert({ name: newLessonName.trim() })
      .select()
      .single()
    setCreatingLesson(false)
    if (err) { setError('Could not create lesson: ' + err.message); return }
    const updated = sortLessons([...lessons, data])
    setLessons(updated)
    setSelectedLessonId(data.id)
    setNewLessonName('')
    setShowNewLesson(false)
  }

  async function handleLookup() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/lookup?hanzi=${encodeURIComponent(input.trim())}`)
      const data = await res.json()
      if (data.error) setError(data.error)
      else setResult(data)
    } catch {
      setError('Failed to look up character. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result || !selectedLessonId) return
    setSaving(true)
    setError('')
    const { error: dbError } = await supabase.from('characters').upsert({
      hanzi: result.hanzi,
      pinyin: result.pinyin,
      english: result.english,
      indonesian: result.indonesian,
      lesson_id: selectedLessonId,
    }, { onConflict: 'hanzi,lesson_id' })
    setSaving(false)
    if (dbError) {
      setError('Failed to save: ' + dbError.message)
    } else {
      setSuccessMsg(`"${result.hanzi}" saved to library!`)
      setInput('')
      setResult(null)
      onSaved()
    }
  }

  const selectedLesson = lessons.find(l => l.id === selectedLessonId)?.name

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">

      {/* ── Lesson Manager ── */}
      <div className="duo-card p-4 space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider" style={{ color: 'var(--duo-text-light)' }}>
          Lesson
        </h2>

        {/* Dropdown row */}
        <div className="flex gap-2">
          <select
            value={selectedLessonId}
            onChange={e => setSelectedLessonId(e.target.value)}
            style={{
              flex: 1,
              background: 'white',
              border: '2.5px solid var(--duo-border)',
              borderBottom: '4px solid var(--duo-border)',
              borderRadius: '14px',
              padding: '0.6rem 0.75rem',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: selectedLessonId ? 'var(--duo-text)' : 'var(--duo-text-light)',
              outline: 'none',
            }}
          >
            <option value="">Select a lesson…</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

        </div>

        {/* New lesson toggle */}
        {!showNewLesson ? (
          <button
            onClick={() => setShowNewLesson(true)}
            className="btn-duo-outline-green"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            + New Lesson
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newLessonName}
              onChange={e => setNewLessonName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateLesson()}
              placeholder="e.g. Lesson 14 – Travel"
              style={{
                flex: 1,
                background: 'white',
                border: '2.5px solid var(--duo-border)',
                borderBottom: '4px solid var(--duo-border)',
                borderRadius: '12px',
                padding: '0.55rem 0.75rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--duo-text)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCreateLesson}
              disabled={creatingLesson || !newLessonName.trim()}
              className="btn-duo-green"
              style={{ fontSize: '0.85rem', padding: '0.55rem 0.9rem', width: 'auto' }}
            >
              {creatingLesson ? '…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowNewLesson(false); setNewLessonName('') }}
              style={{
                background: 'white',
                border: '2.5px solid var(--duo-border)',
                borderBottom: '4px solid var(--duo-border)',
                borderRadius: '12px',
                padding: '0.55rem 0.75rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--duo-text-light)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── Add Character Form ── */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-black" style={{ color: 'var(--duo-text)' }}>Add a Character</h2>
          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--duo-text-light)' }}>
            {selectedLessonId
              ? `Adding to "${selectedLesson}"`
              : 'Select a lesson above first'}
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            placeholder="e.g. 你"
            disabled={!selectedLessonId}
            className="flex-1 text-3xl text-center outline-none"
            style={{
              background: selectedLessonId ? 'white' : '#F8F8F8',
              border: '2.5px solid var(--duo-border)',
              borderBottom: '4px solid var(--duo-border)',
              borderRadius: '16px',
              padding: '0.75rem',
              fontFamily: 'inherit',
              fontWeight: 800,
              color: 'var(--duo-text)',
              opacity: selectedLessonId ? 1 : 0.5,
            }}
          />
          <button
            onClick={handleLookup}
            disabled={loading || !input.trim() || !selectedLessonId}
            className="btn-duo-green"
            style={{ width: 'auto', padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
          >
            {loading ? '…' : '🔍 Look Up'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FFF0F0', border: '2px solid var(--duo-red)', borderRadius: '16px', padding: '0.75rem 1rem' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--duo-red)' }}>{error}</p>
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#F0FFF0', border: '2px solid var(--duo-green)', borderRadius: '16px', padding: '0.75rem 1rem' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--duo-green)' }}>✓ {successMsg}</p>
        </div>
      )}

      {result && (
        <div className="duo-card p-5 space-y-4">
          <div className="text-center py-2">
            <p className="font-black" style={{ fontSize: '5rem', color: 'var(--duo-text)', lineHeight: 1 }}>{result.hanzi}</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Pinyin', value: result.pinyin, color: 'var(--duo-blue)' },
              { label: 'English', value: result.english, color: 'var(--duo-text)' },
              { label: 'Indonesian', value: result.indonesian, color: 'var(--duo-text-light)' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3" style={{ borderBottom: '2px solid var(--duo-border)', paddingBottom: '0.5rem' }}>
                <span className="text-xs font-black w-24 shrink-0 uppercase tracking-wider" style={{ color: 'var(--duo-text-light)' }}>{row.label}</span>
                <span className="font-bold text-sm" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-duo-green">
            {saving ? 'Saving…' : '💾 Save to Library'}
          </button>
        </div>
      )}
    </div>
  )
}
