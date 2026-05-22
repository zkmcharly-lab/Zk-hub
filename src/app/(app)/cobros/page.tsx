'use client'

import { useState } from 'react'
import { useCobros, useDeleteCobro } from '@/hooks/use-cobros'
import { formatCurrency, formatDate, avatarColor, initials } from '@/lib/utils'
import { CreditCard, Loader2, AlertTriangle, CircleDollarSign, Trash2, Plus } from 'lucide-react'
import { CobroPanel } from '@/components/cobros/cobro-panel'
import { MantenimientoCard } from '@/components/cobros/mantenimiento-card'
import { CobroFormModal } from '@/components/cobros/cobro-form-modal'

const ESTADO_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:    { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
  en_progreso:  { bg: '#dbeafe', color: '#1e40af', label: 'En progreso' },
  completado:   { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
  cancelado:    { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelado' },
  vencido:      { bg: '#fee2e2', color: '#991b1b', label: 'Vencido' },
}

function isVencido(d: string | null) {
  if (!d) return false
  return new Date(d + 'T12:00:00') < new Date()
}

export default function CobrosPage() {
  const { data: cobrosData, isLoading } = useCobros()
  const deleteCobro = useDeleteCobro()
  const cobros = cobrosData ?? []

  const [selected, setSelected] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const mantenimientos = cobros.filter(c => c.tipo === 'mantenimiento')
  const desarrollos = cobros.filter(c => c.tipo === 'desarrollo')

  // KPIs
  const mantenimientosActivos = mantenimientos.filter(c => c.estado !== 'cancelado' && c.estado !== 'completado').length
  const mrrActual = mantenimientos.filter(c => c.estado !== 'cancelado' && c.estado !== 'completado').reduce((s, c) => s + c.monto_total, 0)
  const desarrollosPendientes = desarrollos.filter(c => c.estado === 'pendiente' || c.estado === 'en_progreso').length
  
  // Cobrado este mes (heurística simple para la UI)
  const cobradoMes = cobros.reduce((s, c) => {
    const pagosCompletados = c.pagos?.filter(p => p.estado === 'pagado') || []
    return s + pagosCompletados.reduce((sp, p) => sp + p.monto, 0)
  }, 0)

  const totVencidos = cobros.filter(c => c.estado === 'vencido').reduce((s, c) => s + c.monto_total, 0)

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('¿Eliminar este cobro?')) {
      deleteCobro.mutate(id)
      if (selected?.id === id) setSelected(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F5]">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5] overflow-y-auto">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
        <h1 className="text-[16px] font-bold text-gray-900 tracking-tight">Cobros</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-[8px] bg-[#E8193C] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#C8102E] transition-colors"
        >
          <Plus size={15} /> Nuevo cobro
        </button>
      </div>

      <div className="p-6 space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="rounded-[10px] bg-[rgb(238,242,255)] px-4 py-3">
            <p className="text-[22px] font-extrabold text-[rgb(99,102,241)]">{mantenimientosActivos}</p>
            <p className="text-[11px] font-semibold text-[rgb(99,102,241)]/80 uppercase tracking-wider mt-1">Mantenimientos</p>
          </div>
          <div className="rounded-[10px] bg-[rgb(209,250,229)] px-4 py-3">
            <p className="text-[22px] font-extrabold text-[rgb(16,185,129)]">{formatCurrency(mrrActual)}</p>
            <p className="text-[11px] font-semibold text-[rgb(16,185,129)]/80 uppercase tracking-wider mt-1">MRR Actual</p>
          </div>
          <div className="rounded-[10px] bg-[rgb(224,242,254)] px-4 py-3">
            <p className="text-[22px] font-extrabold text-[rgb(14,165,233)]">{desarrollosPendientes}</p>
            <p className="text-[11px] font-semibold text-[rgb(14,165,233)]/80 uppercase tracking-wider mt-1">Desarrollos Pend.</p>
          </div>
          <div className="rounded-[10px] bg-[rgb(209,250,229)] px-4 py-3">
            <p className="text-[22px] font-extrabold text-[rgb(16,185,129)]">{formatCurrency(cobradoMes)}</p>
            <p className="text-[11px] font-semibold text-[rgb(16,185,129)]/80 uppercase tracking-wider mt-1">Cobrado Mes</p>
          </div>
          <div className="rounded-[10px] bg-[rgb(254,226,226)] px-4 py-3">
            <p className="text-[22px] font-extrabold text-[rgb(239,68,68)]">{formatCurrency(totVencidos)}</p>
            <p className="text-[11px] font-semibold text-[rgb(239,68,68)]/80 uppercase tracking-wider mt-1">Vencidos</p>
          </div>
        </div>

        {/* Sección A — Mantenimientos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-gray-900">Mantenimientos Activos</h2>
          </div>
          
          {mantenimientos.length === 0 ? (
            <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white p-8 text-center text-gray-500 text-[13px]">
              No hay mantenimientos activos.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mantenimientos.map(cobro => (
                <MantenimientoCard key={cobro.id} cobro={cobro} onRegistrarPago={() => setSelected(cobro)} />
              ))}
            </div>
          )}
        </section>

        {/* Sección B — Desarrollos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-gray-900">Cobros por Desarrollo</h2>
          </div>
          <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white overflow-hidden">
            {desarrollos.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[13px]">
                No hay cobros de desarrollo.
              </div>
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Deal</th>
                    <th className="px-5 py-3">Monto</th>
                    <th className="px-5 py-3">Método</th>
                    <th className="px-5 py-3">Cuotas</th>
                    <th className="px-5 py-3">Próximo</th>
                    <th className="px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {desarrollos.map((cobro) => {
                    const st = ESTADO_COLOR[cobro.estado] ?? ESTADO_COLOR.pendiente
                    const pagosPagados = cobro.pagos?.filter((p: any) => p.estado === 'pagado').length ?? 0
                    const total = cobro.num_pagos
                    const isSelected = selected?.id === cobro.id
                    const prox = cobro.pagos?.find((p: any) => p.estado !== 'pagado')

                    return (
                      <tr 
                        key={cobro.id}
                        onClick={() => setSelected(isSelected ? null : cobro)}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ backgroundColor: avatarColor(cobro.contact?.nombre ?? '?') }}>
                              {initials(cobro.contact?.nombre ?? '?')}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{cobro.contact?.nombre ?? 'Sin cliente'}</div>
                              {cobro.contact?.empresa && <div className="text-[11px] text-gray-500">{cobro.contact.empresa}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-500">{cobro.deal?.titulo || (cobro.deal_id ? `Deal: ${cobro.deal_id.substring(0,8)}` : 'Sin deal')}</td>
                        <td className="px-5 py-4 font-bold text-[#E8193C]">{formatCurrency(cobro.monto_total, cobro.moneda)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            {cobro.metodo_pago === 'stripe' ? <CreditCard size={14} /> : <CircleDollarSign size={14} />}
                            <span className="capitalize">{cobro.metodo_pago}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-500">{pagosPagados}/{total}</td>
                        <td className="px-5 py-4">
                          {prox?.fecha_vencimiento ? (
                            <span className={`flex items-center gap-1.5 ${isVencido(prox.fecha_vencimiento) ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                              {isVencido(prox.fecha_vencimiento) && <AlertTriangle size={13} />}
                              {formatDate(prox.fecha_vencimiento)}
                            </span>
                          ) : (
                            <span style={{ color: cobro.estado === 'completado' ? '#10b981' : '#d1d5db' }}>
                              {cobro.estado === 'completado' ? '✓ Completado' : '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.color + '30' }}>
                              {st.label}
                            </span>
                            <button
                              onClick={(e) => handleDelete(cobro.id, e)}
                              disabled={deleteCobro.isPending}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Eliminar cobro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10"
            onClick={() => setSelected(null)}
          />
          <CobroPanel
            cobro={selected}
            onClose={() => setSelected(null)}
          />
        </>
      )}

      <CobroFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
