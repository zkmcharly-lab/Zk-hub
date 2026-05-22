# SPEC CLAUDE CODE — ZK Hub v2
> Fecha: 2026-05-21  
> Entorno: Claude Code  
> Proyecto: `zk-hub-v2` — Next.js + Supabase  
> Fuente de verdad: código de Fabri en `ZK-Hub-main/artifacts/zk-crm/` + schema `zkhub_backup (1).sql`

---

## OBJETIVO

Construir **desde cero** el ZK Hub usando Next.js (App Router) + Supabase.  
La fuente de diseño y lógica de negocio es la app de Fabri (React + Vite en Replit).  
**No se usa el código de Fabri directamente** — se migra su lógica a Next.js con llamadas a Supabase.

---

## RUTAS EN DISCO

```
Proyecto nuevo (Claude escribe aquí):
C:\Users\user\Documents\Sistemas de trabajo\Proyectos Vibe Coding\KaizenDw\projects\zk-hub-v2\

Código de Fabri (solo lectura):
C:\Users\user\Documents\Sistemas de trabajo\Proyectos Vibe Coding\KaizenDw\projects\zk-hub\ZK-Hub-main\artifacts\zk-crm\src\

Schema SQL (importar a Supabase):
C:\Users\user\Documents\Sistemas de trabajo\Proyectos Vibe Coding\KaizenDw\projects\zk-hub\zkhub_backup (1).sql
```

---

## FASE 1 — SETUP DEL PROYECTO

### 1.1 Inicializar Next.js

```bash
cd "C:\Users\user\Documents\Sistemas de trabajo\Proyectos Vibe Coding\KaizenDw\projects\zk-hub-v2"
npx create-next-app@latest . --typescript --app --no-tailwind --src-dir --import-alias "@/*" --no-git --yes
```

> No usar Tailwind. El sistema de estilos es **100% CSS custom properties** (ver FASE 5).

### 1.2 Instalar dependencias exactas

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query
npm install lucide-react
npm install react-hook-form @hookform/resolvers zod
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install framer-motion
npm install date-fns
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction
```

> ❌ NO instalar: recharts, wouter, @workspace/api-client-react, tailwindcss

### 1.3 Variables de entorno

Crear `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<URL del proyecto Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clave anon de Supabase>
```

---

## FASE 2 — SCHEMA SQL

### 2.1 Tablas a importar en Supabase

Importar el archivo `zkhub_backup (1).sql` via **SQL Editor de Supabase**.  
Tablas principales del schema (ya verificadas):

| Tabla | Campos clave |
|---|---|
| `workspaces` | id, nombre, plan, owner_id, logo_url, accent_color, currency |
| `workspace_users` | workspace_id, user_id, rol |
| `users` | id, email, password_hash, nombre, avatar_url, role_title, is_superadmin |
| `contacts` | id, workspace_id, nombre, email, telefono, empresa, etiquetas[], notas, temperatura, folder_id, nicho, dato_relevante, pais, region, maps_url, facebook_url, instagram_url, sitio_web |
| `contact_notes` | id, contact_id, workspace_id, contenido, created_by, created_at |
| `contact_folders` | id, workspace_id, nombre, color, icon, order_index |
| `deals` | id, workspace_id, contact_id, stage_id, titulo, valor, posicion, fecha_cierre, descripcion, prioridad, currency |
| `pipeline_stages` | id, workspace_id, nombre, posicion, color |
| `tasks` | id, workspace_id, text, done, contact_id, due_date, assigned_to, assignee_slot, notes |
| `cobros` | id, workspace_id, deal_id, contact_id, monto_total, moneda, num_pagos, metodo_pago, fecha_primer_pago, frecuencia, estado, notas |
| `cobro_pagos` | id, cobro_id, numero_pago, fecha_vencimiento, fecha_pago, monto, estado |
| `calendar_events` | id, workspace_id, created_by, titulo, tipo, fecha_inicio, fecha_fin, todo_el_dia, contact_id, deal_id |
| `conversations` | id, workspace_id, contact_id, canal, estado, ultimo_mensaje, ultimo_mensaje_at |
| `messages` | id, conversation_id, workspace_id, contenido, direccion, canal, created_by |
| `activity_log` | id, workspace_id, user_id, action, entity_type, entity_id, entity_label, metadata |
| `reminders` | id, workspace_id, created_by, contact_id, deal_id, titulo, fecha_recordatorio, tipo, canal, status |

### 2.2 Ajustes necesarios en Supabase

1. **RLS** — Habilitar Row Level Security en todas las tablas.  
   Política base: `auth.uid() = user_id` para users; `workspace_id = get_current_workspace_id()` para el resto.

2. **Función helper** — Crear en SQL Editor:
```sql
CREATE OR REPLACE FUNCTION get_current_workspace_id()
RETURNS uuid AS $$
  SELECT workspace_id FROM workspace_users 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
