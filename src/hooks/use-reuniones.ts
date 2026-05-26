import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { toast } from 'sonner'

export interface Reunion {
  id: string
  workspace_id: string
  deal_id: string | null
  titulo: string
  notas: string | null
  fecha_hora: string
  created_at: string
  deals?: { titulo: string } | null
}

export function useReuniones(startOfWeekStr?: string, endOfWeekStr?: string) {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['reuniones', workspace?.id, startOfWeekStr, endOfWeekStr],
    queryFn: async () => {
      let query = supabase
        .from('reuniones')
        .select('*, deals(titulo)')
        .eq('workspace_id', workspace!.id)
        .order('fecha_hora', { ascending: true })

      if (startOfWeekStr && endOfWeekStr) {
        query = query.gte('fecha_hora', startOfWeekStr).lte('fecha_hora', endOfWeekStr)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Reunion[]
    },
    enabled: !!workspace?.id,
  })
}

export function useCreateReunion() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reunion: Partial<Reunion>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      const { data, error } = await supabase
        .from('reuniones')
        .insert({ ...reunion, workspace_id: workspace.id })
        .select()
        .single()
      if (error) throw error
      return data as Reunion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reuniones'] })
      toast.success('Reunión agendada')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Error al agendar reunión')
    }
  })
}

export function useUpdateReunion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Reunion> }) => {
      const { data: updated, error } = await supabase
        .from('reuniones')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated as Reunion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reuniones'] })
    },
    onError: (err) => {
      console.error(err)
      toast.error('Error al actualizar reunión')
    }
  })
}

export function useDeleteReunion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reuniones').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reuniones'] })
      toast.success('Reunión cancelada')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Error al cancelar reunión')
    }
  })
}
