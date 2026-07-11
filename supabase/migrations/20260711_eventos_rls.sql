-- 
-- StickFrame Phase 3 - StickFlow & Eventos RLS and Security Policies Migration
-- 

-- 1. Helper function para obter o cliente_id do usuário logado (via e-mail)
CREATE OR REPLACE FUNCTION public.get_cliente_id()
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (
    SELECT c.id 
    FROM public.clientes c
    JOIN auth.users u ON u.email = c.email
    WHERE u.id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- 2. Habilitar RLS na tabela public.stickflow
ALTER TABLE public.stickflow ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stickflow_select" ON public.stickflow;
DROP POLICY IF EXISTS "stickflow_insert" ON public.stickflow;
DROP POLICY IF EXISTS "stickflow_update" ON public.stickflow;
DROP POLICY IF EXISTS "stickflow_delete" ON public.stickflow;

-- Políticas de acesso para stickflow
CREATE POLICY "stickflow_select" ON public.stickflow
  FOR SELECT USING (
    empresa_id = get_empresa_id() AND (
      is_funcionario() OR 
      cliente_id = get_cliente_id()
    )
  );

CREATE POLICY "stickflow_insert" ON public.stickflow
  FOR INSERT WITH CHECK (
    empresa_id = get_empresa_id() AND is_funcionario()
  );

CREATE POLICY "stickflow_update" ON public.stickflow
  FOR UPDATE USING (
    empresa_id = get_empresa_id() AND is_funcionario()
  ) WITH CHECK (
    empresa_id = get_empresa_id() AND is_funcionario()
  );

CREATE POLICY "stickflow_delete" ON public.stickflow
  FOR DELETE USING (
    empresa_id = get_empresa_id() AND is_diretor()
  );


-- 3. Habilitar RLS na tabela public.stickflow_eventos
ALTER TABLE public.stickflow_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stickflow_eventos_select" ON public.stickflow_eventos;
DROP POLICY IF EXISTS "stickflow_eventos_insert" ON public.stickflow_eventos;
DROP POLICY IF EXISTS "stickflow_eventos_update" ON public.stickflow_eventos;
DROP POLICY IF EXISTS "stickflow_eventos_delete" ON public.stickflow_eventos;

-- Políticas de acesso para stickflow_eventos
CREATE POLICY "stickflow_eventos_select" ON public.stickflow_eventos
  FOR SELECT USING (
    empresa_id = get_empresa_id() AND (
      is_funcionario() OR (
        stickflow_id IN (SELECT id FROM public.stickflow WHERE cliente_id = get_cliente_id()) AND 
        visibilidade IN ('CLIENTE', 'PUBLICO')
      )
    )
  );

CREATE POLICY "stickflow_eventos_insert" ON public.stickflow_eventos
  FOR INSERT WITH CHECK (
    empresa_id = get_empresa_id() AND is_funcionario()
  );

-- Bloquear atualizações e exclusões de eventos (Timeline é imutável para auditoria)
CREATE POLICY "stickflow_eventos_update" ON public.stickflow_eventos FOR UPDATE USING (false);
CREATE POLICY "stickflow_eventos_delete" ON public.stickflow_eventos FOR DELETE USING (false);
