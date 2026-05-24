import { useState, useEffect } from 'react'
import { useUpdateProyecto } from '@/hooks/use-proyectos'
import { X, Loader2 } from 'lucide-react'

interface ProjectEditModalProps {
  isOpen: boolean
  onClose: () => void
  proyecto: any
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

export function ProjectEditModal({ isOpen, onClose, proyecto }: ProjectEditModalProps) {
  const updateProyecto = useUpdateProyecto()

  const [form, setForm] = useState({
    nombre: '',
    tipo: 'web',
    estado: 'activo',
    responsable: '',
    fecha_entrega: '',
    logo_url: '',
    banner_url: ''
  })

  useEffect(() => {
    if (proyecto && isOpen) {
      setForm({
        nombre: proyecto.nombre || '',
        tipo: proyecto.tipo || 'web',
        estado: proyecto.estado || 'activo',
        responsable: proyecto.responsable || '',
        fecha_entrega: proyecto.fecha_entrega || '',
        logo_url: proyecto.logo_url || '',
        banner_url: proyecto.banner_url || ''
      })
    }
  }, [proyecto, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return alert('El nombre es requerido')

    updateProyecto.mutate({
      id: proyecto.id,
      data: {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        estado: form.estado as any,
        responsable: form.responsable || null,
        fecha_entrega: form.fecha_entrega || null,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null
      }
    }, {
      onSuccess: () => {
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
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Editar proyecto</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Actualiza los datos del proyecto</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f3'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              
              <div>
                <Lbl required>Nombre del proyecto</Lbl>
                <input autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} placeholder="Ej: Rediseño Web Ecommerce" />
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
                <Lbl>Estado</Lbl>
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

              <div>
                <Lbl>URL del Logo</Lbl>
                <input type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} style={inputStyle} placeholder="https://..." />
              </div>

              <div>
                <Lbl>URL del Banner</Lbl>
                <input type="url" value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} style={inputStyle} placeholder="https://..." />
              </div>

            </div>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#fff', flexShrink: 0 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#4b5563', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={updateProyecto.isPending} style={{ padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#E8193C', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: updateProyecto.isPending ? 0.6 : 1 }}>
              {updateProyecto.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
