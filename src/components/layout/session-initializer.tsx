'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore, useWorkspaceStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'

export function SessionInitializer({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore()
  const { setWorkspace } = useWorkspaceStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function restoreSession(sessionUser: any) {
      try {
        // 1. Obtener perfil con maybeSingle para evitar excepciones
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, nombre, avatar_url, role_title')
          .eq('id', sessionUser.id)
          .maybeSingle()

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            nombre: profile.nombre,
            avatar_url: profile.avatar_url,
            role_title: profile.role_title,
          })
        } else {
          setUser({
            id: sessionUser.id,
            email: sessionUser.email ?? '',
            nombre: sessionUser.email?.split('@')[0] ?? 'Usuario',
          })
        }

        // 2. Obtener workspace con maybeSingle
        const { data: wu } = await supabase
          .from('workspace_users')
          .select('workspace_id, workspaces(id, nombre, logo_url, currency, plan)')
          .eq('user_id', sessionUser.id)
          .limit(1)
          .maybeSingle()

        if (wu?.workspaces) {
          const ws = wu.workspaces as any
          setWorkspace({
            id: ws.id,
            nombre: ws.nombre,
            logo_url: ws.logo_url,
            currency: ws.currency ?? 'USD',
            plan: ws.plan,
          })
        } else {
          console.warn('El usuario no tiene un workspace asignado.')
        }
      } catch (err) {
        console.error('Error al restaurar sesión:', err)
      } finally {
        setLoading(false)
      }
    }

    // Comprobación inicial de sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        restoreSession(session.user)
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        restoreSession(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setWorkspace(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setWorkspace])

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--zk-bg-page)', gap: 16
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#E8193C', letterSpacing: '-0.04em' }}>ZK</span>
          <span style={{ fontSize: 32, fontWeight: 300, color: 'var(--zk-text-primary)', letterSpacing: '-0.02em' }}>Hub</span>
        </div>
        <Loader2 size={24} style={{ color: '#E8193C', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return <>{children}</>
}
