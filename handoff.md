# HANDOFF CLAUDE CODE — ZK Hub v2
> **Fecha:** 2026-05-21  
> **Entorno:** Antigravity (Diseño & Planificación) → Claude Code (Construcción)  
> **Proyecto:** `zk-hub-v2` (Next.js 16 + Supabase)  
> **Propósito:** Resolver problemas críticos de sesión persistente, implementar conversión de divisas en el Dashboard y asegurar fidelidad visual 1:1.

---

## 1. INCIDENTE CRÍTICO: Persistencia de Sesión (Zustand + Supabase)

### Causa Raíz
El estado de autenticación (`User`) y el `Workspace` actual se gestionan a través de una store de Zustand (`src/lib/store.ts`). Al cerrar sesión e iniciarla, o al hacer un refresh manual de la página (F5), el estado del cliente se borra por completo (`user: null`, `workspace: null`).
Como los hooks de React Query tienen el activador `enabled: !!workspaceId`, al ser `null` las consultas a Supabase nunca se ejecutan, dejando la aplicación vacía ("no aparecen los datos").

### Solución Diseñada
Debemos implementar un **`SessionInitializer`** global en el cliente (dentro de `providers.tsx` o como un componente en el Layout raíz) que detecte de forma proactiva la sesión de Supabase Auth, recupere el perfil y el workspace del usuario, y pueble el Zustand store antes de que el resto del layout renderice su UI.

#### Componentes a Crear / Modificar:

##### 1. [NEW] `src/components/layout/session-initializer.tsx`
Un componente cliente que cargue la sesión y el workspace del usuario:
- Llama a `supabase.auth.onAuthStateChange` para reaccionar ante cambios de sesión.
- Si existe una sesión activa:
  1. Consulta la tabla `users` para obtener el perfil: `id, email, nombre, avatar_url, role_title`.
  2. Consulta la tabla `workspace_users` con un join a `workspaces` para obtener el workspace: `workspace_id, workspaces(id, nombre, logo_url, currency, plan)`.
  3. Ejecuta `setUser(...)` y `setWorkspace(...)` en las stores de Zustand.
- Muestra una **pantalla de carga premium** (un spinner elegante con el logo de ZK y un skeleton shimmer de fondo) mientras el estado `loading` del inicializador sea `true`.

```typescript
// Estructura sugerida para session-initializer.tsx
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
        // 1. Obtener perfil
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, nombre, avatar_url, role_title')
          .eq('id', sessionUser.id)
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
            id: sessionUser.id,
            email: sessionUser.email,
            nombre: sessionUser.email.split('@')[0],
          })
        }

        // 2. Obtener workspace
        const { data: wu } = await supabase
          .from('workspace_users')
          .select('workspace_id, workspaces(id, nombre, logo_url, currency, plan)')
          .eq('user_id', sessionUser.id)
          .limit(1)
          .single()

        if (wu?.workspaces) {
          const ws = wu.workspaces as any
          setWorkspace({
            id: ws.id,
            nombre: ws.nombre,
            logo_url: ws.logo_url,
            currency: ws.currency ?? 'USD',
            plan: ws.plan,
          })
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
```

##### 2. [MODIFY] `src/app/providers.tsx`
Integrar `SessionInitializer` envolviendo el árbol de componentes después de `QueryClientProvider` para que todos los Server y Client Components tengan acceso al estado cargado.

---

## 2. MEJORA DE NEGOCIO: Conversión de Divisas en el Dashboard Principal

### Causa Raíz
Actualmente, los deals de un workspace pueden registrarse en diferentes monedas (USD, EUR, MXN, ARS, etc.). En el Dashboard, los widgets calculan los totales agregando los importes de forma cruda (`dealsData.reduce((sum, d) => sum + parseFloat(d.valor), 0)`), mezclando divisas sin conversión previa.

### Solución Diseñada
Debemos implementar una conversión dinámica en el lado del cliente utilizando la tasa de cambio provista por la API Frankfurter (o el fallback Open ER API) ya instalada en `CurrencyConverter.tsx`.

#### Pasos de Implementación para Claude Code:

##### 1. [NEW] `src/hooks/use-exchange-rates.ts`
Crear un hook global que obtenga y comparta las tasas de cambio de Frankfurter API, utilizando react-query para persistir en caché y optimizar peticiones:

