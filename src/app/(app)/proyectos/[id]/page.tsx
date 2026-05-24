'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  useProyecto, useAvanzarFase, useUpdateTarea, useCreateTarea,
  useUpdateProyecto, useDeleteProyecto, useDeleteTarea,
  useToggleFase, useSubtareas, useCreateSubtarea, useToggleSubtarea, useDeleteSubtarea,
  useProyectoNotas, useCreateNota,
  type ProyectoFase, type ProyectoTarea, type ProyectoSubtarea
} from '@/hooks/use-proyectos'
import { ArrowLeft, CheckCircle2, Circle, Loader2, Plus, Calendar, Trash2, Pencil, X, ChevronDown, ChevronRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MantenimientoSetupModal } from '@/components/proyectos/mantenimiento-setup-modal'
import { ProjectEditModal } from '@/components/proyectos/project-edit-modal'
import { createClient } from '@/lib/supabase/client'

// ── Constants ─────────────────────────────────────────────────────────────────
const AVATARS: Record<string, { initials: string; bg: string; name: string }> = {
  charly: { initials: 'CH', bg: '#2563EB', name: 'Charly' },
  inma:   { initials: 'IN', bg: '#EC4899', name: 'Inma' },
  fabri:  { initials: 'FA', bg: '#16A34A', name: 'Fabri' },
  gabi:   { initials: 'GA', bg: '#D97706', name: 'Gabi' },
  global: { initials: 'GL', bg: '#6B7280', name: 'Global' },
}

const TASK_COLORS: Record<string, { border: string; bg: string }> = {
  charly: { border: '#2563EB', bg: 'rgba(37,99,235,0.05)' },
  inma:   { border: '#EC4899', bg: 'rgba(236,72,153,0.05)' },
  fabri:  { border: '#16A34A', bg: 'rgba(22,163,74,0.05)' },
  gabi:   { border: '#D97706', bg: 'rgba(217,119,6,0.05)' },
  global: { border: 'transparent', bg: '#F9FAFB' },
}

const NOTA_COLORS: Record<string, string> = {
  charly: '#2563EB',
  inma:   '#EC4899',
  fabri:  '#16A34A',
  gabi:   '#D97706',
}

