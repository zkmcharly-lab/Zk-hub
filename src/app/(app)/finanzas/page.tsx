'use client'

import { useState } from 'react'
import { useCobros } from '@/hooks/use-cobros'
import { useGastos } from '@/hooks/use-gastos'
import { useExchangeRates, convertAmount } from '@/hooks/use-exchange-rates'
import { GastoFormModal } from '@/components/finanzas/gasto-form-modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Plus } from 'lucide-react'

export default function FinanzasPage() {
  const { data: cobros = [], isLoading: cobrosLoading } = useCobros()
  const { data: gastos = [], isLoading: gastosLoading } = useGastos()
  const { data: rates, isLoading: ratesLoading } = useExchangeRates()

  const [activeTab, setActiveTab] = useState<'ingresos' | 'gastos' | 'rentabilidad'>('ingresos')
  const [showGastoModal, setShowGastoModal] = useState(false)

  if (cobrosLoading || gastosLoading || ratesLoading) {
    return <div className="p-8 text-gray-500">Cargando datos financieros...</div>
  }

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // 1. Ingresos Mes (Pagos liquidados en el mes actual)
  const pagosLiquidados = cobros.flatMap(c => 
    (c.pagos || [])
      .filter(p => p.estado === 'pagado' && p.fecha_pago)
      .map(p => ({
        ...p,
        cobro: c,
        montoEUR: rates ? convertAmount(p.monto, c.moneda, 'EUR', rates) : p.monto
      }))
  )
  
  const pagosMesActual = pagosLiquidados.filter(p => {
    const d = new Date(p.fecha_pago!)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const ingresosMesEUR = pagosMesActual.reduce((sum, p) => sum + p.montoEUR, 0)
  const ingresosDesglose = pagosMesActual.reduce((acc, p) => {
    acc[p.cobro.moneda] = (acc[p.cobro.moneda] || 0) + p.monto
    return acc
  }, {} as Record<string, number>)

  // 2. Gastos Mes
  const gastosEnEUR = gastos.map(g => ({
    ...g,
    montoEUR: rates ? convertAmount(g.monto, g.divisa, 'EUR', rates) : g.monto
  }))

  const gastosMesActual = gastosEnEUR.filter(g => {
    const d = new Date(g.fecha)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const gastosMesEUR = gastosMesActual.reduce((sum, g) => sum + g.montoEUR, 0)
  const gastosDesglose = gastosMesActual.reduce((acc, g) => {
    acc[g.divisa] = (acc[g.divisa] || 0) + g.monto
    return acc
  }, {} as Record<string, number>)

  // 3. Beneficio y Margen (Mensual)
  const beneficioMesEUR = ingresosMesEUR - gastosMesEUR
  const margenMes = ingresosMesEUR > 0 ? (beneficioMesEUR / ingresosMesEUR) * 100 : 0

  // 4. MRR (Mantenimientos o suscripciones mensuales activas)
  let mrrDesglose: Record<string, number> = {}
  const mrrEUR = cobros
    .filter(c => c.estado === 'activo' && c.frecuencia === 'mensual' && c.tipo === 'mantenimiento')
    .reduce((sum, c) => {
      const cuotaMonto = c.pagos?.[0]?.monto || c.monto_total
      mrrDesglose[c.moneda] = (mrrDesglose[c.moneda] || 0) + cuotaMonto
      const cuotaEUR = rates ? convertAmount(cuotaMonto, c.moneda, 'EUR', rates) : cuotaMonto
      return sum + cuotaEUR
    }, 0)

  // Rentabilidad por Cliente (All time)
  // Agrupar Ingresos
  const rentabilidadPorCliente: Record<string, { nombre: string, ingresos: number, gastos: number, beneficio: number }> = {}
  
  pagosLiquidados.forEach(p => {
    const contactId = p.cobro.contact_id
    if (!contactId) return
    if (!rentabilidadPorCliente[contactId]) {
      rentabilidadPorCliente[contactId] = { nombre: p.cobro.contact?.nombre || 'Desconocido', ingresos: 0, gastos: 0, beneficio: 0 }
    }
    rentabilidadPorCliente[contactId].ingresos += p.montoEUR
  })

  gastosEnEUR.forEach(g => {
    let contactId = g.cliente_id
    if (!contactId && g.proyecto_id) {
      const cobroVinculado = cobros.find(c => c.proyecto?.nombre === g.proyectos?.nombre)
      if (cobroVinculado) contactId = cobroVinculado.contact_id
    }

    if (contactId && rentabilidadPorCliente[contactId]) {
      rentabilidadPorCliente[contactId].gastos += g.montoEUR
    } else if (contactId) {
      rentabilidadPorCliente[contactId] = { nombre: g.contacts?.nombre || 'Cliente Gasto', ingresos: 0, gastos: g.montoEUR, beneficio: 0 }
    }
  })

  // Calculate beneficio per client
  Object.keys(rentabilidadPorCliente).forEach(id => {
    rentabilidadPorCliente[id].beneficio = rentabilidadPorCliente[id].ingresos - rentabilidadPorCliente[id].gastos
  })

  const clientsRentabilidadArray = Object.values(rentabilidadPorCliente).sort((a, b) => b.beneficio - a.beneficio)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas ZK</h1>
          <p className="text-gray-500 text-sm mt-1">Vista consolidada en EUR (€)</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Ingresos (Mes)</p>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(ingresosMesEUR, 'EUR')}</div>
          </div>
          {Object.keys(ingresosDesglose).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-2 text-[11px] text-gray-500">
              {Object.entries(ingresosDesglose).map(([k, v]) => (
                <span key={k}>{formatCurrency(v, k)} {k}</span>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Gastos (Mes)</p>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(gastosMesEUR, 'EUR')}</div>
          </div>
          {Object.keys(gastosDesglose).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-2 text-[11px] text-gray-500">
              {Object.entries(gastosDesglose).map(([k, v]) => (
                <span key={k}>{formatCurrency(v, k)} {k}</span>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Beneficio (Mes)</p>
          <div className={`text-2xl font-bold ${beneficioMesEUR >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(beneficioMesEUR, 'EUR')}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Margen</p>
          <div className="text-2xl font-bold text-gray-900">{margenMes.toFixed(1)}%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -top-4 opacity-5 text-blue-600"><RefreshCw size={80} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">MRR Activo</p>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(mrrEUR, 'EUR')}</div>
          </div>
          {Object.keys(mrrDesglose).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-2 text-[11px] text-blue-500 font-medium relative z-10">
              {Object.entries(mrrDesglose).map(([k, v]) => (
                <span key={k}>{formatCurrency(v, k)} {k}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 flex items-center">
          <button
            onClick={() => setActiveTab('ingresos')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ingresos' ? 'border-[#E8193C] text-[#E8193C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Ingresos (Pagos liquidados)
          </button>
          <button
            onClick={() => setActiveTab('gastos')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'gastos' ? 'border-[#E8193C] text-[#E8193C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Gastos Operativos
          </button>
          <button
            onClick={() => setActiveTab('rentabilidad')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'rentabilidad' ? 'border-[#E8193C] text-[#E8193C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Rentabilidad por Cliente
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'ingresos' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 px-4">Cliente / Deal</th>
                    <th className="pb-3 px-4">Concepto</th>
                    <th className="pb-3 px-4 text-right">Monto Original</th>
                    <th className="pb-3 px-4 text-right">Monto EUR</th>
                    <th className="pb-3 px-4 text-right">Fecha Pago</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pagosLiquidados.sort((a,b) => new Date(b.fecha_pago!).getTime() - new Date(a.fecha_pago!).getTime()).map(p => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-900">{p.cobro.contact?.nombre || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {p.cobro.deal?.titulo || p.cobro.tipo} (Cuota {p.numero_pago}/{p.cobro.num_pagos})
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(p.monto, p.cobro.moneda)} {p.cobro.moneda}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(p.montoEUR, 'EUR')}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{formatDate(p.fecha_pago!)}</td>
                    </tr>
                  ))}
                  {pagosLiquidados.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No hay pagos liquidados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'gastos' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowGastoModal(true)}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-white bg-[#E8193C] hover:bg-[#C8102E] px-4 py-2 rounded-[10px] transition-colors"
                >
                  <Plus size={14} /> Registrar Gasto
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="pb-3 px-4">Fecha</th>
                      <th className="pb-3 px-4">Concepto</th>
                      <th className="pb-3 px-4">Tipo</th>
                      <th className="pb-3 px-4">Vinculación</th>
                      <th className="pb-3 px-4 text-right">Monto Original</th>
                      <th className="pb-3 px-4 text-right">Monto EUR</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {gastosEnEUR.map(g => (
                      <tr key={g.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-gray-500">{formatDate(g.fecha)}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{g.concepto}</td>
                        <td className="py-3 px-4 text-gray-600 capitalize">{g.tipo}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {g.vinculacion_tipo === 'general' ? 'General' : 
                           g.vinculacion_tipo === 'cliente' ? g.contacts?.nombre : 
                           g.proyectos?.nombre}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(g.monto, g.divisa)} {g.divisa}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(g.montoEUR, 'EUR')}</td>
                      </tr>
                    ))}
                    {gastosEnEUR.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">No hay gastos registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rentabilidad' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 px-4">Cliente</th>
                    <th className="pb-3 px-4 text-right">Ingresos (EUR)</th>
                    <th className="pb-3 px-4 text-right">Gastos Asignados (EUR)</th>
                    <th className="pb-3 px-4 text-right">Beneficio Neto (EUR)</th>
                    <th className="pb-3 px-4 text-right">Rentabilidad %</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {clientsRentabilidadArray.map(c => {
                    const margen = c.ingresos > 0 ? (c.beneficio / c.ingresos) * 100 : 0
                    return (
                      <tr key={c.nombre} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        <td className="py-4 px-4 font-bold text-gray-900">{c.nombre}</td>
                        <td className="py-4 px-4 text-right text-emerald-600 font-medium">{formatCurrency(c.ingresos, 'EUR')}</td>
                        <td className="py-4 px-4 text-right text-red-600 font-medium">{formatCurrency(c.gastos, 'EUR')}</td>
                        <td className={`py-4 px-4 text-right font-bold ${c.beneficio >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                          {formatCurrency(c.beneficio, 'EUR')}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${margen >= 50 ? 'bg-emerald-50 text-emerald-700' : margen > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                            {margen.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {clientsRentabilidadArray.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No hay datos de rentabilidad</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showGastoModal && <GastoFormModal onClose={() => setShowGastoModal(false)} />}
    </div>
  )
}
