'use client'

import { useState } from 'react'
import { useCobros, useDeleteCobro } from '@/hooks/use-cobros'
import { formatDate, avatarColor, initials } from '@/lib/utils'
import { CreditCard, Loader2, AlertTriangle, CircleDollarSign, Trash2, Plus, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'
import { CobroPanel } from '@/components/cobros/cobro-panel'
import { CobroFormModal } from '@/components/cobros/cobro-form-modal'

const ESTADO_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:   { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
  en_progreso: { bg: '#dbeafe', color: '#1e40af', label: 'En progreso' },
  completado:  { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
  cancelado:   { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelado' },
  vencido:     { bg: '#fee2e2', color: '#991b1b', label: 'Vencido' },
}

function isVencido(d: string | null) {
  if (!d) return false
  return new Date(d + 'T12:00:00') < new Date()
}

const formatMonto = (monto: number, moneda: string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda || 'USD', minimumFractionDigits: 0 }).format(monto)

export default function DesarrollosPage() {
  const { data: cobrosData, isLoading } = useCobros()
  const deleteCobro = useDeleteCobro()
  const cobros = cobrosData ?? []
  const desarrollos = cobros.filter(c => c.tipo === 'desarrollo')

  const [selected, setSelected] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = Array.from(new Map(
    desarrollos.filter(c => {
      if (!search) return true
      const s = search.toLowerCase()
      return (c.contact?.nombre || '').toLowerCase().includes(s) || (c.deal?.titulo || '').toLowerCase().includes(s)
    }).map(c => [c.id, c])
  ).values())

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center bg-[#F5F5F5]">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  )

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5] overflow-y-auto">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
        <Link href="/cobros" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[16px] font-bold text-gray-900 tracking-tight">Cobros por Desarrollo</h1>
        <div className="relative ml-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por cliente o deal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-[250px] h-8 pl-8 pr-3 text-[13px] bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E8193C] focus:bg-white transition-colors"
          />
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-[8px] bg-[#E8193C] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#C8102E] transition-colors"
          >
            <Plus size={15} /> Nuevo cobro
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white overflow-hidden">
          {filtered.length === 0 ? (
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
                {filtered.map((cobro) => {
                  const st = ESTADO_COLOR[cobro.estado] ?? ESTADO_COLOR.pendiente
                  const pagosPagados = cobro.pagos?.filter((p: any) => p.estado === 'pagado').length ?? 0
                  const total = cobro.num_pagos
                  const prox = cobro.pagos?.find((p: any) => p.estado !== 'pagado')
                  return (
                    <tr
                      key={cobro.id}
                      onClick={() => setSelected(selected?.id === cobro.id ? null : cobro)}
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
                      <td className="px-5 py-4 text-gray-500">{cobro.deal?.titulo || '—'}</td>
                      <td className="px-5 py-4 font-bold text-[#E8193C]">{formatMonto(cobro.monto_total, cobro.moneda)}</td>
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
                            onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar este cobro?')) deleteCobro.mutate(cobro.id) }}
                            disabled={deleteCobro.isPending}
                            className="text-gray-400 hover:text-red-500 transition-colors"
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
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setSelected(null)} />
          <CobroPanel cobro={selected} onClose={() => setSelected(null)} />
        </>
      )}
      <CobroFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
