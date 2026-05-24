'use client'
import { useState } from 'react'
import { usePipeline, useCreateDeal, useUpdateDeal } from '@/hooks/use-deals'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/lib/store'
import { logActivity } from '@/lib/activity'
import { formatCurrency, avatarColor, initials, formatDate } from '@/lib/utils'
import { Plus, Loader2, AlertTriangle } from 'lucide-react'
import { DealFormModal } from '@/components/pipeline/deal-form-modal'
import { DealPanel } from '@/components/pipeline/deal-panel'
import { CobrosSetupModal } from '@/components/pipeline/cobros-setup-modal'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const formatMonto = (monto: number, moneda: string) => {
  const code = moneda || 'USD';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0
  }).format(monto)
}

function DealCard({ deal, overlay, onClick }: { deal: any; overlay?: boolean; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    backgroundColor: 'var(--zk-bg-card)',
    border: `0.8px solid ${deal.is_overdue ? 'rgba(239,68,68,0.4)' : 'var(--zk-border)'}`,
    borderRadius: 10,
    padding: '12px 14px',
    cursor: overlay ? 'grabbing' : 'grab',
    boxShadow: overlay ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
    userSelect: 'none',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={(e) => {
      // Prevent drag events from triggering click if needed, or just call onClick
      if (!isDragging && onClick) onClick();
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--zk-text-primary)', lineHeight: 1.3, flex: 1 }}>
          {deal.titulo}
        </p>
        {deal.is_overdue && <AlertTriangle size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />}
      </div>
      {deal.valor > 0 && (
        <p style={{ fontSize: 13, fontWeight: 600, color: '#E8193C', marginTop: 6 }}>
          {formatMonto(deal.valor, deal.currency)}
        </p>
      )}
      {deal.contact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', backgroundColor: avatarColor(deal.contact.nombre),
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#fff',
          }}>
            {initials(deal.contact.nombre)}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--zk-text-secondary)' }}>{deal.contact.nombre}</p>
        </div>
      )}
      {deal.fecha_cierre && (
        <p style={{ fontSize: 11, color: deal.is_overdue ? '#ef4444' : 'var(--zk-text-muted)', marginTop: 6 }}>
          📅 {formatDate(deal.fecha_cierre)}
        </p>
      )}
    </div>
  )
}

function KanbanColumn({ stage, deals, onAddDeal, onDealClick }: { stage: any; deals: any[]; onAddDeal: (stageId: string) => void; onDealClick: (deal: any) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  
  const totalsByCurrency = deals.reduce((acc, deal) => {
    const currency = deal.currency || 'USD';
    acc[currency] = (acc[currency] || 0) + (deal.valor || 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minWidth: 280, maxWidth: 280, flexShrink: 0,
      height: 'calc(100vh - 180px)'
    }}>
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        padding: '8px 12px', backgroundColor: 'var(--zk-bg-card)',
        border: '0.8px solid var(--zk-border)', borderRadius: 8,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stage.color, flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--zk-text-primary)', flex: 1 }}>{stage.nombre}</p>
        <span style={{ fontSize: 11, color: 'var(--zk-text-muted)', fontWeight: 500 }}>{deals.length}</span>
      </div>
      {Object.keys(totalsByCurrency).length > 0 && (
        <p style={{ fontSize: 11.5, color: stage.color, fontWeight: 600, marginBottom: 10, paddingLeft: 4 }}>
          {Object.entries(totalsByCurrency).map(([moneda, monto]) => formatMonto(monto as number, moneda)).join(' · ')}
        </p>
      )}

      {/* Cards */}
      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div 
          ref={setNodeRef}
          style={{ 
            display: 'flex', flexDirection: 'column', gap: 8, 
            flex: 1, minHeight: 100, overflowY: 'auto',
            backgroundColor: isOver ? 'rgba(232,25,60,0.04)' : 'transparent',
            borderRadius: 8,
            transition: 'background-color 150ms'
          }}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
          ))}
        </div>
      </SortableContext>

      {/* Add button */}
      <button
        onClick={() => onAddDeal(stage.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
          padding: '8px 10px', backgroundColor: 'transparent',
          border: '0.8px dashed var(--zk-border)', borderRadius: 8,
          fontSize: 12.5, color: 'var(--zk-text-muted)', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 120ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E8193C'; e.currentTarget.style.color = '#E8193C' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--zk-border)'; e.currentTarget.style.color = 'var(--zk-text-muted)' }}
      >
        <Plus size={13} /> Agregar deal
      </button>
    </div>
  )
}

