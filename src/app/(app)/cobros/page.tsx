'use client'
import { useState } from 'react'
import { useCobros, useDeleteCobro } from '@/hooks/use-cobros'
import { formatCurrency, formatDate, avatarColor, initials } from '@/lib/utils'
import { CreditCard, Plus, Loader2, CheckCircle2, Clock, AlertTriangle, CircleDollarSign, Trash2 } from 'lucide-react'
import { CobroFormModal } from '@/components/cobros/cobro-form-modal'
import { CobroPanel } from '@/components/cobros/cobro-panel'

const ESTADO_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:    { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
  en_progreso:  { bg: '#dbeafe', color: '#1e40af', label: 'En progreso' },
  completado:   { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
  cancelado:    { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelado' },
  vencido:      { bg: '#fee2e2', color: '#991b1b', label: 'Vencido' },
}

function isVencido(d: string | null) {
  if (!d) return false
  return new Date(d + 'T12:00:00') < new Date()
}

export default function CobrosPage() {
  const { data: cobrosData, isLoading } = useCobros()
  const deleteCobro = useDeleteCobro()
  const cobros = cobrosData ?? []

  const [selected, setSelected] = useState<any | null>(null)
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'en_progreso' | 'completado' | 'vencido'>('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filtered = filter === 'todos' ? cobros : cobros.filter((c) => c.estado === filter)

  // Stats
  const totPend = cobros.filter((c) => c.estado === 'pendiente').reduce((s, c) => s + c.monto_total, 0)
  const totPagado = cobros.filter((c) => c.estado === 'completado').reduce((s, c) => s + c.monto_total, 0)
  const totVencido = cobros.filter((c) => c.estado === 'vencido').reduce((s, c) => s + c.monto_total, 0)
  const totGeneral = cobros.reduce((s, c) => s + c.monto_total, 0)

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('¿Eliminar este cobro?')) {
      deleteCobro.mutate(id)
      if (selected?.id === id) setSelected(null)
    }
  }

  return (
    <div style={{ flex: 1, background: 'var(--zk-bg-page)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ background: 'var(--zk-bg-surface)', borderBottom: '1px solid var(--zk-border)', padding: '20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircleDollarSign size={20} color="#0ea5e9" />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--zk-text-primary)', margin: 0 }}>Cobros</h1>
                <p style={{ fontSize: 13, color: 'var(--zk-text-muted)', margin: 0 }}>Seguimiento de pagos por cliente y deal</p>
              </div>
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
              backgroundColor: '#E8193C', color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
              onClick={() => setIsModalOpen(true)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E8193C'}
            >
              <Plus size={14} /> Nuevo cobro
            </button>
          </div>

          {/* Stats cards */}
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 2 }}>
            {[
              { label: 'Total cobros', value: formatCurrency(totGeneral), color: '#6366f1', bg: '#eef2ff' },
              { label: 'Pendientes', value: formatCurrency(totPend), color: '#d97706', bg: '#fffbeb' },
              { label: 'En progreso', value: cobros.filter(c => c.estado === 'en_progreso').length, color: '#0ea5e9', bg: '#e0f2fe' },
              { label: 'Cobrados', value: formatCurrency(totPagado), color: '#10b981', bg: '#d1fae5' },
              { label: 'Vencidos', value: formatCurrency(totVencido), color: '#ef4444', bg: '#fee2e2' },
            ].map(s => (
              <div key={s.label} style={{ padding: '12px 16px', background: s.bg, borderRadius: 10, minWidth: 120, textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 600, opacity: 0.85 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ background: 'var(--zk-bg-surface)', borderBottom: '1px solid var(--zk-border)', padding: '0 28px', display: 'flex', gap: 4 }}>
          {(['todos', 'pendiente', 'en_progreso', 'completado', 'vencido'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: filter === f ? 700 : 500, fontFamily: 'inherit',
                color: filter === f ? '#0ea5e9' : 'var(--zk-text-muted)',
                borderBottom: filter === f ? '2px solid #0ea5e9' : '2px solid transparent',
              }}
            >
              {f === 'todos' ? 'Todos' : ESTADO_COLOR[f]?.label ?? f}
              {f !== 'todos' && <span style={{ marginLeft: 6, fontSize: 11, background: filter === f ? '#e0f2fe' : 'var(--zk-bg-elevated)', color: filter === f ? '#0ea5e9' : 'var(--zk-text-muted)', borderRadius: 20, padding: '1px 7px' }}>
                {cobros.filter(c => c.estado === f).length}
              </span>}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ flex: 1, padding: '20px 28px', overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader2 size={36} style={{ animation: 'spin 0.8s linear infinite', color: '#0ea5e9' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <CircleDollarSign size={48} color="var(--zk-text-muted)" style={{ marginBottom: 12, opacity: 0.5 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--zk-text-primary)', marginBottom: 6 }}>Sin cobros{filter !== 'todos' ? ` ${ESTADO_COLOR[filter]?.label?.toLowerCase()}` : ''}</div>
              <div style={{ fontSize: 13, color: 'var(--zk-text-secondary)' }}>
                {filter === 'todos'
                  ? 'Mové un deal a la columna "En cobro" del pipeline para empezar a registrar cobros.'
                  : 'No hay cobros con este estado.'}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--zk-bg-surface)', borderRadius: 14, border: '1px solid var(--zk-border)', overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.2fr 1fr 1.2fr 1.2fr 100px', padding: '10px 16px', background: 'var(--zk-bg-elevated)', borderBottom: '1px solid var(--zk-border)' }}>
                {['Cliente', 'Deal', 'Monto', 'Método', 'Cuotas', 'Próx. pago', 'Estado'].map(h => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--zk-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                ))}
              </div>

              {filtered.map((cobro, i) => {
                const st = ESTADO_COLOR[cobro.estado] ?? ESTADO_COLOR.pendiente
                const pagosPagados = cobro.pagos?.filter((p: any) => p.estado === 'pagado').length ?? 0
                const total = cobro.num_pagos
                const progress = total > 0 ? Math.round((pagosPagados / total) * 100) : 0
                const isSelected = selected?.id === cobro.id
                
                // Encontrar próxima cuota pendiente
                const prox = cobro.pagos?.find((p: any) => p.estado !== 'pagado')

                return (
                  <div
                    key={cobro.id}
                    onClick={() => setSelected(isSelected ? null : cobro)}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 2fr 1.2fr 1fr 1.2fr 1.2fr 100px',
                      padding: '14px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--zk-border)' : 'none',
                      cursor: 'pointer', alignItems: 'center',
                      background: isSelected ? 'var(--zk-bg-hover)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--zk-bg-hover)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'var(--zk-bg-hover)' : 'transparent' }}
                  >
                    {/* Cliente */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColor(cobro.contact?.nombre ?? '?'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>
                        {initials(cobro.contact?.nombre ?? '?')}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--zk-text-primary)' }}>{cobro.contact?.nombre ?? 'Sin contacto'}</div>
                        <div style={{ fontSize: 12, color: 'var(--zk-text-muted)' }}>{cobro.contact?.empresa ?? ''}</div>
                      </div>
                    </div>

                    {/* Deal */}
                    <div style={{ fontSize: 13, color: 'var(--zk-text-secondary)', fontWeight: 500, paddingRight: 8 }}>
                      {cobro.deal_id ? `Deal ID: ${cobro.deal_id.substring(0,8)}` : <span style={{ color: 'var(--zk-text-muted)' }}>Sin deal</span>}
                    </div>

                    {/* Monto */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0ea5e9' }}>
                      {formatCurrency(cobro.monto_total, cobro.moneda)}
                    </div>

                    {/* Método */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--zk-text-secondary)' }}>
                      {cobro.metodo_pago === 'stripe' ? <CreditCard size={14} /> : <CircleDollarSign size={14} />}
                      {cobro.metodo_pago === 'stripe' ? 'Stripe' : 'Trans.'}
                    </div>

                    {/* Cuotas */}
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--zk-text-primary)', fontWeight: 600, marginBottom: 4 }}>{pagosPagados}/{total} pagos</div>
                      <div style={{ height: 5, background: 'var(--zk-bg-elevated)', borderRadius: 3, width: 80, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#10b981' : '#0ea5e9', borderRadius: 3 }} />
                      </div>
                    </div>

                    {/* Próx. pago */}
                    <div style={{ fontSize: 13, color: prox && isVencido(prox.fecha_vencimiento) ? '#ef4444' : 'var(--zk-text-secondary)', fontWeight: prox && isVencido(prox.fecha_vencimiento) ? 600 : 400 }}>
                      {prox?.fecha_vencimiento ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {isVencido(prox.fecha_vencimiento) && <AlertTriangle size={13} color="#ef4444" />}
                          {formatDate(prox.fecha_vencimiento)}
                        </span>
                      ) : (
                        <span style={{ color: cobro.estado === 'completado' ? '#10b981' : 'var(--zk-text-muted)' }}>
                          {cobro.estado === 'completado' ? '✓ Completado' : '—'}
                        </span>
                      )}
                    </div>

                    {/* Estado + actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700 }}>
                        {st.label}
                      </div>
                      <button
                        onClick={(e) => handleDelete(cobro.id, e)}
                        disabled={deleteCobro.isPending}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--zk-text-muted)', padding: 3 }}
                        title="Eliminar cobro"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <CobroFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* Detail panel */}
      {selected && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.12)' }}
            onClick={() => setSelected(null)}
          />
          <CobroPanel
            cobro={selected}
            onClose={() => setSelected(null)}
          />
        </>
      )}
    </div>
  )
}
