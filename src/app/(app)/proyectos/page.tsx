'use client'

import { useState } from 'react'
import { useProyectos, Proyecto } from '@/hooks/use-proyectos'
import { ProjectCard } from '@/components/proyectos/project-card'
import { ProjectFormModal } from '@/components/proyectos/project-form-modal'
import { Plus, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

const getResponsableFromEmail = (email: string) => {
  if (email === 'admin@zk.com') return 'charly'
  if (email === 'inmaolmo@gmail.com') return 'inma'
  return null
}

const AVATARS: Record<string, { initials: string; bg: string; name: string }> = {
  charly: { initials: 'CH', bg: '#E8193C', name: 'Charly' },
  inma: { initials: 'IN', bg: '#EC4899', name: 'Inma' },
  fabri: { initials: 'FA', bg: '#16A34A', name: 'Fabri' },
}

export default function ProyectosPage() {
  const { data: proyectos, isLoading } = useProyectos()
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'mis_proyectos' | 'todos'>('mis_proyectos')

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F5]">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  const miResponsable = getResponsableFromEmail(user?.email ?? '')
  const safeProyectos = proyectos || []
  
  const misProyectos = safeProyectos.filter(p => p.responsable?.toLowerCase() === miResponsable)
  
  // Agrupar proyectos por responsable para la vista "Todos"
  const agrupados: Record<string, Proyecto[]> = {}
  safeProyectos.forEach(p => {
    const key = p.responsable?.toLowerCase() || 'sin_asignar'
    if (!agrupados[key]) agrupados[key] = []
    agrupados[key].push(p)
  })

  // Order of grouping keys: charly, inma, fabri, sin_asignar
  const order = ['charly', 'inma', 'fabri', 'sin_asignar']
  const keysSorted = Object.keys(agrupados).sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5] overflow-hidden">
      
      {/* Header */}
      <div className="flex shrink-0 flex-col border-b border-gray-200 bg-white">
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
          <h1 className="text-[16px] font-bold text-gray-900 tracking-tight">Proyectos</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-[8px] bg-[#E8193C] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#C8102E] transition-colors"
          >
            <Plus size={15} /> Nuevo proyecto
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 pt-2">
          <button 
            onClick={() => setActiveTab('mis_proyectos')}
            className={`pb-3 text-[13px] font-bold border-b-2 transition-colors ${
              activeTab === 'mis_proyectos' ? 'border-[#E8193C] text-[#E8193C]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mis proyectos
          </button>
          <button 
            onClick={() => setActiveTab('todos')}
            className={`pb-3 text-[13px] font-bold border-b-2 transition-colors ${
              activeTab === 'todos' ? 'border-[#E8193C] text-[#E8193C]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Todos los proyectos
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'mis_proyectos' && (
          <div>
            {misProyectos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <p className="text-[14px]">No tienes proyectos asignados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {misProyectos.map((proyecto) => (
                  <ProjectCard key={proyecto.id} proyecto={proyecto} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'todos' && (
          <div className="space-y-8">
            {safeProyectos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <p className="text-[14px]">No hay proyectos activos.</p>
              </div>
            ) : (
              keysSorted.map(key => {
                const proys = agrupados[key]
                const responsableInfo = AVATARS[key]
                
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-4">
                      {responsableInfo ? (
                        <>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: responsableInfo.bg }}>
                            {responsableInfo.initials}
                          </div>
                          <h2 className="text-[15px] font-bold text-gray-900">Proyectos de {responsableInfo.name}</h2>
                        </>
                      ) : (
                        <h2 className="text-[15px] font-bold text-gray-900">Sin asignar</h2>
                      )}
                      <span className="text-[12px] font-medium text-gray-400">({proys.length})</span>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {proys.map(p => (
                        <ProjectCard key={p.id} proyecto={p} />
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      <ProjectFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
