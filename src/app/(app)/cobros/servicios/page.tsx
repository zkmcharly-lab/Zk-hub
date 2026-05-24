'use client'

import { useState } from 'react'
import { useCobros, useDeleteCobro, useCreateCobro } from '@/hooks/use-cobros'
import { formatDate, avatarColor, initials } from '@/lib/utils'
import { Loader2, Plus, ArrowLeft, Trash2, Search, CreditCard, CircleDollarSign } from 'lucide-react'
import Link from 'next/link'
import { CobroPanel } from '@/components/cobros/cobro-panel'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { useQuery } from '@tanstack/react-query'

const formatMonto = (monto: number, moneda: string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda || 'USD', minimumFractionDigits: 0 }).format(monto)

const ESTADO_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:   { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
  en_progreso: { bg: '#dbeafe', color: '#1e40af', label: 'En progreso' },
  completado:  { bg: '#d1fae5', color: '#065f46', label: 'Completado' },
  cancelado:   { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelado' },
  vencido:     { bg: '#fee2e2', color: '#991b1b', label: 'Vencido' },
}

function NuevoServicioModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { workspace } = useWorkspaceStore()
  const createCobro = useCreateCobro()
  const supabase = createClient()

  // Fetch contacts para el select
  const { data: contacts } = useQuery({
    queryKey: ['contacts-simple', workspace?.id],
    queryFn: async () => {
      const { data } = await supabase.from('contacts').select('id, nombre').eq('workspace_id', workspace!.id).order('nombre')
      return data || []
    },
    enabled: isOpen && !!workspace?.id
  })

  const [form, setForm] = useState({
    contact_id: '',
    notas: '', // Usaremos notas como el "concepto" del servicio
    monto_total: '',
    moneda: workspace?.currency || 'USD',
    fecha_inicio: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia',
    estado: 'pendiente'
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contact_id || !form.monto_total || !form.notas) return

    createCobro.mutate({
      contact_id: form.contact_id,
      tipo: 'servicio',
      monto_total: parseFloat(form.monto_total),
      moneda: form.moneda,
      fecha_primer_pago: form.fecha_inicio,
      metodo_pago: form.metodo_pago,
      estado: form.estado as any,
      num_pagos: 1, // Pago único
      notas: form.notas, // Concepto
    }, {
      onSuccess: onClose
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md p-6">
        <h2 className="text-[16px] font-bold text-gray-900 mb-5">Nuevo Servicio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Concepto / Servicio</label>
            <input
              type="text"
              required
              value={form.notas}
              onChange={e => setForm({ ...form, notas: e.target.value })}
              className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#E8193C]"
              placeholder="Ej: Auditoría SEO, Consultoría..."
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Cliente</label>
            <select
              required
              value={form.contact_id}
              onChange={e => setForm({ ...form, contact_id: e.target.value })}
              className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none cursor-pointer"
            >
              <option value="">Selecciona un cliente</option>
              {contacts?.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Monto</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={form.monto_total}
                  onChange={e => setForm({ ...form, monto_total: e.target.value })}
                  className="flex-1 h-9 px-3 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#E8193C]"
                  placeholder="0.00"
                />
                <select
                  value={form.moneda}
                  onChange={e => setForm({ ...form, moneda: e.target.value })}
                  className="w-20 h-9 px-2 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none cursor-pointer"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Fecha de pago</label>
              <input
                type="date"
                required
                value={form.fecha_inicio}
                onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Método</label>
              <select
                value={form.metodo_pago}
                onChange={e => setForm({ ...form, metodo_pago: e.target.value })}
                className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none cursor-pointer"
              >
                <option value="transferencia">Transferencia</option>
                <option value="stripe">Stripe</option>
                <option value="efectivo">Efectivo</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Estado</label>
              <select
                value={form.estado}
                onChange={e => setForm({ ...form, estado: e.target.value })}
                className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-[8px] focus:outline-none cursor-pointer"
              >
                <option value="pendiente">Pendiente</option>
                <option value="completado">Completado</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="text-[13px] text-gray-500 hover:text-gray-700 px-3 font-medium">Cancelar</button>
            <button
              type="submit"
              disabled={createCobro.isPending}
              className="bg-[#E8193C] text-white text-[13px] font-bold px-4 py-2 rounded-[8px] hover:bg-[#C8102E] disabled:opacity-50 transition-colors"
            >
              {createCobro.isPending ? 'Creando...' : 'Crear servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ServiciosPage() {
  const { data: cobrosData, isLoading } = useCobros()
  const deleteCobro = useDeleteCobro()
  const cobros = cobrosData ?? []
  const servicios = cobros.filter(c => c.tipo === 'servicio')

  const [selected, setSelected] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = servicios.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (c.contact?.nombre || '').toLowerCase().includes(s) || (c.notas || '').toLowerCase().includes(s)
  })

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
        <h1 className="text-[16px] font-bold text-gray-900 tracking-tight">Servicios Únicos</h1>
        <div className="relative ml-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Buscar por cliente o concepto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-[250px] h-8 pl-8 pr-3 text-[13px] bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E8193C] focus:bg-white transition-colors"
          />
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-[8px] bg-[#E8193C] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#C8102E] transition-colors"
          >
            <Plus size={15} /> Nuevo servicio
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-[13px]">
              No hay servicios registrados.
            </div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Concepto / Servicio</th>
                  <th className="px-5 py-3">Monto</th>
                  <th className="px-5 py-3">Método</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((cobro) => {
                  const st = ESTADO_COLOR[cobro.estado] ?? ESTADO_COLOR.pendiente
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
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-800">{cobro.notas || '—'}</td>
                      <td className="px-5 py-4 font-bold text-[#E8193C]">{formatMonto(cobro.monto_total, cobro.moneda)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          {cobro.metodo_pago === 'stripe' ? <CreditCard size={14} /> : <CircleDollarSign size={14} />}
                          <span className="capitalize">{cobro.metodo_pago}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{formatDate(cobro.fecha_primer_pago)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.color + '30' }}>
                            {st.label}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar este servicio?')) deleteCobro.mutate(cobro.id) }}
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

      <NuevoServicioModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
