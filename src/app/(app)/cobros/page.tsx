'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCobros } from '@/hooks/use-cobros'
import { Loader2, ArrowRight, Wrench, Code2, Zap } from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'

const formatMonto = (monto: number, moneda: string) => {
  const code = moneda || 'USD'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: code, minimumFractionDigits: 0 }).format(monto)
}

const renderDesglosado = (dict: Record<string, number>) => {
  const entries = Object.entries(dict).filter(([, v]) => v > 0)
  if (entries.length === 0) return '—'
  return entries.map(([moneda, monto]) => formatMonto(monto, moneda)).join(' · ')
}

export default function CobrosPage() {
  const { workspace } = useWorkspaceStore()
  const { data: cobrosData, isLoading } = useCobros()
  const cobros = cobrosData ?? []

  if (isLoading) return (
    <div className="flex flex-1 items-center justify-center bg-[#F5F5F5]">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  )

  const mantenimientosActivos = cobros.filter(c => c.tipo === 'mantenimiento' && c.estado !== 'cancelado' && c.estado !== 'completado').length
  const desarrollosPendientes = cobros.filter(c => c.tipo === 'desarrollo' && (c.estado === 'pendiente' || c.estado === 'en_progreso')).length
  const serviciosPendientes = cobros.filter(c => c.tipo === 'servicio' && c.estado === 'pendiente').length

  const mrrByCurrency = cobros
    .filter(c => c.tipo === 'mantenimiento' && c.estado !== 'cancelado' && c.estado !== 'completado')
    .reduce((acc, c) => {
      const code = c.moneda || 'USD'
      acc[code] = (acc[code] || 0) + ((c.monto_total || 0) / (c.num_pagos || 1))
      return acc
    }, {} as Record<string, number>)

  const cobradoByCurrency = cobros.reduce((acc, c) => {
    const pagados = c.pagos?.filter((p: any) => p.estado === 'pagado') || []
    const val = pagados.reduce((s: number, p: any) => s + p.monto, 0)
    if (val > 0) {
      const code = c.moneda || 'USD'
      acc[code] = (acc[code] || 0) + val
    }
    return acc
  }, {} as Record<string, number>)

  const vencidosByCurrency = cobros
    .filter(c => c.estado === 'vencido')
    .reduce((acc, c) => {
      const code = c.moneda || 'USD'
      acc[code] = (acc[code] || 0) + (c.monto_total || 0)
      return acc
    }, {} as Record<string, number>)

  const totalMantenimientos = cobros.filter(c => c.tipo === 'mantenimiento' && c.estado !== 'cancelado').length
  const totalDesarrollos = cobros.filter(c => c.tipo === 'desarrollo' && c.estado !== 'cancelado').length
  const totalServicios = cobros.filter(c => c.tipo === 'servicio' && c.estado !== 'cancelado').length

  const sections = [
    {
      href: '/cobros/mantenimientos',
      icon: <Wrench size={24} className="text-indigo-500" />,
      label: 'Mantenimientos',
      description: 'Cobros recurrentes mensuales por soporte y mantenimiento.',
      count: mantenimientosActivos,
      countLabel: 'activos',
      bgClass: 'bg-[#EEF2FF] border-indigo-100 hover:border-indigo-300',
      kpi: renderDesglosado(mrrByCurrency),
      kpiLabel: 'MRR',
      total: totalMantenimientos,
      completados: totalMantenimientos - mantenimientosActivos,
      progressColor: 'bg-indigo-500'
    },
    {
      href: '/cobros/desarrollos',
      icon: <Code2 size={24} className="text-sky-500" />,
      label: 'Desarrollos',
      description: 'Proyectos de desarrollo web con pagos en cuotas.',
      count: desarrollosPendientes,
      countLabel: 'pendientes',
      bgClass: 'bg-[#E0F2FE] border-sky-100 hover:border-sky-300',
      kpi: renderDesglosado(cobradoByCurrency),
      kpiLabel: 'Cobrado',
      total: totalDesarrollos,
      completados: totalDesarrollos - desarrollosPendientes,
      progressColor: 'bg-sky-500'
    },
    {
      href: '/cobros/servicios',
      icon: <Zap size={24} className="text-amber-500" />,
      label: 'Servicios',
      description: 'Servicios únicos con pago único (auditorías, consultorías, etc.).',
      count: serviciosPendientes,
      countLabel: 'pendientes',
      bgClass: 'bg-[#FFFBEB] border-amber-100 hover:border-amber-300',
      kpi: renderDesglosado(vencidosByCurrency) === '—' ? '$0' : renderDesglosado(vencidosByCurrency),
      kpiLabel: 'Vencidos',
      total: totalServicios,
      completados: totalServicios - serviciosPendientes,
      progressColor: 'bg-amber-500'
    },
  ]

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5] overflow-y-auto">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-6">
        <h1 className="text-[16px] font-bold text-gray-900 tracking-tight">Cobros</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Top Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-[10px] bg-indigo-50 border border-indigo-100 px-4 py-3 flex flex-col justify-center">
            <p className="text-[18px] font-extrabold text-indigo-600 leading-tight truncate">{renderDesglosado(mrrByCurrency)}</p>
            <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider mt-1">MRR</p>
          </div>
          <div className="rounded-[10px] bg-emerald-50 border border-emerald-100 px-4 py-3 flex flex-col justify-center">
            <p className="text-[18px] font-extrabold text-emerald-600 leading-tight truncate">{renderDesglosado(cobradoByCurrency)}</p>
            <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider mt-1">Cobrado Total</p>
          </div>
          <div className="rounded-[10px] bg-red-50 border border-red-100 px-4 py-3 flex flex-col justify-center">
            <p className="text-[18px] font-extrabold text-red-500 leading-tight truncate">{renderDesglosado(vencidosByCurrency)}</p>
            <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mt-1">Vencidos</p>
          </div>
          <div className="rounded-[10px] bg-gray-50 border border-gray-200 px-4 py-3 flex flex-col justify-center">
            <p className="text-[22px] font-extrabold text-gray-700 leading-tight">{cobros.length}</p>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">Total cobros</p>
          </div>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map(s => {
            const progress = s.total > 0 ? (s.completados / s.total) * 100 : 0
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`rounded-[14px] border p-6 flex flex-col gap-4 shadow-sm transition-all group ${s.bgClass}`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-[12px] bg-white/60 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                    {s.icon}
                  </div>
                  <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors mt-1" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-gray-900">{s.label}</h2>
                  <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">{s.description}</p>
                </div>
                
                {/* Progress Mini Bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1.5 font-medium">
                    <span>Progreso</span>
                    <span>{s.completados} / {s.total} completados</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <div className={`h-full ${s.progressColor} rounded-full transition-all`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-black/5 pt-3 mt-1">
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{s.kpiLabel}</p>
                    <p className="text-[14px] font-bold text-gray-800 mt-0.5">{s.kpi}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-600">
                    {s.count} {s.countLabel}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
