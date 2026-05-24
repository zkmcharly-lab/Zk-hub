import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, ArrowRight, ExternalLink, Trash2, Calendar, LayoutGrid, FileText } from 'lucide-react'
import { formatCurrency, relativeTime } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface TaskPanelProps {
  task: any
  onClose: () => void
}

const LANES = [
  { key: "inma",   label: "Inma",   color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  { key: "gabi",   label: "Gabi",   color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  { key: "fabri",  label: "Fabri",  color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  { key: "charly", label: "Charly", color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  { key: "global", label: "Global", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
]

export function TaskPanel({ task, onClose }: TaskPanelProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [subtareas, setSubtareas] = useState<any[]>(task.proyecto_subtareas || [])

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const lane = LANES.find(l => l.key === task.responsable) || LANES[4]
  const proyecto = task.proyecto_fases?.proyectos
  const fase = task.proyecto_fases

  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      await supabase.from('proyecto_tareas').update({ estado: 'completada' }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto_tareas_kanban'] })
      onClose()
    }
  })

  const updateSubtarea = useMutation({
    mutationFn: async ({ id, estado }: { id: string, estado: string }) => {
      const supabase = createClient()
      await supabase.from('proyecto_subtareas').update({ estado }).eq('id', id)
    },
    onMutate: async ({ id, estado }) => {
      // Optimistic update
      setSubtareas(prev => prev.map(s => s.id === id ? { ...s, estado } : s))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proyecto_tareas_kanban'] })
  })

  const handleAddSub = async () => {
    const text = prompt('Añadir apunte o nota:')
    if (!text) return
    const supabase = createClient()
    const { data } = await supabase.from('proyecto_subtareas')
      .insert({ tarea_id: task.id, titulo: text, estado: 'pendiente' })
      .select().single()
    if (data) {
      setSubtareas(prev => [...prev, data])
      queryClient.invalidateQueries({ queryKey: ['proyecto_tareas_kanban'] })
    }
  }

  const handleGoToProject = () => {
    if (proyecto?.id) {
      router.push(`/proyectos/${proyecto.id}`)
      onClose()
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} />
      <aside style={{ width: 420, minWidth: 420, height: '100%', backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="fixed inset-y-0 right-0 z-40 md:static md:z-auto">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e5e7eb', flexShrink: 0, backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 1 }}>
            <div className="flex items-start justify-between mb-4" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: lane.bg, color: lane.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LayoutGrid size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: lane.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{lane.label}</p>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {task.titulo}
                  </h2>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                <button onClick={onClose} style={{ padding: 6, borderRadius: 6, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5563', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: 6 }}>
                Creada el {new Date(task.created_at).toLocaleDateString('es-ES')}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: task.estado === 'completada' ? '#10b981' : '#f59e0b', backgroundColor: task.estado === 'completada' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 6 }}>
                {task.estado === 'completada' ? 'Completada' : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Proyecto y Fase */}
            <section>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Proyecto Relacionado</h3>
              {proyecto ? (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, backgroundColor: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{proyecto.nombre}</h4>
                      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{fase ? `Fase: ${fase.nombre_fase}` : 'Sin fase específica'}</p>
                    </div>
                    <button 
                      onClick={handleGoToProject}
                      style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#fff', backgroundColor: '#E8193C', borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C8102E'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8193C'}
                    >
                      Ver proyecto <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#6b7280' }}>Esta tarea no está asignada a un proyecto.</p>
              )}
            </section>

            {/* Descripción (si hubiera) */}
            {task.descripcion && (
              <section>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Descripción</h3>
                <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', backgroundColor: '#f9fafb', padding: 14, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  {task.descripcion}
                </div>
              </section>
            )}

            {/* Notas / Subtareas */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notas de Tarea ({subtareas.length})</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#f9fafb', padding: 16, borderRadius: 10, border: '1px solid #e5e7eb' }}>
                {subtareas.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#6b7280' }}>No hay notas para esta tarea.</p>
                ) : (
                  subtareas.map((sub: any) => (
                    <div key={sub.id} style={{ paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                      <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>
                        {sub.titulo}
                      </p>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{new Date(sub.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  ))
                )}
                
                <button 
                  onClick={handleAddSub}
                  style={{ fontSize: 12.5, color: lane.color, fontWeight: 600, background: "none", border: "none", padding: "4px 0", cursor: "pointer", width: "fit-content", textAlign: "left", marginTop: 4 }}
                >
                  + Añadir nota
                </button>
              </div>
            </section>

          </div>

          {/* Footer Actions */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => completeTask.mutate(task.id)}
              disabled={completeTask.isPending || task.estado === 'completada'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 16px', borderRadius: 8, backgroundColor: task.estado === 'completada' ? '#d1d5db' : '#10b981', color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 600, cursor: task.estado === 'completada' ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: completeTask.isPending ? 0.7 : 1 }}
              onMouseEnter={(e) => { if (task.estado !== 'completada') e.currentTarget.style.backgroundColor = '#059669' }}
              onMouseLeave={(e) => { if (task.estado !== 'completada') e.currentTarget.style.backgroundColor = '#10b981' }}
            >
              <Check size={16} strokeWidth={3} />
              {task.estado === 'completada' ? 'Tarea completada' : 'Marcar tarea como completada'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
