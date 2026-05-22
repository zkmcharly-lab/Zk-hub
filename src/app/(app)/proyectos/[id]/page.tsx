'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProyecto, useAvanzarFase, useUpdateTarea, useCreateTarea, useUpdateProyecto, useDeleteProyecto } from '@/hooks/use-proyectos'
import { ArrowLeft, CheckCircle2, Circle, Loader2, PlayCircle, Plus, Calendar, Save, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MantenimientoSetupModal } from '@/components/proyectos/mantenimiento-setup-modal'
import { ProjectEditModal } from '@/components/proyectos/project-edit-modal'

const AVATARS: Record<string, { initials: string; bg: string; name: string }> = {
  charly: { initials: 'CH', bg: '#E8193C', name: 'Charly' },
  inma: { initials: 'IN', bg: '#EC4899', name: 'Inma' },
  fabri: { initials: 'FA', bg: '#16A34A', name: 'Fabri' },
  global: { initials: 'GL', bg: '#6B7280', name: 'Global' }
}

export default function ProyectoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.id as string

  const { data: proyecto, isLoading } = useProyecto(proyectoId)
  const avanzarFase = useAvanzarFase(proyectoId)
  const updateTarea = useUpdateTarea()
  const createTarea = useCreateTarea()
  const updateProyecto = useUpdateProyecto()
  const deleteProyecto = useDeleteProyecto()

  const [mantenimientoModalOpen, setMantenimientoModalOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Estados para creación de tareas
  const [faseCreandoTarea, setFaseCreandoTarea] = useState<string | null>(null)
  const [nuevaTarea, setNuevaTarea] = useState({ descripcion: '', responsable: 'global' })

  // Estado para las notas
  const [resumen, setResumen] = useState('')
  const [isResumenDirty, setIsResumenDirty] = useState(false)

  useEffect(() => {
    if (proyecto && !isResumenDirty) {
      setResumen(proyecto.resumen || '')
    }
  }, [proyecto, isResumenDirty])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F5]">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (!proyecto) {
    return <div className="p-6">Proyecto no encontrado.</div>
  }

  const handleAvanzarFase = () => {
    if (confirm(`¿Estás seguro de avanzar a la siguiente fase?`)) {
      avanzarFase.mutate({ faseActual: proyecto.fase_actual })
    }
  }

  const handleCreateTarea = (faseId: string) => {
    if (!nuevaTarea.descripcion.trim()) return
    const currentFase = proyecto.fases?.find(f => f.id === faseId)
    const nextOrden = (currentFase?.proyecto_tareas?.length || 0) + 1

    createTarea.mutate({
      fase_id: faseId,
      descripcion: nuevaTarea.descripcion.trim(),
      responsable: nuevaTarea.responsable,
      estado: 'pendiente',
      orden: nextOrden
    }, {
      onSuccess: () => {
        setFaseCreandoTarea(null)
        setNuevaTarea({ descripcion: '', responsable: 'global' })
      }
    })
  }

  const handleGuardarResumen = () => {
    updateProyecto.mutate({ id: proyecto.id, data: { resumen } }, {
      onSuccess: () => setIsResumenDirty(false)
    })
  }

  const responsableObj = proyecto.responsable ? AVATARS[proyecto.responsable.toLowerCase()] : null

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5] overflow-y-auto">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
        <button onClick={() => router.push('/proyectos')} className="text-gray-400 hover:text-gray-900">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-[16px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {proyecto.nombre}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border capitalize ${
              proyecto.estado === 'pausado' ? 'bg-amber-50 text-amber-600 border-amber-100' :
              proyecto.estado === 'entregado' ? 'bg-blue-50 text-blue-600 border-blue-100' :
              'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {proyecto.estado}
            </span>
          </h1>
          <div className="flex items-center gap-3 text-[12px] text-gray-500 mt-0.5">
            {responsableObj && (
              <span className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: responsableObj.bg }}>
                  {responsableObj.initials}
                </div>
                {responsableObj.name}
              </span>
            )}
            {proyecto.fecha_entrega && (
              <span className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
                <Calendar size={12} /> {formatDate(proyecto.fecha_entrega)}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button 
            onClick={() => {
              if (confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) {
                deleteProyecto.mutate(proyecto.id, {
                  onSuccess: () => router.push('/proyectos')
                })
              }
            }}
            disabled={deleteProyecto.isPending}
            className="rounded-[8px] bg-red-50 px-3 py-1.5 text-[12px] font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {deleteProyecto.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Eliminar
          </button>
          <button 
            onClick={() => setIsEditOpen(true)}
            className="rounded-[8px] border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Editar proyecto
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* COLUMNA IZQUIERDA: Fases y Tareas */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Timeline */}
            <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[16px] font-bold text-gray-900">Timeline del Proyecto</h2>
                {proyecto.fase_actual < 6 && proyecto.estado !== 'entregado' && (
                  <button 
                    onClick={handleAvanzarFase}
                    disabled={avanzarFase.isPending}
                    className="flex items-center gap-2 rounded-[8px] bg-gray-900 px-4 py-2 text-[12px] font-bold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    Avanzar de fase &rarr;
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {proyecto.fases?.map((fase) => {
                  const isCurrent = fase.numero_fase === proyecto.fase_actual && proyecto.estado !== 'entregado'
                  const isPast = fase.numero_fase < proyecto.fase_actual || proyecto.estado === 'entregado'
                  
                  return (
                    <div key={fase.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          isPast ? 'bg-emerald-100 text-emerald-600' : 
                          isCurrent ? 'bg-[#E8193C] text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isPast ? <CheckCircle2 size={14} /> : isCurrent ? <PlayCircle size={14} /> : <Circle size={14} />}
                        </div>
                        {fase.numero_fase < 6 && (
                          <div className={`w-0.5 flex-1 my-1 ${isPast ? 'bg-emerald-100' : 'bg-gray-100'}`} />
                        )}
                      </div>
                      
                      <div className={`pb-6 w-full ${!isCurrent && !isPast && 'opacity-50'}`}>
                        <h3 className={`text-[14px] font-bold ${isCurrent ? 'text-[#E8193C]' : 'text-gray-900'}`}>
                          Fase {fase.numero_fase}: {fase.nombre_fase}
                        </h3>
                        
                        {/* Tareas de la fase */}
                        {fase.proyecto_tareas && fase.proyecto_tareas.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {fase.proyecto_tareas.map(tarea => {
                              const asignadoObj = tarea.responsable ? AVATARS[tarea.responsable.toLowerCase()] || AVATARS.global : AVATARS.global
                              return (
                                <div key={tarea.id} className="flex items-start gap-3 rounded-[8px] bg-gray-50 border border-gray-100 p-2.5 transition-colors hover:bg-gray-100 group">
                                  <input 
                                    type="checkbox" 
                                    checked={tarea.estado === 'completada'} 
                                    onChange={(e) => {
                                      updateTarea.mutate({ 
                                        id: tarea.id, 
                                        data: { estado: e.target.checked ? 'completada' : 'pendiente' } 
                                      })
                                    }}
                                    disabled={updateTarea.isPending}
                                    className="mt-0.5 rounded text-[#E8193C] focus:ring-[#E8193C] cursor-pointer disabled:opacity-50 w-4 h-4" 
                                  />
                                  <div className="flex-1 mt-[1px]">
                                    <p className={`text-[13px] font-medium ${tarea.estado === 'completada' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                      {tarea.descripcion}
                                    </p>
                                  </div>
                                  <div 
                                    className="w-5 h-5 rounded-full flex shrink-0 items-center justify-center text-[9px] font-bold text-white shadow-sm opacity-90 group-hover:opacity-100"
                                    style={{ backgroundColor: asignadoObj.bg }}
                                    title={asignadoObj.name}
                                  >
                                    {asignadoObj.initials}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        <div className="mt-3">
                          {faseCreandoTarea === fase.id ? (
                            <div className="rounded-[8px] bg-white border border-[#E8193C]/20 shadow-sm p-3 space-y-3">
                              <input 
                                autoFocus
                                type="text" 
                                placeholder="Descripción de la tarea..." 
                                className="w-full text-[13px] bg-transparent border-b border-gray-200 pb-1.5 focus:outline-none focus:border-[#E8193C] transition-colors"
                                value={nuevaTarea.descripcion}
                                onChange={e => setNuevaTarea(prev => ({ ...prev, descripcion: e.target.value }))}
                                onKeyDown={e => {
                                  if(e.key === 'Enter') handleCreateTarea(fase.id)
                                  if(e.key === 'Escape') setFaseCreandoTarea(null)
                                }}
                              />
                              <div className="flex items-center justify-between gap-2">
                                <select 
                                  className="text-[12px] bg-gray-50 border border-gray-200 text-gray-700 rounded px-2 py-1.5 focus:outline-none cursor-pointer"
                                  value={nuevaTarea.responsable}
                                  onChange={e => setNuevaTarea(prev => ({ ...prev, responsable: e.target.value }))}
                                >
                                  <option value="global">Sin asignar</option>
                                  <option value="charly">Charly</option>
                                  <option value="inma">Inma</option>
                                  <option value="fabri">Fabri</option>
                                </select>
                                <div className="flex gap-2 items-center">
                                  <button onClick={() => setFaseCreandoTarea(null)} className="text-[12px] text-gray-500 hover:text-gray-700 font-medium px-2">Cancelar</button>
                                  <button 
                                    onClick={() => handleCreateTarea(fase.id)}
                                    disabled={createTarea.isPending || !nuevaTarea.descripcion.trim()}
                                    className="text-[12px] bg-[#E8193C] text-white px-3 py-1.5 rounded-[6px] font-bold hover:bg-[#C8102E] disabled:opacity-50 transition-colors shadow-sm"
                                  >
                                    {createTarea.isPending ? 'Guardando...' : 'Guardar tarea'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => {
                              setFaseCreandoTarea(fase.id)
                              setNuevaTarea({ descripcion: '', responsable: 'global' })
                            }} className="text-[12px] font-bold text-[#E8193C] hover:text-[#C8102E] flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors hover:bg-red-50">
                              <Plus size={14} /> Añadir nueva tarea
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Detalles y Acciones */}
          <div className="space-y-6">
            
            <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-[14px] font-bold text-gray-900 mb-5">Detalles del Proyecto</h2>
              
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cliente</p>
                  <p className="text-[13px] font-medium text-gray-900">
                    {proyecto.contacts?.nombre || 'N/A'}
                  </p>
                </div>
                
                {proyecto.deals && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Deal vinculado</p>
                    <p className="text-[13px] font-medium text-[#E8193C]">
                      {proyecto.deals.titulo} ({formatCurrency(proyecto.deals.valor)})
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Responsable Principal</p>
                  {responsableObj ? (
                    <div className="flex items-center gap-2.5 text-[13px] text-gray-900 font-medium">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: responsableObj.bg }}>
                        {responsableObj.initials}
                      </div>
                      {responsableObj.name}
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-500 italic">Sin asignar</p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha de Entrega</p>
                  <p className="text-[13px] font-medium text-gray-900 flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    {proyecto.fecha_entrega ? formatDate(proyecto.fecha_entrega) : 'No definida'}
                  </p>
                </div>
                
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Progreso general</p>
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 flex-1 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                      <div className="h-2.5 rounded-full bg-[#E8193C] transition-all duration-500" style={{ width: `${proyecto.porcentaje}%` }} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 w-8 text-right">{proyecto.porcentaje}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas del proyecto */}
            <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-bold text-gray-900">Notas del equipo</h2>
                {isResumenDirty && (
                  <button 
                    onClick={handleGuardarResumen}
                    disabled={updateProyecto.isPending}
                    className="text-[11px] font-bold text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-[6px] flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Save size={12} /> {updateProyecto.isPending ? 'Guardando...' : 'Guardar notas'}
                  </button>
                )}
              </div>
              <textarea 
                className="w-full h-40 text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-[10px] p-4 resize-none focus:outline-none focus:border-[#E8193C]/50 focus:bg-white transition-all shadow-sm"
                placeholder="Escribe apuntes, links útiles, decisiones o comentarios del equipo aquí..."
                value={resumen}
                onChange={e => {
                  setResumen(e.target.value)
                  setIsResumenDirty(true)
                }}
              />
            </div>

            {/* Mantenimiento Action (Visible in Phase 5 or 6) */}
            {proyecto.fase_actual >= 5 && (
              <div className="rounded-[14px] border-[0.8px] border-emerald-200 bg-emerald-50 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <h3 className="text-[14px] font-bold text-emerald-900 mb-2">Mantenimiento Mensual</h3>
                <p className="text-[12px] text-emerald-700 mb-4 leading-relaxed">
                  El proyecto está en fase de entrega o soporte. Ya puedes configurar el plan de mantenimiento para este cliente.
                </p>
                <button 
                  id="btn-crear-mantenimiento"
                  onClick={() => setMantenimientoModalOpen(true)}
                  className="w-full rounded-[8px] bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Crear mantenimiento
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>

      <MantenimientoSetupModal 
        isOpen={mantenimientoModalOpen}
        onClose={() => setMantenimientoModalOpen(false)}
        proyecto={proyecto}
      />
      <ProjectEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        proyecto={proyecto}
      />
    </div>
  )
}
