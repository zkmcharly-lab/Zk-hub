import { useState, useEffect } from 'react'
import { useCreateCobro } from '@/hooks/use-cobros'
import { useContacts } from '@/hooks/use-contacts'
import { usePipeline } from '@/hooks/use-deals'
import { X, Loader2 } from 'lucide-react'

interface CobroFormModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (cobro: any) => void
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#0f172a',
  height: 40, fontSize: 14, borderRadius: 8, width: '100%', padding: '0 12px',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

function Lbl({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 500, color: '#a3a3a3', display: 'block', marginBottom: 6 }}>
      {children}{required && <span style={{ color: '#E8193C', marginLeft: 3 }}>*</span>}
    </label>
  )
}

export function CobroFormModal({ isOpen, onClose, onCreated }: CobroFormModalProps) {
  const createCobro = useCreateCobro()
  const { data: contacts, isLoading: contactsLoading } = useContacts()
  const { data: pipeline, isLoading: pipelineLoading } = usePipeline()
  const deals = pipeline?.deals ?? []

  const [form, setForm] = useState({
    monto_total: '',
    moneda: 'USD',
    contact_id: '',
    deal_id: '',
    num_pagos: '1',
    metodo_pago: 'transferencia',
    frecuencia: 'mensual',
    fecha_primer_pago: '',
    estado: 'pendiente',
    notas: '',
  })

  useEffect(() => {
    if (isOpen) {
      setForm({
        monto_total: '',
        moneda: 'USD',
        contact_id: '',
        deal_id: '',
        num_pagos: '1',
        metodo_pago: 'transferencia',
        frecuencia: 'mensual',
        fecha_primer_pago: '',
        estado: 'pendiente',
        notas: '',
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.monto_total || parseFloat(form.monto_total) <= 0) return alert('El monto debe ser mayor a 0')
    if (!form.contact_id) return alert('Debe seleccionar un contacto')

    const dataToSave = {
      monto_total: parseFloat(form.monto_total),
      moneda: form.moneda,
      contact_id: form.contact_id,
      deal_id: form.deal_id || null,
      num_pagos: parseInt(form.num_pagos, 10) || 1,
      metodo_pago: form.metodo_pago,
      frecuencia: form.frecuencia,
      fecha_primer_pago: form.fecha_primer_pago || null,
      estado: form.estado,
      notas: form.notas || null,
    }

    createCobro.mutate(dataToSave, {
      onSuccess: (created) => {
        if (onCreated) onCreated(created)
        onClose()
      },
    })
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 500, maxHeight: '90vh', backgroundColor: '#f9f9fb',
        borderRadius: 12, display: 'flex', flexDirection: 'column', zIndex: 101, overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Nuevo cobro</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Registrá un plan de pagos o cobro único</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f3'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {contactsLoading || pipelineLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" style={{ color: '#6b7280' }} /></div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl required>Contacto / Cliente</Lbl>
                  <select value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })} style={selectStyle}>
                    <option value="">Seleccioná un cliente</option>
                    {contacts?.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} {c.empresa ? `(${c.empresa})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Lbl>Deal Asociado</Lbl>
                  <select value={form.deal_id} onChange={(e) => setForm({ ...form, deal_id: e.target.value })} style={selectStyle}>
                    <option value="">Sin deal asociado</option>
                    {deals?.filter(d => !form.contact_id || d.contact_id === form.contact_id).map(d => (
                      <option key={d.id} value={d.id}>{d.titulo} - {d.currency} {d.valor}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl required>Monto Total</Lbl>
                  <input type="number" value={form.monto_total} onChange={(e) => setForm({ ...form, monto_total: e.target.value })} style={inputStyle} placeholder="0.00" />
                </div>
                <div>
                  <Lbl>Moneda</Lbl>
                  <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} style={selectStyle}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="ARS">ARS</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl>Número de cuotas</Lbl>
                  <input type="number" min="1" value={form.num_pagos} onChange={(e) => setForm({ ...form, num_pagos: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <Lbl>Frecuencia</Lbl>
                  <select value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value })} style={selectStyle}>
                    <option value="unico">Pago único</option>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl>Método de pago</Lbl>
                  <select value={form.metodo_pago} onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })} style={selectStyle}>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="cripto">Cripto</option>
                  </select>
                </div>
                <div>
                  <Lbl>Fecha del primer pago</Lbl>
                  <input type="date" value={form.fecha_primer_pago} onChange={(e) => setForm({ ...form, fecha_primer_pago: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <Lbl>Notas Adicionales</Lbl>
                <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Ej: Pago adelantado del proyecto..."
                  style={{ ...inputStyle, height: 72, resize: 'vertical', paddingTop: 10 }} />
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#fff', flexShrink: 0 }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#4b5563', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={createCobro.isPending} style={{ padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#E8193C', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: createCobro.isPending ? 0.6 : 1 }}>
                {createCobro.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
