-- ── obra_membros: RBAC por obra ───────────────────────────────────────────────
-- nivel: 'visualizador' = leitura, 'colaborador' = editar conteúdo, 'responsavel' = editar obra + gerenciar membros
create table if not exists public.obra_membros (
  id           uuid primary key default gen_random_uuid(),
  obra_id      uuid not null references public.obras(id) on delete cascade,
  usuario_id   uuid not null references public.usuarios(id) on delete cascade,
  nivel        text not null default 'colaborador'
                 check (nivel in ('visualizador', 'colaborador', 'responsavel')),
  adicionado_por uuid references public.usuarios(id),
  created_at   timestamptz not null default now(),
  unique (obra_id, usuario_id)
);

alter table public.obra_membros enable row level security;

-- Somente membros da mesma empresa podem ver/gerenciar
create policy "empresa_own" on public.obra_membros
  using (
    exists (
      select 1 from public.obras o
      join public.usuarios u on u.empresa_id = o.empresa_id
      where o.id = obra_id and u.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.obras o
      join public.usuarios u on u.empresa_id = o.empresa_id
      where o.id = obra_id and u.id = auth.uid()
    )
  );

create index on public.obra_membros (obra_id);
create index on public.obra_membros (usuario_id);

-- Helper: retorna o nivel do user atual em uma obra (null = sem acesso explícito)
create or replace function get_obra_nivel(p_obra_id uuid)
returns text language sql stable as $$
  select nivel from public.obra_membros
  where obra_id = p_obra_id and usuario_id = auth.uid()
  limit 1
$$;
