import { useState, useEffect } from 'react'
import { useCreateTask } from '@/hooks/use-tasks'
import { useContacts } from '@/hooks/use-contacts'
import { useWorkspaceMembers } from '@/hooks/use-team'
import { X, Loader2 } from 'lucide-react'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (task: any) => void
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#0f172a',
  height: 40, fontSize: 14, borderRadius: 8, width: '100%', padding: '0 12px',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

function Lbl({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 500, color: '#a3a3a3', display: 'block', marginBottom: 6 }}>
      {children}{required && <span style={{ color: '#E8193C', marginLeft: 3 }}>*</span>}
    </label>
  )
}

export function TaskFormModal({ isOpen, onClose, onCreated }: TaskFormModalProps) {
  const createTask = useCreateTask()
  const { data: contacts, isLoading: contactsLoading } = useContacts()
  const { data: teamMembers, isLoading: teamLoading } = useWorkspaceMembers()

  const [form, setForm] = useState({
    text: '',
    contact_id: '',
    due_date: '',
    assignee_slot: '',
    assigned_to: '',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      setForm({
        text: '',
        contact_id: '',
        due_date: '',
        assignee_slot: '',
        assigned_to: '',
        notes: '',
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.text.trim()) return alert('La descripción de la tarea es requerida')

    const dataToSave = {
      text: form.text.trim(),
      contact_id: form.contact_id || null,
      due_date: form.due_date || null,
      assignee_slot: form.assignee_slot || null,
      assigned_to: form.assigned_to || null,
      notes: form.notes || null,
    }

    createTask.mutate(dataToSave, {
      onSuccess: (created) => {
        if (onCreated) onCreated(created)
        onClose()
      },
    })
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 500, maxHeight: '90vh', backgroundColor: '#f9f9fb',
        borderRadius: 12, display: 'flex', flexDirection: 'column', zIndex: 101, overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Nueva tarea</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Completá los detalles de la tarea</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f3'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {contactsLoading || teamLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" style={{ color: '#6b7280' }} /></div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <Lbl required>Descripción de la tarea</Lbl>
                <input autoFocus value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} style={inputStyle} placeholder="Ej: Llamar para confirmar reunión" />
              </div>

              <div>
                <Lbl>Contacto / Cliente</Lbl>
                <select value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })} style={selectStyle}>
                  <option value="">Sin contacto</option>
                  {contacts?.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.empresa ? `(${c.empresa})` : ''}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Lbl>Fecha de vencimiento</Lbl>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <Lbl>Asignado / Slot</Lbl>
                  <select value={form.assignee_slot} onChange={(e) => setForm({ ...form, assignee_slot: e.target.value })} style={selectStyle}>
                    <option value="">Sin asignar</option>
                    <option value="active">Activa</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <Lbl>Asignado a</Lbl>
                  <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} style={selectStyle}>
                    <option value="">Sin asignar</option>
                    {teamMembers?.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.users?.nombre ?? 'Usuario'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Lbl>Notas Adicionales</Lbl>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalles extra de la tarea..."
                  style={{ ...inputStyle, height: 72, resize: 'vertical', paddingTop: 10 }} />
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#fff', flexShrink: 0 }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#4b5563', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={createTask.isPending} style={{ padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: '#E8193C', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: createTask.isPending ? 0.6 : 1 }}>
                {createTask.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
