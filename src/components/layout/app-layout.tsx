'use client'
import { Sidebar } from './sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', backgroundColor: 'var(--zk-bg-page)' }}>
      {/* Sidebar — desktop */}
      <div className="md-sidebar" style={{ display: 'flex' }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column',
        minWidth: 0,
      }}>
        {children}
      </main>
    </div>
  )
}
