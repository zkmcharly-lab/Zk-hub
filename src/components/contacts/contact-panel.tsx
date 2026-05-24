import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { useContact, useUpdateContact, useDeleteContact } from '@/hooks/use-contacts'
import { useContactNotes, useAddContactNote, useDeleteContactNote } from '@/hooks/use-contact-notes'
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder } from '@/hooks/use-reminders'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, avatarColor, initials, relativeTime } from '@/lib/utils'
import { COUNTRY_LIST } from '@/utils/locations'
import { X, Pencil, Loader2, Mail, Phone, Building2, Calendar, Trash2, Plus, SendHorizonal, MessageSquare, MapPin, ExternalLink, Globe, TrendingUp, Bell, CheckCircle2, Circle, BadgeCheck } from 'lucide-react'

// Contact panel component
interface ContactPanelProps {
  contactId: string
  onClose: () => void
  onEdit: (id: string) => void
  onAddDeal: (id: string) => void
  isNewContact?: boolean
  onNewEvent?: (id: string) => void
  onNewConversation?: (id: string) => void
}

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

export function ContactPanel({ contactId, onClose, onEdit, onAddDeal, isNewContact, onNewEvent, onNewConversation }: ContactPanelProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { workspace } = useWorkspaceStore()

  const { data: contact, isLoading } = useContact(contactId)
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  
  const { data: notes, isLoading: notesLoading } = useContactNotes(contactId)
  const addNote = useAddContactNote(contactId)
  const deleteNote = useDeleteContactNote(contactId)

  const { data: allReminders, isLoading: remindersLoading } = useReminders()
  const createReminder = useCreateReminder()
  const updateReminder = useUpdateReminder()
  const deleteReminder = useDeleteReminder()

  const contactReminders = allReminders?.filter(r => r.contact_id === contactId) || []
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDate, setReminderDate] = useState('')

  const [noteText, setNoteText] = useState('')
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Estado "Marcar como cliente"
  const [isCliente, setIsCliente] = useState(false)
  const [marcandoCliente, setMarcandoCliente] = useState(false)

  // Check si ya es cliente al cargar
  useEffect(() => {
    if (!workspace?.id || !contactId) return
    const supabase = createClient()
    supabase
      .from('contact_list_members')
      .select('id, contact_lists(nombre)')
      .eq('contact_id', contactId)
      .then(({ data }) => {
        const lists = data?.map((m: any) => m.contact_lists?.nombre) ?? []
        setIsCliente(lists.includes('Clientes ZK'))
      })
  }, [contactId, workspace?.id])

  const handleMarcarComoCliente = async () => {
    if (!workspace?.id || isCliente) return
    setMarcandoCliente(true)
    try {
      const supabase = createClient()
      // 1. Buscar o crear CARPETA "Clientes ZK"
      let { data: carpeta } = await supabase
        .from('contact_folders')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('nombre', 'Clientes ZK')
        .maybeSingle()
      
      if (!carpeta) {
        const { data: nueva } = await supabase
          .from('contact_folders')
          .insert({ 
            workspace_id: workspace.id, 
            nombre: 'Clientes ZK',
            color: '#10b981',
            order_index: 99
          })
          .select('id').single()
        carpeta = nueva
      }

      // 2. Buscar o crear LISTA "Clientes ZK" para segmentación
      let { data: lista } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('nombre', 'Clientes ZK')
        .maybeSingle()

      if (!lista) {
        const { data: created } = await supabase
          .from('contact_lists')
          .insert({ workspace_id: workspace.id, nombre: 'Clientes ZK' })
          .select('id')
          .single()
        lista = created
      }

      if (lista?.id) {
        await supabase
          .from('contact_list_members')
          .upsert({ list_id: lista.id, contact_id: contactId }, { onConflict: 'list_id,contact_id' })
        
        // NO cambiar folder_id original, solo temperatura
        await supabase
          .from('contacts')
          .update({ temperatura: null })
          .eq('id', contactId)

        setIsCliente(true)
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        queryClient.invalidateQueries({ queryKey: ['contact_folders'] })
        queryClient.invalidateQueries({ queryKey: ['contact_list_members'] })
      }
    } finally {
      setMarcandoCliente(false)
    }
  }

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleAddNote = () => {
    const trimmed = noteText.trim()
    if (!trimmed) return
    addNote.mutate(trimmed, {
      onSuccess: () => { setNoteText(''); textareaRef.current?.focus() },
    })
  }

  const handleDeleteNote = (noteId: string) => {
    setDeletingNoteId(noteId)
    deleteNote.mutate(noteId, {
      onSettled: () => setDeletingNoteId(null),
    })
  }

  const handleAddReminder = () => {
    if (!reminderTitle.trim() || !reminderDate) return
    createReminder.mutate({
      titulo: reminderTitle.trim(),
      fecha_recordatorio: reminderDate,
      contact_id: contactId,
      estado: 'pendiente'
    }, {
      onSuccess: () => {
        setReminderTitle('')
        setReminderDate('')
        setShowReminderForm(false)
      }
    })
  }

  if (isLoading || !contact) {
    return (
      <aside style={{ width: 420, minWidth: 420, height: '100%', backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#6b7280' }} />
      </aside>
    )
  }

  const hasLocation = contact.pais || contact.region || contact.maps_url
  const hasSocial = contact.facebook_url || contact.instagram_url

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onClose} />
      <aside style={{ width: 420, minWidth: 420, height: '100%', backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="fixed inset-y-0 right-0 z-40 md:static md:z-auto">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e5e7eb', flexShrink: 0, backgroundColor: '#ffffff', position: 'sticky', top: 0, zIndex: 1 }}>
            <div className="flex items-start justify-between mb-4" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: avatarColor(contact.nombre), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                  {initials(contact.nombre)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.nombre}</h2>
                  {contact.empresa && <p style={{ fontSize: 14, color: '#6b7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.empresa}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                <button onClick={() => onEdit(contactId)} style={{ padding: 6, borderRadius: 6, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                  <Pencil size={16} />
                </button>
                <button onClick={onClose} style={{ padding: 6, borderRadius: 6, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {/* Marcar como cliente / badge cliente */}
              {isCliente ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  backgroundColor: 'rgba(22,163,74,0.12)', color: '#16A34A',
                  border: '1px solid rgba(22,163,74,0.3)', borderRadius: 9999,
                  padding: '3px 10px', fontSize: 11, fontWeight: 700
                }}>
                  ✓ Cliente
                </span>
              ) : (
                <button
                  onClick={handleMarcarComoCliente}
                  disabled={marcandoCliente}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    backgroundColor: 'rgba(22,163,74,0.1)', color: '#16A34A',
                    border: '1px solid rgba(22,163,74,0.3)', borderRadius: 9999,
                    padding: '3px 10px', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 120ms'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(22,163,74,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(22,163,74,0.1)' }}
                >
                  {marcandoCliente ? <Loader2 size={11} className="animate-spin" /> : '✓'}
                  Marcar como cliente
                </button>
              )}
              {/* Temperatura switch */}
              {(() => {
                const t = contact.temperatura || 'frio'
                const cfg = [
                  { v: 'frio', label: '❄ Frío', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                  { v: 'tibio', label: '🌤 Tibio', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                  { v: 'caliente', label: '🔥 Caliente', color: '#E8193C', bg: 'rgba(232,25,60,0.12)' },
                ] as const
                return (
                  <div style={{ display: 'flex', gap: 0, borderRadius: 9999, border: '1px solid #e5e7eb', overflow: 'hidden', background: '#f9f9fb' }}>
                    {cfg.map((c, i) => (
                      <button key={c.v} onClick={() => updateContact.mutate({ id: contactId, data: { temperatura: c.v } })}
                        title={c.label}
                        style={{
                          padding: '3px 10px', fontSize: 11, fontWeight: t === c.v ? 700 : 400, cursor: 'pointer', border: 'none',
                          background: t === c.v ? c.bg : 'none', color: t === c.v ? c.color : '#525252',
                          borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none', transition: 'all 120ms',
                        }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                )
              })()}
              {contact.etiquetas?.map((t) => (
                <span key={t} style={{ backgroundColor: '#e5e7eb', color: '#6b7280', fontSize: 11, borderRadius: 9999, padding: '3px 8px' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px', paddingBottom: 40 }}>
            {/* Info */}
            <section>
              <SectionLabel>Información</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {contact.email && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={14} style={{ color: '#525252' }} />
                      <span style={{ fontSize: 12.5, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{contact.email}</span>
                    </div>
                  </div>
                )}
                {contact.telefono && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Teléfono</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={14} style={{ color: '#525252' }} />
                      <span style={{ fontSize: 12.5, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{contact.telefono}</span>
                    </div>
                  </div>
                )}
                {contact.empresa && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Empresa</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={14} style={{ color: '#525252' }} />
                      <span style={{ fontSize: 12.5, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{contact.empresa}</span>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agregado</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} style={{ color: '#525252' }} />
                    <span style={{ fontSize: 12.5, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {new Date(contact.created_at).toLocaleDateString('es')}
                    </span>
                  </div>
                </div>
                {contact.sitio_web && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 600, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sitio web</p>
                    <a href={contact.sitio_web} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#E8193C', textDecoration: 'none' }}>
                      <Globe size={12} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {contact.sitio_web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                      </span>
                      <ExternalLink size={10} style={{ flexShrink: 0 }} />
                    </a>
                  </div>
                )}
              </div>
            </section>

            {hasLocation && (
              <>
                <Divider />
                <section>
                  <SectionLabel>Ubicación</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(contact.pais || contact.region) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: 13, color: '#374151' }}>
                          {[contact.region, contact.pais ? COUNTRY_LIST.find((c) => c.code === contact.pais)?.nombre ?? contact.pais : null].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {contact.maps_url && (
                      <a href={contact.maps_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#E8193C', textDecoration: 'none', width: 'fit-content' }}>
                        <ExternalLink size={12} /> Ver en Google Maps
                      </a>
                    )}
                  </div>
                </section>
              </>
            )}

            {contact.dato_relevante && (
              <>
                <Divider />
                <div style={{ background: 'rgba(232,25,60,0.07)', border: '1px solid rgba(232,25,60,0.35)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: '#E8193C', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>⚑ Dato relevante</p>
                  <p style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.55, whiteSpace: 'pre-wrap', margin: 0 }}>{contact.dato_relevante}</p>
                </div>
              </>
            )}

            {hasSocial && (
              <>
                <Divider />
                <section>
                  <SectionLabel>Redes sociales</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {contact.facebook_url && (
                      <a href={contact.facebook_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', textDecoration: 'none', padding: '8px 10px', backgroundColor: '#f9f9fb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: 12, flex: 1 }}>Facebook</span>
                        <ExternalLink size={12} style={{ color: '#4b5563' }} />
                      </a>
                    )}
                    {contact.instagram_url && (
                      <a href={contact.instagram_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', textDecoration: 'none', padding: '8px 10px', backgroundColor: '#f9f9fb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: 12, flex: 1 }}>Instagram</span>
                        <ExternalLink size={12} style={{ color: '#4b5563' }} />
                      </a>
                    )}
                  </div>
                </section>
              </>
            )}

            <Divider />

            {/* Notas */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <SectionLabel>Notas {notes?.length ? `(${notes.length})` : ''}</SectionLabel>
              </div>
              <div style={{ marginBottom: 16 }}>
                <textarea
                  ref={textareaRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote() }}
                  placeholder="Escribí una nota sobre este contacto..."
                  rows={3}
                  style={{ width: '100%', backgroundColor: '#f9f9fb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#0f172a', resize: 'none', outline: 'none', lineHeight: 1.5, boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#E8193C'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#2a2a2a'}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={handleAddNote} disabled={!noteText.trim() || addNote.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#E8193C', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: noteText.trim() ? 'pointer' : 'default', opacity: (!noteText.trim() || addNote.isPending) ? 0.5 : 1 }}>
                    {addNote.isPending ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
                    Agregar nota
                  </button>
                </div>
              </div>
              {notesLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                  <Loader2 size={14} className="animate-spin" /> Cargando notas...
                </div>
              ) : !notes?.length ? (
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>Aún no hay notas. Agregá una para registrar contexto importante.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {notes.map((note) => (
                    <div key={note.id} style={{ position: 'relative' }}>
                      <p style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.6, whiteSpace: 'pre-wrap', paddingRight: 28 }}>{note.contenido}</p>
                      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                        {relativeTime(note.created_at)}{note.created_by_nombre && ` · ${note.created_by_nombre}`}
                      </p>
                      {note.created_by === user?.id && (
                        <button onClick={() => handleDeleteNote(note.id)} disabled={deletingNoteId === note.id}
                          style={{ position: 'absolute', top: 0, right: 0, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          {deletingNoteId === note.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Divider />

            {/* Deals */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <SectionLabel>Deals</SectionLabel>
                <button onClick={() => onAddDeal(contactId)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#E8193C'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                  <Plus size={14} /> Agregar deal
                </button>
              </div>
              {!contact.deals?.length ? (
                <div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>Sin deals asociados.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contact.deals.map((deal) => (
                    <div key={deal.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f9f9fb', borderRadius: 8, border: '1px solid #e5e7eb', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#E8193C', flexShrink: 0 }} />
                        <p style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.titulo}</p>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#E8193C', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatCurrency(deal.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Divider />

            {/* Recordatorios */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <SectionLabel>Recordatorios</SectionLabel>
                <button onClick={() => setShowReminderForm(!showReminderForm)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#f59e0b'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>
                  <Plus size={14} /> Añadir
                </button>
              </div>

              {showReminderForm && (
                <div style={{ marginBottom: 16, backgroundColor: '#f9f9fb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px' }}>
                  <input
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="Título del recordatorio..."
                    style={{ width: '100%', height: 32, marginBottom: 8, padding: '0 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6, outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      style={{ flex: 1, height: 32, padding: '0 10px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6, outline: 'none' }}
                    />
                    <button onClick={handleAddReminder} disabled={!reminderTitle.trim() || !reminderDate || createReminder.isPending}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '0 14px', fontSize: 12, fontWeight: 500, cursor: (reminderTitle.trim() && reminderDate) ? 'pointer' : 'default', opacity: (!reminderTitle.trim() || !reminderDate || createReminder.isPending) ? 0.5 : 1 }}>
                      {createReminder.isPending ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />} Guardar
                    </button>
                  </div>
                </div>
              )}

              {remindersLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
                  <Loader2 size={14} className="animate-spin" /> Cargando...
                </div>
              ) : !contactReminders.length ? (
                <div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>Sin recordatorios pendientes.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contactReminders.map((rem) => (
                    <div key={rem.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', gap: 12, opacity: rem.estado === 'completado' ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0, flex: 1 }}>
                        <button
                          onClick={() => updateReminder.mutate({ id: rem.id, data: { estado: rem.estado === 'completado' ? 'pendiente' : 'completado' }})}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: rem.estado === 'completado' ? '#22c55e' : '#d1d5db', flexShrink: 0, marginTop: 2 }}
                        >
                          {rem.estado === 'completado' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </button>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: rem.estado === 'completado' ? '#6b7280' : '#374151', textDecoration: rem.estado === 'completado' ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                            {rem.titulo}
                          </p>
                          <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={10} />
                            {new Date(rem.fecha_recordatorio + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => deleteReminder.mutate(rem.id)} style={{ padding: 4, borderRadius: 6, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Footer */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                if (confirm('¿Eliminar este contacto? Esta acción no se puede deshacer.')) {
                  deleteContact.mutate(contactId, {
                    onSuccess: () => onClose()
                  })
                }
              }}
              disabled={deleteContact.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', opacity: deleteContact.isPending ? 0.5 : 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
            >
              {deleteContact.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Eliminar contacto
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