```

3. **Auth** — Usar **Supabase Auth** (email/password). La tabla `users` de Fabri usa `password_hash` propio — en v2 usamos `auth.users` de Supabase y mantenemos la tabla `users` solo para el perfil (nombre, avatar_url, role_title).

---

## FASE 3 — ARQUITECTURA NEXT.JS

### 3.1 Estructura de carpetas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx          ← AppLayout con Sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── contacts/page.tsx
│   │   ├── pipeline/page.tsx
│   │   ├── cobros/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── conversations/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx              ← Root layout (QueryClient + CSS)
│   └── globals.css             ← Design system completo
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── app-layout.tsx
│   │   └── mobile-nav.tsx
│   ├── contacts/
│   │   ├── contact-panel.tsx
│   │   ├── contact-form-modal.tsx
│   │   └── contact-list.tsx
│   ├── pipeline/
│   │   ├── pipeline-board.tsx
│   │   ├── deal-card.tsx
│   │   └── deal-panel.tsx
│   ├── tasks/
│   │   ├── kanban-board.tsx
│   │   ├── task-card.tsx
│   │   └── team-view.tsx
│   ├── cobros/
│   │   └── cobros-table.tsx
│   └── ui/
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── toast.tsx
│       └── ...shadcn components mínimos
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← createBrowserClient
│   │   ├── server.ts           ← createServerClient (para server components)
│   │   └── middleware.ts       ← refresh de sesión
│   ├── utils.ts                ← formatCurrency, formatDate, helpers
│   ├── currencies.ts           ← CURRENCIES[], getCurrency(), formatCurrency()
│   └── store.ts                ← Zustand: useAuthStore, useWorkspaceStore
├── hooks/
│   ├── use-contacts.ts
│   ├── use-deals.ts
│   ├── use-tasks.ts
│   ├── use-cobros.ts
│   ├── use-deal.ts             ← useDealDetail, useUpdateDealDetail
│   ├── use-contact-notes.ts    ← useContactNotes, useAddContactNote, useDeleteContactNote
│   ├── use-toast.ts
│   └── use-mobile.tsx
└── utils/
    └── locations.ts            ← COUNTRY_LIST, getRegions(), getRegionLabel()
```

### 3.2 Middleware

`middleware.ts` en raíz del proyecto:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* supabase ssr cookie handling */ } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 3.3 Supabase client

