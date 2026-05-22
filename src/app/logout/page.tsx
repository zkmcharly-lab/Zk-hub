'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore, useWorkspaceStore } from '@/lib/store'

export default function LogoutPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { setWorkspace } = useWorkspaceStore()

  useEffect(() => {
    const supabase = createClient()
    
    const logout = async () => {
      // 1. Limpiar auth de Supabase
      await supabase.auth.signOut()
      
      // 2. Limpiar stores
      setUser(null)
      setWorkspace(null)
      
      // 3. Redirigir al login
      router.push('/login')
      router.refresh()
    }

    logout()
  }, [router, setUser, setWorkspace])

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'var(--zk-bg-page)',
      color: 'var(--zk-text-primary)'
    }}>
      <p>Cerrando sesión de forma segura...</p>
    </div>
  )
}
