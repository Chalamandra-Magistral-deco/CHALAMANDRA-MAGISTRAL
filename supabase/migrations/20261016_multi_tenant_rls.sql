-- 1. Asegurar que la columna tenant_id existe en las tablas críticas del ecosistema
ALTER TABLE IF EXISTS public.user_metrics 
ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT auth.uid();

ALTER TABLE IF EXISTS public.srap_diagnostics 
ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT auth.uid();

-- 2. Habilitar Row Level Security (RLS) en las tablas
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srap_diagnostics ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de aislamiento estricto para user_metrics
CREATE POLICY "Aislamiento de metricas por tenant" ON public.user_metrics
    FOR ALL
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());

-- 4. Crear políticas de aislamiento estricto para srap_diagnostics
CREATE POLICY "Aislamiento de diagnosticos por tenant" ON public.srap_diagnostics
    FOR ALL
    USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());
