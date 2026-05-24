import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { logActivity } from '@/lib/activity'

export interface PipelineStage {
  id: string
  workspace_id: string
  nombre: string
  posicion: number
  color: string
  deals?: Deal[]
}

export interface Deal {
  id: string
  workspace_id: string
  contact_id: string | null
  stage_id: string | null
  titulo: string
  valor: number
  posicion: number
  fecha_cierre: string | null
  descripcion: string | null
  notas: string | null
  prioridad: 'low' | 'normal' | 'high'
  subtipo: string | null
  currency: string | null
  reunion_fecha: string | null
  reunion_hora: string | null
  reunion_lugar: string | null
  reunion_plataforma: string | null
  reunion_link: string | null
  reunion_duracion: string | null
  agendar_en_calendario: boolean
  created_at: string
  is_overdue?: boolean
  contact?: { id: string; nombre: string; empresa: string | null; email: string | null } | null
}

export function usePipeline() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['pipeline', workspace?.id],
    queryFn: async () => {
      const [stagesRes, dealsRes] = await Promise.all([
        supabase
          .from('pipeline_stages')
          .select('*')
          .eq('workspace_id', workspace!.id)
          .order('posicion'),
        supabase
          .from('deals')
          .select('*, contacts(id, nombre, empresa, email)')
          .eq('workspace_id', workspace!.id)
          .order('posicion'),
      ])
      if (stagesRes.error) throw stagesRes.error
      if (dealsRes.error) throw dealsRes.error

      const today = new Date().toISOString().split('T')[0]
      const deals = (dealsRes.data ?? []).map((d: any) => ({
        ...d,
        contact: d.contacts ?? null,
        is_overdue: !!(d.fecha_cierre && d.fecha_cierre < today),
      })) as Deal[]

      const stages = (stagesRes.data ?? []).map((s: any) => ({
        ...s,
        deals: deals.filter((d) => d.stage_id === s.id).sort((a, b) => a.posicion - b.posicion),
      })) as PipelineStage[]

      return { stages, deals }
    },
    enabled: !!workspace?.id,
  })
}

export function useDealDetail(dealId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['deal-detail', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, contacts(id, nombre, empresa, email)')
        .eq('id', dealId!)
        .single()
      if (error) throw error
      const today = new Date().toISOString().split('T')[0]
      return {
        ...data,
        contact: (data as any).contacts ?? null,
        is_overdue: !!(data.fecha_cierre && data.fecha_cierre < today),
      } as Deal
    },
    enabled: !!dealId,
  })
}

export function useCreateDeal() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Deal>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      const { data: created, error } = await supabase
        .from('deals')
        .insert({ ...data, workspace_id: workspace.id })
        .select()
        .single()
      if (error) throw error
      return created as Deal
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', workspace?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspace?.id] })
      if (workspace?.id) {
        logActivity(workspace.id, 'deal_created', 'deal', created.id, created.titulo)
      }
    },
  })
}

export function useUpdateDeal() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Deal> }) => {
      const { data: updated, error } = await supabase
        .from('deals')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated as Deal
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', workspace?.id] })
      queryClient.invalidateQueries({ queryKey: ['deal-detail', updated.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspace?.id] })
    },
  })
}

export function useDeleteDeal() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', workspace?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspace?.id] })
    },
  })
}
