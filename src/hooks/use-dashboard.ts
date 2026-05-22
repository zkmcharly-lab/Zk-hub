import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { convertAmount } from '@/hooks/use-exchange-rates'

export function useDashboardMetrics(workspaceId?: string, rates?: Record<string, number>, workspaceCurrency?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['dashboard-metrics', workspaceId, workspaceCurrency, !!rates],
    queryFn: async () => {
      if (!workspaceId) throw new Error('No workspace')
      
      const [contacts, deals, wonDeals] = await Promise.all([
        supabase.from('contacts').select('id, created_at, folder_id').eq('workspace_id', workspaceId),
        supabase.from('deals').select('id, created_at, valor, currency, stage_id').eq('workspace_id', workspaceId),
        supabase.from('deals').select('id, created_at, valor, currency').eq('workspace_id', workspaceId).eq('stage_id', 'WON_STAGE_ID_PLACEHOLDER') // Note: We need to figure out stage mapping if they have won stage
      ])

      const now = new Date()
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const contactsData = contacts.data || []
      const dealsData = deals.data || []
      
      const pipelineTotal = dealsData.reduce((sum, d) => {
        const val = parseFloat(d.valor || '0')
        const converted = (rates && workspaceCurrency) ? convertAmount(val, d.currency || 'USD', workspaceCurrency, rates) : val
        return sum + converted
      }, 0)
      const pipelineLastWeek = dealsData.filter(d => new Date(d.created_at) < lastWeek).reduce((sum, d) => {
        const val = parseFloat(d.valor || '0')
        const converted = (rates && workspaceCurrency) ? convertAmount(val, d.currency || 'USD', workspaceCurrency, rates) : val
        return sum + converted
      }, 0)

      // Frios
      const frios = contactsData.filter(c => c.folder_id === 'cold') // Simplified

      return {
        contacts: {
          total: contactsData.length,
          this_week: contactsData.filter(c => new Date(c.created_at) >= lastWeek).length,
          last_week: 0,
          delta: contactsData.filter(c => new Date(c.created_at) >= lastWeek).length, // simplified delta
        },
        deals_active: {
          total: dealsData.length,
          this_week: dealsData.filter(c => new Date(c.created_at) >= lastWeek).length,
          last_week: 0,
          delta: dealsData.filter(c => new Date(c.created_at) >= lastWeek).length,
        },
        pipeline_value: {
          total: pipelineTotal,
          this_week: 0,
          last_week: pipelineLastWeek,
          delta: pipelineTotal - pipelineLastWeek,
        },
        deals_won: {
          this_month: 0,
          last_month: 0,
          delta: 0,
        },
        contactos_frios_total: frios.length,
        contactos_frios_agendados: 0,
        contactos_frios_list: [],
      }
    },
    enabled: !!workspaceId,
  })
}

export function useDashboardPipelineSummary(workspaceId?: string, rates?: Record<string, number>, workspaceCurrency?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['dashboard-pipeline', workspaceId, workspaceCurrency, !!rates],
    queryFn: async () => {
      if (!workspaceId) throw new Error('No workspace')
      
      const { data: stages } = await supabase.from('pipeline_stages').select('*').eq('workspace_id', workspaceId).order('posicion')
      const { data: deals } = await supabase.from('deals').select('stage_id, valor, currency').eq('workspace_id', workspaceId)

      let grandTotal = 0
      const summaryStages = (stages || []).map(stage => {
        const stageDeals = (deals || []).filter(d => d.stage_id === stage.id)
        const totalValue = stageDeals.reduce((sum, d) => {
          const val = parseFloat(d.valor || '0')
          const converted = (rates && workspaceCurrency) ? convertAmount(val, d.currency || 'USD', workspaceCurrency, rates) : val
          return sum + converted
        }, 0)
        grandTotal += totalValue
        return {
          id: stage.id,
          nombre: stage.nombre,
          color: stage.color || '#6b7280',
          deals_count: stageDeals.length,
          total_value: totalValue
        }
      })

      return {
        stages: summaryStages,
        grand_total: grandTotal
      }
    },
    enabled: !!workspaceId,
  })
}