`src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 3.4 QueryClient provider

`src/app/layout.tsx` (root):
```typescript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import './globals.css'

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } }
  }))
  return (
    <html lang="es">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

---

## FASE 4 — SISTEMA DE AUTENTICACIÓN

### 4.1 Login page (`/login`)

Replicar lógica de `pages/login.tsx` de Fabri, adaptada a Supabase Auth:

```typescript
// src/app/(auth)/login/page.tsx
const supabase = createClient()
const { error } = await supabase.auth.signInWithPassword({ email, password })
```

Estilos exactos de Fabri:
- Fondo: `#f5f5f7`
- Card: `#ffffff` con border `#e5e7eb`
- Input class: `auth-page-input` (ver globals.css)
- ZK Red: `#E8193C`
- Logo: `⚡ ZK Hub`

### 4.2 Zustand store

```typescript
// src/lib/store.ts
import { create } from 'zustand'

interface AuthStore {
  user: { id: string; email: string; nombre: string; avatar_url?: string } | null
  setUser: (user: AuthStore['user']) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))

interface WorkspaceStore {
  workspace: { id: string; nombre: string; logo_url?: string; currency: string } | null
  setWorkspace: (ws: WorkspaceStore['workspace']) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspace: null,
  setWorkspace: (workspace) => set({ workspace }),
}))
```

---

## FASE 5 — DESIGN SYSTEM (globals.css)

Copiar **exactamente** el contenido del archivo `zk-crm/src/index.css` de Fabri.  
Es el design system completo — incluye:
- CSS custom properties ZK Brand (`--zk-red`, `--zk-bg-page`, etc.)
- FullCalendar light theme (`.zk-calendar`)
- Mobile fixes, dialog bottom sheets
- Contact Form Modal grid (`.cfm-grid`, `.cfm-full`)
- Deal Form Modal grid (`.dfm-grid`, `.dfm-full`)
- Skeleton shimmer (`.skeleton-shimmer`)
- Custom scrollbars, focus rings, selection color

**Adicionalmente** en `globals.css`, añadir al `body`:
```css
background-color: var(--zk-bg-page); /* #f5f5f7 */
```

> ⚠️ El archivo fuente tiene `@import "tailwindcss"` — ELIMINAR esas líneas, son específicas de Fabri.

---

## FASE 6 — SIDEBAR

Replicar `components/layout/sidebar.tsx` de Fabri.

### Estructura visual
```
┌─────────────────────────┐
│ [Logo ZK]  [Workspace ▼]│ ← workspace switcher
├─────────────────────────┤
│ MAIN                    │
│  Dashboard              │
│  Contactos              │
│  Pipeline               │
│  Cobros                 │
│  Tareas                 │
├─────────────────────────┤
│ HERRAMIENTAS            │
│  Calendario             │
│  Conversaciones         │
├─────────────────────────┤
│ EQUIPO                  │
│  Ajustes                │
├─────────────────────────┤
│ [Avatar] [Nombre]  [→]  │ ← logout
└─────────────────────────┘
```

### Estilos exactos (del sidebar de Fabri)
```css
width: 240px  /* --sidebar-w */
background: var(--zk-sidebar-bg)  /* #ffffff */
border-right: 1px solid var(--zk-sidebar-border)  /* #e5e7eb */
```

Nav item activo:
```css
background: rgba(232,25,60,0.08)
color: #111111
border-left: 2px solid #E8193C
```

### Navegación (rutas Next.js)
```typescript
const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Contactos', icon: Users, href: '/contacts' },
  { label: 'Pipeline', icon: TrendingUp, href: '/pipeline' },
  { label: 'Cobros', icon: CreditCard, href: '/cobros' },
  { label: 'Tareas', icon: CheckSquare, href: '/tasks' },
  { label: 'Calendario', icon: Calendar, href: '/calendar' },
  { label: 'Conversaciones', icon: MessageSquare, href: '/conversations' },
  { label: 'Ajustes', icon: Settings, href: '/settings' },
]
```

Usar `usePathname()` de Next.js en lugar de `useLocation()` de wouter.

### Logout
```typescript
const supabase = createClient()
await supabase.auth.signOut()
router.push('/login')
```

---

## FASE 7 — HOOKS DE DATOS (Supabase)

Cada hook reemplaza las llamadas `customFetch` de Fabri por `@supabase/supabase-js`.  
Todos los hooks usan `@tanstack/react-query`.

### Patrón base

```typescript
// Ejemplo: useContacts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store'

export function useContacts(params?: { search?: string; limit?: number }) {
  const supabase = createClient()
  const { workspace } = useWorkspaceStore()
  
  return useQuery({
    queryKey: ['contacts', workspace?.id, params],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*, deals(id, titulo, valor, stage_id, fecha_cierre)')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false })
      
      if (params?.search) {
        query = query.or(`nombre.ilike.%${params.search}%,email.ilike.%${params.search}%,empresa.ilike.%${params.search}%`)
      }
      if (params?.limit) query = query.limit(params.limit)
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!workspace?.id,
  })
}
```

### Hooks a implementar

| Hook | Tabla principal | Equivalente Fabri |
|---|---|---|
| `useContacts` | contacts | `useGetContacts` |
| `useContact(id)` | contacts | `useGetContact` |
| `useCreateContact` | contacts | `useCreateContact` |
| `useUpdateContact` | contacts | `useUpdateContact` |
| `useDeleteContact` | contacts | `useDeleteContact` |
| `useContactNotes(contactId)` | contact_notes | `useContactNotes` |
| `useAddContactNote` | contact_notes | `useAddContactNote` |
| `useDeleteContactNote` | contact_notes | `useDeleteContactNote` |
| `usePipeline` | deals + pipeline_stages | `useGetPipeline` |
| `useDealDetail(id)` | deals + contacts | `useDealDetail` |
| `useCreateDeal` | deals | `useCreateDeal` |
| `useUpdateDeal` | deals | `useUpdateDeal` |
| `useDeleteDeal` | deals | `useDeleteDeal` |
| `useTasks` | tasks + contacts | `useTasks` |
| `useCreateTask` | tasks | `useCreateTask` |
| `useUpdateTask` | tasks | `useUpdateTask` |
| `useDeleteTask` | tasks | `useDeleteTask` |
| `useCobros` | cobros + cobro_pagos + contacts | `useCobros` |
| `useWorkspace` | workspaces + workspace_users | `useGetWorkspace` |

### Tipos TypeScript

```typescript
// src/lib/types.ts

export interface Contact {
  id: string
  workspace_id: string
  nombre: string
  email: string | null
  telefono: string | null
  empresa: string | null
  etiquetas: string[]
  notas: string | null
  temperatura: 'frio' | 'tibio' | 'caliente'
  folder_id: string | null
  nicho: string | null
  dato_relevante: string | null
  pais: string | null
  region: string | null
  maps_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  sitio_web: string | null
  created_at: string
  deals?: Deal[]
}

export interface Deal {
  id: string
  workspace_id: string
  contact_id: string | null
  stage_id: string | null
  titulo: string
  valor: number
  posicion: number
  fecha_cierre: string | null
  descripcion: string | null
  prioridad: 'low' | 'normal' | 'high'
  currency: string | null
  created_at: string
  contact?: { id: string; nombre: string; empresa: string | null; email: string | null }
  is_overdue?: boolean  // calculado: fecha_cierre < hoy && !ganado
}

export interface PipelineStage {
  id: string
  workspace_id: string
  nombre: string
  posicion: number
  color: string
  deals?: Deal[]
}

export interface Task {
  id: string
  workspace_id: string
  text: string
  done: boolean
  contact_id: string | null
  due_date: string | null
  assigned_to: string | null
  assignee_slot: string | null
  notes: string | null
  created_at: string
  contact?: { id: string; nombre: string; empresa: string | null }
}

export interface Cobro {
  id: string
  workspace_id: string
  deal_id: string | null
  contact_id: string | null
  monto_total: number
  moneda: string
  num_pagos: number
  metodo_pago: string
  fecha_primer_pago: string | null
  frecuencia: string
  estado: string
  notas: string | null
  created_at: string
  contact?: { id: string; nombre: string; empresa: string | null }
  pagos?: CobroPago[]
}

export interface CobroPago {
  id: string
  cobro_id: string
  numero_pago: number
  fecha_vencimiento: string | null
  fecha_pago: string | null
  monto: number
  estado: 'pendiente' | 'pagado' | 'vencido'
  notas: string | null
}
```

---

## FASE 8 — UTILIDADES

### lib/utils.ts

```typescript
import { CURRENCIES } from './currencies'

export function formatCurrency(
  amount: number | null | undefined,
  currencyCode?: string | null
): string {
  if (amount === null || amount === undefined) return '—'
  const currency = CURRENCIES.find(c => c.code === (currencyCode ?? 'USD')) ?? CURRENCIES[0]
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency.symbol}${amount.toLocaleString()}`
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sin fecha'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`
  const m = Math.floor(diff / 2592000)
  return `hace ${m} mes${m > 1 ? 'es' : ''}`
}

