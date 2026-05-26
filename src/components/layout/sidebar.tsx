'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, TrendingUp, CreditCard, FolderKanban,
  Calendar, MessageSquare, Settings, LogOut, ChevronDown, Globe2, BookOpen
} from 'lucide-react'
import { useAuthStore, useWorkspaceStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { avatarColor, initials } from '@/lib/utils'

const NAV_MAIN = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Contactos', icon: Users, href: '/contacts' },
  { label: 'Pipeline', icon: TrendingUp, href: '/pipeline' },
  { label: 'Cobros', icon: CreditCard, href: '/cobros' },
  { label: 'Finanzas', icon: CreditCard, href: '/finanzas' },
  { label: 'Proyectos', icon: FolderKanban, href: '/proyectos' },
]

const NAV_TOOLS = [
  { label: 'Calendario', icon: Calendar, href: '/calendar' },
  { label: 'Conversaciones', icon: MessageSquare, href: '/conversations' },
  { label: 'Scraper B2B', icon: Globe2, href: '/herramientas/scraper' },
  { label: 'Knowledge Base', icon: BookOpen, href: '/herramientas/knowledge' },
]

const NAV_TEAM = [
  { label: 'Ajustes', icon: Settings, href: '/settings' },
]

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', borderRadius: 8, fontSize: 13.5,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--zk-text-primary)' : 'var(--zk-nav-text)',
        backgroundColor: active ? 'var(--zk-red-subtle)' : 'transparent',
        borderLeft: active ? '2px solid var(--zk-red)' : '2px solid transparent',
        textDecoration: 'none', transition: 'all 120ms',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--zk-nav-hover)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      {label}
    </Link>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{
      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--zk-section-label)',
      padding: '0 14px', marginBottom: 4, marginTop: 16,
    }}>
      {children}
    </p>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { workspace } = useWorkspaceStore()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  return (
    <aside
      className="app-sidebar"
      style={{
        width: 'var(--sidebar-w)', minWidth: 'var(--sidebar-w)',
        height: '100vh', display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--zk-sidebar-bg)',
        borderRight: '1px solid var(--zk-sidebar-border)',
        overflowY: 'auto', overflowX: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header / Workspace */}
      <div style={{
        padding: '18px 14px 14px',
        borderBottom: '1px solid var(--zk-border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {workspace?.logo_url ? (
            <img src={workspace.logo_url} alt="Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: 6, backgroundColor: '#E8193C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              ZK
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--zk-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {workspace?.nombre ?? 'ZK Marketing'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--zk-text-muted)', marginTop: 1 }}>
              {workspace?.plan ?? 'Pro'}
            </p>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--zk-text-muted)', flexShrink: 0 }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px 0', overflow: 'auto' }}>
        <SectionLabel>Principal</SectionLabel>
        {NAV_MAIN.map(({ label, icon: Icon, href }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname === href || (href !== '/dashboard' && pathname.startsWith(href))} />
        ))}

        <SectionLabel>Herramientas</SectionLabel>
        {NAV_TOOLS.map(({ label, icon: Icon, href }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
        ))}

        <SectionLabel>Equipo</SectionLabel>
        {NAV_TEAM.map(({ label, icon: Icon, href }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        borderTop: '1px solid var(--zk-border)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          backgroundColor: user ? avatarColor(user.nombre) : '#E8193C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: '#fff',
        }}>
          {user ? initials(user.nombre) : '?'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--zk-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.nombre ?? 'Usuario'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--zk-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.role_title ?? user?.email ?? ''}
          </p>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--zk-text-muted)', padding: 6, borderRadius: 6, lineHeight: 0, flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#E8193C'; e.currentTarget.style.backgroundColor = 'rgba(232,25,60,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--zk-text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
