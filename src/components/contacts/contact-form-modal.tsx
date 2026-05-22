import { useState, useEffect } from 'react'
import { useContact, useCreateContact, useUpdateContact } from '@/hooks/use-contacts'
import { useContactFolders } from '@/hooks/use-contact-folders'
import { X, MapPin, Globe, Phone, Building2, Loader2 } from 'lucide-react'
import { COUNTRY_LIST, getRegions, getRegionLabel } from '@/utils/locations'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'

const SECTORES = [
  'Inmobiliaria',
  'Legal / Abogados', 
  'Salud / Médicos',
  'Restaurante / Food',
  'Ecommerce / Tienda online',
  'Educación',
  'Construcción',
  'Marketing / Agencia',
  'Tecnología',
  'Finanzas / Contabilidad',
  'Viajes / Turismo',
  'Moda / Retail',
  'Otro'
]

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  contactId?: string
  onCreated?: (contact: any) => void
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#0f172a',
  height: 40, fontSize: 14, borderRadius: 8, width: '100%', padding: '0 12px',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', appearance: 'none' }

function Lbl({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 500, color: '#a3a3a3', display: 'block', marginBottom: 6 }}>
      {children}{required && <span style={{ color: '#E8193C', marginLeft: 3 }}>*</span>}
    </label>
  )
}

function SectionSep({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 8, paddingBottom: 4, borderTop: '1px solid #e5e7eb', marginTop: 12, marginBottom: 8 }}>
      {label}
    </div>
  )
}

