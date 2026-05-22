'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore, useWorkspaceStore } from '@/lib/store'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { setWorkspace } = useWorkspaceStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError || !data.user) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Cargar perfil del usuario
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, nombre, avatar_url, role_title')
      .eq('id', data.user.id)
      .single()

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
        id: data.user.id,
        email: data.user.email ?? email,
        nombre: data.user.email?.split('@')[0] ?? 'Usuario',
      })
    }

    // Cargar workspace
    const { data: wu } = await supabase
      .from('workspace_users')
      .select('workspace_id, workspaces(id, nombre, logo_url, currency, plan)')
      .eq('user_id', data.user.id)
      .limit(1)
      .single()

    if (wu?.workspaces) {
      const ws = wu.workspaces as any
      setWorkspace({ id: ws.id, nombre: ws.nombre, logo_url: ws.logo_url, currency: ws.currency ?? 'USD', plan: ws.plan })
    }

    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--zk-bg-page)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8,
          }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#E8193C', letterSpacing: '-0.04em' }}>ZK</span>
            <span style={{ fontSize: 28, fontWeight: 300, color: 'var(--zk-text-primary)', letterSpacing: '-0.02em' }}>Hub</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--zk-text-secondary)', margin: 0 }}>
            Centro de mando ZK Marketing
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--zk-bg-card)',
          border: '1px solid var(--zk-border)',
          borderRadius: 16,
          padding: '32px 28px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--zk-text-primary)', marginBottom: 24 }}>
            Iniciar sesión
          </h1>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--zk-text-secondary)', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                required
                className="auth-page-input"
                style={{
                  width: '100%', height: 48, padding: '0 14px',
                  backgroundColor: 'var(--zk-bg-input)', border: '1px solid var(--zk-border)',
                  borderRadius: 10, fontSize: 15, color: 'var(--zk-text-primary)',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'border-color 150ms, box-shadow 150ms',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#E8193C'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,25,60,0.12)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--zk-border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--zk-text-secondary)', display: 'block', marginBottom: 6 }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="auth-page-input"
                  style={{
                    width: '100%', height: 48, padding: '0 44px 0 14px',
                    backgroundColor: 'var(--zk-bg-input)', border: '1px solid var(--zk-border)',
                    borderRadius: 10, fontSize: 15, color: 'var(--zk-text-primary)',
                    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                    transition: 'border-color 150ms, box-shadow 150ms',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#E8193C'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,25,60,0.12)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--zk-border)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--zk-text-secondary)', padding: 4, lineHeight: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(232,25,60,0.08)', border: '1px solid rgba(232,25,60,0.25)',
                borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E8193C',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: '100%', height: 48, backgroundColor: '#E8193C', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !email || !password ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit', transition: 'opacity 150ms',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#C8102E' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E8193C' }}
            >
              {loading && <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--zk-text-muted)', marginTop: 20 }}>
          ZK Hub © 2026 — Uso interno
        </p>
      </div>
    </div>
  )
}
