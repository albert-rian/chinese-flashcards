'use client'

import { useState } from 'react'
import AddCharacter from '@/components/AddCharacter'
import Flashcard from '@/components/Flashcard'
import Library from '@/components/Library'

type Tab = 'library' | 'add' | 'flashcard'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('add')
  const [refreshKey, setRefreshKey] = useState(0)

  function handleSaved() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 text-center">
        <h1 className="text-xl font-bold text-gray-900">汉字 Flashcards</h1>
        <p className="text-xs text-gray-400 mt-0.5">My Chinese character library</p>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {activeTab === 'library' && <Library refreshKey={refreshKey} />}
        {activeTab === 'add' && <AddCharacter onSaved={handleSaved} />}
        {activeTab === 'flashcard' && <Flashcard refreshKey={refreshKey} />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
            activeTab === 'library' ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          <span className="text-xl">📚</span>
          Library
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
            activeTab === 'add' ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          <span className={`text-2xl leading-none pb-0.5 ${activeTab === 'add' ? 'text-red-500' : 'text-gray-400'}`}>＋</span>
          Add
        </button>
        <button
          onClick={() => setActiveTab('flashcard')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
            activeTab === 'flashcard' ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          <span className="text-xl">🃏</span>
          Flashcards
        </button>
      </nav>
    </div>
  )
}
