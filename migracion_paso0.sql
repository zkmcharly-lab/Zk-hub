ALTER TABLE public.cobros 
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'desarrollo'
CHECK (tipo IN ('desarrollo', 'mantenimiento'));

CREATE TABLE IF NOT EXISTS public.proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'web',
  fase_actual INTEGER DEFAULT 1 CHECK (fase_actual BETWEEN 1 AND 6),
  porcentaje INTEGER DEFAULT 0 CHECK (porcentaje BETWEEN 0 AND 100),
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo','pausado','entregado')),
  resumen TEXT,
  proximos_pasos TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proyecto_fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE CASCADE NOT NULL,
  numero_fase INTEGER NOT NULL CHECK (numero_fase BETWEEN 1 AND 6),
  nombre_fase TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_progreso','completada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proyecto_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_id UUID REFERENCES public.proyecto_fases(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID NOT NULL,
  descripcion TEXT NOT NULL,
  responsable TEXT DEFAULT 'global',
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_progreso','completada')),
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyecto_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyecto_tareas ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas (el filtrado por workspace_id lo hace la aplicación cliente)
CREATE POLICY "RLS proyectos" ON public.proyectos FOR ALL TO authenticated USING (true);
CREATE POLICY "RLS proyecto_fases" ON public.proyecto_fases FOR ALL TO authenticated USING (true);
CREATE POLICY "RLS proyecto_tareas" ON public.proyecto_tareas FOR ALL TO authenticated USING (true);

-- Insertar fases automáticamente al crear proyecto
CREATE OR REPLACE FUNCTION public.inicializar_fases_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.proyecto_fases (proyecto_id, numero_fase, nombre_fase, estado)
  VALUES
    (NEW.id, 1, 'Diagnóstico', 'en_progreso'),
    (NEW.id, 2, 'Diseño', 'pendiente'),
    (NEW.id, 3, 'Build', 'pendiente'),
    (NEW.id, 4, 'Validación', 'pendiente'),
    (NEW.id, 5, 'Entrega', 'pendiente'),
    (NEW.id, 6, 'Soporte', 'pendiente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_proyecto_created
  AFTER INSERT ON public.proyectos
  FOR EACH ROW EXECUTE FUNCTION public.inicializar_fases_proyecto();
