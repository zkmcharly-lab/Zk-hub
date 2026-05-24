'use client'
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { useSearchParams } from 'next/navigation'
import { Check, Loader2, LayoutGrid, Plus } from "lucide-react"
import { TaskPanel } from "@/components/tasks/task-panel"
import { ProyectoTaskFormModal } from "@/components/tasks/proyecto-task-form-modal"

const LANES = [
  { key: "inma",   label: "Inmi",   color: "#ec4899", bg: "rgba(236,72,153,0.07)",   border: "rgba(236,72,153,0.30)" },
  { key: "gabi",   label: "Gabi",   color: "#d97706", bg: "rgba(217,119,6,0.07)",    border: "rgba(217,119,6,0.30)" },
  { key: "fabri",  label: "Fabri",  color: "#16a34a", bg: "rgba(22,163,74,0.07)",    border: "rgba(22,163,74,0.30)" },
  { key: "charly", label: "Charly", color: "#2563eb", bg: "rgba(37,99,235,0.08)",    border: "rgba(37,99,235,0.20)" },
  { key: "global", label: "Global", color: "#6b7280", bg: "rgba(107,114,128,0.08)",  border: "rgba(107,114,128,0.20)" },
] as const

function KanbanTask({ task, onSelectTask }: any) {
  const lane = LANES.find(l => l.key === task.responsable) || LANES[4]
  
  const subtareas = task.proyecto_subtareas || []
  const completadas = subtareas.filter((s:any) => s.estado === 'completada').length

  return (
    <div 
      onClick={() => onSelectTask(task)}
      style={{
        background: "var(--zk-bg-card)",
        border: "1px solid var(--zk-border-subtle)",
        borderLeft: `4px solid ${lane.color}`,
        borderRadius: 9,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)"}
    >
      <div style={{ fontSize: 10.5, color: "var(--zk-text-muted)", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {task.proyecto_fases?.proyectos?.nombre || 'Sin proyecto'}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--zk-text-primary)", marginTop: 4, lineHeight: 1.4 }}>
        {task.titulo}
      </div>
      {subtareas.length > 0 && (
        <div style={{ fontSize: 11.5, color: "var(--zk-text-secondary)", marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: lane.color }} />
          {subtareas.length} subtarea{subtareas.length !== 1 ? 's' : ''} ({completadas}/{subtareas.length})
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const persona = searchParams.get('persona')
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['proyecto_tareas_kanban', workspace?.id],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase.from('proyecto_tareas')
        .select(`
          *,
          proyecto_fases(
            numero_fase,
            nombre_fase,
            proyecto_id,
            proyectos(id, nombre)
          ),
          proyecto_subtareas(*)
        `)
        .eq('workspace_id', workspace!.id)
        .neq('estado', 'completada')
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!workspace?.id
  })

  useEffect(() => {
    const handler = () => refetch()
    window.addEventListener('refetch-tasks', handler)
    return () => window.removeEventListener('refetch-tasks', handler)
  }, [refetch])

  const updateSubtarea = useMutation({
    mutationFn: async ({ id, estado }: { id: string, estado: string }) => {
      const supabase = createClient()
      await supabase.from('proyecto_subtareas').update({ estado }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proyecto_tareas_kanban'] })
  })

  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      await supabase.from('proyecto_tareas').update({ estado: 'completada' }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proyecto_tareas_kanban'] })
  })

  if (isLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} className="animate-spin text-gray-400" />
    </div>
  )

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 28px", flexShrink: 0, borderBottom: "1px solid var(--zk-border-subtle)", backgroundColor: "var(--zk-topbar-bg)", display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--zk-text-primary)", margin: 0 }}>Tareas de Proyectos</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, backgroundColor: 'rgba(232,25,60,0.08)', color: '#E8193C', borderRadius: 8 }}>
            <LayoutGrid size={14} /> Vista Kanban
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, backgroundColor: '#E8193C', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C8102E'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8193C'}
          >
            <Plus size={14} /> Añadir Tarea
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, padding: '20px 28px 24px', backgroundColor: 'var(--zk-bg-page)', minWidth: 1200 }}>
        {LANES.map(lane => {
          const laneTasks = tasks.filter(t => {
            if (lane.key === 'global') return !t.responsable || t.responsable === 'global'
            return t.responsable === lane.key
          })

          const isHighlighted = persona && persona.toLowerCase() === lane.key
          
          return (
            <div key={lane.key} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              background: isHighlighted ? lane.bg : "var(--zk-bg-card)", 
              border: `1px solid ${isHighlighted ? lane.border : 'var(--zk-border)'}`, 
              borderRadius: 14, 
              overflow: "hidden",
              transition: "all 0.3s ease",
              boxShadow: isHighlighted ? `0 0 0 2px ${lane.color}30` : 'none'
            }}>
              <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${isHighlighted ? lane.border : 'var(--zk-border-subtle)'}`, background: isHighlighted ? 'transparent' : lane.bg, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--zk-text-primary)", flex: 1 }}>{lane.label}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 10px", borderRadius: 999, background: `${lane.color}22`, color: lane.color }}>{laneTasks.length}</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 10 }}>
                {laneTasks.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: "var(--zk-text-disabled)", textAlign: 'center', marginTop: 20 }}>No hay tareas</p>
                ) : (
                  laneTasks.map(task => (
                    <KanbanTask 
                      key={task.id} 
                      task={task} 
                      onSelectTask={setSelectedTask}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedTask && (
        <TaskPanel 
          task={selectedTask}
          onClose={() => {
            setSelectedTask(null)
            refetch()
          }}
        />
      )}

      <ProyectoTaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => refetch()}
      />
    </div>
  )
}
