'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'
import { Search, Loader2, Download, AlertCircle, Globe, Globe2, Building2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { ContactFormModal } from '@/components/contacts/contact-form-modal'

type ScrapedLead = {
  id: string
  nombre: string
  telefono: string | null
  sitio_web: string | null
  maps_url: string
  nicho: string
  email: string | null
  instagram: string | null
  marketing_opportunity: boolean
}

const MOCK_DATA: ScrapedLead[] = [
  {
    id: '1',
    nombre: 'Taquería El Franc',
    telefono: '+52 664 123 4567',
    sitio_web: null,
    maps_url: 'https://maps.google.com/?q=Taqueria+El+Franc',
    nicho: 'Restaurantes',
    email: null,
    instagram: 'https://instagram.com/taqueriaelfranc',
    marketing_opportunity: false,
  },
  {
    id: '2',
    nombre: 'Taller Mecánico Otay',
    telefono: '+52 664 987 6543',
    sitio_web: null,
    maps_url: 'https://maps.google.com/?q=Taller+Mecanico+Otay',
    nicho: 'Automotriz',
    email: 'contacto@tallerotay.com',
    instagram: null,
    marketing_opportunity: false,
  },
  {
    id: '3',
    nombre: 'Dental Tijuana Centro',
    telefono: '+52 664 555 1234',
    sitio_web: null,
    maps_url: 'https://maps.google.com/?q=Dental+Tijuana+Centro',
    nicho: 'Clínicas dentales',
    email: 'info@dentaltijuana.com',
    instagram: 'https://instagram.com/dentaltijuana',
    marketing_opportunity: false,
  },
  {
    id: '4',
    nombre: 'Boutique Fashion Style',
    telefono: '+52 664 222 3344',
    sitio_web: 'https://fashionstyle-tj.com',
    maps_url: 'https://maps.google.com/?q=Boutique+Fashion+Style',
    nicho: 'Boutiques',
    email: 'hola@fashionstyle-tj.com',
    instagram: 'https://instagram.com/fashionstyle_tj',
    marketing_opportunity: true,
  },
  {
    id: '5',
    nombre: 'Estética Glamour',
    telefono: '+52 664 777 8899',
    sitio_web: 'https://esteticaglamour.com.mx',
    maps_url: 'https://maps.google.com/?q=Estetica+Glamour',
    nicho: 'Estéticas',
    email: 'citas@esteticaglamour.com.mx',
    instagram: 'https://instagram.com/glamour_estetica',
    marketing_opportunity: true,
  },
  {
    id: '6',
    nombre: 'Consultores Empresariales BC',
    telefono: '+52 664 333 4455',
    sitio_web: 'https://consultoresbc.com',
    maps_url: 'https://maps.google.com/?q=Consultores+BC',
    nicho: 'Servicios',
    email: 'contacto@consultoresbc.com',
    instagram: null,
    marketing_opportunity: false,
  },
]

type TabFilter = 'todos' | 'sin-web' | 'con-web'
type ScraperStatus = 'idle' | 'loading' | 'success'

export default function ScraperPage() {
  const { workspace } = useWorkspaceStore()
  
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('Tijuana, Baja California')
  const [onlyNoWeb, setOnlyNoWeb] = useState(true)
  
  const [status, setStatus] = useState<ScraperStatus>('idle')
  const [results, setResults] = useState<ScrapedLead[]>([])
  
  const [activeTab, setActiveTab] = useState<TabFilter>('todos')
  const [loadingText, setLoadingText] = useState("Conectando con Supabase Edge Functions en ZK Hub...")
  
  // States for ContactFormModal Integration
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<ScrapedLead | null>(null)

  const supabase = createClient()

  // Cargar leads existentes al montar el componente
  useEffect(() => {
    async function loadExistingLeads() {
      if (!workspace?.id) return
      const { data, error } = await supabase
        .from('temporal_leads')
        .select('*')
        .eq('workspace_id', workspace.id)
      
      if (!error && data && data.length > 0) {
        setResults(data)
        setStatus('success')
      }
    }
    loadExistingLeads()
  }, [workspace?.id, supabase])

  useEffect(() => {
    let timer1: NodeJS.Timeout
    let timer2: NodeJS.Timeout
    
    if (status === 'loading') {
      setLoadingText("Conectando con Supabase Edge Functions en ZK Hub...")
      timer1 = setTimeout(() => {
        setLoadingText("Lanzando crawler en Google Maps (Tijuana)...")
      }, 15000)
      timer2 = setTimeout(() => {
        setLoadingText("Analizando código fuente, buscando correos y perfiles de Instagram...")
      }, 45000)
    }
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [status])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'loading' && workspace?.id) {
      interval = setInterval(async () => {
        const { data, error } = await supabase
          .from('temporal_leads')
          .select('*')
          .eq('workspace_id', workspace.id)

        if (!error && data && data.length > 0) {
          setResults(data)
          setStatus('success')
          toast.success(`Extracción completada. Se encontraron ${data.length} resultados.`)
        }
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [status, workspace?.id, supabase])

  const handleStartScraping = async () => {
    if (!keyword) {
      toast.error('Ingresa un sector o palabra clave')
      return
    }
    
    if (!workspace?.id) {
      toast.error('No hay workspace activo')
      return
    }
    
    setStatus('loading')
    setResults([])
    
    try {
      // Clear previous temporal leads for this workspace before starting
      await supabase.from('temporal_leads').delete().eq('workspace_id', workspace.id)

      const { data, error } = await supabase.functions.invoke('apify-scraper', {
        body: { keyword, location, workspace_id: workspace.id }
      })

      if (error) throw error

      toast.info('Extracción iniciada en segundo plano...')
    } catch (err: any) {
      console.error(err)
      toast.error('Error al iniciar extracción: ' + err.message)
      setStatus('idle')
    }
  }

  const handleImportToContacts = (lead: ScrapedLead) => {
    if (!workspace?.id) {
      toast.error('No hay workspace activo.')
      return
    }
    
    setSelectedLead(lead)
    setIsModalOpen(true)
  }

  const handleContactCreated = async (createdContact: any) => {
    if (selectedLead) {
      try {
        // Delete from temporal leads now that it has been saved in contacts
        await supabase.from('temporal_leads').delete().eq('id', selectedLead.id)
        setResults(prev => prev.filter(r => r.id !== selectedLead.id))
        toast.success(`'${selectedLead.nombre}' importado y guardado correctamente.`)
      } catch (err: any) {
        console.error('Error al remover lead temporal:', err)
      }
    }
  }

  const handleDiscard = async (id: string) => {
    await supabase.from('temporal_leads').delete().eq('id', id)
    setResults(prev => prev.filter(r => r.id !== id))
  }

  const filteredResults = results.filter(r => {
    if (activeTab === 'sin-web') return !r.sitio_web
    if (activeTab === 'con-web') return !!r.sitio_web
    return true
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--zk-bg-page)' }}>
      {/* Topbar */}
      <div style={{
        padding: '18px 28px', borderBottom: '0.8px solid var(--zk-border)',
        backgroundColor: 'var(--zk-topbar-bg)', display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0, backdropFilter: 'blur(8px)',
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--zk-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe2 size={18} style={{ color: '#E8193C' }} /> 
            Lead Scraper
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--zk-text-muted)', marginTop: 2 }}>
            Extracción automatizada de negocios locales
          </p>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 24, gap: 24 }}>
        
        {/* Control Panel */}
        <div style={{ 
          backgroundColor: 'var(--zk-bg-card)', border: '1px solid var(--zk-border)', borderRadius: 12,
          padding: 24, display: 'flex', flexDirection: 'column', gap: 20
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--zk-text-primary)' }}>Configuración de Búsqueda</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--zk-text-secondary)', marginBottom: 6 }}>
                Sector / Palabra clave
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--zk-text-muted)', pointerEvents: 'none' }} />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Ej: Boutiques, clínicas dentales..."
                  style={{
                    width: '100%', height: 38, padding: '0 10px 0 32px',
                    backgroundColor: 'var(--zk-bg-input)', border: '1px solid var(--zk-border)',
                    borderRadius: 8, fontSize: 13, color: 'var(--zk-text-primary)', outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#E8193C'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--zk-border)'}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--zk-text-secondary)', marginBottom: 6 }}>
                Zona / Ubicación
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--zk-text-muted)', pointerEvents: 'none' }} />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Tijuana, Baja California"
                  style={{
                    width: '100%', height: 38, padding: '0 10px 0 32px',
                    backgroundColor: 'var(--zk-bg-input)', border: '1px solid var(--zk-border)',
                    borderRadius: 8, fontSize: 13, color: 'var(--zk-text-primary)', outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#E8193C'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--zk-border)'}
                />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--zk-border-subtle)', paddingTop: 16, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={onlyNoWeb}
                onChange={(e) => setOnlyNoWeb(e.target.checked)}
                style={{ accentColor: '#E8193C', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13, color: 'var(--zk-text-dim)', fontWeight: 500 }}>Filtrar solo negocios SIN página web</span>
            </label>
            
            <button
              onClick={handleStartScraping}
              disabled={status === 'loading'}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px',
                backgroundColor: status === 'loading' ? 'var(--zk-bg-elevated)' : '#E8193C', 
                color: status === 'loading' ? 'var(--zk-text-muted)' : '#fff', 
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if(status !== 'loading') e.currentTarget.style.backgroundColor = '#C8102E' }}
              onMouseLeave={(e) => { if(status !== 'loading') e.currentTarget.style.backgroundColor = '#E8193C' }}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Extrayendo...
                </>
              ) : (
                <>
                  <Search size={14} />
                  Iniciar Extracción
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {status === 'idle' && results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, border: '1px dashed var(--zk-border)', borderRadius: 12, backgroundColor: 'var(--zk-bg-card)' }}>
              <Search size={32} style={{ color: 'var(--zk-text-muted)', marginBottom: 16 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--zk-text-primary)' }}>No hay ninguna prospección activa</p>
              <p style={{ fontSize: 13, color: 'var(--zk-text-secondary)', textAlign: 'center', maxWidth: 400, marginTop: 8 }}>
                Introduce un sector y ubicación arriba para empezar a escanear negocios locales en Tijuana sin página web.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--zk-text-primary)' }}>
                  Resultados {status === 'success' && <span style={{ color: 'var(--zk-text-muted)', fontWeight: 400, marginLeft: 4 }}>({filteredResults.length})</span>}
                </h3>
                
                {/* Tabs */}
                <div style={{ display: 'flex', backgroundColor: 'var(--zk-bg-elevated)', padding: 4, borderRadius: 8, gap: 4 }}>
                  <button
                    onClick={() => setActiveTab('todos')}
                    style={{
                      padding: '4px 12px', fontSize: 12, fontWeight: 500, border: 'none', borderRadius: 6,
                      backgroundColor: activeTab === 'todos' ? 'var(--zk-bg-card)' : 'transparent',
                      color: activeTab === 'todos' ? 'var(--zk-text-primary)' : 'var(--zk-text-secondary)',
                      boxShadow: activeTab === 'todos' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer',
                    }}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setActiveTab('sin-web')}
                    style={{
                      padding: '4px 12px', fontSize: 12, fontWeight: 500, border: 'none', borderRadius: 6,
                      backgroundColor: activeTab === 'sin-web' ? 'var(--zk-bg-card)' : 'transparent',
                      color: activeTab === 'sin-web' ? 'var(--zk-text-primary)' : 'var(--zk-text-secondary)',
                      boxShadow: activeTab === 'sin-web' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer',
                    }}
                  >
                    Sin Web (Prioritarios 🎯)
                  </button>
                  <button
                    onClick={() => setActiveTab('con-web')}
                    style={{
                      padding: '4px 12px', fontSize: 12, fontWeight: 500, border: 'none', borderRadius: 6,
                      backgroundColor: activeTab === 'con-web' ? 'var(--zk-bg-card)' : 'transparent',
                      color: activeTab === 'con-web' ? 'var(--zk-text-primary)' : 'var(--zk-text-secondary)',
                      boxShadow: activeTab === 'con-web' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer',
                    }}
                  >
                    Con Web
                  </button>
                </div>
              </div>

              <div style={{ 
                backgroundColor: 'var(--zk-bg-card)', border: '1px solid var(--zk-border)', borderRadius: 12,
                overflow: 'hidden'
              }}>
                {status === 'loading' && results.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 16 }}>
                     <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#E8193C' }} />
                     <p style={{ fontSize: 13, color: 'var(--zk-text-secondary)', fontWeight: 500 }}>{loadingText}</p>
                     <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                       {[1,2,3,4].map(i => (
                         <div key={i} className="animate-pulse" style={{ height: 44, backgroundColor: 'var(--zk-bg-elevated)', borderRadius: 8, width: '100%', opacity: 1 - (i*0.15) }} />
                       ))}
                     </div>
                  </div>
                ) : filteredResults.length === 0 && status !== 'loading' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
                     <AlertCircle size={24} style={{ color: 'var(--zk-text-muted)' }} />
                     <p style={{ fontSize: 13, color: 'var(--zk-text-secondary)' }}>No se encontraron negocios con los filtros actuales.</p>
                  </div>
                ) : (
                <div className="mobile-table-scroll" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '0.8px solid var(--zk-border)', backgroundColor: 'var(--zk-bg-surface)' }}>
                        {['Empresa', 'Sector', 'Teléfono', 'Sitio Web', 'Email', 'Instagram', 'Acciones'].map((h) => (
                          <th key={h} style={{
                            padding: '12px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600,
                            color: 'var(--zk-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                            whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((lead) => (
                        <tr key={lead.id} style={{ borderBottom: '0.8px solid var(--zk-border-subtle)', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--zk-bg-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 500, color: 'var(--zk-text-primary)' }}>
                            {lead.nombre}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--zk-text-secondary)' }}>{lead.nicho}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--zk-text-secondary)' }}>{lead.telefono || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {lead.sitio_web ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <a href={lead.sitio_web} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>
                                  {new URL(lead.sitio_web).hostname.replace('www.','')}
                                </a>
                                {lead.marketing_opportunity && (
                                  <span style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={10} /> Sin Pixel/Analytics
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{
                                fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                                backgroundColor: 'var(--zk-red)', color: '#fff',
                              }}>
                                SIN WEB
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--zk-text-secondary)' }}>{lead.email || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--zk-text-secondary)' }}>
                            {lead.instagram ? (
                              <a href={lead.instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--zk-text-primary)', textDecoration: 'none' }}>
                                @{lead.instagram.split('/').filter(Boolean).pop()}
                              </a>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button 
                                onClick={() => handleImportToContacts(lead)}
                                style={{
                                  padding: '4px 10px', fontSize: 11.5, fontWeight: 600, color: '#111', 
                                  backgroundColor: 'transparent', border: '1px solid var(--zk-border)', borderRadius: 6,
                                  cursor: 'pointer', transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--zk-bg-hover)'; e.currentTarget.style.borderColor = 'var(--zk-border-subtle)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--zk-border)'; }}
                              >
                                Importar
                              </button>
                              <button 
                                onClick={() => handleDiscard(lead.id)}
                                style={{
                                  padding: '4px 10px', fontSize: 11.5, fontWeight: 500, color: 'var(--zk-text-muted)', 
                                  backgroundColor: 'transparent', border: 'none', borderRadius: 6,
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = '#111' }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--zk-text-muted)' }}
                              >
                                Descartar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </div>

      {/* Integration with ContactFormModal for preloaded review */}
      {isModalOpen && selectedLead && (
        <ContactFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedLead(null)
          }}
          initialValues={{
            nombre: selectedLead.nombre,
            telefono: selectedLead.telefono,
            sitio_web: selectedLead.sitio_web,
            email: selectedLead.email,
            instagram_url: selectedLead.instagram,
            nicho: selectedLead.nicho === 'General' ? '' : selectedLead.nicho,
            maps_url: selectedLead.maps_url,
          }}
          onCreated={handleContactCreated}
        />
      )}
    </div>
  )
}
