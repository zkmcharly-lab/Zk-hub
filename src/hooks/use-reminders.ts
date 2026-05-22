import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore, useAuthStore } from '@/lib/store'

export interface Reminder {
  id: string
  workspace_id: string
  contact_id: string | null
  deal_id: string | null
  task_id: string | null
  titulo: string
  descripcion: string | null
  fecha_recordatorio: string
  estado: 'pendiente' | 'completado' | 'descartado'
  created_by: string | null
  created_at: string
  contact?: {
    id: string
    nombre: string
  } | null
}

export function useReminders() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['reminders', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id || !user?.id) return []

      const { data, error } = await supabase
        .from('reminders')
        .select('*, contact:contacts(id, nombre)')
        .eq('workspace_id', workspace.id)
        .eq('created_by', user.id)
        .order('fecha_recordatorio', { ascending: true })

      if (error) throw error
      return (data ?? []) as Reminder[]
    },
    enabled: !!workspace?.id && !!user?.id,
  })
}

export function useCreateReminder() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Reminder>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      if (!user?.id) throw new Error('Usuario no autenticado')

      const { data: created, error } = await supabase
        .from('reminders')
        .insert({
          ...data,
          workspace_id: workspace.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return created as Reminder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export function useUpdateReminder() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Reminder> }) => {
      const { data: updated, error } = await supabase
        .from('reminders')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as Reminder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export function useDeleteReminder() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}
