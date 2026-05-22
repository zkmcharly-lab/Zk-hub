import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'

export interface ContactNote {
  id: string
  contact_id: string
  workspace_id: string
  contenido: string
  created_by: string | null
  created_by_nombre: string | null
  created_at: string
}

export function useContactNotes(contactId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['contact-notes', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_notes')
        .select('*, users!created_by(nombre)')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((n: any) => ({
        ...n,
        created_by_nombre: n.users?.nombre ?? null,
      })) as ContactNote[]
    },
    enabled: !!contactId,
  })
}

export function useAddContactNote(contactId: string) {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contenido: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('contact_notes')
        .insert({
          contact_id: contactId,
          workspace_id: workspace!.id,
          contenido,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] })
    },
  })
}

export function useDeleteContactNote(contactId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('contact_notes').delete().eq('id', noteId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] })
    },
  })
}
