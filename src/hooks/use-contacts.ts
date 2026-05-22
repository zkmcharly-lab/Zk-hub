import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'

export interface Contact {
  id: string
  workspace_id: string
  nombre: string
  email: string | null
  telefono: string | null
  empresa: string | null
  etiquetas: string[]
  notas: string | null
  temperatura: 'frio' | 'tibio' | 'caliente'
  folder_id: string | null
  nicho: string | null
  pais: string | null
  region: string | null
  maps_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  sitio_web: string | null
  preferred_currency: string | null
  dato_relevante: string | null
  created_at: string
  deals?: Array<{ id: string; titulo: string; valor: number; stage_id: string | null; fecha_cierre: string | null }>
}

export function useContacts(params?: { search?: string; limit?: number; folder_id?: string | null }) {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['contacts', workspace?.id, params],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*, deals(id, titulo, valor, stage_id, fecha_cierre)')
        .eq('workspace_id', workspace!.id)
        .order('nombre', { ascending: true })

      if (params?.search) {
        query = query.or(
          `nombre.ilike.%${params.search}%,email.ilike.%${params.search}%,empresa.ilike.%${params.search}%`
        )
      }
      if (params?.folder_id) query = query.eq('folder_id', params.folder_id)
      if (params?.limit) query = query.limit(params.limit)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Contact[]
    },
    enabled: !!workspace?.id,
  })
}

export function useContact(id: string | null) {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, deals(id, titulo, valor, stage_id, fecha_cierre)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Contact
    },
    enabled: !!id && !!workspace?.id,
  })
}

export function useCreateContact() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      const { data: created, error } = await supabase
        .from('contacts')
        .insert({ ...data, workspace_id: workspace.id })
        .select()
        .single()
      if (error) throw error
      return created as Contact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', workspace?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspace?.id] })
    },
  })
}

export function useUpdateContact() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
      const { data: updated, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated as Contact
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', workspace?.id] })
      queryClient.invalidateQueries({ queryKey: ['contact', updated.id] })
    },
  })
}

export function useDeleteContact() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', workspace?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspace?.id] })
    },
  })
}
