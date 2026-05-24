'use client'

import Link from 'next/link'
import { User, Calendar, CheckSquare } from 'lucide-react'
import type { Proyecto } from '@/hooks/use-proyectos'
import { formatDate } from '@/lib/utils'

const NOMBRES_FASES = ['Diagnóstico', 'Diseño', 'Build', 'Validación', 'Entrega', 'Soporte']

const AVATARS: Record<string, { initials: string; bg: string; name: string }> = {
  charly: { initials: 'CH', bg: '#E8193C', name: 'Charly' },
  inma: { initials: 'IN', bg: '#EC4899', name: 'Inma' },
  fabri: { initials: 'FA', bg: '#16A34A', name: 'Fabri' },
}

export function ProjectCard({ proyecto }: { proyecto: Proyecto }) {
  const isPausado = proyecto.estado === 'pausado'
  const isEntregado = proyecto.estado === 'entregado'
  
  let badgeClasses = 'bg-emerald-50 text-emerald-600 border-emerald-100'
  if (isPausado) badgeClasses = 'bg-amber-50 text-amber-600 border-amber-100'
  if (isEntregado) badgeClasses = 'bg-blue-50 text-blue-600 border-blue-100'

  const responsableObj = proyecto.responsable ? AVATARS[proyecto.responsable.toLowerCase()] : null

  // Calcular tareas pendientes de la fase actual y agrupar por persona
  const currentFase = proyecto.proyecto_fases?.find(f => f.numero_fase === proyecto.fase_actual)
  const tareasPendientes = currentFase?.proyecto_tareas?.filter(t => t.estado !== 'completada') || []
  
  const pendientesPorPersona = tareasPendientes.reduce((acc, t) => {
    const slot = t.responsable?.toLowerCase()
    if (slot && AVATARS[slot]) {
      acc[slot] = (acc[slot] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <Link 
      href={`/proyectos/${proyecto.id}`}
      className="block rounded-[12px] border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all overflow-hidden relative group"
    >
      {/* Banner Superior */}
      <div 
        className="h-[60px] w-full bg-cover bg-center relative flex items-center px-4"
        style={proyecto.banner_url ? { backgroundImage: `url(${proyecto.banner_url})` } : {
          background: `linear-gradient(90deg, ${isEntregado ? '#d1fae5' : isPausado ? '#fef3c7' : '#f3f4f6'} 0%, ${isEntregado ? '#a7f3d0' : isPausado ? '#fde68a' : '#e5e7eb'} 100%)`
        }}
      >
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
        
        {/* Logo Circular Superpuesto */}
        <div className="absolute -bottom-5 w-10 h-10 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center z-10">
          {proyecto.logo_url ? (
            <img src={proyecto.logo_url} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-[12px] font-bold text-gray-500 uppercase">
              {proyecto.nombre.substring(0,2)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 pt-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-[14px] font-bold text-gray-900 truncate">
              {proyecto.nombre}
            </h3>
            {proyecto.contacts && (
              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                {proyecto.contacts.nombre} {proyecto.contacts.empresa ? `· ${proyecto.contacts.empresa}` : ''}
              </p>
            )}
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border capitalize ${badgeClasses}`}>
            {proyecto.estado}
          </span>
        </div>

        <div className="space-y-1.5 mt-2 mb-4">
          {responsableObj && (
            <div className="flex items-center gap-2 text-[13px] text-gray-600">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                style={{ backgroundColor: responsableObj.bg }}
              >
                {responsableObj.initials}
              </div>
              <span className="font-medium text-gray-900">{responsableObj.name}</span>
            </div>
          )}
          {proyecto.fecha_entrega && (
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              <Calendar size={13} />
              Entrega: {formatDate(proyecto.fecha_entrega)}
            </div>
          )}
        </div>

        {/* Fases (Progress) */}
        <div className="mb-2 mt-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase">
                Fase {proyecto.fase_actual}: {NOMBRES_FASES[proyecto.fase_actual - 1]}
              </p>
              
              {/* Desglose de tareas pendientes por persona */}
              {Object.keys(pendientesPorPersona).length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {Object.entries(pendientesPorPersona).map(([slot, count]) => {
                    const avatar = AVATARS[slot]
                    if (!avatar) return null
                    return (
                      <div key={slot} className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full pr-2 pl-0.5 py-0.5">
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ backgroundColor: avatar.bg }}
                        >
                          {avatar.initials}
                        </div>
                        <span className="text-[10px] font-bold text-gray-700">{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="text-[11px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
              <CheckSquare size={12} className="text-gray-500" />
              {tareasPendientes.length} pend.
            </div>
          </div>
          {/* Mini-barras por fase */}
          <div className="flex gap-1 h-1.5 w-full mb-1">
            {[1, 2, 3, 4, 5, 6].map((fase) => {
              let bg = 'bg-gray-100'
              if (fase < proyecto.fase_actual || isEntregado) bg = 'bg-[#E8193C]'
              else if (fase === proyecto.fase_actual) bg = 'bg-[#E8193C]/40'
              
              return (
                <div key={fase} className={`flex-1 rounded-full ${bg}`} />
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-gray-400">
            <span>Progreso general</span>
            <span>{proyecto.porcentaje}%</span>
          </div>
        </div>
      </div>

    </Link>
  )
}
