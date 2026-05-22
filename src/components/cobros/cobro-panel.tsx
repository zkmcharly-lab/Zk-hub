'use client'
import { useState, useCallback, useEffect } from 'react'
import { useUpdateCobro } from '@/hooks/use-cobros'
import { formatCurrency, formatDate, avatarColor, initials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/lib/store'
import { X, Check, Clock, AlertTriangle, RefreshCw, Edit2 } from 'lucide-react'

// Iconos y colores de estados de pago
const PAGO_ESTADO: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente', icon: <Clock size={12} /> },
  pagado:    { bg: '#d1fae5', color: '#065f46', label: 'Pagado',    icon: <Check size={12} /> },
  vencido:   { bg: '#fee2e2', color: '#991b1b', label: 'Vencido',   icon: <AlertTriangle size={12} /> },
  parcial:   { bg: '#dbeafe', color: '#1e40af', label: 'Parcial',   icon: <RefreshCw size={12} /> },
}

const FRECUENCIA_LABELS: Record<string, string> = {
  unico: 'Pago único', semanal: 'Semanal', quincenal: 'Quincenal',
  mensual: 'Mensual', bimestral: 'Bimestral', trimestral: 'Trimestral',
}

function isVencido(d: string | null) {
  if (!d) return false
  return new Date(d + 'T12:00:00') < new Date()
}

