-- ═══════════════════════════════════════════════════════════════════════════
-- STICK FRAME SAAS — MIGRATION: 20260609_auth_trigger.sql
-- Gatilho de Sincronização Automatizada (auth.users ➔ public.usuarios)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  -- Tenta converter o empresa_id dos metadados de cadastro
  BEGIN
    v_empresa_id := (new.raw_user_meta_data->>'empresa_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_empresa_id := NULL;
  END;

  -- Se não vier uma empresa válida nos metadados, busca a primeira cadastrada 
  -- para evitar violação de NOT NULL FK na tabela public.usuarios
  IF v_empresa_id IS NULL THEN
    SELECT id INTO v_empresa_id FROM public.empresas LIMIT 1;
  END IF;

  INSERT INTO public.usuarios (id, empresa_id, nome, perfil, ativo)
  VALUES (
    new.id, 
    v_empresa_id, 
    COALESCE(new.raw_user_meta_data->>'nome', 'Novo Usuário'), 
    COALESCE(new.raw_user_meta_data->>'perfil', 'comercial'), 
    true
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    nome = EXCLUDED.nome,
    perfil = EXCLUDED.perfil,
    empresa_id = EXCLUDED.empresa_id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger se já existir para evitar conflitos de recriação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