export function useDashboardDealsOverTime(workspaceId?: string, rates?: Record<string, number>, workspaceCurrency?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['dashboard-deals-time', workspaceId, workspaceCurrency, !!rates],
    queryFn: async () => {
      if (!workspaceId) throw new Error('No workspace')
      
      const { data: deals } = await supabase.from('deals').select('created_at, valor, currency').eq('workspace_id', workspaceId)
      
      // Group by weeks (simplified: return 8 empty weeks for now or real logic)
      const weeks: { week_label: string; deals_created: number; value_created: number; }[] = []
      for (let i = 7; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i * 7)
        weeks.push({
          week_label: `Sem ${d.getDate()}/${d.getMonth()+1}`,
          deals_created: 0,
          value_created: 0
        })
      }
      
      if (deals) {
         deals.forEach(deal => {
            // Find appropriate week and add logic
            weeks[weeks.length - 1].deals_created += 1
            const val = parseFloat(deal.valor || '0')
            const converted = (rates && workspaceCurrency) ? convertAmount(val, deal.currency || 'USD', workspaceCurrency, rates) : val
            weeks[weeks.length - 1].value_created += converted
         })
      }

      return { weeks }
    },
    enabled: !!workspaceId,
  })
}

export function useDashboardAttention(workspaceId?: string, rates?: Record<string, number>, workspaceCurrency?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['dashboard-attention', workspaceId, workspaceCurrency, !!rates],
    queryFn: async () => {
      if (!workspaceId) throw new Error('No workspace')
      
      const today = new Date().toISOString().split('T')[0]
      const [overdue, stale, contactsWithoutDeals] = await Promise.all([
        supabase.from('deals').select('id, titulo, valor, currency, fecha_cierre, stage_id, contact_id').eq('workspace_id', workspaceId).lt('fecha_cierre', today),
        supabase.from('conversations').select('*').eq('workspace_id', workspaceId).lt('ultimo_mensaje_at', new Date(Date.now() - 48*3600*1000).toISOString()), // 48h stale
        supabase.from('contacts').select('id, nombre, empresa, created_at').eq('workspace_id', workspaceId).limit(5)
      ])

      // Simplify references for now
      const overdueDeals = (overdue.data || []).map(d => {
        const val = parseFloat(d.valor || '0')
        const converted = (rates && workspaceCurrency) ? convertAmount(val, d.currency || 'USD', workspaceCurrency, rates) : val
        return {
          ...d,
          valor: converted.toString(),
          stage_nombre: 'Etapa',
          stage_color: '#E8193C',
          contact: null
        }
      })

      return {
        overdue_deals: overdueDeals,
        stale_conversations: stale.data || [],
        contacts_without_deals: contactsWithoutDeals.data || []
      }
    },
    enabled: !!workspaceId,
  })
}

export function useDashboardActivity(workspaceId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['dashboard-activity', workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error('No workspace')
      
      const { data } = await supabase.from('activity_log').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(10)
      
      const events = (data || []).map(a => ({
        type: a.action,
        label: a.entity_label || a.action,
        entity_id: a.entity_id,
        entity_type: a.entity_type,
        timestamp: a.created_at,
        meta: a.metadata || {}
      }))

      return { events }
    },
    enabled: !!workspaceId,
  })
}

export function useDashboardTasksSummary(workspaceId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['dashboard-tasks', workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error('No workspace')
      
      const { data: tasks } = await supabase.from('tasks').select('*').eq('workspace_id', workspaceId)
      
      const pending = (tasks || []).filter(t => !t.done)
      const todayDate = new Date().toISOString().split('T')[0]

      return {
        tasks: {
          overdue: pending.filter(t => t.due_date && t.due_date < todayDate).length,
          today: pending.filter(t => t.due_date === todayDate).length,
          pending_total: pending.length,
          completed_this_week: 0,
          top_today: pending.slice(0, 5).map(t => ({ id: t.id, text: t.text, due_date: t.due_date }))
        },
        upcoming_events: []
      }
    },
    enabled: !!workspaceId,
  })
}
