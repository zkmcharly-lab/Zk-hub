import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { toast } from 'sonner'

export interface GastoZK {
  id: string
  workspace_id: string
  concepto: string
  tipo: 'herramienta' | 'publicidad' | 'freelancer' | 'operativo' | 'otro'
  monto: number
  divisa: 'EUR' | 'USD' | 'MXN'
  vinculacion_tipo: 'general' | 'cliente' | 'proyecto'
  cliente_id: string | null
  proyecto_id: string | null
  fecha: string
  created_at: string
  proyectos?: { nombre: string }
  contacts?: { nombre: string }
}

export function useGastos() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()

  return useQuery({
    queryKey: ['gastos', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gastos_zk')
        .select('*, proyectos(nombre), contacts(nombre)')
        .eq('workspace_id', workspace!.id)
        .order('fecha', { ascending: false })

      if (error) throw error
      return data as GastoZK[]
    },
    enabled: !!workspace?.id,
  })
}

export function useCreateGasto() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (gasto: Partial<GastoZK>) => {
      if (!workspace?.id) throw new Error('Workspace no hidratado')
      const { data, error } = await supabase
        .from('gastos_zk')
        .insert({ ...gasto, workspace_id: workspace.id })
        .select()
        .single()
      if (error) throw error
      return data as GastoZK
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos', workspace?.id] })
      toast.success('Gasto registrado exitosamente')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Error al registrar gasto')
    }
  })
}

export function useDeleteGasto() {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gastos_zk').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos', workspace?.id] })
      toast.success('Gasto eliminado')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Error al eliminar gasto')
    }
  })
}
