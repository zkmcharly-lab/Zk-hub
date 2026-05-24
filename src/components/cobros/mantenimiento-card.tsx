'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import type { Cobro } from '@/hooks/use-cobros'

export function MantenimientoCard({ cobro, onRegistrarPago }: { cobro: Cobro; onRegistrarPago: () => void }) {
  const formatMonto = (monto: number, moneda: string) => {
    const code = moneda || 'USD';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0
    }).format(monto)
  }
  const isVencido = cobro.estado === 'vencido'
  const badgeClasses = isVencido 
    ? 'bg-red-50 text-red-600 border-red-100' 
    : 'bg-emerald-50 text-emerald-600 border-emerald-100'

  const nextPayment = cobro.pagos
    ?.filter(p => p.estado !== 'pagado')
    ?.sort((a, b) => new Date(a.fecha_vencimiento || 0).getTime() - new Date(b.fecha_vencimiento || 0).getTime())
    ?.[0]

  return (
    <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-[15px] font-bold text-gray-900">
            {cobro.contact?.empresa || cobro.contact?.nombre || 'Sin cliente'}
          </h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${badgeClasses}`}>
            {isVencido ? 'Vencido' : 'Al día'}
          </span>
        </div>
        <p className="text-[12px] text-gray-500 mb-4">
          Proyecto: {cobro.proyecto?.nombre || cobro.deal?.titulo || 'General'}
        </p>
        
        <div className="mb-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Cuota Mensual</p>
          <p className="text-[18px] font-bold text-gray-900">
            {formatMonto((cobro.monto_total || 0) / (cobro.num_pagos || 1), cobro.moneda)} <span className="text-[12px] text-gray-400 font-normal">/mes</span>
          </p>
        </div>
        
        <p className="text-[12px] text-gray-500">
          Próximo cobro: <span className="font-semibold text-gray-800">
            {nextPayment?.fecha_vencimiento ? formatDate(nextPayment.fecha_vencimiento) : 'No definido'}
          </span>
        </p>
      </div>
      
      <button 
        onClick={onRegistrarPago}
        className="mt-5 w-full rounded-[8px] border border-gray-200 bg-gray-50 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all"
      >
        Registrar Pago
      </button>
    </div>
  )
}