const PALETTE = ['#E8193C', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
```

### lib/currencies.ts

Copiar exactamente de `zk-crm/src/lib/currencies.ts`:
```typescript
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano', locale: 'es-MX' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino', locale: 'es-AR' },
] as const
```

### utils/locations.ts

Copiar exactamente de `zk-crm/src/utils/locations.ts` (COUNTRY_LIST, getRegions, getRegionLabel).

---

## FASE 9 — PÁGINAS

### Regla general de migración

Para cada página de Fabri → Next.js:
1. Cambiar `customFetch(...)` por hook de Supabase correspondiente
2. Cambiar `useLocation()` / `navigate()` de wouter por `useRouter()` / `usePathname()` de Next.js
3. Mantener **todos los estilos inline** idénticos
4. Mantener los `--zk-*` CSS custom properties

### 9.1 Dashboard (`/dashboard`)

Replicar `pages/dashboard.tsx`.  
⚠️ **NO usar Recharts**. Reemplazar los gráficos de Recharts por:
- Barras de progreso en CSS puro
- Grids de métricas con `display: grid`
- Tendencias con flechas (↑↓) y colores

Métricas a mostrar (queries Supabase directas):
- Total contactos del workspace
- Deals activos / total valor
- Cobros pendientes
- Tareas sin completar
- Actividad reciente (tabla `activity_log`)

```typescript
// Ejemplo de query para métricas
const { data: stats } = useQuery({
  queryKey: ['dashboard-stats', workspaceId],
  queryFn: async () => {
    const supabase = createClient()
    const [contacts, deals, cobros, tasks] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
      supabase.from('deals').select('id, valor').eq('workspace_id', workspaceId),
      supabase.from('cobros').select('id, monto_total, estado').eq('workspace_id', workspaceId),
      supabase.from('tasks').select('id, done').eq('workspace_id', workspaceId),
    ])
    return {
      totalContactos: contacts.count ?? 0,
      totalDeals: deals.data?.length ?? 0,
      valorPipeline: deals.data?.reduce((s, d) => s + d.valor, 0) ?? 0,
      cobrosPendientes: cobros.data?.filter(c => c.estado === 'pendiente').length ?? 0,
      tareasPendientes: tasks.data?.filter(t => !t.done).length ?? 0,
    }
  }
})
```

### 9.2 Contactos (`/contacts`)

Replicar `pages/contacts.tsx`:
- Lista con búsqueda, filtros por temperatura/carpeta
- Panel lateral `ContactPanel` (420px, border-left)
- Modal `ContactFormModal` (780px desktop, bottom sheet mobile)
- Temperatura quick-switch en panel

### 9.3 Pipeline (`/pipeline`)

Replicar `pages/pipeline.tsx`:
- Tablero Kanban con columnas por stage (drag & drop con `@dnd-kit`)
- Panel lateral `DealPanel` (440px)
- Métricas de pipeline en header
- Modal creación de deal

Drag & drop con `@dnd-kit/core`:
```typescript
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
```

### 9.4 Cobros (`/cobros`)

Replicar `pages/cobros.tsx`:
- Tabla de cobros con estado (pendiente, pagado, vencido)
- Gestión de cuotas (cobro_pagos)
- Modal creación de cobro

### 9.5 Tareas (`/tasks`)

Replicar `pages/tasks.tsx`:
- Vista Kanban: 3 columnas (Por hacer, En progreso, Completado)
- Vista equipo: lista flat
- Drag & drop entre columnas (`@dnd-kit`)
- Sticky note modal para detalle de tarea
- Filtros por tiempo (hoy, semana, mes)

Lanes exactas:
```typescript
const LANES = [
  { key: 'todo', label: 'Por hacer', color: '#6b7280', dot: '#e5e7eb' },
  { key: 'in_progress', label: 'En progreso', color: '#f59e0b', dot: '#f59e0b' },
  { key: 'done', label: 'Completado', color: '#10b981', dot: '#10b981' },
]
```

> ⚠️ La tabla `tasks` no tiene columna `lane` — mapear por `done`:  
> `done=false` → 'todo' (o 'in_progress' si tiene `assignee_slot`)  
> `done=true` → 'done'  
> El drag & drop actualiza el campo `done` y `assignee_slot`.

### 9.6 Calendario (`/calendar`)

Usar `@fullcalendar/react`. Replicar estilos `.zk-calendar` del globals.css.

```typescript
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
```

Datos: tabla `calendar_events` filtrada por `workspace_id`.

### 9.7 Conversaciones (`/conversations`)

Layout: lista izquierda (conversaciones) + panel derecho (mensajes).  
Tablas: `conversations` + `messages`.  
Replicar `pages/conversations.tsx` de Fabri.

### 9.8 Ajustes (`/settings`)

- Perfil del usuario (nombre, avatar)
- Workspace (nombre, logo, currency)
- Miembros del equipo (workspace_users)

---

## FASE 10 — COMPONENTES CRÍTICOS

### ContactPanel

Copiar `components/contacts/contact-panel.tsx` de Fabri.  
Adaptar:
- `useGetContact` → `useContact(id)` de Supabase hook
- `customFetch('/api/contacts/:id/conversations')` → query directa a `conversations` table
- `useLocation()` → `useRouter()` de Next.js
- Mantener todos los estilos inline idénticos

### ContactFormModal

Copiar `components/contacts/contact-form-modal.tsx` de Fabri.  
Adaptar:
- `useCreateContact` / `useUpdateContact` → hooks Supabase
- `zodResolver` + `react-hook-form` → mantener exactamente igual
- Schema de validación → mantener exactamente igual

### DealPanel

Copiar `components/pipeline/deal-panel.tsx` de Fabri.  
Adaptar:
- `useDealDetail` / `useUpdateDealDetail` / `useDeleteDeal` → hooks Supabase
- `useGetPipeline` → `usePipeline()` Supabase
- `useGetContacts` → `useContacts()` Supabase
- Mantener todos los estilos inline idénticos

---

## REGLAS DE IMPLEMENTACIÓN

### ✅ Siempre
- `workspace_id` en TODOS los INSERTs a Supabase
- Bordes: `0.8px solid var(--zk-border)` (no 1px) en cards
- Fondo de página: `var(--zk-bg-page)` = `#f5f5f7`
- Fondo de cards: `var(--zk-bg-card)` = `#ffffff`
- Font: `Inter` (ya incluida en globals.css)
- ZK Red: `#E8193C` para elementos activos/primarios
- Supabase siempre con `createClient()` del browser client
- `useWorkspaceStore` para obtener `workspace.id` en hooks

