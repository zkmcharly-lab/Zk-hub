'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { useQueryClient } from '@tanstack/react-query'

interface MantenimientoSetupModalProps {
  isOpen: boolean
  onClose: () => void
  proyecto: {
    id: string
    nombre: string
    contact_id: string | null
    deal_id: string | null
  }
}

export function MantenimientoSetupModal({ isOpen, onClose, proyecto }: MantenimientoSetupModalProps) {
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [monto, setMonto] = useState<number | ''>('')
  const [moneda, setMoneda] = useState('USD')
  const [numCuotas, setNumCuotas] = useState(12)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [metodo, setMetodo] = useState('transferencia')
  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !proyecto) return null

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
        contact_id: proyecto.contact_id,
        deal_id: proyecto.deal_id,
        tipo: 'mantenimiento',
        monto_total: Number(monto) * numCuotas,
        moneda: moneda,
        num_pagos: numCuotas,
        metodo_pago: metodo,
        fecha_primer_pago: fecha,
        frecuencia: 'mensual',
        estado: 'pendiente',
        notas: notas
      }).select().single()

      if (error) throw error

      if (data) {
        const fechaBase = fecha ? new Date(fecha) : new Date()
        const montoMensual = Number(monto) || 0
        const nPagos = numCuotas
        const pagosRows = []
        for (let i = 0; i < nPagos; i++) {
          const f = new Date(fechaBase)
          f.setMonth(f.getMonth() + i)
          pagosRows.push({
            cobro_id: data.id,
            numero_pago: i + 1,
            fecha_vencimiento: f.toISOString().split('T')[0],
            monto: montoMensual,
            estado: 'pendiente'
          })
        }
        const { error: cuotasError } = await supabase.from('cobro_pagos').insert(pagosRows)
        if (cuotasError) throw cuotasError
      }

      await queryClient.invalidateQueries({ queryKey: ['cobros', workspace.id] })
      onClose()
    } catch (err: any) {
      console.error('Error completo:', err)
      console.error('Mensaje:', err?.message)
      alert('Error: ' + (err?.message ?? JSON.stringify(err)))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-[500px] rounded-[14px] bg-white p-7 border-[0.8px] border-gray-200 shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-bold text-gray-900">
            Configurar Mantenimiento
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Datos del Proyecto */}
        <div className="mb-6 rounded-[8px] bg-emerald-50 p-4 border border-emerald-100 flex justify-between items-center">
          <div>
            <p className="text-[12px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">Proyecto</p>
            <p className="text-[14px] font-bold text-emerald-900">{proyecto.nombre}</p>
          </div>
        </div>

        {/* Formulario de Configuración */}
        <div className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Monto mensual</label>
              <input 
                type="number" 
                value={monto} 
                onChange={e => setMonto(Number(e.target.value) || '')}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all" 
                placeholder="Ej. 500"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Moneda</label>
              <select 
                value={moneda} 
                onChange={e => setMoneda(e.target.value)}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="EUR">EUR</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Método de pago</label>
              <select 
                value={metodo} 
                onChange={e => setMetodo(e.target.value)}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
              >
                <option value="transferencia">Transferencia</option>
                <option value="stripe">Stripe</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">1º Cobro</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Número de cuotas</label>
            <input 
              type="number" 
              min={1} 
              max={36}
              value={numCuotas}
              onChange={e => setNumCuotas(parseInt(e.target.value) || 12)}
              className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all" 
            />
            <p style={{fontSize:11, color:'#9ca3af', marginTop:4}}>
              Por defecto 12 meses (1 año)
            </p>
          </div>
          
          <div>
            <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notas (opcional)</label>
            <textarea 
              rows={2} 
              value={notas} 
              onChange={e => setNotas(e.target.value)}
              className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all resize-none" 
              placeholder="Ej. Facturar a fin de mes..."
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
            className="flex items-center gap-2 rounded-[8px] bg-emerald-600 px-5 py-2 text-[14px] font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Crear mantenimiento
          </button>
        </div>
      </div>
    </div>
  )
}
