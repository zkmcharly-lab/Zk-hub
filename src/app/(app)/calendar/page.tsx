'use client'

import { useState, useMemo } from 'react'
import { useReuniones, useCreateReunion, useUpdateReunion, useDeleteReunion, Reunion } from '@/hooks/use-reuniones'
import { usePipeline } from '@/hooks/use-deals'
import { Clock, Plus, MapPin, ChevronLeft, ChevronRight, X, Trash2, Pencil, Calendar as CalendarIcon, AlignLeft } from 'lucide-react'

const TIMEZONES = [
  { id: 'Europe/Madrid', label: 'España (CET/CEST)', short: 'CET' },
  { id: 'America/Cancun', label: 'México Cancún (EST)', short: 'EST' },
  { id: 'America/Tijuana', label: 'México Tijuana (PST/PDT)', short: 'PST' }
]

function getZoneParts(utcDate: string | Date, timeZone: string) {
  const d = new Date(utcDate)
  const dateStr = new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  const timeStr = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(d)
  return { dateStr, timeStr }
}

export default function CalendarPage() {
  const [zona, setZona] = useState('Europe/Madrid')
  
  // Base current date reference
  const [baseDate, setBaseDate] = useState(new Date())

  // Generate the 7 days of the week starting from Monday
  const weekDays = useMemo(() => {
    const d = new Date(baseDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    d.setDate(diff)
    d.setHours(0,0,0,0)
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const current = new Date(d)
      current.setDate(d.getDate() + i)
      // Get the local YYYY-MM-DD string for comparison (we use browser local here for the week grid itself)
      const dateStr = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(current)
      
      const label = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(current)
      days.push({ dateStr, label })
    }
    return days
  }, [baseDate])

  // Fetch all recent/upcoming
  const startFetch = new Date(baseDate)
  startFetch.setDate(startFetch.getDate() - 15)
  const endFetch = new Date(baseDate)
  endFetch.setDate(endFetch.getDate() + 15)

  const { data: reuniones = [], isLoading } = useReuniones(startFetch.toISOString(), endFetch.toISOString())
  const createReunion = useCreateReunion()
  const updateReunion = useUpdateReunion()
  const deleteReunion = useDeleteReunion()

  const { data: pipeline } = usePipeline()
  const deals = pipeline?.deals || []

  const [showModal, setShowModal] = useState(false)
  const [detailReunion, setDetailReunion] = useState<Reunion | null>(null)
  
  // Form state
  const [titulo, setTitulo] = useState('')
  const [dealId, setDealId] = useState('')
  const [notas, setNotas] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  
  // Edit mode
  const [editId, setEditId] = useState<string | null>(null)

  const openModal = (dateStr?: string) => {
    setTitulo('')
    setDealId('')
    setNotas('')
    setFormDate(dateStr || weekDays[0].dateStr)
    setFormTime('10:00')
    setEditId(null)
    setShowModal(true)
  }

  const openEditModal = (r: Reunion) => {
    const { dateStr, timeStr } = getZoneParts(r.fecha_hora, zona)
    setTitulo(r.titulo)
    setDealId(r.deal_id || '')
    setNotas(r.notas || '')
    setFormDate(dateStr)
    setFormTime(timeStr)
    setEditId(r.id)
    setDetailReunion(null)
    setShowModal(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    
    const getOffsetMs = (timeZone: string) => {
      const d = new Date()
      const tzDate = new Date(d.toLocaleString('en-US', { timeZone }))
      const utcDate = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }))
      return tzDate.getTime() - utcDate.getTime()
    }
    
    const offsetMs = getOffsetMs(zona)
    const utcTimeMs = new Date(`${formDate}T${formTime}:00Z`).getTime() - offsetMs
    const finalUtcDate = new Date(utcTimeMs).toISOString()

    if (editId) {
      updateReunion.mutate({ id: editId, data: { titulo, deal_id: dealId || null, notas, fecha_hora: finalUtcDate } }, {
        onSuccess: () => setShowModal(false)
      })
    } else {
      createReunion.mutate({ titulo, deal_id: dealId || null, notas, fecha_hora: finalUtcDate }, {
        onSuccess: () => setShowModal(false)
      })
    }
  }

  const handlePrevWeek = () => {
    const d = new Date(baseDate)
    d.setDate(d.getDate() - 7)
    setBaseDate(d)
  }

  const handleNextWeek = () => {
    const d = new Date(baseDate)
    d.setDate(d.getDate() + 7)
    setBaseDate(d)
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 h-screen flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda Semanal</h1>
          <p className="text-gray-500 text-sm mt-1">Sincronización multi-zona</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm">
            <MapPin size={16} className="text-gray-400 ml-2" />
            <select 
              value={zona} 
              onChange={e => setZona(e.target.value)}
              className="text-[13px] font-semibold text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer pr-4"
            >
              {TIMEZONES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 text-[13px] font-bold text-white bg-[#E8193C] hover:bg-[#C8102E] px-4 py-2.5 rounded-[10px] transition-colors shadow-sm"
          >
            <Plus size={16} /> Agendar
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-2 shrink-0 shadow-sm">
        <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft size={20}/></button>
        <span className="font-bold text-gray-900">
          {weekDays[0].label} - {weekDays[6].label}
        </span>
        <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight size={20}/></button>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-4 min-h-[500px] pb-6">
        {weekDays.map(day => {
          const dayReuniones = reuniones.filter(r => {
            const { dateStr } = getZoneParts(r.fecha_hora, zona)
            return dateStr === day.dateStr
          }).sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())

          return (
            <div key={day.dateStr} className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm h-full">
              <div className="bg-white border-b border-gray-200 py-3 text-center shrink-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{day.label.split(',')[0]}</p>
                <p className="text-[16px] font-bold text-gray-900">{day.dateStr.split('-')[2]}</p>
              </div>
              
              <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[250px]">
                {isLoading && <p className="text-[10px] text-gray-400 text-center mt-4">Cargando...</p>}
                
                {dayReuniones.map(r => {
                  const { timeStr } = getZoneParts(r.fecha_hora, zona)
                  return (
                    <button 
                      key={r.id} 
                      onClick={() => setDetailReunion(r)}
                      className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          <Clock size={10} />
                          {timeStr}
                        </div>
                        {r.notas && <AlignLeft size={12} className="text-gray-400" />}
                      </div>
                      
                      <h3 className="text-[13px] font-bold text-gray-900 leading-tight mb-1">{r.titulo}</h3>
                      
                      {r.deals?.titulo && (
                        <div className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-max mt-2 truncate max-w-full">
                          🤝 {r.deals.titulo}
                        </div>
                      )}
                    </button>
                  )
                })}
                
                <button 
                  onClick={() => openModal(day.dateStr)}
                  className="w-full py-2.5 mt-1 flex items-center justify-center gap-1 text-[12px] font-semibold text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors border border-dashed border-gray-300 hover:border-gray-400"
                >
                  <Plus size={14} /> Añadir
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail Modal */}
      {detailReunion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-bold text-gray-900 pr-4">{detailReunion.titulo}</h2>
              <button onClick={() => setDetailReunion(null)} className="rounded-full p-2 hover:bg-gray-100 transition-colors shrink-0">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Horarios en las 3 zonas */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h3 className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CalendarIcon size={14} /> Horarios de la reunión
                </h3>
                <div className="space-y-2">
                  {TIMEZONES.map(t => {
                    const { dateStr, timeStr } = getZoneParts(detailReunion.fecha_hora, t.id)
                    return (
                      <div key={t.id} className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-gray-600">{t.short}</span>
                        <span className="text-[13px] font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-blue-100">
                          {dateStr} — {timeStr}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {detailReunion.deals?.titulo && (
                <div>
                  <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Deal Vinculado</h3>
                  <p className="text-[14px] font-medium text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    🤝 {detailReunion.deals.titulo}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <AlignLeft size={14} /> Notas
                </h3>
                {detailReunion.notas ? (
                  <p className="text-[14px] text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                    {detailReunion.notas}
                  </p>
                ) : (
                  <p className="text-[13px] text-gray-400 italic">No hay notas para esta reunión.</p>
                )}
              </div>

              <div className="pt-2 flex justify-between gap-3 border-t border-gray-100">
                <button 
                  onClick={() => {
                    if (confirm('¿Eliminar esta reunión permanentemente?')) {
                      deleteReunion.mutate(detailReunion.id)
                      setDetailReunion(null)
                    }
                  }}
                  className="px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-[10px] transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
                <button 
                  onClick={() => openEditModal(detailReunion)}
                  className="px-5 py-2 text-[13px] font-bold text-white bg-gray-900 hover:bg-black rounded-[10px] transition-colors flex items-center gap-1.5"
                >
                  <Pencil size={14} /> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-bold text-gray-900">{editId ? 'Editar Reunión' : 'Agendar Reunión'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Título de la reunión</label>
                <input
                  required
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] focus:border-[#E8193C] focus:bg-white focus:outline-none"
                  placeholder="Ej. Revisión de Diseño"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Fecha ({TIMEZONES.find(t=>t.id===zona)?.label})</label>
                  <input
                    required
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] focus:border-[#E8193C] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Hora</label>
                  <input
                    required
                    type="time"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] focus:border-[#E8193C] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Vincular Deal (Opcional)</label>
                <select
                  value={dealId}
                  onChange={e => setDealId(e.target.value)}
                  className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] focus:border-[#E8193C] focus:bg-white focus:outline-none"
                >
                  <option value="">Sin vincular...</option>
                  {deals.map(d => (
                    <option key={d.id} value={d.id}>{d.titulo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Notas rápidas</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] focus:border-[#E8193C] focus:bg-white focus:outline-none min-h-[80px]"
                  placeholder="Apuntes rápidos..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[13px] font-bold text-gray-600 hover:bg-gray-100 rounded-[10px]">
                  Cancelar
                </button>
                <button type="submit" disabled={createReunion.isPending || updateReunion.isPending} className="px-4 py-2 text-[13px] font-bold text-white bg-[#E8193C] hover:bg-[#C8102E] rounded-[10px]">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
