import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore, useAuthStore } from '@/lib/store'

export interface WorkspaceUser {
  user_id: string
  rol: string
  users: {
    id: string
    nombre: string
    email: string
    avatar_url: string | null
  }
}

export function useWorkspaceMembers() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['workspace-members', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_users')
        .select('rol, users(id, nombre, email, avatar_url)')
        .eq('workspace_id', workspace!.id)
      
      if (error) throw error
      return (data ?? []) as unknown as WorkspaceUser[]
    },
    enabled: !!workspace?.id,
  })
}

export function useUpdateProfile() {
  const supabase = createClient()
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ nombre }: { nombre: string }) => {
      if (!user?.id) throw new Error('Usuario no autenticado')
      
      const { data, error } = await supabase
        .from('users')
        .update({ nombre })
        .eq('id', user.id)
        .select()
        .single()
        
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (user) {
        setUser({ ...user, nombre: data.nombre })
      }
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })
}

export function useUpdateWorkspace() {
  const supabase = createClient()
  const { workspace, setWorkspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ nombre, currency }: { nombre: string; currency: string }) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      
      const { data, error } = await supabase
        .from('workspaces')
        .update({ nombre, currency })
        .eq('id', workspace.id)
        .select()
        .single()
        
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (workspace) {
        setWorkspace({ ...workspace, nombre: data.nombre, currency: data.currency })
      }
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
    }
  })
}
