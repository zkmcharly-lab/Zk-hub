import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { X, Loader2 } from 'lucide-react'

interface ProyectoTaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#0f172a',
  height: 40, fontSize: 14, borderRadius: 8, width: '100%', padding: '0 12px',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

function Lbl({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 500, color: '#a3a3a3', display: 'block', marginBottom: 6 }}>
      {children}{required && <span style={{ color: '#E8193C', marginLeft: 3 }}>*</span>}
    </label>
  )
}

export function ProyectoTaskFormModal({ isOpen, onClose, onCreated }: ProyectoTaskFormModalProps) {
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    responsable: '',
    proyecto_id: '',
    fase_id: '',
    nota_subtarea: ''
  })

  // Fetch proyectos
  const { data: proyectos, isLoading: proyectosLoading } = useQuery({
    queryKey: ['proyectos_dropdown', workspace?.id],
    queryFn: async () => {
      const { data } = await supabase.from('proyectos').select('id, nombre').eq('workspace_id', workspace!.id).order('nombre')
      return data || []
    },
    enabled: isOpen && !!workspace?.id
  })

  // Fetch fases based on selected proyecto
  const { data: fases, isLoading: fasesLoading } = useQuery({
    queryKey: ['proyecto_fases_dropdown', form.proyecto_id],
    queryFn: async () => {
      const { data } = await supabase.from('proyecto_fases').select('id, nombre_fase').eq('proyecto_id', form.proyecto_id).order('numero_fase')
      return data || []
    },
    enabled: !!form.proyecto_id
  })

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setForm({ titulo: '', descripcion: '', responsable: '', proyecto_id: '', fase_id: '', nota_subtarea: '' })
    }
  }, [isOpen])

  const createTask = useMutation({
    mutationFn: async () => {
      // Create task
      const { data: tarea, error } = await supabase.from('proyecto_tareas').insert({
        workspace_id: workspace!.id,
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        responsable: form.responsable || 'global',
        estado: 'pendiente',
        fase_id: form.fase_id || null
      }).select().single()

      if (error) throw error

      // Create initial subtask note if provided
      if (form.nota_subtarea.trim()) {
        await supabase.from('proyecto_subtareas').insert({
          workspace_id: workspace!.id,
          tarea_id: tarea.id,
          titulo: form.nota_subtarea,
          estado: 'pendiente'
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto_tareas_kanban'] })
      if (onCreated) onCreated()
      onClose()
    }
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim()) return alert('El título de la tarea es requerido')
    if (!form.fase_id) return alert('Debes seleccionar una fase del proyecto')
    createTask.mutate()
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
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Nueva Tarea de Proyecto</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Agregá una tarea y vincúlala a una fase</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f3'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {proyectosLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" style={{ color: '#6b7280' }} /></div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <Lbl required>Título de la tarea</Lbl>
                <input autoFocus value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} style={inputStyle} placeholder="Ej: Implementar landing page" />
              </div>

              <div>
                <Lbl>Descripción (Opcional)</Lbl>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalles de la tarea..."
                  style={{ ...inputStyle, height: 72, resize: 'vertical', paddingTop: 10 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl required>Proyecto</Lbl>
                  <select value={form.proyecto_id} onChange={(e) => setForm({ ...form, proyecto_id: e.target.value, fase_id: '' })} style={selectStyle}>
                    <option value="">Seleccionar proyecto...</option>
                    {proyectos?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Lbl required>Fase del proyecto</Lbl>
                  <select value={form.fase_id} onChange={(e) => setForm({ ...form, fase_id: e.target.value })} style={selectStyle} disabled={!form.proyecto_id || fasesLoading}>
                    <option value="">Seleccionar fase...</option>
                    {fases?.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.nombre_fase}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Lbl>Asignado a</Lbl>
                <select value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} style={selectStyle}>
                  <option value="">Global / Sin asignar</option>
                  <option value="inma">Inma</option>
                  <option value="gabi">Gabi</option>
                  <option value="fabri">Fabri</option>
                  <option value="charly">Charly</option>
                </select>
              </div>

              <div>
                <Lbl>Primera Nota / Subtarea (Opcional)</Lbl>
                <textarea value={form.nota_subtarea} onChange={(e) => setForm({ ...form, nota_subtarea: e.target.value })} placeholder="Nota o apunte sobre esta tarea..."
                  style={{ ...inputStyle, height: 72, resize: 'vertical', paddingTop: 10 }} />
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#fff', flexShrink: 0 }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#4b5563', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={createTask.isPending} style={{ padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#E8193C', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: createTask.isPending ? 0.6 : 1 }}>
                {createTask.isPending ? 'Guardando...' : 'Crear Tarea'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
