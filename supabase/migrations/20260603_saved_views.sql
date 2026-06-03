create table if not exists public.saved_views (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  module      text not null,
  label       text not null,
  filters     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.saved_views enable row level security;

create policy "empresa_own" on public.saved_views
  using (empresa_id = (select empresa_id from public.usuarios where id = auth.uid()))
  with check (empresa_id = (select empresa_id from public.usuarios where id = auth.uid()));

create index on public.saved_views (empresa_id, module);
