import { useState, useEffect } from 'react'
import { useCreateDeal } from '@/hooks/use-deals'
import { usePipeline } from '@/hooks/use-deals'
import { useContacts } from '@/hooks/use-contacts'
import { X, Loader2 } from 'lucide-react'

interface DealFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialStageId?: string | null
  onCreated?: (deal: any) => void
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

function SectionSep({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 8, paddingBottom: 4, borderTop: '1px solid #e5e7eb', marginTop: 12, marginBottom: 8 }}>
      {label}
    </div>
  )
}

export function DealFormModal({ isOpen, onClose, initialStageId, onCreated }: DealFormModalProps) {
  const createDeal = useCreateDeal()
  const { data: pipeline, isLoading: pipelineLoading } = usePipeline()
  const { data: contacts, isLoading: contactsLoading } = useContacts()

  const [form, setForm] = useState({
    titulo: '',
    valor: '',
    currency: 'USD',
    prioridad: 'normal' as 'low' | 'normal' | 'high',
    subtipo: '',
    stage_id: '',
    contact_id: '',
    fecha_cierre: '',
    descripcion: '',
    reunion_fecha: '',
    reunion_hora: '',
    reunion_lugar: '',
    reunion_plataforma: '',
    reunion_link: '',
    reunion_duracion: '',
    agendar_en_calendario: true,
  })

  useEffect(() => {
    if (isOpen) {
      setForm({
        titulo: '',
        valor: '',
        currency: 'USD',
        prioridad: 'normal',
        subtipo: '',
        stage_id: initialStageId || (pipeline?.stages?.[0]?.id ?? ''),
        contact_id: '',
        fecha_cierre: '',
        descripcion: '',
        reunion_fecha: '',
        reunion_hora: '',
        reunion_lugar: '',
        reunion_plataforma: '',
        reunion_link: '',
        reunion_duracion: '',
        agendar_en_calendario: true,
      })
    }
  }, [isOpen, initialStageId, pipeline])

  if (!isOpen) return null

  const isReady = !pipelineLoading && !contactsLoading

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim()) return alert('El título es requerido')

    const dataToSave = {
      titulo: form.titulo.trim(),
      valor: parseFloat(form.valor) || 0,
      currency: form.currency,
      prioridad: form.prioridad,
      stage_id: form.stage_id || null,
      contact_id: form.contact_id || null,
      fecha_cierre: form.fecha_cierre || null,
      descripcion: form.descripcion || null,
      subtipo: form.subtipo || null,
      reunion_fecha: form.reunion_fecha || null,
      reunion_hora: form.reunion_hora || null,
      reunion_lugar: form.reunion_lugar || null,
      reunion_plataforma: form.reunion_plataforma || null,
      reunion_link: form.reunion_link || null,
      reunion_duracion: form.reunion_duracion || null,
      agendar_en_calendario: form.agendar_en_calendario,
      posicion: 0,
    }

    createDeal.mutate(dataToSave, {
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
        width: '100%', maxWidth: 550, maxHeight: '90vh', backgroundColor: '#f9f9fb',
        borderRadius: 12, display: 'flex', flexDirection: 'column', zIndex: 101, overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Nuevo deal</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Agregá una oportunidad al pipeline</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f3'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {!isReady ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" style={{ color: '#6b7280' }} /></div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <Lbl required>Título del deal</Lbl>
                <input autoFocus value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} style={inputStyle} placeholder="Ej: Implementación ZK Hub" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl>Subtipo de servicio</Lbl>
                  <select value={form.subtipo} onChange={(e) => setForm({ ...form, subtipo: e.target.value })} style={selectStyle}>
                    <option value="">Seleccionar...</option>
                    <option value="diseño web">Diseño web</option>
                    <option value="desarrollo app">Desarrollo app</option>
                    <option value="ads">Ads</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="consultoría">Consultoría</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <Lbl>Etapa (Stage)</Lbl>
                  <select value={form.stage_id} onChange={(e) => setForm({ ...form, stage_id: e.target.value })} style={selectStyle}>
                    {pipeline?.stages?.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl>Valor</Lbl>
                  <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} style={inputStyle} placeholder="0" />
                </div>
                <div>
                  <Lbl>Moneda</Lbl>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={selectStyle}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="ARS">ARS</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
              </div>

              <div>
                <Lbl>Contacto asignado</Lbl>
                <select value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })} style={selectStyle}>
                  <option value="">Sin contacto</option>
                  {contacts?.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.empresa ? `(${c.empresa})` : ''}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl>Prioridad</Lbl>
                  <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value as any })} style={selectStyle}>
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <Lbl>Fecha de cierre</Lbl>
                  <input type="date" value={form.fecha_cierre} onChange={(e) => setForm({ ...form, fecha_cierre: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <Lbl>Descripción del trato</Lbl>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalles de la oportunidad..."
                  style={{ ...inputStyle, height: 72, resize: 'vertical', paddingTop: 10 }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}><SectionSep label="📅 Reunión / Llamada" /></div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl>Fecha</Lbl>
                  <input type="date" value={form.reunion_fecha} onChange={(e) => setForm({ ...form, reunion_fecha: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <Lbl>Hora</Lbl>
                  <input type="time" value={form.reunion_hora} onChange={(e) => setForm({ ...form, reunion_hora: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl>Duración</Lbl>
                  <select value={form.reunion_duracion} onChange={(e) => setForm({ ...form, reunion_duracion: e.target.value })} style={selectStyle}>
                    <option value="">Seleccionar...</option>
                    <option value="30min">30 min</option>
                    <option value="1h">1h</option>
                    <option value="1.5h">1.5h</option>
                    <option value="2h">2h</option>
                  </select>
                </div>
                <div>
                  <Lbl>Plataforma</Lbl>
                  <select value={form.reunion_plataforma} onChange={(e) => setForm({ ...form, reunion_plataforma: e.target.value })} style={selectStyle}>
                    <option value="">Seleccionar...</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Teams">Teams</option>
                    <option value="Teléfono">Teléfono</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
              </div>

              <div>
                <Lbl>Lugar o dirección</Lbl>
                <input value={form.reunion_lugar} onChange={(e) => setForm({ ...form, reunion_lugar: e.target.value })} style={inputStyle} placeholder="Lugar o dirección" />
              </div>

              <div>
                <Lbl>Link de la reunión</Lbl>
                <input value={form.reunion_link} onChange={(e) => setForm({ ...form, reunion_link: e.target.value })} style={inputStyle} placeholder="https://meet.google.com/..." />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input type="checkbox" id="agendar" checked={form.agendar_en_calendario} onChange={(e) => setForm({ ...form, agendar_en_calendario: e.target.checked })} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#E8193C' }} />
                <label htmlFor="agendar" style={{ fontSize: 13, color: '#4b5563', cursor: 'pointer' }}>Agendar en calendario</label>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#fff', flexShrink: 0 }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#4b5563', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={createDeal.isPending} style={{ padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#E8193C', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: createDeal.isPending ? 0.6 : 1 }}>
                {createDeal.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
