'use client'

import { useState } from 'react'
import { useCreateGasto } from '@/hooks/use-gastos'
import { useContacts } from '@/hooks/use-contacts'
import { useProyectos } from '@/hooks/use-proyectos'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

export function GastoFormModal({ onClose }: Props) {
  const createGasto = useCreateGasto()
  const { data: contactos = [] } = useContacts()
  const { data: proyectos = [] } = useProyectos()

  const [concepto, setConcepto] = useState('')
  const [tipo, setTipo] = useState<'herramienta' | 'publicidad' | 'freelancer' | 'operativo' | 'otro'>('herramienta')
  const [monto, setMonto] = useState('')
  const [divisa, setDivisa] = useState<'EUR' | 'USD' | 'MXN'>('EUR')
  const [vinculacionTipo, setVinculacionTipo] = useState<'general' | 'cliente' | 'proyecto'>('general')
  const [vinculacionId, setVinculacionId] = useState<string>('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createGasto.mutate({
      concepto,
      tipo,
      monto: parseFloat(monto),
      divisa,
      vinculacion_tipo: vinculacionTipo,
      cliente_id: vinculacionTipo === 'cliente' ? vinculacionId : null,
      proyecto_id: vinculacionTipo === 'proyecto' ? vinculacionId : null,
      fecha
    }, {
      onSuccess: onClose
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-bold text-gray-900">Registrar Gasto</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Concepto</label>
            <input
              required
              type="text"
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 focus:border-[#E8193C] focus:bg-white focus:outline-none transition-colors"
              placeholder="Ej. Suscripción Vercel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Monto</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 focus:border-[#E8193C] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Divisa</label>
              <select
                value={divisa}
                onChange={e => setDivisa(e.target.value as any)}
                className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 focus:border-[#E8193C] focus:bg-white focus:outline-none transition-colors"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="MXN">MXN ($)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Tipo</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as any)}
                className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 focus:border-[#E8193C] focus:bg-white focus:outline-none transition-colors"
              >
                <option value="herramienta">Herramienta / Software</option>
                <option value="publicidad">Publicidad</option>
                <option value="freelancer">Freelancer</option>
                <option value="operativo">Operativo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Fecha</label>
              <input
                required
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 focus:border-[#E8193C] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Vinculación</label>
            <select
              value={vinculacionTipo}
              onChange={e => {
                setVinculacionTipo(e.target.value as any)
                setVinculacionId('')
              }}
              className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 focus:border-[#E8193C] focus:bg-white focus:outline-none transition-colors mb-2"
            >
              <option value="general">Gasto General</option>
              <option value="cliente">Cliente Específico</option>
              <option value="proyecto">Proyecto Específico</option>
            </select>

            {vinculacionTipo === 'cliente' && (
              <select
                required
                value={vinculacionId}
                onChange={e => setVinculacionId(e.target.value)}
                className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 focus:border-[#E8193C] focus:bg-white focus:outline-none transition-colors"
              >
                <option value="">Selecciona cliente...</option>
                {contactos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}

            {vinculacionTipo === 'proyecto' && (
              <select
                required
                value={vinculacionId}
                onChange={e => setVinculacionId(e.target.value)}
                className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 focus:border-[#E8193C] focus:bg-white focus:outline-none transition-colors"
              >
                <option value="">Selecciona proyecto...</option>
                {proyectos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-bold text-gray-600 hover:bg-gray-100 rounded-[10px] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createGasto.isPending}
              className="px-4 py-2 text-[13px] font-bold text-white bg-[#E8193C] hover:bg-[#C8102E] rounded-[10px] transition-colors disabled:opacity-50"
            >
              {createGasto.isPending ? 'Guardando...' : 'Guardar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
