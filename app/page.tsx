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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--duo-bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--duo-green)', borderBottom: '3px solid var(--duo-green-dark)' }} className="px-4 py-4 text-center">
        <h1 className="text-2xl font-black text-white tracking-wide">汉字 Flashcards</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>My Chinese character library</p>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'library' && <Library refreshKey={refreshKey} />}
        {activeTab === 'add' && <AddCharacter onSaved={handleSaved} />}
        {activeTab === 'flashcard' && <Flashcard refreshKey={refreshKey} />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex z-10" style={{ background: 'white', borderTop: '2px solid var(--duo-border)' }}>
        {([
          { key: 'library', label: 'Library', icon: '📚' },
          { key: 'add', label: 'Add', icon: '➕' },
          { key: 'flashcard', label: 'Practice', icon: '🃏' },
        ] as { key: Tab; label: string; icon: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
            style={{
              color: activeTab === tab.key ? 'var(--duo-green)' : 'var(--duo-text-light)',
              borderTop: activeTab === tab.key ? '3px solid var(--duo-green)' : '3px solid transparent',
              fontWeight: 800,
              fontSize: '0.7rem',
            }}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