```typescript
import { useQuery } from '@tanstack/react-query'

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      try {
        const res = await fetch("https://api.frankfurter.app/latest?from=USD")
        if (!res.ok) throw new Error("API error")
        const data = await res.json()
        return { ...data.rates, USD: 1 } as Record<string, number>
      } catch {
        const res2 = await fetch("https://open.er-api.com/v6/latest/USD")
        const data2 = await res2.json()
        return data2.rates as Record<string, number>
      }
    },
    staleTime: 12 * 60 * 60 * 1000, // 12 horas de caché
  })
}
```

##### 2. [MODIFY] Modificar las Consultas SQL en `src/hooks/use-dashboard.ts`
Asegurarse de incluir el campo `currency` (o `moneda`) en todas las selecciones de deals de Supabase:
- En `useDashboardMetrics`:
  ```typescript
  supabase.from('deals').select('id, created_at, valor, currency, stage_id')
  ```
- En `useDashboardPipelineSummary`:
  ```typescript
  supabase.from('deals').select('stage_id, valor, currency')
  ```
- En `useDashboardDealsOverTime`:
  ```typescript
  supabase.from('deals').select('created_at, valor, currency')
  ```
- En `useDashboardAttention` (overdue deals):
  ```typescript
  supabase.from('deals').select('id, titulo, valor, currency, fecha_cierre, stage_id, contact_id')
  ```

##### 3. [MODIFY] Aplicar la lógica de Conversión en los Hooks
En cada una de las funciones del hook `use-dashboard.ts`, integrar el cálculo de tipo de cambio.
- Definir un helper de conversión cliente:
  ```typescript
  export function convertAmount(amount: number, from: string, to: string, rates: Record<string, number>): number {
    const fromRate = rates[from]
    const toRate = rates[to]
    if (!fromRate || !toRate) return amount
    return (amount / fromRate) * toRate
  }
  ```
- El hook recibirá opcionalmente las tasas (`rates`) o la conversión se realizará de manera reactiva en el componente cliente (Dashboard) usando las tasas cargadas.
- **Recomendado:** Realizar la conversión en el Dashboard Component (`src/app/(app)/dashboard/page.tsx`) llamando al hook `useExchangeRates` y procesando los datos devueltos por `useDashboardMetrics` etc., asegurando que los importes se muestren 100% convertidos al `workspaceCurrency` configurado en el workspace del usuario.

---

## 3. MEJORA VISUAL & ESTILOS: Configuración Tailwind CSS v4 + PostCSS

### Problema
El usuario indica que visualmente se ve roto y faltan detalles. Esto suele ocurrir cuando Tailwind CSS v4 no está procesando correctamente las clases utilitarias o entra en conflicto con las variables personalizadas de CSS de Fabri en `globals.css`.

### Instrucción para Claude Code:
1. **Validación de PostCSS**: Revisar `postcss.config.mjs` y `tailwind.config.ts`.
2. **globals.css Saneado**: Asegurarse de que no existan directivas duplicadas. El archivo `globals.css` debe importar correctamente Tailwind v4 y definir los colores base bajo las variables CSS correspondientes (`--zk-red`, `--zk-bg-page`, etc.).
3. **Revisar Fuentes**: La tipografía `Inter` debe renderizarse suavemente en todos los navegadores mediante:
   ```css
   body {
     font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
     background-color: var(--zk-bg-page);
     color: var(--zk-text-primary);
     -webkit-font-smoothing: antialiased;
   }
   ```
4. **Verificación visual del Layout**: Validar la visualización responsiva del Sidebar y del Dashboard en dispositivos móviles y de escritorio.

---

## 4. CRITERIOS DE ACEPTACIÓN PARA CLAUDE CODE
1. **Inicio y Cierre Limpio**: Al refrescar la página en cualquier ruta (`/dashboard`, `/contacts`, etc.), el usuario no debe ser redirigido a `/login` si tiene sesión activa en Supabase Auth, y sus datos reales deben cargarse en pantalla tras un breve estado de carga premium.
2. **Dashboard Multi-divisa**: El "Valor pipeline" y el gráfico de deals del Dashboard deben calcular el acumulado convirtiendo los valores reales de cada deal (ej: pesos MXN a dólares USD, según el workspace) aplicando las tasas reales del Frankfurter API.
3. **Build Exitoso**: La aplicación debe compilar con `npm run build` sin errores de TypeScript ni advertencias fatales de PostCSS.

