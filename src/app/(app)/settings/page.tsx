'use client'
import { useState, useEffect } from 'react'
import { useAuthStore, useWorkspaceStore } from '@/lib/store'
import { avatarColor, initials } from '@/lib/utils'
import { useWorkspaceMembers, useUpdateProfile, useUpdateWorkspace } from '@/hooks/use-team'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { workspace } = useWorkspaceStore()
  
  const { data: teamMembers, isLoading: teamLoading } = useWorkspaceMembers()
  const updateProfile = useUpdateProfile()
  const updateWorkspace = useUpdateWorkspace()

  // Profile Form State
  const [nombrePerfil, setNombrePerfil] = useState(user?.nombre || '')
  
  // Workspace Form State
  const [nombreWorkspace, setNombreWorkspace] = useState(workspace?.nombre || '')
  const [currency, setCurrency] = useState(workspace?.currency || 'USD')

  // Update states if store changes
  useEffect(() => {
    if (user?.nombre) setNombrePerfil(user.nombre)
  }, [user?.nombre])

  useEffect(() => {
    if (workspace) {
      setNombreWorkspace(workspace.nombre)
      setCurrency(workspace.currency || 'USD')
    }
  }, [workspace])

  const handleSaveProfile = () => {
    if (!nombrePerfil.trim() || nombrePerfil === user?.nombre) return
    updateProfile.mutate({ nombre: nombrePerfil.trim() })
  }

  const handleSaveWorkspace = () => {
    if (!nombreWorkspace.trim() || (nombreWorkspace === workspace?.nombre && currency === workspace?.currency)) return
    updateWorkspace.mutate({ nombre: nombreWorkspace.trim(), currency })
  }

  const currentUserRole = teamMembers?.find(m => m.user_id === user?.id)?.rol || 'Member'

  const cardStyle = {
    backgroundColor: 'var(--zk-bg-card)', border: '0.8px solid var(--zk-border)',
    borderRadius: 12, padding: '24px',
  }

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--zk-text-muted)', marginBottom: 8
  }

  const inputStyle = {
    width: '100%', height: 36, padding: '0 12px', border: '1px solid var(--zk-border-subtle)', 
    borderRadius: 6, fontSize: 13, outline: 'none', backgroundColor: 'var(--zk-bg-surface)',
    color: 'var(--zk-text-primary)'
  }

  const buttonStyle = {
    height: 36, padding: '0 16px', backgroundColor: '#E8193C', color: '#fff',
    border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 40px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--zk-text-primary)', marginBottom: 24 }}>Ajustes</h1>

      {/* MI PERFIL */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--zk-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Mi perfil
        </h2>
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              backgroundColor: user ? avatarColor(user.nombre) : '#E8193C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#fff',
            }}>
              {user ? initials(user.nombre) : '?'}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 12, maxWidth: 400 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nombre</label>
                <input
                  value={nombrePerfil}
                  onChange={(e) => setNombrePerfil(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button 
                onClick={handleSaveProfile} 
                disabled={!nombrePerfil.trim() || nombrePerfil === user?.nombre || updateProfile.isPending}
                style={{ ...buttonStyle, opacity: (!nombrePerfil.trim() || nombrePerfil === user?.nombre || updateProfile.isPending) ? 0.6 : 1 }}
              >
                {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Guardar
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 40 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <p style={{ fontSize: 14, color: 'var(--zk-text-secondary)' }}>{user?.email ?? '—'}</p>
            </div>
            <div>
              <label style={labelStyle}>Rol</label>
              <p style={{ fontSize: 14, color: 'var(--zk-text-secondary)' }}>{currentUserRole}</p>
            </div>
          </div>

        </div>
      </section>

      {/* EQUIPO */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--zk-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Miembros del Equipo
        </h2>
        <div style={{ ...cardStyle, padding: '12px 24px' }}>
          {teamLoading ? (
            <div style={{ padding: '20px 0', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--zk-text-muted)' }}>
              <Loader2 size={16} className="animate-spin" /> Cargando equipo...
            </div>
          ) : teamMembers?.length === 0 ? (
            <p style={{ padding: '20px 0', color: 'var(--zk-text-disabled)' }}>No hay miembros en este workspace.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {teamMembers?.map((member, i) => {
                const u = member.users;
                if (!u) return null;
                return (
                  <div key={member.user_id} style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                    borderBottom: i < teamMembers.length - 1 ? '1px solid var(--zk-border-subtle)' : 'none'
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: avatarColor(u.nombre),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>
                      {initials(u.nombre)}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--zk-text-primary)' }}>{u.nombre}</p>
                    <span style={{ color: 'var(--zk-text-disabled)' }}>·</span>
                    <p style={{ fontSize: 13, color: 'var(--zk-text-secondary)' }}>{u.email}</p>
                    <span style={{ color: 'var(--zk-text-disabled)' }}>·</span>
                    <p style={{ fontSize: 13, color: 'var(--zk-text-secondary)' }}>
                      {member.rol.charAt(0).toUpperCase() + member.rol.slice(1)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* WORKSPACE */}
      <section>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--zk-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Workspace
        </h2>
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, maxWidth: 600 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Nombre workspace</label>
              <input
                value={nombreWorkspace}
                onChange={(e) => setNombreWorkspace(e.target.value)}
                style={inputStyle}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Moneda por defecto</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="MXN">MXN</option>
                <option value="ARS">ARS</option>
              </select>
            </div>

            <button 
              onClick={handleSaveWorkspace} 
              disabled={!nombreWorkspace.trim() || (nombreWorkspace === workspace?.nombre && currency === workspace?.currency) || updateWorkspace.isPending}
              style={{ ...buttonStyle, opacity: (!nombreWorkspace.trim() || (nombreWorkspace === workspace?.nombre && currency === workspace?.currency) || updateWorkspace.isPending) ? 0.6 : 1 }}
            >
              {updateWorkspace.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Guardar
            </button>
          </div>
        </div>
      </section>
      
    </div>
  )
}
