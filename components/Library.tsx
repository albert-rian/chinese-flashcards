'use client'

import { useState, useEffect } from 'react'
import { supabase, Character } from '@/lib/supabase'

export default function Library({ refreshKey }: { refreshKey: number }) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCharacters() {
      setLoading(true)
      const { data } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: true })
      setCharacters(data || [])
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
        <p className="text-5xl">📚</p>
        <p className="text-gray-600 font-medium">No characters yet</p>
        <p className="text-gray-400 text-sm">Add your first character using the + tab.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <p className="text-sm text-gray-400 mb-3">{characters.length} characters saved</p>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Hanzi</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Pinyin</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">English</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Indonesian</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((char, i) => (
              <tr
                key={char.id}
                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-3 text-2xl font-bold text-gray-900">{char.hanzi}</td>
                <td className="px-4 py-3 text-gray-700">{char.pinyin}</td>
                <td className="px-4 py-3 text-gray-700">{char.english}</td>
                <td className="px-4 py-3 text-gray-500">{char.indonesian}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