---
**Entorno:** Antigravity | ID de sesión: 2026-05-21-AG-03 | Cierre: listo para construcción.

## FEATURE: Reconexión de Formularios de Creación

**Descripción:**
Los botones de 'Nuevo...' en la interfaz están visualmente presentes pero desconectados lógicamente de los modales y estados. Además, las mutaciones de los hooks no están protegidas contra pérdida de sesión.

**Componentes a Construir/Modificar:**

1. **Hooks de Supabase (use-contacts.ts, use-deals.ts, use-cobros.ts, use-tasks.ts):**
   - Modificar la mutationFn de las funciones de creación (ej. useCreateContact).
   - Comprobar que workspace?.id exista. Si no, lanzar un error o retornar tempranamente, evitando el uso inseguro de workspace!.id.

2. **Contactos (contacts/page.tsx):**
   - Crear estado const [isModalOpen, setIsModalOpen] = useState(false).
   - Conectar botón 'Nuevo contacto' a setIsModalOpen(true).
   - Importar y renderizar <ContactFormModal /> al final del componente.

3. **Pipeline/Deals (pipeline/page.tsx y nuevo modal):**
   - Crear src/components/pipeline/deal-form-modal.tsx basado en el estilo de ContactFormModal.
   - Manejar el estado del modal en pipeline/page.tsx (ej. const [dealModalStage, setDealModalStage] = useState<string | null>(null)).
   - Conectar el botón 'Nuevo deal' del header (abrir modal con stage vacío).
   - Conectar el onAddDeal de KanbanColumn (abrir modal con stage pre-seleccionado).

4. **Cobros (cobros/page.tsx y nuevo modal):**
   - Crear src/components/cobros/cobro-form-modal.tsx.
   - Conectar el botón de 'Nuevo cobro' a la apertura del modal en cobros/page.tsx.

5. **Tareas (	asks/page.tsx):**
   - En la vista de lista (iewMode === 'team'), actualmente no existe el input para agregar tareas.
   - Añadir el mismo input inline de texto que se usa en la vista Kanban (columna 'todo'), pero ubicado al inicio de la vista de lista.

**Restricciones de Diseño:**

- Los nuevos modales deben seguir la misma estética visual de Tailwind + CSS nativo que tiene ContactFormModal.
- Usar useCreateX() para ejecutar las mutaciones, y cerrando el modal solo en el onSuccess del hook.

**Criterio de Aceptación:**
El usuario puede hacer clic en los botones de 'Nuevo...' en cualquier de las 4 páginas, se abre el modal correspondiente (o input de tarea), y al enviar el formulario la data persiste en Supabase sin crashear.

## FEATURE: Módulos Pendientes y Paridad de Base de Datos (Fase Final)

**Descripción:**
Claude Code debe completar la reconstrucción de los módulos faltantes (Cobros, Tareas, Calendario, Conversaciones) y la adición de los campos faltantes a los formularios existentes, asegurando una paridad visual y funcional 1:1 con el código base legado (Fabri).

**Componentes a Construir/Modificar:**

1. **Formularios (Contacts, Deals, Cobros):**
   - Actualizar los modales (`contact-form-modal.tsx`, `deal-form-modal.tsx`, `cobro-form-modal.tsx`) para incluir campos faltantes y detalles.

2. **Cobros (`src/app/(app)/cobros/page.tsx`):**
   - Refactorizar a Grid Table y añadir Sidebar lateral `CobroPanel` (ver Fabri).

3. **Tareas (`src/app/(app)/tasks/page.tsx`):**
   - Refactorizar Lanes a equipos y construir `StickyNoteModal`.

4. **Calendario y Conversaciones:**
   - Crear desde cero basándose en Fabri (implementando FullCalendar y la Bandeja de Entrada).

**Restricciones de Diseño:**
- Seguir las clases de Tailwind y estilos CSS nativos presentes en el código de Fabri. El diseño visual debe ser idéntico al de Fabri.

**Criterio de Aceptación:**
Claude Code aplicará todos los fixes de la auditoría reportada en `implementation_plan.md` y asegurará compilación exitosa (0 errores de TS).
