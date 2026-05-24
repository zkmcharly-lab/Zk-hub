import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { useQueryClient } from '@tanstack/react-query'
import { X, Upload, Loader2, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'

interface ImportCsvModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ImportCsvModal({ isOpen, onClose }: ImportCsvModalProps) {
  const { workspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [parsedData, setParsedData] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setError(null)

    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mappedData = results.data.map((row: any) => {
          const lowerKeys = Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v])
          )
          
          return {
            nombre: lowerKeys.nombre || lowerKeys.name || '',
            email: lowerKeys.email || '',
            telefono: lowerKeys.telefono || lowerKeys.phone || '',
            empresa: lowerKeys.empresa || lowerKeys.company || '',
            pais: lowerKeys.pais || lowerKeys.country || '',
            temperatura: lowerKeys.temperatura || 'frio'
          }
        }).filter(r => r.nombre) // Require at least a name

        setParsedData(mappedData)
        setPreview(mappedData.slice(0, 5))
      },
      error: (err) => {
        setError(`Error parseando el archivo: ${err.message}`)
      }
    })
  }

  const handleImport = async () => {
    if (!workspace?.id || parsedData.length === 0) return
    setIsImporting(true)
    setError(null)
    const supabase = createClient()

    try {
      const { error } = await supabase.from('contacts').insert(
        parsedData.map(d => ({ ...d, workspace_id: workspace.id }))
      )
      if (error) throw error
      
      alert(`${parsedData.length} contactos importados con éxito`)
      queryClient.invalidateQueries({ queryKey: ['contacts', workspace.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      handleClose()
    } catch (err: any) {
      console.error('Error importando:', err)
      setError(err?.message || 'Error al importar los contactos')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setParsedData([])
    setError(null)
    onClose()
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }} onClick={handleClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 600, maxHeight: '90vh', backgroundColor: '#f9f9fb',
        borderRadius: 12, display: 'flex', flexDirection: 'column', zIndex: 101, overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Importar Contactos</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Sube un archivo CSV con tus contactos</p>
          </div>
          <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f3'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto' }}>
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '1.5px dashed #d1d5db', borderRadius: 8, padding: 40,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', backgroundColor: '#fff', transition: 'background-color 150ms'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            >
              <Upload size={32} color="#9ca3af" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Haz clic para seleccionar un archivo</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Formatos soportados: .csv</p>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".csv" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Archivo: {file.name}</p>
                <button 
                  onClick={() => { setFile(null); setPreview([]); setParsedData([]); }}
                  style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cambiar archivo
                </button>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, color: '#991b1b', fontSize: 13 }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {preview.length > 0 && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>
                    Previsualización (Primeros 5 de {parsedData.length})
                  </p>
                  <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>Nombre</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>Email</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>Teléfono</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#6b7280' }}>Empresa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} style={{ borderBottom: i < preview.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                            <td style={{ padding: '8px 12px', color: '#111827' }}>{row.nombre}</td>
                            <td style={{ padding: '8px 12px', color: '#4b5563' }}>{row.email}</td>
                            <td style={{ padding: '8px 12px', color: '#4b5563' }}>{row.telefono}</td>
                            <td style={{ padding: '8px 12px', color: '#4b5563' }}>{row.empresa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#fff', flexShrink: 0 }}>
          <button type="button" onClick={handleClose} disabled={isImporting} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#4b5563', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button 
            onClick={handleImport} 
            disabled={isImporting || parsedData.length === 0} 
            style={{ 
              padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#E8193C', 
              border: 'none', borderRadius: 8, cursor: parsedData.length > 0 && !isImporting ? 'pointer' : 'not-allowed', 
              opacity: parsedData.length > 0 && !isImporting ? 1 : 0.6,
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {isImporting ? <><Loader2 size={14} className="animate-spin" /> Importando...</> : `Confirmar Importación (${parsedData.length})`}
          </button>
        </div>
      </div>
    </>
  )
}
