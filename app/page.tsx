'use client'

import { useState } from 'react'
import AddCharacter from '@/components/AddCharacter'
import Flashcard from '@/components/Flashcard'

type Tab = 'add' | 'flashcard'

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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'add'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Add Character
        </button>
        <button
          onClick={() => setActiveTab('flashcard')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'flashcard'
              ? 'text-red-500 border-b-2 border-red-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Flashcards
        </button>
      </div>

      {/* Content */}
      <main className="flex-1">
        {activeTab === 'add' && <AddCharacter onSaved={handleSaved} />}
        {activeTab === 'flashcard' && <Flashcard refreshKey={refreshKey} />}
      </main>
    </div>
  )
}
