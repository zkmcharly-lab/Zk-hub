import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'

export interface ContactFolder {
  id: string
  workspace_id: string
  nombre: string
  color: string
  icon: string
  order_index: number
  created_at: string
}

export function useContactFolders() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['contact-folders', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_folders')
        .select('*')
        .eq('workspace_id', workspace!.id)
        .order('order_index')
      
      if (error) throw error
      return (data ?? []) as ContactFolder[]
    },
    enabled: !!workspace?.id,
  })
}

export function useCreateContactFolder() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<ContactFolder>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      const { data: created, error } = await supabase
        .from('contact_folders')
        .insert({ ...data, workspace_id: workspace.id })
        .select()
        .single()
      if (error) throw error
      return created as ContactFolder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-folders', workspace?.id] })
    },
  })
}

export function useDeleteContactFolder() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_folders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-folders', workspace?.id] })
    },
  })
}
