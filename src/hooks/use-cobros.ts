import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'

export interface CobroPago {
  id: string
  cobro_id: string
  numero_pago: number
  fecha_vencimiento: string | null
  fecha_pago: string | null
  monto: number
  estado: 'pendiente' | 'pagado' | 'vencido'
  notas: string | null
}

export interface Cobro {
  id: string
  workspace_id: string
  deal_id: string | null
  contact_id: string | null
  monto_total: number
  moneda: string
  num_pagos: number
  metodo_pago: string
  fecha_primer_pago: string | null
  frecuencia: string
  estado: string
  notas: string | null
  created_at: string
  contact?: { id: string; nombre: string; empresa: string | null } | null
  pagos?: CobroPago[]
}

export function useCobros() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['cobros', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cobros')
        .select('*, contacts(id, nombre, empresa), cobro_pagos(*)')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((c: any) => ({
        ...c,
        contact: c.contacts ?? null,
        pagos: (c.cobro_pagos ?? []).sort((a: CobroPago, b: CobroPago) => a.numero_pago - b.numero_pago),
      })) as Cobro[]
    },
    enabled: !!workspace?.id,
  })
}

export function useCreateCobro() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Cobro>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      const { data: created, error } = await supabase
        .from('cobros')
        .insert({ ...data, workspace_id: workspace.id })
        .select()
        .single()
      if (error) throw error
      return created as Cobro
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobros', workspace?.id] })
    },
  })
}

export function useUpdateCobroPago() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CobroPago> }) => {
      const { data: updated, error } = await supabase
        .from('cobro_pagos')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated as CobroPago
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobros', workspace?.id] })
    },
  })
}

export function useUpdateCobro() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cobro> }) => {
      const { data: updated, error } = await supabase
        .from('cobros')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated as Cobro
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobros', workspace?.id] })
    },
  })
}

export function useDeleteCobro() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cobros').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobros', workspace?.id] })
    },
  })
}

