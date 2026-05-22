import { create } from 'zustand'

interface User {
  id: string
  email: string
  nombre: string
  avatar_url?: string | null
  role_title?: string | null
}

interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))

interface Workspace {
  id: string
  nombre: string
  logo_url?: string | null
  currency: string
  plan: string
}

interface WorkspaceStore {
  workspace: Workspace | null
  setWorkspace: (ws: Workspace | null) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspace: null,
  setWorkspace: (workspace) => set({ workspace }),
}))
