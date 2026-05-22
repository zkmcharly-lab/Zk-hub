import { useState } from 'react'
import { useCreateProyecto } from '@/hooks/use-proyectos'
import { useContacts } from '@/hooks/use-contacts'
import { usePipeline } from '@/hooks/use-deals'
import { X, Loader2 } from 'lucide-react'

interface ProjectFormModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (proyecto: any) => void
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#0f172a',
  height: 40, fontSize: 14, borderRadius: 8, width: '100%', padding: '0 12px',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' }

function Lbl({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 500, color: '#a3a3a3', display: 'block', marginBottom: 6 }}>
      {children}{required && <span style={{ color: '#E8193C', marginLeft: 3 }}>*</span>}
    </label>
  )
}

export function ProjectFormModal({ isOpen, onClose, onCreated }: ProjectFormModalProps) {
  const { data: contacts, isLoading: loadingContacts } = useContacts()
  const { data: pipeline, isLoading: loadingDeals } = usePipeline()
  const createProyecto = useCreateProyecto()

  const [form, setForm] = useState({
    nombre: '',
    contact_id: '',
    deal_id: '',
    tipo: 'web',
    estado: 'activo',
    responsable: '',
    fecha_entrega: ''
  })

  if (!isOpen) return null

  const isReady = !loadingContacts && !loadingDeals

  const dealsToSelect = form.contact_id 
    ? pipeline?.deals?.filter((d) => d.contact_id === form.contact_id)
    : pipeline?.deals

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return alert('El nombre es requerido')

    createProyecto.mutate({
      nombre: form.nombre.trim(),
      contact_id: form.contact_id || null,
      deal_id: form.deal_id || null,
      tipo: form.tipo,
      estado: form.estado as any,
      responsable: form.responsable || null,
      fecha_entrega: form.fecha_entrega || null,
      fase_actual: 1,
      porcentaje: 0
    }, {
      onSuccess: (created) => {
        if (onCreated) onCreated(created)
        setForm({ nombre: '', contact_id: '', deal_id: '', tipo: 'web', estado: 'activo', responsable: '', fecha_entrega: '' })
        onClose()
      }
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
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Nuevo proyecto</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Configura los datos base del proyecto</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f3'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <X size={16} />
          </button>
        </div>

        {!isReady ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" style={{ color: '#6b7280' }} /></div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                
                <div>
                  <Lbl required>Nombre del proyecto</Lbl>
                  <input autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} placeholder="Ej: Rediseño Web Ecommerce" />
                </div>

                <div>
                  <Lbl>Contacto vinculado</Lbl>
                  <select value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value, deal_id: '' })} style={selectStyle}>
                    <option value="">Seleccionar contacto...</option>
                    {contacts?.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.empresa ? `(${c.empresa})` : ''}</option>)}
                  </select>
                </div>

                <div>
                  <Lbl>Deal vinculado</Lbl>
                  <select value={form.deal_id} onChange={(e) => setForm({ ...form, deal_id: e.target.value })} style={selectStyle}>
                    <option value="">Seleccionar deal...</option>
                    {dealsToSelect?.map(d => <option key={d.id} value={d.id}>{d.titulo}</option>)}
                  </select>
                </div>

                <div>
                  <Lbl>Tipo de proyecto</Lbl>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} style={selectStyle}>
                    <option value="web">Desarrollo Web</option>
                    <option value="app">App Móvil</option>
                    <option value="ads">Gestión de Ads</option>
                    <option value="web_y_ads">Web + Ads</option>
                  </select>
                </div>

                <div>
                  <Lbl>Estado inicial</Lbl>
                  <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} style={selectStyle}>
                    <option value="activo">Activo</option>
                    <option value="pausado">Pausado</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>

                <div>
                  <Lbl>Responsable principal</Lbl>
                  <select value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} style={selectStyle}>
                    <option value="">Sin asignar</option>
                    <option value="charly">Charly</option>
                    <option value="inma">Inma</option>
                    <option value="fabri">Fabri</option>
                  </select>
                </div>

                <div>
                  <Lbl>Fecha estimada de entrega</Lbl>
                  <input type="date" value={form.fecha_entrega} onChange={(e) => setForm({ ...form, fecha_entrega: e.target.value })} style={inputStyle} />
                </div>

              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#fff', flexShrink: 0 }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#4b5563', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={createProyecto.isPending} style={{ padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#E8193C', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: createProyecto.isPending ? 0.6 : 1 }}>
                {createProyecto.isPending ? 'Guardando...' : 'Crear Proyecto'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
