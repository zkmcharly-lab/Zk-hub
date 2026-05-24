'use client'

import { useState } from 'react'
import { useCobros, useDeleteCobro, useUpdateCobro } from '@/hooks/use-cobros'
import { formatDate } from '@/lib/utils'
import { Loader2, Plus, ArrowLeft, Trash2, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import { MantenimientoCard } from '@/components/cobros/mantenimiento-card'
import { CobroPanel } from '@/components/cobros/cobro-panel'
import { MantenimientoSetupModal } from '@/components/proyectos/mantenimiento-setup-modal'

const formatMonto = (monto: number, moneda: string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda || 'USD', minimumFractionDigits: 0 }).format(monto)

import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Modal para editar mantenimiento
function EditMantenimientoModal({ cobro, onClose }: { cobro: any; onClose: () => void }) {
  const updateCobro = useUpdateCobro()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [monto, setMonto] = useState(String((cobro.monto_total || 0) / (cobro.num_pagos || 1)))
  const [moneda, setMoneda] = useState(cobro.moneda || 'USD')
  const [metodo, setMetodo] = useState(cobro.metodo_pago || 'transferencia')
  const [notas, setNotas] = useState(cobro.notas || '')

  const handleSave = async () => {
    const cuota = parseFloat(monto)
    if (isNaN(cuota) || cuota <= 0) return
    
    // 1. Update cobro
    updateCobro.mutate({
      id: cobro.id,
      data: {
        monto_total: cuota * (cobro.num_pagos || 1),
        moneda,
        metodo_pago: metodo,
        notas,
      }
    }, { 
      onSuccess: async () => {
        // 2. Regenerar/actualizar cobro_pagos pendientes
        await supabase
          .from('cobro_pagos')
          .update({ monto: cuota })
          .eq('cobro_id', cobro.id)
          .eq('estado', 'pendiente')
          
        queryClient.invalidateQueries({ queryKey: ['cobros'] })
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X size={18} />
        </button>
        <h2 className="text-[15px] font-bold text-gray-900 mb-5">Editar mantenimiento</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Cuota mensual</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                className="flex-1 h-9 px-3 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#E8193C]"
                placeholder="150"
              />
              <select
                value={moneda}
                onChange={e => setMoneda(e.target.value)}
                className="h-9 px-3 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none cursor-pointer"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Método de pago</label>
            <select
              value={metodo}
              onChange={e => setMetodo(e.target.value)}
              className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none cursor-pointer"
            >
              <option value="transferencia">Transferencia</option>
              <option value="stripe">Stripe</option>
              <option value="efectivo">Efectivo</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-[8px] resize-none focus:outline-none focus:ring-1 focus:ring-[#E8193C]"
              placeholder="Notas opcionales..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="text-[13px] text-gray-500 hover:text-gray-700 font-medium px-3">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={updateCobro.isPending}
            className="bg-[#E8193C] text-white text-[13px] font-bold px-4 py-2 rounded-[8px] hover:bg-[#C8102E] disabled:opacity-50 transition-colors"
          >
            {updateCobro.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MantenimientosPage() {
  const { data: cobrosData, isLoading } = useCobros()
  const deleteCobro = useDeleteCobro()
  const cobros = cobrosData ?? []
  const mantenimientos = cobros.filter(c => c.tipo === 'mantenimiento')

  const [selected, setSelected] = useState<any | null>(null)
  const [editando, setEditando] = useState<any | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center bg-[#F5F5F5]">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  )

  const mrrByCurrency = mantenimientos
    .filter(c => c.estado !== 'cancelado' && c.estado !== 'completado')
    .reduce((acc, c) => {
      const code = c.moneda || 'USD'
      acc[code] = (acc[code] || 0) + ((c.monto_total || 0) / (c.num_pagos || 1))
      return acc
    }, {} as Record<string, number>)

  const mrrText = Object.entries(mrrByCurrency).map(([m, v]) => formatMonto(v, m)).join(' · ') || '—'

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5] overflow-y-auto">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
        <Link href="/cobros" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-[16px] font-bold text-gray-900 tracking-tight">Mantenimientos</h1>
          <p className="text-[12px] text-gray-500">MRR: <span className="font-semibold text-gray-700">{mrrText}</span></p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setSetupOpen(true)}
            className="flex items-center gap-2 rounded-[8px] bg-[#E8193C] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#C8102E] transition-colors"
          >
            <Plus size={15} /> Nuevo mantenimiento
          </button>
        </div>
      </div>

      <div className="p-6">
        {mantenimientos.length === 0 ? (
          <div className="rounded-[14px] border border-gray-200 bg-white p-8 text-center text-gray-500 text-[13px]">
            No hay mantenimientos activos.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mantenimientos.map(cobro => (
              <div key={cobro.id} className="relative group">
                <MantenimientoCard cobro={cobro} onRegistrarPago={() => setSelected(cobro)} />
                {/* Actions overlay */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditando(cobro)}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-800 shadow-sm"
                    title="Editar"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este mantenimiento y todos sus pagos?')) {
                        deleteCobro.mutate(cobro.id)
                      }
                    }}
                    disabled={deleteCobro.isPending}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-red-500 shadow-sm"
                    title="Eliminar"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setSelected(null)} />
          <CobroPanel cobro={selected} onClose={() => setSelected(null)} />
        </>
      )}

      {editando && <EditMantenimientoModal cobro={editando} onClose={() => setEditando(null)} />}

      {/* Hack: setup modal without proyecto – we open the generic cobro form */}
      {setupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[16px] p-6 max-w-sm text-center shadow-xl">
            <p className="text-[14px] text-gray-700 mb-4">Para crear un nuevo mantenimiento, hazlo desde la página de detalle del proyecto correspondiente usando el botón "Crear mantenimiento".</p>
            <button onClick={() => setSetupOpen(false)} className="bg-gray-900 text-white px-4 py-2 rounded-[8px] text-[13px] font-bold">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}
