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
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
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
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Add a Character</h2>
        <p className="text-sm text-gray-500">Type any Hanzi and the app will find the rest.</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="e.g. 你"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-2xl text-center focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <button
          onClick={handleLookup}
          disabled={loading || !input.trim()}
          className="bg-red-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Look Up'}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {successMsg && (
        <p className="text-green-600 text-sm font-medium">{successMsg}</p>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="text-center">
            <p className="text-6xl font-bold text-gray-900">{result.hanzi}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-400 w-24 shrink-0">Pinyin</span>
              <span className="text-gray-800 font-medium">{result.pinyin}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-24 shrink-0">English</span>
              <span className="text-gray-800">{result.english}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-24 shrink-0">Indonesian</span>
              <span className="text-gray-800">{result.indonesian}</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save to Library'}
          </button>
        </div>
      )}
    </div>
  )
}