// ── SubtareasPanel ─────────────────────────────────────────────────────────────
function SubtareasPanel({ tarea }: { tarea: ProyectoTarea }) {
  const { data: subtareas = [], isLoading } = useSubtareas(tarea.id)
  const createSubtarea = useCreateSubtarea()
  const toggleSubtarea = useToggleSubtarea()
  const deleteSubtarea = useDeleteSubtarea()
  const [nuevoTexto, setNuevoTexto] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTexto, setEditTexto] = useState('')

  const handleCreate = () => {
    if (!nuevoTexto.trim()) return
    createSubtarea.mutate({ tarea_id: tarea.id, descripcion: nuevoTexto.trim() }, {
      onSuccess: () => setNuevoTexto('')
    })
  }

  const handleSaveEdit = (subId: string) => {
    if (!editTexto.trim()) return
    // Since we're treating them as notes, we just need to update the description.
    // We can use the toggleSubtarea mutation or we need a useUpdateSubtarea mutation.
    // Wait, useToggleSubtarea only updates 'estado'. 
    // We don't have an update mutation for subtasks description in use-proyectos.ts yet.
    // Let's create an inline update using supabase client.
    const runUpdate = async () => {
      const supabase = createClient()
      await supabase.from('proyecto_subtareas').update({ descripcion: editTexto.trim() }).eq('id', subId)
      // trigger refetch by dispatching or just relying on window focus, actually we can just manually update the cache or reload
      window.dispatchEvent(new Event('refetch-subtareas'))
      setEditingId(null)
    }
    runUpdate()
  }

  // To trigger refetch when inline editing finishes
  const queryClient = useQueryClient()
  useEffect(() => {
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['subtareas', tarea.id] })
    window.addEventListener('refetch-subtareas', handleRefetch)
    return () => window.removeEventListener('refetch-subtareas', handleRefetch)
  }, [queryClient, tarea.id])

  if (isLoading) return <div className="pl-6 py-2 text-[12px] text-gray-400">Cargando...</div>

  return (
    <div className="pl-6 pt-2 space-y-2" onClick={e => e.stopPropagation()}>
      {subtareas.map(sub => (
        <div key={sub.id} className="flex flex-col gap-1 group py-0.5 relative">
          <div className="flex items-start gap-2">
            <span className="text-gray-300 text-[10px] select-none mt-1 shrink-0">├─</span>
            
            {editingId === sub.id ? (
              <div className="flex-1 flex flex-col gap-2 bg-white p-2 rounded-md border border-gray-200 shadow-sm z-10">
                <textarea
                  autoFocus
                  className="w-full text-[12px] text-gray-700 bg-transparent resize-none focus:outline-none min-h-[60px]"
                  value={editTexto}
                  onChange={e => setEditTexto(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="text-[11px] text-gray-500 hover:text-gray-700">Cancelar</button>
                  <button onClick={() => handleSaveEdit(sub.id)} className="text-[11px] bg-[#E8193C] text-white px-2 py-1 rounded font-bold">Guardar</button>
                </div>
              </div>
            ) : (
              <div 
                className="flex-1 flex flex-col cursor-text min-w-0" 
                onClick={() => { setEditingId(sub.id); setEditTexto(sub.descripcion) }}
              >
                <span className="text-[12px] text-gray-700 break-words whitespace-pre-wrap leading-relaxed pr-6">
                  {sub.descripcion}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">Nota agregada</span>
              </div>
            )}

            {/* Buttons (absolutely positioned so they don't get pushed by text) */}
            {editingId !== sub.id && (
              <div className="absolute top-1 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-[#F9FAFB] pl-2">
                <button
                  onClick={() => deleteSubtarea.mutate({ id: sub.id, tarea_id: tarea.id })}
                  className="text-gray-400 hover:text-red-500 transition-all p-1 bg-white rounded-md border border-gray-100 shadow-sm"
                  title="Eliminar nota"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="flex items-start gap-1.5 pt-1">
        <span className="text-gray-300 text-[10px] select-none mt-1.5 shrink-0">└─</span>
        <textarea
          ref={inputRef as any}
          placeholder="+ Añadir nota / apunte sobre la tarea..."
          value={nuevoTexto}
          onChange={e => setNuevoTexto(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreate()
            if (e.key === 'Escape') setNuevoTexto('')
          }}
          className="text-[12px] bg-transparent border border-dashed border-gray-300 rounded-md p-1.5 focus:border-[#E8193C] focus:bg-white focus:outline-none text-gray-700 placeholder-gray-400 w-full min-h-[30px] resize-y transition-colors break-words"
        />
        {nuevoTexto.trim() && (
          <button
            onClick={handleCreate}
            disabled={createSubtarea.isPending}
            className="text-[11px] bg-[#E8193C] text-white px-2 py-1.5 rounded font-bold hover:bg-[#C8102E] shrink-0 mt-0.5"
          >
            Guardar
          </button>
        )}
      </div>
    </div>
  )
}

// ── TareaRow ──────────────────────────────────────────────────────────────────
function TareaRow({ tarea }: { tarea: ProyectoTarea }) {
  const updateTarea = useUpdateTarea()
  const deleteTarea = useDeleteTarea()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ descripcion: tarea.descripcion, responsable: tarea.responsable || 'global' })

  const asignadoObj = AVATARS[tarea.responsable?.toLowerCase()] ?? AVATARS.global
  const taskColor = TASK_COLORS[tarea.responsable?.toLowerCase()] ?? TASK_COLORS.global

  const handleSave = () => {
    if (!editData.descripcion.trim()) return
    updateTarea.mutate({ id: tarea.id, data: { descripcion: editData.descripcion.trim(), responsable: editData.responsable } }, {
      onSuccess: () => setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="rounded-[8px] bg-white border border-[#E8193C]/20 shadow-sm p-3 space-y-3">
        <input
          autoFocus
          type="text"
          className="w-full text-[13px] bg-transparent border-b border-gray-200 pb-1.5 focus:outline-none focus:border-[#E8193C] transition-colors"
          value={editData.descripcion}
          onChange={e => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setEditing(false)
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <select
            className="text-[12px] bg-gray-50 border border-gray-200 text-gray-700 rounded px-2 py-1.5 focus:outline-none cursor-pointer"
            value={editData.responsable}
            onChange={e => setEditData(prev => ({ ...prev, responsable: e.target.value }))}
          >
            <option value="global">Sin asignar</option>
            <option value="charly">Charly</option>
            <option value="inma">Inma</option>
            <option value="fabri">Fabri</option>
            <option value="gabi">Gabi</option>
          </select>
          <div className="flex gap-2 items-center">
            <button onClick={() => setEditing(false)} className="text-[12px] text-gray-500 hover:text-gray-700 font-medium px-2">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={updateTarea.isPending || !editData.descripcion.trim()}
              className="text-[12px] bg-[#E8193C] text-white px-3 py-1.5 rounded-[6px] font-bold hover:bg-[#C8102E] disabled:opacity-50 transition-colors shadow-sm"
            >
              {updateTarea.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-[8px] border border-gray-100 shadow-sm overflow-hidden transition-all"
      style={{ borderLeft: `3px solid ${taskColor.border}`, backgroundColor: taskColor.bg }}
    >
      <div
        className="flex items-center gap-2.5 p-2.5 cursor-pointer group relative"
        onClick={() => setExpanded(prev => !prev)}
      >
        {/* Checkbox */}
        <div onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={tarea.estado === 'completada'}
            onChange={(e) => {
              updateTarea.mutate({ id: tarea.id, data: { estado: e.target.checked ? 'completada' : 'pendiente' } })
            }}
            disabled={updateTarea.isPending}
            className="rounded text-[#E8193C] focus:ring-[#E8193C] cursor-pointer disabled:opacity-50 w-4 h-4"
          />
        </div>

        {/* Expand icon */}
        <span className="text-gray-300 shrink-0">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>

        {/* Description */}
        <p className={`text-[13px] font-medium flex-1 ${tarea.estado === 'completada' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {tarea.descripcion}
        </p>

        {/* Avatar */}
        <div
          className="w-6 h-6 rounded-full flex shrink-0 items-center justify-center text-[9px] font-bold text-white shadow-sm"
          style={{ backgroundColor: asignadoObj.bg }}
          title={asignadoObj.name}
        >
          {asignadoObj.initials}
        </div>

        {/* Edit / Delete */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setEditing(true)
              setEditData({ descripcion: tarea.descripcion, responsable: tarea.responsable || 'global' })
            }}
            className="text-gray-400 hover:text-gray-700 p-1"
            title="Editar"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => { if (confirm('¿Eliminar esta tarea?')) deleteTarea.mutate(tarea.id) }}
            className="text-gray-400 hover:text-red-500 p-1"
            title="Eliminar"
            disabled={deleteTarea.isPending}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Subtareas expandidas */}
      {expanded && <SubtareasPanel tarea={tarea} />}
    </div>
  )
}

// ── NotasPanel ────────────────────────────────────────────────────────────────
function NotasPanel({ proyectoId }: { proyectoId: string }) {
  const { data: notas = [], isLoading } = useProyectoNotas(proyectoId)
  const createNota = useCreateNota()
  const [showing, setShowing] = useState(false)
  const [autor, setAutor] = useState<'charly' | 'inma' | 'fabri' | 'gabi'>('charly')
  const [contenido, setContenido] = useState('')

  const handleCreate = () => {
    if (!contenido.trim()) return
    createNota.mutate({ proyecto_id: proyectoId, autor, contenido: contenido.trim() }, {
      onSuccess: () => { setContenido(''); setShowing(false) }
    })
  }

  const formatNotaDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-bold text-gray-900">Notas del equipo</h2>
        <button
          onClick={() => setShowing(prev => !prev)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-[6px] transition-colors shadow-sm"
        >
          <Plus size={11} /> Nota
        </button>
      </div>

      {/* Form nueva nota */}
      {showing && (
        <div className="mb-4 rounded-[10px] border border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0"
              style={{ backgroundColor: NOTA_COLORS[autor] }}
            >
              {AVATARS[autor].initials}
            </div>
            <select
              value={autor}
              onChange={e => setAutor(e.target.value as any)}
              className="text-[12px] bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gray-400 cursor-pointer"
            >
              <option value="charly">Charly</option>
              <option value="inma">Inma</option>
              <option value="fabri">Fabri</option>
              <option value="gabi">Gabi</option>
            </select>
          </div>
          <textarea
            autoFocus
            className="w-full text-[13px] text-gray-700 bg-white border border-gray-200 rounded-[8px] p-3 resize-none focus:outline-none focus:border-gray-400 transition-all h-24"
            placeholder="Escribe la nota..."
            value={contenido}
            onChange={e => setContenido(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setShowing(false) }}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowing(false)} className="text-[12px] text-gray-500 hover:text-gray-700 font-medium px-2">Cancelar</button>
            <button
              onClick={handleCreate}
              disabled={createNota.isPending || !contenido.trim()}
              className="text-[12px] bg-[#E8193C] text-white px-3 py-1.5 rounded-[6px] font-bold hover:bg-[#C8102E] disabled:opacity-50 transition-colors shadow-sm"
            >
              {createNota.isPending ? 'Guardando...' : 'Guardar nota'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de notas */}
      {isLoading ? (
        <p className="text-[12px] text-gray-400">Cargando notas...</p>
      ) : notas.length === 0 ? (
        <p className="text-[12px] text-gray-400 italic">Sin notas aún. Añade la primera.</p>
      ) : (
        <div className="space-y-4">
          {notas.map(nota => (
            <div key={nota.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0"
                  style={{ backgroundColor: NOTA_COLORS[nota.autor] }}
                >
                  {AVATARS[nota.autor]?.initials ?? nota.autor.substring(0, 2).toUpperCase()}
                </div>
                <p className="text-[12px] font-semibold text-gray-700">
                  {AVATARS[nota.autor]?.name ?? nota.autor}
                  <span className="font-normal text-gray-400 ml-1.5">· {formatNotaDate(nota.created_at)}</span>
                </p>
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed pl-8 whitespace-pre-wrap">{nota.contenido}</p>
              <div className="border-b border-gray-100 pt-1 ml-8" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProyectoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.id as string

  const { data: proyecto, isLoading } = useProyecto(proyectoId)
  const updateTarea = useUpdateTarea()
  const createTarea = useCreateTarea()
  const updateProyecto = useUpdateProyecto()
  const deleteProyecto = useDeleteProyecto()
  const toggleFase = useToggleFase(proyectoId)

  const [mantenimientoModalOpen, setMantenimientoModalOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [faseCreandoTarea, setFaseCreandoTarea] = useState<string | null>(null)
  const [nuevaTarea, setNuevaTarea] = useState({ descripcion: '', responsable: 'global' })

  const handleCreateTarea = (faseId: string) => {
    if (!nuevaTarea.descripcion.trim()) return
    const currentFase = proyecto?.fases?.find(f => f.id === faseId)
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

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file || !proyecto) return
    
    // Check size limit: 5MB max
    if (file.size > 5 * 1024 * 1024) return alert('El archivo es muy pesado. Máximo 5MB.')

    if (tipo === 'logo') setIsUploadingLogo(true)
    else setIsUploadingBanner(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${proyecto.workspace_id}/${proyecto.id}/${tipo}.${ext}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('proyectos-assets')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('proyectos-assets')
        .getPublicUrl(path)

      // force refresh url by appending timestamp
      const urlWithTs = `${publicUrl}?t=${new Date().getTime()}`

      await updateProyecto.mutateAsync({
        id: proyecto.id,
        data: tipo === 'logo' ? { logo_url: urlWithTs } : { banner_url: urlWithTs }
      })
    } catch (err: any) {
      console.error(err)
      alert('Error subiendo archivo: ' + (err.message || 'Error desconocido'))
    } finally {
      if (tipo === 'logo') setIsUploadingLogo(false)
      else setIsUploadingBanner(false)
      // Reset input
      e.target.value = ''
    }
  }

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

  const responsableObj = proyecto.responsable ? AVATARS[proyecto.responsable.toLowerCase()] : null

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5] overflow-y-auto">
      {/* Header with optional Banner/Logo */}
      <div className="bg-white border-b border-gray-200 relative shrink-0 group/banner">
        {proyecto.banner_url ? (
          <div 
            className="w-full h-32 md:h-48 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${proyecto.banner_url})` }}
          >
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center">
              {isUploadingBanner ? (
                <div className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Subiendo...</div>
              ) : (
                <label className="cursor-pointer bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-colors">
                  Cambiar banner
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadAsset(e, 'banner')} disabled={isUploadingBanner} />
                </label>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-32 md:h-48 bg-gradient-to-r from-gray-100 to-gray-200 relative flex items-center justify-center group-hover/banner:from-gray-200 group-hover/banner:to-gray-300 transition-colors">
            {isUploadingBanner ? (
              <div className="bg-white shadow-sm text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Subiendo...</div>
            ) : (
              <label className="cursor-pointer bg-white shadow-sm text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                Subir banner
                <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadAsset(e, 'banner')} disabled={isUploadingBanner} />
              </label>
            )}
          </div>
        )}
        
        <div className="px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 pt-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/proyectos')} className="text-gray-400 hover:text-gray-900 shrink-0 bg-white/80 p-1.5 rounded-full z-10 shadow-sm relative top-[-10px]">
              <ArrowLeft size={18} />
            </button>
            
            <div className={`shrink-0 rounded-[12px] bg-white border border-gray-200 overflow-hidden flex items-center justify-center p-1 z-10 -mt-12 w-20 h-20 shadow-md relative group/logo`}>
              {isUploadingLogo ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : proyecto.logo_url ? (
                <>
                  <img src={proyecto.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer text-white text-[10px] font-bold underline">
                      Cambiar
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadAsset(e, 'logo')} disabled={isUploadingLogo} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors">
                  <span className="text-xs font-bold text-gray-500 mb-1">{proyecto.nombre.substring(0,2).toUpperCase()}</span>
                  <span className="text-[9px] underline">Subir logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadAsset(e, 'logo')} disabled={isUploadingLogo} />
                </label>
              )}
            </div>
            
            <div className="z-10">
              <h1 className="text-[16px] md:text-[20px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
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
                  <span className="flex items-center gap-1.5 bg-white/80 rounded px-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: responsableObj.bg }}>
                      {responsableObj.initials}
                    </div>
                    {responsableObj.name}
                  </span>
                )}
                {proyecto.fecha_entrega && (
                  <span className="flex items-center gap-1.5 border-l border-gray-300 pl-3 bg-white/80 rounded pr-1">
                    <Calendar size={12} /> {formatDate(proyecto.fecha_entrega)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 z-10 md:ml-auto">
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
                <p className="text-[11px] text-gray-400">Haz clic en el círculo de cada fase para marcarla</p>
              </div>

              <div className="space-y-4">
                {proyecto.fases?.map((fase) => {
                  const isCompleted = fase.estado === 'completada'
                  const isCurrent = fase.estado === 'en_progreso'
                  const isPending = fase.estado === 'pendiente'

                  return (
                    <div key={fase.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        {/* Clickable circle */}
                        <button
                          onClick={() => {
                            if (!toggleFase.isPending) {
                              toggleFase.mutate({
                                faseId: fase.id,
                                currentEstado: fase.estado,
                                allFases: proyecto.fases ?? []
                              })
                            }
                          }}
                          disabled={toggleFase.isPending}
                          title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer disabled:opacity-60
                            ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600' :
                              isCurrent ? 'bg-[#E8193C] border-[#E8193C] text-white shadow-[0_0_0_4px_rgba(232,25,60,0.15)]' :
                              'bg-white border-gray-300 text-gray-300 hover:border-gray-500'}
                          `}
                          style={isCurrent ? { animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' } : undefined}
                        >
                          {isCompleted ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-white" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                          )}
                        </button>

                        {fase.numero_fase < 6 && (
                          <div className={`w-0.5 flex-1 my-1 ${isCompleted ? 'bg-emerald-200' : 'bg-gray-100'}`} />
                        )}
                      </div>

                      <div className={`pb-6 w-full ${isPending ? 'opacity-50' : ''}`}>
                        <h3 className={`text-[14px] font-bold ${isCurrent ? 'text-[#E8193C]' : isCompleted ? 'text-emerald-700' : 'text-gray-900'}`}>
                          Fase {fase.numero_fase}: {fase.nombre_fase}
                        </h3>

                        {/* Tareas de la fase */}
                        {fase.proyecto_tareas && fase.proyecto_tareas.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {fase.proyecto_tareas.map(tarea => (
                              <TareaRow key={tarea.id} tarea={tarea} />
                            ))}
                          </div>
                        )}

                        {/* Añadir tarea */}
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
                                  if (e.key === 'Enter') handleCreateTarea(fase.id)
                                  if (e.key === 'Escape') setFaseCreandoTarea(null)
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
                                  <option value="gabi">Gabi</option>
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
                            <button
                              onClick={() => {
                                setFaseCreandoTarea(fase.id)
                                setNuevaTarea({ descripcion: '', responsable: 'global' })
                              }}
                              className="text-[12px] font-bold text-[#E8193C] hover:text-[#C8102E] flex items-center gap-1.5 px-1 py-0.5 rounded transition-colors hover:bg-red-50"
                            >
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

          {/* COLUMNA DERECHA */}
          <div className="space-y-6">

            {/* Detalles */}
            <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-[14px] font-bold text-gray-900 mb-5">Detalles del Proyecto</h2>
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cliente</p>
                  <p className="text-[13px] font-medium text-gray-900">{proyecto.contacts?.nombre || 'N/A'}</p>
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

            {/* Notas del equipo */}
            <NotasPanel proyectoId={proyectoId} />

            {/* Mantenimiento (Fase 5+) */}
            {proyecto.fase_actual >= 5 && (
              <div className="rounded-[14px] border-[0.8px] border-emerald-200 bg-emerald-50 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
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
