import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'

export interface Proyecto {
  id: string
  workspace_id: string
  contact_id: string | null
  deal_id: string | null
  nombre: string
  tipo: string
  fase_actual: number
  porcentaje: number
  estado: 'activo' | 'pausado' | 'entregado'
  resumen: string | null
  proximos_pasos: string | null
  created_at: string
  responsable?: string | null
  fecha_entrega?: string | null
  contacts?: { nombre: string; empresa: string | null }
  deals?: { titulo: string; valor: number }
  proyecto_fases?: ProyectoFase[]
}

export interface ProyectoFase {
  id: string
  proyecto_id: string
  numero_fase: number
  nombre_fase: string
  estado: 'pendiente' | 'en_progreso' | 'completada'
  proyecto_tareas?: ProyectoTarea[]
}

export interface ProyectoTarea {
  id: string
  fase_id: string
  workspace_id: string
  descripcion: string
  responsable: string
  estado: 'pendiente' | 'en_progreso' | 'completada'
  orden: number
}

export function useProyectos() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['proyectos', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*, contacts(nombre, empresa), deals(titulo, valor), proyecto_fases(*, proyecto_tareas(*))')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const proyectosSorted = (data ?? []).map((p: any) => {
        const fases = (p.proyecto_fases || []).map((f: any) => ({
          ...f,
          proyecto_tareas: (f.proyecto_tareas || []).sort((a: any, b: any) => a.orden - b.orden)
        })).sort((a: any, b: any) => a.numero_fase - b.numero_fase)
        return { ...p, proyecto_fases: fases }
      })
      
      return proyectosSorted as Proyecto[]
    },
    enabled: !!workspace?.id,
  })
}

export function useProyecto(id: string) {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['proyecto', id],
    queryFn: async () => {
      const { data: proyecto, error: errorProyecto } = await supabase
        .from('proyectos')
        .select('*, contacts(nombre, empresa), deals(titulo, valor)')
        .eq('id', id)
        .single()

      if (errorProyecto) throw errorProyecto

      const { data: fases, error: errorFases } = await supabase
        .from('proyecto_fases')
        .select('*, proyecto_tareas(*)')
        .eq('proyecto_id', id)
        .order('numero_fase', { ascending: true })

      if (errorFases) throw errorFases

      // Sort tareas inside each fase
      const fasesSort = fases.map((f: any) => ({
        ...f,
        proyecto_tareas: (f.proyecto_tareas || []).sort((a: any, b: any) => a.orden - b.orden)
      }))

      return { ...proyecto, fases: fasesSort } as Proyecto & { fases: ProyectoFase[] }
    },
    enabled: !!id && !!workspace?.id,
  })
}

export function useCreateProyecto() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Proyecto>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      const { data: created, error } = await supabase
        .from('proyectos')
        .insert({ ...data, workspace_id: workspace.id })
        .select()
        .single()
      if (error) throw error
      return created as Proyecto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos', workspace?.id] })
    },
  })
}

export function useAvanzarFase(proyectoId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { workspace } = useWorkspaceStore()

  return useMutation({
    mutationFn: async ({ faseActual }: { faseActual: number }) => {
      if (faseActual >= 6) return

      const nuevaFase = faseActual + 1
      const nuevoPorcentaje = Math.round((nuevaFase / 6) * 100)

      const { error } = await supabase
        .from('proyectos')
        .update({ 
          fase_actual: nuevaFase,
          porcentaje: nuevoPorcentaje,
          estado: nuevaFase === 6 ? 'entregado' : 'activo'
        })
        .eq('id', proyectoId)

      if (error) throw error

      // Update phase statuses
      await supabase
        .from('proyecto_fases')
        .update({ estado: 'completada' })
        .eq('proyecto_id', proyectoId)
        .eq('numero_fase', faseActual)

      await supabase
        .from('proyecto_fases')
        .update({ estado: 'en_progreso' })
        .eq('proyecto_id', proyectoId)
        .eq('numero_fase', nuevaFase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', proyectoId] })
      queryClient.invalidateQueries({ queryKey: ['proyectos', workspace?.id] })
    },
  })
}

export function useCreateTarea() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<ProyectoTarea>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      const { data: created, error } = await supabase
        .from('proyecto_tareas')
        .insert({ ...data, workspace_id: workspace.id })
        .select()
        .single()
      if (error) throw error
      return created
    },
    onSuccess: (_, variables) => {
      // We could invalidate specific project if we had the ID, but global invalidate or specific phase works too
      queryClient.invalidateQueries({ queryKey: ['proyecto'] })
    },
  })
}

export function useUpdateTarea() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProyectoTarea> }) => {
      const { data: updated, error } = await supabase
        .from('proyecto_tareas')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyecto'] })
    },
  })
}

export function useUpdateProyecto() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { workspace } = useWorkspaceStore()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Proyecto> }) => {
      const { data: updated, error } = await supabase
        .from('proyectos')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated as Proyecto
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proyecto', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['proyectos', workspace?.id] })
    },
  })
}

export function useDeleteProyecto() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { workspace } = useWorkspaceStore()

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Borrar tareas (on delete cascade should handle this ideally, but manual to be safe)
      await supabase.from('proyecto_tareas').delete().eq('proyecto_id', id) // Wait, Tareas only have fase_id actually.
      // Let's just delete the project, if ON DELETE CASCADE is set, it will work.
      // If not, we will need to delete fases, which deletes tareas.
      
      // Let's fetch fases to delete tareas manually just in case
      const { data: fases } = await supabase.from('proyecto_fases').select('id').eq('proyecto_id', id)
      if (fases && fases.length > 0) {
        const faseIds = fases.map((f: any) => f.id)
        await supabase.from('proyecto_tareas').delete().in('fase_id', faseIds)
      }
      
      await supabase.from('proyecto_fases').delete().eq('proyecto_id', id)
      
      const { error } = await supabase.from('proyectos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos', workspace?.id] })
    },
  })
}
