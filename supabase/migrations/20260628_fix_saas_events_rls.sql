-- saas_events: política de INSERT usava auth.users.raw_user_meta_data->>'empresa_id'
-- (NULL para 5/6 usuários reais) → todo insert bloqueado silenciosamente → telemetria
-- growth vazia. Alinhado a get_empresa_id() (public.usuarios), convenção do app.
-- Aplicado via apply_migration fix_saas_events_rls_get_empresa_id.
drop policy if exists saas_events_insert_own on public.saas_events;
create policy saas_events_insert_own on public.saas_events for insert
  with check (empresa_id = get_empresa_id());
drop policy if exists saas_events_select_own on public.saas_events;
create policy saas_events_select_own on public.saas_events for select
  using (empresa_id = get_empresa_id() or auth.email() = 'admin@stickframe.com.br');
