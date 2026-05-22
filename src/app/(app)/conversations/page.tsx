export default function ConversationsPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '18px 28px', borderBottom: '0.8px solid var(--zk-border)',
        backgroundColor: 'var(--zk-topbar-bg)', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--zk-text-primary)' }}>Conversaciones</h1>
        <p style={{ fontSize: 12.5, color: 'var(--zk-text-muted)', marginTop: 2 }}>Historial de mensajes por contacto</p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 32 }}>💬</p>
        <p style={{ fontSize: 15, color: 'var(--zk-text-secondary)' }}>Conversaciones en construcción</p>
      </div>
    </div>
  )
}