export function ContactFormModal({ isOpen, onClose, contactId, onCreated }: ContactFormModalProps) {
  const isEditing = !!contactId
  const { data: existingContact, isLoading } = useContact(contactId ?? null)
  const { data: folders } = useContactFolders()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const { workspace } = useWorkspaceStore()
  const supabase = createClient()

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', empresa: '', sitio_web: '',
    notas: '', dato_relevante: '', etiquetas: [] as string[],
    pais: '', region: '', maps_url: '', facebook_url: '', instagram_url: '',
    temperatura: 'frio' as 'frio' | 'tibio' | 'caliente', nicho: '',
    preferred_currency: 'USD', folder_id: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [selectedNicho, setSelectedNicho] = useState('')

  useEffect(() => {
    if (isOpen && existingContact) {
      setForm({
        nombre: existingContact.nombre ?? '',
        email: existingContact.email ?? '',
        telefono: existingContact.telefono ?? '',
        empresa: existingContact.empresa ?? '',
        sitio_web: existingContact.sitio_web ?? '',
        notas: existingContact.notas ?? '',
        dato_relevante: existingContact.dato_relevante ?? '',
        etiquetas: existingContact.etiquetas ?? [],
        pais: existingContact.pais ?? '',
        region: existingContact.region ?? '',
        maps_url: existingContact.maps_url ?? '',
        facebook_url: existingContact.facebook_url ?? '',
        instagram_url: existingContact.instagram_url ?? '',
        temperatura: existingContact.temperatura ?? 'frio',
        nicho: existingContact.nicho ?? '',
        preferred_currency: existingContact.preferred_currency ?? 'USD',
        folder_id: existingContact.folder_id ?? '',
      })
      
      const initialNicho = existingContact.nicho ?? ''
      if (initialNicho && !SECTORES.includes(initialNicho) && initialNicho !== 'Otro') {
        setSelectedNicho('Otro')
      } else {
        setSelectedNicho(initialNicho)
      }
    }
    
    if (isOpen && !existingContact && !isEditing) {
      setForm({
        nombre: '', email: '', telefono: '', empresa: '', sitio_web: '',
        notas: '', dato_relevante: '', etiquetas: [],
        pais: '', region: '', maps_url: '', facebook_url: '', instagram_url: '',
        temperatura: 'frio', nicho: '', preferred_currency: 'USD', folder_id: '',
      })
      setSelectedNicho('')
    }
  }, [isOpen, existingContact, isEditing])

  if (!isOpen) return null

  const isReady = !isEditing || (isEditing && !isLoading && existingContact)
  const regions = getRegions(form.pais)
  const regionLabel = getRegionLabel(form.pais)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return alert('El nombre es requerido')

    let finalFolderId = form.folder_id || null
    if (form.nicho && !finalFolderId && workspace?.id) {
      const assignFolder = async (nicho: string) => {
        const { data: existing } = await supabase
          .from('contact_folders')
          .select('id')
          .eq('workspace_id', workspace.id)
          .eq('nombre', nicho)
          .single()
        
        if (existing) return existing.id
        
        const { data: nueva } = await supabase
          .from('contact_folders')
          .insert({
            workspace_id: workspace.id,
            nombre: nicho,
            color: '#6b7280',
            order_index: 0
          })
          .select('id')
          .single()
        
        return nueva?.id
      }
      
      const newFolderId = await assignFolder(form.nicho)
      if (newFolderId) {
        finalFolderId = newFolderId
      }
    }

    const dataToSave = {
      ...form,
      email: form.email || null,
      telefono: form.telefono || null,
      empresa: form.empresa || null,
      sitio_web: form.sitio_web || null,
      notas: form.notas || null,
      dato_relevante: form.dato_relevante || null,
      pais: form.pais || null,
      region: form.region || null,
      maps_url: form.maps_url || null,
      facebook_url: form.facebook_url || null,
      instagram_url: form.instagram_url || null,
      nicho: form.nicho || null,
      preferred_currency: form.preferred_currency || 'USD',
      folder_id: finalFolderId,
    }

    if (isEditing) {
      updateContact.mutate({ id: contactId!, data: dataToSave }, {
        onSuccess: () => onClose(),
      })
    } else {
      createContact.mutate(dataToSave, {
        onSuccess: (created) => {
          if (onCreated) onCreated(created)
          onClose()
        },
      })
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = tagInput.trim().replace(/,$/, '')
      if (trimmed && !form.etiquetas.includes(trimmed)) {
        setForm({ ...form, etiquetas: [...form.etiquetas, trimmed] })
        setTagInput('')
      }
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 700, maxHeight: '90vh', backgroundColor: '#f9f9fb',
        borderRadius: 12, display: 'flex', flexDirection: 'column', zIndex: 101, overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>{isEditing ? 'Editar contacto' : 'Nuevo contacto'}</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Completá los datos del contacto</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f3'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {!isReady ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" style={{ color: '#6b7280' }} /></div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                
                {/* Nombre & Email */}
                <div>
                  <Lbl required>Nombre</Lbl>
                  <input autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} placeholder="Ej: María García" />
                </div>
                <div>
                  <Lbl>Email</Lbl>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="correo@empresa.com" />
                </div>

                {/* Teléfono & Empresa */}
                <div>
                  <Lbl>Teléfono</Lbl>
                  <input type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} style={inputStyle} placeholder="+54 11 1234 5678" />
                </div>
                <div>
                  <Lbl>Empresa</Lbl>
                  <input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} style={inputStyle} placeholder="Nombre de la empresa" />
                </div>

                {/* Sitio Web & Nicho */}
                <div>
                  <Lbl>Sitio Web</Lbl>
                  <input value={form.sitio_web} onChange={(e) => setForm({ ...form, sitio_web: e.target.value })} style={inputStyle} placeholder="https://empresa.com" />
                </div>
                <div>
                  <Lbl>Nicho / Sector</Lbl>
                  <select 
                    value={selectedNicho} 
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedNicho(val)
                      if (val !== 'Otro') setForm({ ...form, nicho: val })
                      else setForm({ ...form, nicho: '' })
                    }} 
                    style={selectStyle}
                  >
                    <option value="">Seleccionar sector...</option>
                    {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {selectedNicho === 'Otro' && (
                    <input 
                      value={form.nicho} 
                      onChange={(e) => setForm({ ...form, nicho: e.target.value })} 
                      style={{ ...inputStyle, marginTop: 8 }} 
                      placeholder="Escribe el sector..." 
                    />
                  )}
                </div>

                {/* Moneda Preferida & Carpeta */}
                <div>
                  <Lbl>Moneda preferida</Lbl>
                  <select value={form.preferred_currency} onChange={(e) => setForm({ ...form, preferred_currency: e.target.value })} style={selectStyle}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="ARS">ARS</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
                <div>
                  <Lbl>Carpeta</Lbl>
                  <select value={form.folder_id} onChange={(e) => setForm({ ...form, folder_id: e.target.value })} style={selectStyle}>
                    <option value="">Sin carpeta</option>
                    {folders?.map(f => (
                      <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Temperatura */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Lbl>Temperatura del contacto</Lbl>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([
                      { val: 'frio' as const, label: '❄️ Frío', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                      { val: 'tibio' as const, label: '🌤 Tibio', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                      { val: 'caliente' as const, label: '🔥 Caliente', color: '#E8193C', bg: 'rgba(232,25,60,0.1)' },
                    ]).map(({ val, label, color, bg }) => (
                      <button key={val} type="button" onClick={() => setForm({ ...form, temperatura: val })}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, border: `1px solid ${form.temperatura === val ? color : '#e5e7eb'}`, background: form.temperatura === val ? bg : '#ffffff', color: form.temperatura === val ? color : '#525252', transition: 'all 150ms' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ubicación */}
                <div style={{ gridColumn: '1 / -1' }}><SectionSep label="Ubicación" /></div>
                <div>
                  <Lbl>País</Lbl>
                  <select value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value, region: '' })} style={selectStyle}>
                    <option value="">Seleccioná un país</option>
                    {COUNTRY_LIST.map((c) => <option key={c.code} value={c.code}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <Lbl>{regionLabel}</Lbl>
                  <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} disabled={!form.pais} style={{ ...selectStyle, opacity: !form.pais ? 0.5 : 1 }}>
                    <option value="">Seleccioná una región</option>
                    {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Lbl>URL de Google Maps</Lbl>
                  <input value={form.maps_url} onChange={(e) => setForm({ ...form, maps_url: e.target.value })} style={inputStyle} placeholder="https://maps.app.goo.gl/..." />
                </div>

                {/* Redes Sociales */}
                <div style={{ gridColumn: '1 / -1' }}><SectionSep label="Redes Sociales" /></div>
                <div>
                  <Lbl>Instagram</Lbl>
                  <input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} style={inputStyle} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <Lbl>Facebook</Lbl>
                  <input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} style={inputStyle} placeholder="https://facebook.com/..." />
                </div>

                {/* Etiquetas */}
                <div style={{ gridColumn: '1 / -1' }}><SectionSep label="Etiquetas y Notas" /></div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Lbl>Etiquetas</Lbl>
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', minHeight: 40, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    {form.etiquetas.map((tag) => (
                      <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0f0f3', border: '1px solid #e5e7eb', color: '#4b5563', fontSize: 12, padding: '2px 6px 2px 10px', borderRadius: 9999 }}>
                        {tag}
                        <button type="button" onClick={() => setForm({ ...form, etiquetas: form.etiquetas.filter((t) => t !== tag) })} style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} placeholder={form.etiquetas.length === 0 ? "Escribí una etiqueta y presioná Enter" : ""}
                      style={{ background: 'none', border: 'none', outline: 'none', color: '#0f172a', fontSize: 13, flex: 1, minWidth: 120 }} />
                  </div>
                </div>

                {/* Dato Relevante */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Lbl><span style={{ color: '#E8193C' }}>⚑ Dato relevante</span></Lbl>
                  <textarea value={form.dato_relevante} onChange={(e) => setForm({ ...form, dato_relevante: e.target.value })} placeholder="Información clave que no querés olvidar..."
                    style={{ ...inputStyle, height: 72, resize: 'vertical', paddingTop: 10 }} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Lbl>Notas Adicionales</Lbl>
                  <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Otras notas del contacto..."
                    style={{ ...inputStyle, height: 72, resize: 'vertical', paddingTop: 10 }} />
                </div>

              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#fff', flexShrink: 0 }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#4b5563', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={createContact.isPending || updateContact.isPending} style={{ padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#E8193C', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: (createContact.isPending || updateContact.isPending) ? 0.6 : 1 }}>
                {(createContact.isPending || updateContact.isPending) ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
