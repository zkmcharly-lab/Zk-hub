'use client'

import { useState } from 'react'
import { useProyectos, Proyecto } from '@/hooks/use-proyectos'
import { ProjectCard } from '@/components/proyectos/project-card'
import { ProjectFormModal } from '@/components/proyectos/project-form-modal'
import { Plus, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'


export default function ProyectosPage() {
  const { data: proyectos, isLoading } = useProyectos()
  const { user } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F5]">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  const safeProyectos = proyectos || []
  
  const filteredProyectos = safeProyectos.filter(p => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return p.nombre?.toLowerCase().includes(s) || p.contacts?.nombre?.toLowerCase().includes(s)
  })

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5] overflow-hidden">
      
      {/* Header */}
      <div className="flex shrink-0 flex-col border-b border-gray-200 bg-white">
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
          <h1 className="text-[16px] font-bold text-gray-900 tracking-tight">Proyectos</h1>
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{
                padding: '7px 12px',
                border: '0.8px solid rgb(229,231,235)',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                width: 220,
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-[8px] bg-[#E8193C] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#C8102E] transition-colors"
          >
            <Plus size={15} /> Nuevo proyecto
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {filteredProyectos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p className="text-[14px]">No hay proyectos activos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProyectos.map((proyecto) => (
              <ProjectCard key={proyecto.id} proyecto={proyecto} />
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
