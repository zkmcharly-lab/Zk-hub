import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'

export interface Task {
  id: string
  workspace_id: string
  text: string
  done: boolean
  contact_id: string | null
  due_date: string | null
  assigned_to: string | null
  assignee_slot: string | null
  notes: string | null
  created_at: string
  contact?: { id: string; nombre: string; empresa: string | null } | null
}

export function useTasks(filter?: 'today' | 'week' | 'month' | 'all') {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['tasks', workspace?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*, contacts(id, nombre, empresa)')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false })

      if (filter && filter !== 'all') {
        const now = new Date()
        const start = new Date()
        if (filter === 'today') { start.setHours(0, 0, 0, 0) }
        else if (filter === 'week') { start.setDate(now.getDate() - now.getDay()) }
        else if (filter === 'month') { start.setDate(1) }
        query = query.gte('due_date', start.toISOString().split('T')[0])
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map((t: any) => ({ ...t, contact: t.contacts ?? null })) as Task[]
    },
    enabled: !!workspace?.id,
  })
}

export function useCreateTask() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Pick<Task, 'text' | 'contact_id' | 'due_date' | 'assignee_slot' | 'notes'>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      const { data: created, error } = await supabase
        .from('tasks')
        .insert({ ...data, workspace_id: workspace.id, done: false })
        .select()
        .single()
      if (error) throw error
      return created as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspace?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspace?.id] })
    },
  })
}

export function useUpdateTask() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const { data: updated, error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspace?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspace?.id] })
    },
  })
}

export function useDeleteTask() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspace?.id] })
    },
  })
}
