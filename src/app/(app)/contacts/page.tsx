'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useContacts } from '@/hooks/use-contacts'
import { useWorkspaceStore } from '@/lib/store'
import { avatarColor, initials, relativeTime } from '@/lib/utils'
import { Search, Plus, Users, Flame, Wind, Sun, Loader2, Download } from 'lucide-react'
import { ContactFormModal } from '@/components/contacts/contact-form-modal'
import { ContactPanel } from '@/components/contacts/contact-panel'
import { CreateFolderModal } from '@/components/contacts/create-folder-modal'
import { ImportCsvModal } from '@/components/contacts/import-csv-modal'
import { useContactFolders } from '@/hooks/use-contact-folders'
import { Folder } from 'lucide-react'

const TEMP_CONFIG = {
  frio: { label: '❄️ Frío', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  tibio: { label: '🌤 Tibio', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  caliente: { label: '🔥 Caliente', color: '#E8193C', bg: 'rgba(232,25,60,0.1)' },
} as const

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [tempFilter, setTempFilter] = useState<string | null>(null)
  const [folderFilter, setFolderFilter] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | undefined>(undefined)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any | null>(null)
  
  const { workspace } = useWorkspaceStore()
  const { data: contacts, isLoading } = useContacts({ search })
  const { data: folders, isLoading: foldersLoading } = useContactFolders()
  
  // Custom query para members de Clientes ZK (o cualquier lista)
  const { data: listMembers } = useQuery({
    queryKey: ['contact_list_members', workspace?.id],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase.from('contact_list_members').select('contact_id, contact_lists!inner(id, nombre)').eq('contact_lists.workspace_id', workspace!.id)
      return data || []
    },
    enabled: !!workspace?.id,
  })

  const filtered = contacts?.filter((c) => {
    if (tempFilter && c.temperatura !== tempFilter) return false
    
    if (folderFilter) {
      const isFolderClientesZK = folders?.find(f => f.id === folderFilter)?.nombre === 'Clientes ZK'
      if (isFolderClientesZK) {
        // Si el folder seleccionado es "Clientes ZK", verificar si está en la lista "Clientes ZK"
        const inList = listMembers?.some(m => m.contact_id === c.id && (m.contact_lists as any)?.nombre === 'Clientes ZK')
        if (!inList) return false
      } else {
        if (c.folder_id !== folderFilter) return false
      }
    }
    
    return true
  }) ?? []

  const stats = {
    total: contacts?.length ?? 0,
    frio: contacts?.filter(c => c.temperatura === 'frio').length ?? 0,
    tibio: contacts?.filter(c => c.temperatura === 'tibio').length ?? 0,
    caliente: contacts?.filter(c => c.temperatura === 'caliente').length ?? 0,
    folders: folders?.reduce((acc, f) => {
      if (f.nombre === 'Clientes ZK') {
        acc[f.id] = listMembers?.filter(m => (m.contact_lists as any)?.nombre === 'Clientes ZK' && contacts?.find(c => c.id === m.contact_id)).length ?? 0
      } else {
        acc[f.id] = contacts?.filter(c => c.folder_id === f.id).length ?? 0
      }
      return acc
    }, {} as Record<string, number>) ?? {}
  }

  const handleExportCSV = () => {
    if (!contacts || contacts.length === 0) return
    const headers = ['Nombre', 'Email', 'Teléfono', 'Empresa', 'Nicho', 'Temperatura', 'País', 'Región']
    const csvContent = [
      headers.join(','),
      ...contacts.map(c => [
        `"${c.nombre || ''}"`,
        `"${c.email || ''}"`,
        `"${c.telefono || ''}"`,
        `"${c.empresa || ''}"`,
        `"${c.nicho || ''}"`,
        `"${c.temperatura || ''}"`,
        `"${c.pais || ''}"`,
        `"${c.region || ''}"`
      ].join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `contactos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar de Carpetas */}
      <aside style={{ width: 240, minWidth: 240, borderRight: '1px solid var(--zk-border)', backgroundColor: 'var(--zk-bg-surface)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '24px 16px 12px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--zk-text-muted)', marginBottom: 12, paddingLeft: 8 }}>
            CARPETAS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button
              onClick={() => { setTempFilter(null); setFolderFilter(null); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6,
                backgroundColor: (!tempFilter && !folderFilter) ? 'var(--zk-bg-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: (!tempFilter && !folderFilter) ? 600 : 500, color: 'var(--zk-text-primary)' }}>
                <Folder size={14} style={{ color: 'var(--zk-text-muted)' }} />
                Todos
              </div>
              <span style={{ fontSize: 12, color: 'var(--zk-text-muted)' }}>{stats.total}</span>
            </button>
            <button
              onClick={() => { setTempFilter('caliente'); setFolderFilter(null); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6,
                backgroundColor: (tempFilter === 'caliente') ? 'var(--zk-bg-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: (tempFilter === 'caliente') ? 600 : 500, color: 'var(--zk-text-primary)' }}>
                <span>🔥</span> Caliente
              </div>
              <span style={{ fontSize: 12, color: 'var(--zk-text-muted)' }}>{stats.caliente}</span>
            </button>
            <button
              onClick={() => { setTempFilter('tibio'); setFolderFilter(null); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6,
                backgroundColor: (tempFilter === 'tibio') ? 'var(--zk-bg-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: (tempFilter === 'tibio') ? 600 : 500, color: 'var(--zk-text-primary)' }}>
                <span>🌤</span> Tibio
              </div>
              <span style={{ fontSize: 12, color: 'var(--zk-text-muted)' }}>{stats.tibio}</span>
            </button>
            <button
              onClick={() => { setTempFilter('frio'); setFolderFilter(null); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6,
                backgroundColor: (tempFilter === 'frio') ? 'var(--zk-bg-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: (tempFilter === 'frio') ? 600 : 500, color: 'var(--zk-text-primary)' }}>
                <span>❄️</span> Frío
              </div>
              <span style={{ fontSize: 12, color: 'var(--zk-text-muted)' }}>{stats.frio}</span>
            </button>
          </div>
        </div>

        <div style={{ padding: '12px 16px', flex: 1 }}>
          {foldersLoading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Loader2 size={16} className="animate-spin" style={{ color: 'var(--zk-text-muted)' }} /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {folders?.map(f => {
                const isActive = folderFilter === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => { setFolderFilter(f.id); setTempFilter(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6,
                      backgroundColor: isActive ? 'var(--zk-bg-hover)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: isActive ? 600 : 500, color: 'var(--zk-text-primary)' }}>
                      <Folder size={14} style={{ color: f.color || 'var(--zk-text-muted)', fill: f.color ? `${f.color}20` : 'none' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{f.nombre}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--zk-text-muted)' }}>{stats.folders[f.id] ?? 0}</span>
                  </button>
                )
              })}
              
              <button
                onClick={() => setIsFolderModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6,
                  backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: 8,
                  fontSize: 13, fontWeight: 500, color: '#E8193C'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(232,25,60,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Plus size={14} />
                Nueva carpeta
              </button>
            </div>
          )}
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Topbar */}
      <div style={{
        padding: '18px 28px', borderBottom: '0.8px solid var(--zk-border)',
        backgroundColor: 'var(--zk-topbar-bg)', display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0, backdropFilter: 'blur(8px)',
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--zk-text-primary)' }}>Contactos</h1>
          <p style={{ fontSize: 12.5, color: 'var(--zk-text-muted)', marginTop: 2 }}>
            {filtered.length} contacto{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--zk-text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contacto..."
            style={{
              width: '100%', height: 36, padding: '0 10px 0 32px',
              backgroundColor: 'var(--zk-bg-card)', border: '0.8px solid var(--zk-border)',
              borderRadius: 8, fontSize: 13, color: 'var(--zk-text-primary)',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#E8193C'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--zk-border)'}
          />
        </div>

        {/* Removed Temperatura filters from Topbar because they are now in the Sidebar */}
        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
            backgroundColor: 'transparent', color: 'var(--zk-text-secondary)', border: '1px solid var(--zk-border)', borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}
            onClick={handleExportCSV}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--zk-bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Download size={14} /> Exportar CSV
          </button>
          
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
            backgroundColor: 'transparent', color: 'var(--zk-text-secondary)', border: '1px solid var(--zk-border)', borderRadius: 8,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}
            onClick={() => setIsImportModalOpen(true)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--zk-bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Download size={14} /> Importar CSV
          </button>
          
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
            backgroundColor: '#E8193C', color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
          onClick={() => { setEditingContactId(undefined); setIsModalOpen(true) }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C8102E'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E8193C'}
        >
          <Plus size={14} /> Nuevo contacto
        </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--zk-text-muted)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
            <Users size={32} style={{ color: 'var(--zk-text-muted)' }} />
            <p style={{ fontSize: 14, color: 'var(--zk-text-secondary)' }}>
              {search ? 'Sin resultados para esa búsqueda' : 'No hay contactos aún'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.8px solid var(--zk-border)', backgroundColor: 'var(--zk-bg-surface)' }}>
                {['Contacto', 'Empresa', 'Email', 'Teléfono', 'Temperatura', 'Agregado'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600,
                    color: 'var(--zk-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => {
                const tempCfg = TEMP_CONFIG[contact.temperatura] ?? TEMP_CONFIG.frio
                return (
                  <tr key={contact.id} style={{ borderBottom: '0.8px solid var(--zk-border-subtle)', cursor: 'pointer', backgroundColor: selectedContact?.id === contact.id ? 'var(--zk-bg-hover)' : 'transparent' }}
                    onClick={() => setSelectedContact(contact)}
                    onMouseEnter={(e) => { if (selectedContact?.id !== contact.id) e.currentTarget.style.backgroundColor = 'var(--zk-bg-hover)' }}
                    onMouseLeave={(e) => { if (selectedContact?.id !== contact.id) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: avatarColor(contact.nombre),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600, color: '#fff',
                        }}>
                          {initials(contact.nombre)}
                        </div>
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--zk-text-primary)' }}>{contact.nombre}</p>
                          {contact.etiquetas?.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                              {contact.etiquetas.slice(0, 2).map((t) => (
                                <span key={t} style={{ fontSize: 10.5, backgroundColor: 'var(--zk-bg-elevated)', color: 'var(--zk-text-secondary)', padding: '1px 6px', borderRadius: 99 }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--zk-text-secondary)' }}>{contact.empresa ?? '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--zk-text-secondary)' }}>{contact.email ?? '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--zk-text-secondary)' }}>{contact.telefono ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11.5, fontWeight: 500, padding: '3px 8px', borderRadius: 99,
                        backgroundColor: tempCfg.bg, color: tempCfg.color,
                      }}>
                        {tempCfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--zk-text-muted)', whiteSpace: 'nowrap' }}>
                      {relativeTime(contact.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>
      
      {selectedContact && (
        <ContactPanel 
          contactId={selectedContact.id} 
          onClose={() => setSelectedContact(null)} 
          onEdit={(id) => { setEditingContactId(id); setIsModalOpen(true); }} 
          onAddDeal={(id) => { /* TODO handle deal */ }} 
        />
      )}
      <ContactFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingContactId(undefined); }} contactId={editingContactId} />
      <ImportCsvModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <CreateFolderModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} />
    </div>
  )
}
