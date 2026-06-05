-- Add version tracking to arquivos table
alter table public.arquivos add column if not exists versao integer not null default 1;
alter table public.arquivos add column if not exists arquivo_pai_id uuid references public.arquivos(id) on delete set null;

-- Version history table
create table if not exists public.arquivo_versoes (
  id              uuid primary key default gen_random_uuid(),
  arquivo_id      uuid not null references public.arquivos(id) on delete cascade,
  versao          integer not null,
  storage_path    text not null,
  tamanho         bigint,
  enviado_por     uuid references public.usuarios(id),
  created_at      timestamptz not null default now()
);
alter table public.arquivo_versoes enable row level security;
create policy "empresa_own" on public.arquivo_versoes
  using (exists (
    select 1 from public.arquivos a
    join public.obras o on o.id = a.obra_id
    join public.usuarios u on u.empresa_id = o.empresa_id
    where a.id = arquivo_id and u.id = auth.uid()
  ));
create index on public.arquivo_versoes (arquivo_id);
