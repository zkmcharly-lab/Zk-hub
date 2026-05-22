import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useCreateContactFolder } from '@/hooks/use-contact-folders'

const PREDEFINED_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#64748b']

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (id: string) => void
}

export function CreateFolderModal({ isOpen, onClose, onCreated }: CreateFolderModalProps) {
  const createFolder = useCreateContactFolder()
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState(PREDEFINED_COLORS[0])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    createFolder.mutate(
      { nombre: nombre.trim(), color, order_index: 0 },
      {
        onSuccess: (data) => {
          setNombre('')
          setColor(PREDEFINED_COLORS[0])
          onCreated?.(data.id)
          onClose()
        }
      }
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto" style={{ width: 400, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Nueva Carpeta</h2>
            <button onClick={onClose} style={{ padding: 4, borderRadius: 6, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4b5563', marginBottom: 6 }}>Nombre de la carpeta</label>
              <input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Clientes VIP"
                style={{ width: '100%', height: 36, padding: '0 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#E8193C'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4b5563', marginBottom: 8 }}>Color</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {PREDEFINED_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: 'none', cursor: 'pointer',
                      outline: color === c ? '2px solid #0f172a' : 'none', outlineOffset: 2, transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#374151', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={!nombre.trim() || createFolder.isPending} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#fff', backgroundColor: '#E8193C', border: 'none', borderRadius: 6, cursor: nombre.trim() ? 'pointer' : 'default', opacity: (!nombre.trim() || createFolder.isPending) ? 0.6 : 1 }}>
                {createFolder.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Crear carpeta
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  )
}
