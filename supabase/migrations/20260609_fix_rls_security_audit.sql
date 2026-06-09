-- ═══════════════════════════════════════════════════════════════════════════
-- STICK FRAME SAAS — MIGRATION: 20260609_fix_rls_security_audit.sql
-- Correção de Recursão RLS + Endurecimento de Políticas de Autorização (RBAC)
-- Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. CORREÇÃO DE RECURSÃO INFINITA (get_empresa_id)
-- Modificamos a função para rodar com SECURITY DEFINER de modo que o RLS seja ignorado na leitura da tabela usuarios
CREATE OR REPLACE FUNCTION public.get_empresa_id()
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (
    SELECT empresa_id 
    FROM public.usuarios 
    WHERE id = auth.uid()
  );
END;
$$;

-- 2. RESET GERAL DE POLÍTICAS EXISTENTES (Evita duplicados ou colisões)
DROP POLICY IF EXISTS "empresas_rls" ON public.empresas;
DROP POLICY IF EXISTS "usuarios_rls" ON public.usuarios;
DROP POLICY IF EXISTS "clientes_rls" ON public.clientes;
DROP POLICY IF EXISTS "obras_rls" ON public.obras;
DROP POLICY IF EXISTS "orcamentos_rls" ON public.orcamentos;
DROP POLICY IF EXISTS "contratos_rls" ON public.contratos;
DROP POLICY IF EXISTS "financeiro_rls" ON public.financeiro;
DROP POLICY IF EXISTS "medicoes_rls" ON public.medicoes;
DROP POLICY IF EXISTS "diario_rls" ON public.diario;
DROP POLICY IF EXISTS "arquivos_rls" ON public.arquivos;
DROP POLICY IF EXISTS "eventos_rls" ON public.eventos;
DROP POLICY IF EXISTS "historico_rls" ON public.historico;
DROP POLICY IF EXISTS "notificacoes_rls" ON public.notificacoes;

-- 3. DECLARAÇÃO AUXILIAR DE VERIFICAÇÃO DE PERFIL DE FUNCIONÁRIO (Evita repetições no RLS)
CREATE OR REPLACE FUNCTION public.is_funcionario()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.usuarios 
    WHERE id = auth.uid() 
      AND perfil IN ('diretor', 'comercial', 'engenheiro', 'financeiro')
      AND ativo = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_diretor()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.usuarios 
    WHERE id = auth.uid() 
      AND perfil = 'diretor'
      AND ativo = true
  );
END;
$$;

-- 4. APLICAÇÃO DE POLÍTICAS ENDURECIDAS (TABELA POR TABELA)

-- ── TABELA: empresas ──────────────────────────────────────────────────────────
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresas_select" ON public.empresas
  FOR SELECT USING (id = get_empresa_id());

CREATE POLICY "empresas_update" ON public.empresas
  FOR UPDATE USING (id = get_empresa_id() AND is_diretor())
  WITH CHECK (id = get_empresa_id() AND is_diretor());

CREATE POLICY "empresas_delete" ON public.empresas
  FOR DELETE USING (id = get_empresa_id() AND is_diretor());

-- ── TABELA: usuarios ──────────────────────────────────────────────────────────
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select" ON public.usuarios
  FOR SELECT USING (empresa_id = get_empresa_id());

CREATE POLICY "usuarios_insert" ON public.usuarios
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_diretor());

CREATE POLICY "usuarios_update" ON public.usuarios
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_diretor())
  WITH CHECK (empresa_id = get_empresa_id() AND is_diretor());

CREATE POLICY "usuarios_delete" ON public.usuarios
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: clientes ──────────────────────────────────────────────────────────
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "clientes_insert" ON public.clientes
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "clientes_update" ON public.clientes
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_funcionario())
  WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "clientes_delete" ON public.clientes
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: obras ─────────────────────────────────────────────────────────────
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obras_select" ON public.obras
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "obras_insert" ON public.obras
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "obras_update" ON public.obras
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_funcionario())
  WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "obras_delete" ON public.obras
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: orcamentos ─────────────────────────────────────────────────────────
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orcamentos_select" ON public.orcamentos
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "orcamentos_insert" ON public.orcamentos
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "orcamentos_update" ON public.orcamentos
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_funcionario())
  WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "orcamentos_delete" ON public.orcamentos
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: contratos ──────────────────────────────────────────────────────────
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contratos_select" ON public.contratos
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "contratos_insert" ON public.contratos
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "contratos_update" ON public.contratos
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_funcionario())
  WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "contratos_delete" ON public.contratos
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: financeiro ─────────────────────────────────────────────────────────
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financeiro_select" ON public.financeiro
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "financeiro_insert" ON public.financeiro
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "financeiro_update" ON public.financeiro
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_funcionario())
  WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "financeiro_delete" ON public.financeiro
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: medicoes ───────────────────────────────────────────────────────────
ALTER TABLE public.medicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medicoes_select" ON public.medicoes
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "medicoes_insert" ON public.medicoes
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "medicoes_update" ON public.medicoes
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_funcionario())
  WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "medicoes_delete" ON public.medicoes
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: diario ────────────────────────────────────────────────────────────
ALTER TABLE public.diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diario_select" ON public.diario
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "diario_insert" ON public.diario
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "diario_update" ON public.diario
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_funcionario())
  WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "diario_delete" ON public.diario
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: arquivos ──────────────────────────────────────────────────────────
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arquivos_select" ON public.arquivos
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "arquivos_insert" ON public.arquivos
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "arquivos_update" ON public.arquivos
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_funcionario())
  WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "arquivos_delete" ON public.arquivos
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: eventos ───────────────────────────────────────────────────────────
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eventos_select" ON public.eventos
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "eventos_insert" ON public.eventos
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "eventos_update" ON public.eventos
  FOR UPDATE USING (empresa_id = get_empresa_id() AND is_funcionario())
  WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "eventos_delete" ON public.eventos
  FOR DELETE USING (empresa_id = get_empresa_id() AND is_diretor());

-- ── TABELA: historico ─────────────────────────────────────────────────────────
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historico_select" ON public.historico
  FOR SELECT USING (empresa_id = get_empresa_id() AND is_funcionario());

CREATE POLICY "historico_insert" ON public.historico
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id() AND is_funcionario());

-- Histórico não deve ser editado ou excluído por ninguém por fins de auditoria
CREATE POLICY "historico_no_update" ON public.historico FOR UPDATE USING (false);
CREATE POLICY "historico_no_delete" ON public.historico FOR DELETE USING (false);

-- ── TABELA: notificacoes ──────────────────────────────────────────────────────
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificacoes_select" ON public.notificacoes
  FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "notificacoes_update" ON public.notificacoes
  FOR UPDATE USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "notificacoes_delete" ON public.notificacoes
  FOR DELETE USING (usuario_id = auth.uid());