### ❌ Nunca
- No usar Recharts
- No usar Tailwind
- No usar wouter
- No usar `@workspace/api-client-react`
- No persistir métricas calculadas en BBDD
- No crear tablas nuevas sin consultar el schema

### 🔄 Patrón de invalidación de queries

Después de cualquier mutación:
```typescript
queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] })
queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspaceId] })
```

---

## ORDEN DE IMPLEMENTACIÓN

```
FASE 1  → Setup proyecto + dependencias
FASE 2  → Importar SQL a Supabase + políticas RLS
FASE 3  → Middleware + Supabase client + QueryClient
FASE 4  → Autenticación (login, store, sesión)
FASE 5  → globals.css (design system completo)
FASE 6  → Sidebar + AppLayout + MobileNav
FASE 7  → Hooks de datos (todos los useQuery/useMutation)
FASE 8  → Utilidades (formatCurrency, helpers)
FASE 9  → Dashboard (sin recharts)
FASE 10 → Contactos + ContactPanel + ContactFormModal
FASE 11 → Pipeline + DealPanel + drag & drop
FASE 12 → Cobros
FASE 13 → Tareas + Kanban
FASE 14 → Calendario (FullCalendar)
FASE 15 → Conversaciones
FASE 16 → Ajustes
```

---

## CRITERIO DE ÉXITO

- [ ] Login funciona con Supabase Auth
- [ ] Dashboard muestra métricas reales del workspace
- [ ] Contacts CRUD completo con panel y modal
- [ ] Pipeline Kanban con drag & drop funcional
- [ ] Cobros con gestión de cuotas
- [ ] Tareas Kanban con filtros
- [ ] Calendario con FullCalendar
- [ ] Sidebar con navegación activa correcta
- [ ] Todo en tema claro, fondo `#f5f5f7`
- [ ] Responsive (sidebar en desktop, bottom nav en mobile)
