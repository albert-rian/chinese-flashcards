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

      {/* Content — extra bottom padding so content clears the floating nav */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
        {activeTab === 'library' && <Library refreshKey={refreshKey} />}
        {activeTab === 'add' && <AddCharacter onSaved={handleSaved} />}
        {activeTab === 'flashcard' && <Flashcard refreshKey={refreshKey} />}
      </main>

      {/* Floating Bottom Tab Bar */}
      <nav
        className="fixed flex z-10"
        style={{
          left: '1rem',
          right: '1rem',
          bottom: 'calc(1rem + env(safe-area-inset-bottom))',
          background: 'white',
          borderRadius: '22px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.13), 0 1px 6px rgba(0,0,0,0.07)',
          padding: '0.3rem',
        }}
      >
        {([
          { key: 'library', label: 'Library', icon: '📚' },
          { key: 'add', label: 'Add', icon: '➕' },
          { key: 'flashcard', label: 'Practice', icon: '🃏' },
        ] as { key: Tab; label: string; icon: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
            style={{
              color: activeTab === tab.key ? 'var(--duo-green)' : 'var(--duo-text-light)',
              background: activeTab === tab.key ? '#F0FFF0' : 'transparent',
              borderRadius: '16px',
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