export function CobroPanel({ cobro, onClose }: { cobro: any; onClose: () => void }) {
  const updateCobro = useUpdateCobro()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { workspace } = useWorkspaceStore()
  
  const [editMode, setEditMode] = useState(false)
  const [pagos, setPagos] = useState<any[]>([])
  const [loadingPagos, setLoadingPagos] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState({
    num_pagos: cobro.num_pagos,
    metodo_pago: cobro.metodo_pago,
    fecha_primer_pago: cobro.fecha_primer_pago?.split('T')[0] ?? '',
    frecuencia: cobro.frecuencia,
    notas: cobro.notas ?? '',
  })

  const loadPagos = useCallback(async () => {
    try {
      setLoadingPagos(true)
      const { data, error } = await supabase
        .from('cobro_pagos')
        .select('*')
        .eq('cobro_id', cobro.id)
        .order('numero_pago', { ascending: true })
      if (error) throw error
      setPagos(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPagos(false)
    }
  }, [cobro.id, supabase])

  useEffect(() => {
    loadPagos()
  }, [loadPagos])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await supabase
        .from('cobros')
        .update({
          num_pagos: form.num_pagos,
          fecha_primer_pago: form.fecha_primer_pago || null,
          metodo_pago: form.metodo_pago,
          frecuencia: form.frecuencia,
          notas: form.notas
        })
        .eq('id', cobro.id)

      await supabase
        .from('cobro_pagos')
        .delete()
        .eq('cobro_id', cobro.id)

      const cuotas = []
      const baseDateStr = form.fecha_primer_pago || new Date().toISOString().split('T')[0]
      for (let i = 0; i < form.num_pagos; i++) {
        const fecha = new Date(baseDateStr)
        fecha.setMonth(fecha.getMonth() + i)
        cuotas.push({
          cobro_id: cobro.id,
          numero_pago: i + 1,
          fecha_vencimiento: fecha.toISOString().split('T')[0],
          monto: cobro.monto_total / form.num_pagos,
          estado: 'pendiente'
        })
      }
      await supabase.from('cobro_pagos').insert(cuotas)

      await queryClient.invalidateQueries({ queryKey: ['cobros', workspace?.id] })
      setEditMode(false)
      loadPagos()
    } catch (err) {
      console.error(err)
      alert('Error al guardar configuración del cobro')
    } finally {
      setIsSaving(false)
    }
  }

  const markPago = async (pagoId: string, nuevoEstado: string) => {
    try {
      const fechaPago = nuevoEstado === 'pagado' ? new Date().toISOString().split('T')[0] : null
      const { error } = await supabase
        .from('cobro_pagos')
        .update({ estado: nuevoEstado as any, fecha_pago: fechaPago })
        .eq('id', pagoId)
      
      if (error) throw error
      
      await queryClient.invalidateQueries({ queryKey: ['cobros', workspace?.id] })
      loadPagos()
    } catch (err) {
      console.error(err)
      alert('Error al actualizar pago')
    }
  }
  const paid = pagos.filter((p: any) => p.estado === 'pagado').length
  const total = pagos.length
  const progress = total > 0 ? Math.round((paid / total) * 100) : 0
  const contactNombre = cobro.contacts?.nombre ?? cobro.contact?.nombre ?? 'Sin contacto'

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, zIndex: 50,
      background: '#ffffff', borderLeft: '1px solid var(--zk-border)',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--zk-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            backgroundColor: avatarColor(contactNombre),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 600, color: '#fff',
          }}>
            {initials(contactNombre)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--zk-text-primary)' }}>{contactNombre}</div>
            <div style={{ fontSize: 13, color: 'var(--zk-text-secondary)' }}>{cobro.contacts?.empresa ?? cobro.contact?.empresa ?? ''}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--zk-text-muted)', padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '16px 24px', flex: 1 }}>
        {/* Deal info */}
        {cobro.deal_id && (
          <div style={{ marginBottom: 20, padding: 14, background: 'var(--zk-bg-surface)', borderRadius: 10, border: '1px solid var(--zk-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--zk-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Deal vinculado</div>
            <div style={{ fontWeight: 600, color: 'var(--zk-text-primary)', fontSize: 15 }}>{cobro.deals?.titulo ?? cobro.deal?.titulo ?? `Deal ID: ${cobro.deal_id.substring(0,8)}`}</div>
            <div style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 700, marginTop: 2 }}>
              {formatCurrency(cobro.monto_total, cobro.moneda)}
            </div>
          </div>
        )}

        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--zk-text-primary)' }}>Progreso de pagos</span>
            <span style={{ fontSize: 13, color: 'var(--zk-text-secondary)' }}>{paid}/{total} pagos</span>
          </div>
          <div style={{ height: 8, background: 'var(--zk-bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#10b981' : '#0ea5e9', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Config section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--zk-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configuración</span>
            <button
              onClick={() => setEditMode(!editMode)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#0ea5e9', border: '1px solid #bae6fd', background: '#f0f9ff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
            >
              <Edit2 size={12} /> {editMode ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {!editMode ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Cuotas', value: `${cobro.num_pagos} pago${cobro.num_pagos !== 1 ? 's' : ''}` },
                { label: 'Método', value: cobro.metodo_pago === 'stripe' ? 'Stripe' : 'Transferencia' },
                { label: 'Primer pago', value: formatDate(cobro.fecha_primer_pago) },
                { label: 'Frecuencia', value: FRECUENCIA_LABELS[cobro.frecuencia] ?? cobro.frecuencia },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--zk-bg-surface)', borderRadius: 8, border: '1px solid var(--zk-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--zk-text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--zk-text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Número de cuotas</label>
                  <input type="number" min={1} max={60} value={form.num_pagos} onChange={e => setForm(f => ({ ...f, num_pagos: Number(e.target.value) }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Método de pago</label>
                  <select value={form.metodo_pago} onChange={e => setForm(f => ({ ...f, metodo_pago: e.target.value }))} style={inputStyle}>
                    <option value="transferencia">Transferencia</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Fecha primer pago</label>
                  <input type="date" value={form.fecha_primer_pago} onChange={e => setForm(f => ({ ...f, fecha_primer_pago: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Frecuencia</label>
                  <select value={form.frecuencia} onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value }))} style={inputStyle}>
                    <option value="unico">Pago único</option>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notas</label>
                <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} placeholder="Observaciones del cobro..." style={{ ...inputStyle, resize: 'none', height: 'auto' }} />
              </div>
              <button onClick={handleSave} disabled={isSaving} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
                {isSaving ? 'Guardando…' : 'Guardar y regenerar pagos'}
              </button>
            </div>
          )}
        </div>

        {/* Pagos schedule */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--zk-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Cronograma de pagos
          </div>

          {pagos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--zk-text-muted)', fontSize: 13 }}>
              Configurá las cuotas y la fecha del primer pago para generar el cronograma.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pagos.map((pago: any) => {
                const st = PAGO_ESTADO[pago.estado] ?? PAGO_ESTADO.pendiente
                return (
                  <div key={pago.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--zk-border)', background: pago.estado === 'pagado' ? '#f0fdf4' : 'var(--zk-bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.color, flexShrink: 0 }}>
                        {st.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--zk-text-primary)' }}>Cuota {pago.numero_pago}</div>
                        <div style={{ fontSize: 12, color: isVencido(pago.fecha_vencimiento) && pago.estado !== 'pagado' ? '#ef4444' : 'var(--zk-text-secondary)' }}>
                          {pago.fecha_pago ? `Pagado ${formatDate(pago.fecha_pago)}` : formatDate(pago.fecha_vencimiento)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--zk-text-primary)' }}>
                        {formatCurrency(pago.monto, cobro.moneda)}
                      </div>
                      {pago.estado !== 'pagado' ? (
                        <button onClick={() => markPago(pago.id, 'pagado')} title="Marcar como pagado" style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--zk-border)', background: 'var(--zk-bg-surface)', color: 'var(--zk-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={13} />
                        </button>
                      ) : (
                        <button onClick={() => markPago(pago.id, 'pendiente')} title="Deshacer pago" style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--zk-border)', background: 'var(--zk-bg-surface)', color: 'var(--zk-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {cobro.notas && !editMode && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
            <div style={{ fontSize: 11, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: 4 }}>Notas</div>
            <div style={{ fontSize: 13, color: '#78350f' }}>{cobro.notas}</div>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--zk-text-secondary)',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--zk-border)',
  borderRadius: 8, fontSize: 14, color: 'var(--zk-text-primary)', background: 'var(--zk-bg-surface)',
  outline: 'none', boxSizing: 'border-box',
}
