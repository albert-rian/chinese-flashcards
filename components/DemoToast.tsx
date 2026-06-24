'use client'

import { useEffect } from 'react'

export default function DemoToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(6.5rem + env(safe-area-inset-bottom))',
        left: '1rem',
        right: '1rem',
        zIndex: 300,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: '#3C3C3C',
          color: 'white',
          borderRadius: '14px',
          padding: '0.75rem 1.25rem',
          fontWeight: 700,
          fontSize: '0.85rem',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          maxWidth: '380px',
          textAlign: 'center',
          animation: 'slideUp 0.2s ease',
        }}
      >
        🔒 {message}
      </div>
    </div>
  )
}
