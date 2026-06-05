create table if not exists public.comentarios (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  entidade    text not null,   -- 'obra' | 'medicao' | 'diario' | 'vistoria' | 'checklist'
  entidade_id uuid not null,
  parent_id   uuid references public.comentarios(id) on delete cascade,
  texto       text not null,
  usuario_id  uuid not null references public.usuarios(id),
  editado     boolean default false,
  created_at  timestamptz not null default now()
);
alter table public.comentarios enable row level security;
create policy "empresa_own" on public.comentarios
  using  (empresa_id = (select empresa_id from public.usuarios where id = auth.uid()))
  with check (empresa_id = (select empresa_id from public.usuarios where id = auth.uid()));
create index on public.comentarios (entidade, entidade_id);
create index on public.comentarios (parent_id);
