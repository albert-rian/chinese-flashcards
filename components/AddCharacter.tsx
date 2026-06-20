'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type LookupResult = {
  hanzi: string
  pinyin: string
  english: string
  indonesian: string
}

export default function AddCharacter({ onSaved }: { onSaved: () => void }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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
    if (!result) return
    setSaving(true)
    setError('')
    const { error: dbError } = await supabase.from('characters').upsert({
      hanzi: result.hanzi,
      pinyin: result.pinyin,
      english: result.english,
      indonesian: result.indonesian,
    })
    setSaving(false)
    if (dbError) {
      setError('Failed to save: ' + dbError.message)
    } else {
      setSuccessMsg(`"${result.hanzi}" saved to your library!`)
      setInput('')
      setResult(null)
      onSaved()
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black" style={{ color: 'var(--duo-text)' }}>Add a Character</h2>
        <p className="text-sm font-semibold mt-1" style={{ color: 'var(--duo-text-light)' }}>
          Type any Hanzi — we'll find the rest!
        </p>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="e.g. 你"
          className="flex-1 text-3xl text-center outline-none"
          style={{
            background: 'white',
            border: '2.5px solid var(--duo-border)',
            borderBottom: '4px solid var(--duo-border)',
            borderRadius: '16px',
            padding: '0.75rem',
            fontFamily: 'inherit',
            fontWeight: 800,
            color: 'var(--duo-text)',
          }}
        />
        <button
          onClick={handleLookup}
          disabled={loading || !input.trim()}
          className="btn-duo-green"
          style={{ width: 'auto', padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
        >
          {loading ? '...' : '🔍 Look Up'}
        </button>
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
          {/* Big hanzi */}
          <div className="text-center py-2">
            <p className="font-black" style={{ fontSize: '5rem', color: 'var(--duo-text)', lineHeight: 1 }}>{result.hanzi}</p>
          </div>

          {/* Details */}
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
            {saving ? 'Saving...' : '💾 Save to Library'}
          </button>
        </div>
      )}
    </div>
  )
}