export default function PipelinePage() {
  const { data: pipeline, isLoading } = usePipeline()
  const updateDeal = useUpdateDeal()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dealModalStage, setDealModalStage] = useState<string | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null)
  const [cobroSetupOpen, setCobroSetupOpen] = useState(false)
  const [cobroSetupDeal, setCobroSetupDeal] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const { workspace } = useWorkspaceStore()

  const supabase = createClient()
  const queryClient = useQueryClient()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const activeDeal = pipeline?.deals?.find((d) => d.id === activeId)

  function handleDragStart({ active }: DragStartEvent) { setActiveId(active.id as string) }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    let targetStage = pipeline?.stages?.find(s => s.id === over.id)
    
    if (!targetStage) {
      targetStage = pipeline?.stages?.find(s =>
        s.deals?.some((d: any) => d.id === over.id)
      )
    }

    if (!targetStage) return

    await supabase
      .from('deals')
      .update({ stage_id: targetStage.id })
      .eq('id', active.id as string)

    queryClient.invalidateQueries({ queryKey: ['pipeline'] })

    if (workspace?.id) {
      logActivity(workspace.id, 'deal_stage_changed', 'deal', active.id as string, `Movido a ${targetStage.nombre}`)
    }
    
    if (targetStage.nombre === 'En cobro') {
      const dealToSetup = pipeline?.stages
        ?.flatMap(s => s.deals ?? [])
        ?.find(d => d.id === active.id)
      if (dealToSetup) {
        setCobroSetupDeal(dealToSetup)
        setCobroSetupOpen(true)
      }
    }
  }

  if (isLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--zk-text-muted)' }} />
    </div>
  )

  const totalsByCurrencyHeader = pipeline?.deals?.reduce((acc, deal) => {
    const currency = deal.currency || 'USD';
    acc[currency] = (acc[currency] || 0) + (deal.valor || 0);
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '18px 28px', borderBottom: '0.8px solid var(--zk-border)',
        backgroundColor: 'var(--zk-topbar-bg)', display: 'flex', alignItems: 'center', gap: 16,
        flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--zk-text-primary)' }}>Pipeline</h1>
          <p style={{ fontSize: 12.5, color: 'var(--zk-text-muted)', marginTop: 2 }}>
            {pipeline?.deals?.length ?? 0} deals · {Object.keys(totalsByCurrencyHeader).length > 0 ? Object.entries(totalsByCurrencyHeader).map(([moneda, monto]) => formatMonto(monto as number, moneda)).join(' · ') : formatMonto(0, 'USD')}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            style={{
              padding: '7px 12px',
              border: '0.8px solid rgb(229,231,235)',
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              width: 220,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ flex: 1 }} />

        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
          backgroundColor: '#E8193C', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}
          onClick={() => setDealModalStage('default_stage')}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E8193C'}
        >
          <Plus size={14} /> Nuevo deal
        </button>
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '24px 28px', height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'flex-start' }}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 16, height: '100%', alignItems: 'flex-start', minWidth: 'max-content' }}>
            {pipeline?.stages?.map((stage) => {
              const filteredDeals = (stage.deals ?? []).filter(d => {
                if (!search.trim()) return true
                const s = search.toLowerCase()
                return d.titulo?.toLowerCase().includes(s) || d.contact?.nombre?.toLowerCase().includes(s)
              })
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  deals={filteredDeals}
                  onAddDeal={(stageId) => setDealModalStage(stageId)}
                  onDealClick={(deal) => setSelectedDeal(deal)}
                />
              )
            })}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDeal && <DealCard deal={activeDeal} overlay />}
          </DragOverlay>
        </DndContext>
      </div>

        <DealFormModal 
          isOpen={dealModalStage !== null} 
          initialStageId={dealModalStage === 'default_stage' ? null : dealModalStage} 
          onClose={() => setDealModalStage(null)} 
        />
      </div>

      {selectedDeal && (
        <DealPanel
          dealId={selectedDeal.id}
          onClose={() => setSelectedDeal(null)}
        />
      )}

      <CobrosSetupModal 
        isOpen={cobroSetupOpen} 
        onClose={() => setCobroSetupOpen(false)} 
        deal={cobroSetupDeal} 
      />
    </div>
  )
}
