import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDealDetail, useUpdateDeal, useDeleteDeal, usePipeline } from '@/hooks/use-deals'
import { useContacts } from '@/hooks/use-contacts'
import { X, Pencil, ArrowUp, ArrowDown, AlertTriangle, Mail, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { formatCurrency, avatarColor, initials, relativeTime, formatDate } from '@/lib/utils'

const PRIORIDAD_MAP = { high: 'Alta', normal: 'Normal', low: 'Baja' }
const PRIORIDAD_COLOR = { high: '#ef4444', normal: '#a3a3a3', low: '#6b7280' }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 10 }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: '#e5e7eb', margin: '20px 0' }} />
}

export function DealPanel({ dealId, onClose, onEdit }: { dealId: string; onClose: () => void; onEdit?: (deal: any) => void }) {
  const router = useRouter()
  const { data: deal } = useDealDetail(dealId)
  const updateDeal = useUpdateDeal()
  const deleteDeal = useDeleteDeal()
  const { data: pipeline } = usePipeline()

  const stages = pipeline?.stages ?? []
  const currentStage = stages.find((s) => s.id === deal?.stage_id)

  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState('')
  const descRef = useRef<HTMLTextAreaElement>(null)

  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    titulo: '', valor: '', stage_id: '', fecha_cierre: '', prioridad: 'normal',
  })

  const [isContactSearch, setIsContactSearch] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [debouncedContactSearch, setDebouncedContactSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedContactSearch(contactSearch), 300)
    return () => clearTimeout(t)
  }, [contactSearch])

  const { data: contactsData } = useContacts({ search: debouncedContactSearch, limit: 8 })

  const [isConfirmDelete, setIsConfirmDelete] = useState(false)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  useEffect(() => {
    if (deal) {
      setDescValue(deal.descripcion ?? '')
      setEditForm({
        titulo: deal.titulo,
        valor: deal.valor.toString(),
        stage_id: deal.stage_id ?? '',
        fecha_cierre: deal.fecha_cierre ? deal.fecha_cierre.substring(0, 10) : '',
        prioridad: deal.prioridad,
      })
    }
  }, [deal])

  useEffect(() => {
    if (isEditingDesc && descRef.current) descRef.current.focus()
  }, [isEditingDesc])

  const saveDesc = () => {
    const trimmed = descValue.trim()
    setIsEditingDesc(false)
    if (trimmed === (deal?.descripcion ?? '')) return
    updateDeal.mutate({ id: dealId, data: { descripcion: trimmed || null } })
  }

  const saveEditForm = () => {
    updateDeal.mutate({
      id: dealId,
      data: {
        titulo: editForm.titulo,
        valor: parseFloat(editForm.valor) || 0,
        stage_id: editForm.stage_id,
        fecha_cierre: editForm.fecha_cierre || null,
        prioridad: editForm.prioridad as any,
      },
    }, {
      onSuccess: () => setIsEditFormOpen(false),
    })
  }

  const associateContact = (contactId: string) => {
    updateDeal.mutate({ id: dealId, data: { contact_id: contactId } }, {
      onSuccess: () => {
        setIsContactSearch(false)
        setContactSearch('')
      },
    })
  }

  const handleDelete = () => {
    deleteDeal.mutate(dealId, { onSuccess: () => onClose() })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', backgroundColor: '#f9f9fb', border: '1px solid #e5e7eb',
    borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#0f172a',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  if (!deal) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} />
      <aside style={{ width: 440, minWidth: 440, height: '100%', backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }} className="fixed inset-y-0 right-0 z-40 md:static md:z-auto">
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{deal.titulo}</h2>
              {currentStage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: currentStage.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: currentStage.color, backgroundColor: currentStage.color + '1a', borderRadius: 9999, padding: '2px 8px' }}>
                    {currentStage.nombre}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <button onClick={() => setIsEditFormOpen(!isEditFormOpen)} style={{ padding: 6, borderRadius: 6, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                <Pencil size={16} />
              </button>
              <button onClick={onClose} style={{ padding: 6, borderRadius: 6, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                <X size={16} />
              </button>
            </div>
          </div>
          {deal.is_overdue && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: 13, color: '#ef4444' }}>La fecha de cierre ya pasó</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Detalles */}
          <section>
            <SectionLabel>Detalles del deal</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: 4 }}>Valor</p>
                <span style={{ fontSize: 14, fontWeight: 600, color: deal.valor > 0 ? '#10b981' : '#6b7280' }}>
                  {deal.valor > 0 ? formatCurrency(deal.valor, deal.currency) : 'Sin valor'}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: 4 }}>Fecha de cierre</p>
                <span style={{ fontSize: 13, color: deal.is_overdue ? '#ef4444' : '#374151', fontWeight: deal.is_overdue ? 500 : 400 }}>
                  {deal.fecha_cierre ? formatDate(deal.fecha_cierre) : 'Sin fecha'}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: 4 }}>Prioridad</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {deal.prioridad === 'high' && <ArrowUp size={14} style={{ color: '#ef4444' }} />}
                  {deal.prioridad === 'low' && <ArrowDown size={14} style={{ color: '#6b7280' }} />}
                  <span style={{ fontSize: 13, color: PRIORIDAD_COLOR[deal.prioridad as keyof typeof PRIORIDAD_COLOR] ?? '#a3a3a3' }}>
                    {PRIORIDAD_MAP[deal.prioridad as keyof typeof PRIORIDAD_MAP] ?? 'Normal'}
                  </span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b7280', marginBottom: 4 }}>Creado</p>
                <span style={{ fontSize: 13, color: '#374151' }}>{relativeTime(deal.created_at)}</span>
              </div>
            </div>
          </section>

          <Divider />

          {/* Contacto */}
          <section>
            <SectionLabel>Contacto asociado</SectionLabel>
            {deal.contact ? (
              <div style={{ backgroundColor: '#f9f9fb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: avatarColor(deal.contact.nombre), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                    {initials(deal.contact.nombre)}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{deal.contact.nombre}</p>
                    {deal.contact.empresa && <p style={{ fontSize: 12, color: '#6b7280' }}>{deal.contact.empresa}</p>}
                  </div>
                </div>
                {deal.contact.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Mail size={14} style={{ color: '#6b7280' }} />
                    <a href={`mailto:${deal.contact.email}`} style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>{deal.contact.email}</a>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => router.push('/contacts')} style={{ fontSize: 12, color: '#E8193C', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Ver contacto →
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {!isContactSearch ? (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>Sin contacto asociado</p>
                    <button onClick={() => setIsContactSearch(true)} style={{ fontSize: 13, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
                      + Asociar contacto
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                      <input autoFocus value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Buscar contacto..." style={{ ...inputStyle, paddingLeft: 32 }} />
                    </div>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
                      {contactsData?.map((c) => (
                        <button key={c.id} onClick={() => associateContact(c.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', borderBottom: '1px solid #e8eaed', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: avatarColor(c.nombre), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                            {initials(c.nombre)}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, color: '#0f172a' }}>{c.nombre}</p>
                            {c.empresa && <p style={{ fontSize: 11, color: '#6b7280' }}>{c.empresa}</p>}
                          </div>
                        </button>
                      ))}
                      {contactsData?.length === 0 && <p style={{ padding: 12, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>Sin resultados</p>}
                    </div>
                    <button onClick={() => { setIsContactSearch(false); setContactSearch('') }} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          <Divider />

          {/* Descripción */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', marginBottom: 8 }}>
              <SectionLabel>Descripción</SectionLabel>
              <div style={{ flex: 1 }} />
              {!isEditingDesc && (
                <button onClick={() => setIsEditingDesc(true)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: -10 }}>
                  <Pencil size={14} />
                </button>
              )}
            </div>
            {isEditingDesc ? (
              <div>
                <textarea ref={descRef} value={descValue} onChange={(e) => setDescValue(e.target.value)} onBlur={saveDesc} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveDesc() }}
                  rows={4} placeholder="Agregar descripción..." style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
              </div>
            ) : (
              <p onClick={() => setIsEditingDesc(true)} style={{ fontSize: 13, color: deal.descripcion ? '#374151' : '#6b7280', lineHeight: 1.6, cursor: 'text', whiteSpace: 'pre-wrap', margin: 0 }}>
                {deal.descripcion || 'Sin descripción'}
              </p>
            )}
          </section>

          <Divider />

          {/* Edit form inline */}
          <section>
            <button onClick={() => setIsEditFormOpen(!isEditFormOpen)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: isEditFormOpen ? 14 : 0 }}>
              <Pencil size={14} /> Editar deal {isEditFormOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isEditFormOpen && (
              <div style={{ backgroundColor: '#f9f9fb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Título *</label>
                    <input value={editForm.titulo} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Valor</label>
                      <input type="number" value={editForm.valor} onChange={(e) => setEditForm({ ...editForm, valor: e.target.value })} style={inputStyle} placeholder="0" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Fecha cierre</label>
                      <input type="date" value={editForm.fecha_cierre} onChange={(e) => setEditForm({ ...editForm, fecha_cierre: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Prioridad</label>
                      <select value={editForm.prioridad} onChange={(e) => setEditForm({ ...editForm, prioridad: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="low">Baja</option>
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' }}>Etapa</label>
                      <select value={editForm.stage_id} onChange={(e) => setEditForm({ ...editForm, stage_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {stages.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                    <button onClick={() => setIsEditFormOpen(false)} style={{ fontSize: 13, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={saveEditForm} disabled={updateDeal.isPending || !editForm.titulo} style={{ fontSize: 13, color: '#fff', backgroundColor: '#E8193C', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', opacity: updateDeal.isPending ? 0.5 : 1 }}>
                      {updateDeal.isPending ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <Divider />

          {/* Eliminar */}
          <section>
            {!isConfirmDelete ? (
              <button onClick={() => setIsConfirmDelete(true)} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Eliminar deal
              </button>
            ) : (
              <div style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 13, color: '#0f172a', marginBottom: 10 }}>¿Estás seguro? Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setIsConfirmDelete(false)} style={{ fontSize: 13, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleDelete} disabled={deleteDeal.isPending} style={{ fontSize: 13, color: '#fff', backgroundColor: '#ef4444', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', opacity: deleteDeal.isPending ? 0.5 : 1 }}>
                    {deleteDeal.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                </div>
              </div>
            )}
          </section>

        </div>
      </aside>
    </>
  )
}
