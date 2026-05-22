'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { useQueryClient } from '@tanstack/react-query'

interface CobrosSetupModalProps {
  isOpen: boolean
  onClose: () => void
  deal: {
    id: string
    titulo: string
    valor: number
    currency: string
    contact_id: string
    contact?: { nombre: string }
  } | null
}

export function CobrosSetupModal({ isOpen, onClose, deal }: CobrosSetupModalProps) {
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [monto, setMonto] = useState<number>(0)
  const [moneda, setMoneda] = useState('USD')
  const [cuotas, setCuotas] = useState(1)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [metodo, setMetodo] = useState('Transferencia')
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync state when deal changes
  useState(() => {
    if (deal) {
      setMonto(deal.valor || 0)
      setMoneda(deal.currency || 'USD')
    }
  })

  if (!isOpen || !deal) return null

  const handleGuardar = async () => {
    if (!workspace?.id) return
    if (!monto) {
      alert('Por favor completa el monto.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.from('cobros').insert({
        workspace_id: workspace.id,
        deal_id: deal.id,
        contact_id: deal.contact_id,
        monto_total: monto,
        moneda: moneda,
        num_pagos: cuotas,
        metodo_pago: metodo.toLowerCase(),
        fecha_primer_pago: fecha,
        tipo: 'desarrollo',
        notas: notas,
        estado: 'pendiente'
      }).select().single()

      console.log('INSERT resultado:', { data, error })

      if (error) throw error

      if (data) {
        const fechaBase = fecha ? new Date(fecha) : new Date()
        const montoTotal = Number(monto) || 0
        const nPagos = Number(cuotas) || 1
        const pagosRows = []
        for (let i = 0; i < nPagos; i++) {
          const f = new Date(fechaBase)
          f.setMonth(f.getMonth() + i)
          pagosRows.push({
            cobro_id: data.id,
            numero_pago: i + 1,
            fecha_vencimiento: f.toISOString().split('T')[0],
            monto: montoTotal / nPagos,
            estado: 'pendiente'
          })
        }
        const { error: cuotasError } = await supabase.from('cobro_pagos').insert(pagosRows)
        if (cuotasError) throw cuotasError
      }

      await queryClient.invalidateQueries({ queryKey: ['cobros', workspace.id] })
      onClose()
    } catch (err) {
      console.error(err)
      alert('Error al crear el cobro')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-[500px] rounded-[14px] bg-white p-7 border-[0.8px] border-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-bold text-gray-900">
            Configurar cobro — <span className="font-medium text-gray-600">{deal.titulo}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Datos del deal (Solo lectura) */}
        <div className="mb-6 rounded-[8px] bg-gray-50 p-4 border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Contacto</p>
            <p className="text-[14px] font-medium text-gray-900">{deal.contact?.nombre || 'Sin contacto'}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Monto Deal</p>
            <p className="text-[14px] font-bold text-emerald-600">{formatCurrency(deal.valor, deal.currency)}</p>
          </div>
        </div>

        {/* Formulario de Configuración */}
        <div className="space-y-4">
          
          {/* Tipo de cobro (Fijo) */}
          <div>
            <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de Cobro</label>
            <div className="w-full rounded-[8px] border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-gray-700 font-medium">
              Desarrollo (Proyecto)
            </div>
            <p className="mt-1 text-[11px] text-gray-400">Los mantenimientos se configuran desde la vista de proyectos.</p>
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Monto Total</label>
              <input 
                type="number" 
                value={monto} 
                onChange={e => setMonto(Number(e.target.value))}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-[#E8193C]" 
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Moneda</label>
              <select 
                value={moneda} 
                onChange={e => setMoneda(e.target.value)}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-[#E8193C]"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="EUR">EUR</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
          </div>

          {/* Cuotas y Fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nº de cuotas</label>
              <input 
                type="number" 
                value={cuotas} 
                onChange={e => setCuotas(Number(e.target.value))}
                min={1} 
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-[#E8193C]" 
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">1º Pago</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-[#E8193C]" 
              />
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Método</label>
            <select 
              value={metodo} 
              onChange={e => setMetodo(e.target.value)}
              className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-[#E8193C]"
            >
              <option value="Transferencia">Transferencia</option>
              <option value="Stripe">Stripe</option>
              <option value="Efectivo">Efectivo</option>
            </select>
          </div>
          
          {/* Notas */}
          <div>
            <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notas (opcional)</label>
            <textarea 
              rows={2} 
              value={notas} 
              onChange={e => setNotas(e.target.value)}
              className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-[#E8193C]" 
            />
          </div>
        </div>

        {/* Footer Acciones */}
        <div className="mt-7 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-[14px] font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleGuardar}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-[8px] bg-[#E8193C] px-5 py-2 text-[14px] font-bold text-white hover:bg-[#C8102E] transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Crear cobro
          </button>
        </div>
      </div>
    </div>
  )
}
