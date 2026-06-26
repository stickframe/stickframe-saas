-- Correção de RLS da ia_config
-- A política original comparava empresa_id = auth.uid() (id do USUÁRIO), o que
-- nunca bate com o empresa_id real e bloqueava silenciosamente todo insert/update
-- de configuração de IA (chave OpenAI, WABA, etc.). Alinha com get_empresa_id(),
-- a mesma convenção das demais tabelas multi-tenant.
drop policy if exists empresa_ia_config on public.ia_config;
create policy empresa_ia_config on public.ia_config for all
  using (empresa_id = get_empresa_id())
  with check (empresa_id = get_empresa_id());
