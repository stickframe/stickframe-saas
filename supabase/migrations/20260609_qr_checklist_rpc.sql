-- ═══════════════════════════════════════════════════════════════════════════
-- STICK FRAME SAAS — MIGRATION: 20260609_qr_checklist_rpc.sql
-- Funções RPC de Acesso ao Checklist de Obras (Acesso via QR Code Canteiro)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. BUSCA DE ITENS DE CHECKLIST DA OBRA (Anônimo via Token/Obra ID)
CREATE OR REPLACE FUNCTION public.qr_get_checklist(p_obra_id uuid)
RETURNS SETOF public.checklists_sf
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.checklists_sf
  WHERE obra_id = p_obra_id;
$$;

-- 2. GRAVAÇÃO/ATUALIZAÇÃO DE ITENS DE CHECKLIST DA OBRA (Anônimo via Token/Obra ID)
CREATE OR REPLACE FUNCTION public.qr_save_checklist_item(
  p_obra_id uuid,
  p_etapa text,
  p_item text,
  p_status text,
  p_obs text
)
RETURNS public.checklists_sf
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_empresa_id uuid;
  v_result public.checklists_sf;
BEGIN
  -- Obtém a empresa_id correspondente à obra
  SELECT empresa_id INTO v_empresa_id FROM public.obras WHERE id = p_obra_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Obra com ID % não encontrada.', p_obra_id;
  END IF;

  INSERT INTO public.checklists_sf (
    obra_id, 
    empresa_id, 
    etapa, 
    item, 
    status, 
    obs, 
    updated_at
  )
  VALUES (
    p_obra_id, 
    v_empresa_id, 
    p_etapa, 
    p_item, 
    p_status, 
    p_obs, 
    now()
  )
  ON CONFLICT (obra_id, etapa, item) 
  DO UPDATE SET 
    status = EXCLUDED.status,
    obs = EXCLUDED.obs,
    updated_at = EXCLUDED.updated_at
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;
