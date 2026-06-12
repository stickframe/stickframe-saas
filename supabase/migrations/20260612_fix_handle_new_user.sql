-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: handle_new_user — remove fallback perigoso de empresa
--
-- Bug: quando o auth user era criado sem metadados (fluxo cadastrar-empresa
-- antigo), o trigger caía em `SELECT id FROM empresas LIMIT 1` e vinculava
-- o novo usuário a uma empresa ARBITRÁRIA do banco (vazamento multi-tenant).
-- Depois, o INSERT correto da edge function falhava com chave duplicada,
-- deixando o usuário preso na empresa errada como "Novo Usuário"/comercial
-- e uma empresa órfã para trás.
--
-- Correção: sem empresa_id válido nos metadados, o trigger NÃO insere nada.
-- A criação da linha em public.usuarios passa a ser responsabilidade do
-- fluxo de cadastro (cadastrar-empresa / invite-user), que agora passa
-- os metadados completos no createUser.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  BEGIN
    v_empresa_id := (new.raw_user_meta_data->>'empresa_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_empresa_id := NULL;
  END;

  IF v_empresa_id IS NULL THEN
    RETURN new;
  END IF;

  INSERT INTO public.usuarios (id, empresa_id, nome, perfil, ativo)
  VALUES (
    new.id,
    v_empresa_id,
    COALESCE(new.raw_user_meta_data->>'nome', 'Novo Usuário'),
    COALESCE(new.raw_user_meta_data->>'perfil', 'comercial'),
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
