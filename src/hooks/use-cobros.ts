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
  tipo: 'desarrollo' | 'mantenimiento'
  estado: string
  notas: string | null
  created_at: string
  contact?: { id: string; nombre: string; empresa: string | null } | null
  deal?: { titulo: string } | null
  proyecto?: { nombre: string } | null
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
        .select('*, contacts(id, nombre, empresa), deals(id, titulo), cobro_pagos(*)')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((c: any) => ({
        ...c,
        contact: c.contacts ?? null,
        deal: c.deals ?? null,
        proyecto: null,
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

      // Generar cuotas automáticamente
      if (created) {
        const numPagos = created.num_pagos || 1
        const montoTotal = created.monto_total || 0
        const fechaBase = created.fecha_primer_pago ? new Date(created.fecha_primer_pago) : new Date()
        
        const cuotas = []
        for (let i = 0; i < numPagos; i++) {
          const fecha = new Date(fechaBase)
          fecha.setMonth(fecha.getMonth() + i)
          cuotas.push({
            cobro_id: created.id,
            numero_pago: i + 1,
            fecha_vencimiento: fecha.toISOString().split('T')[0],
            monto: montoTotal / numPagos,
            estado: 'pendiente'
          })
        }
        const { error: cuotasError } = await supabase.from('cobro_pagos').insert(cuotas)
        if (cuotasError) throw cuotasError
      }

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

