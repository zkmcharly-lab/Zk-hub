import { createClient } from '@/lib/supabase/client'

export async function logActivity(
  workspaceId: string,
  action: string,
  entityType: string,
  entityId: string,
  entityLabel: string,
  metadata?: Record<string, any>
) {
  const supabase = createClient()
  await supabase.from('activity_log').insert({
    workspace_id: workspaceId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_label: entityLabel,
    metadata: metadata ?? {}
  })
}
