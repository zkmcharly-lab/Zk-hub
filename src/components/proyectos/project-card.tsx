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

  // Calcular tareas pendientes de la fase actual
  const currentFase = proyecto.proyecto_fases?.find(f => f.numero_fase === proyecto.fase_actual)
  const tareasPendientes = currentFase?.proyecto_tareas?.filter(t => t.estado !== 'completada').length || 0

  return (
    <div className="rounded-[14px] border-[0.8px] border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">{proyecto.nombre}</h3>
            {proyecto.contacts && (
              <p className="text-[13px] text-gray-500 flex items-center gap-1.5 mb-3">
                <User size={13} /> {proyecto.contacts.empresa || proyecto.contacts.nombre}
              </p>
            )}

            <div className="space-y-1.5 mt-4">
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
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold border capitalize ${badgeClasses}`}>
            {proyecto.estado}
          </span>
        </div>

        {/* Fases (Progress) */}
        <div className="mb-2 mt-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase">
                Fase {proyecto.fase_actual}: {NOMBRES_FASES[proyecto.fase_actual - 1]}
              </p>
            </div>
            <div className="text-[11px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
              <CheckSquare size={12} className="text-gray-500" />
              {tareasPendientes} pend.
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

      <div className="flex justify-end pt-3 border-t border-gray-100 mt-4">
        <Link 
          href={`/proyectos/${proyecto.id}`}
          className="text-[13px] font-semibold text-[#E8193C] hover:text-[#C8102E]"
        >
          Ver detalle &rarr;
        </Link>
      </div>
    </div>
  )
}
