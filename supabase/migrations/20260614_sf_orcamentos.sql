-- ── STICK FRAME · sf_orcamentos table ─────────────────────────────────────
-- Stores Orçamento SF (Steel Frame material calculator) project data per company

create table if not exists sf_orcamentos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid references auth.users(id) on delete cascade,
  data        jsonb not null default '{"projetos":[]}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index for fast company-scoped lookups
create index if not exists sf_orcamentos_empresa_id_idx on sf_orcamentos(empresa_id);

-- RLS
alter table sf_orcamentos enable row level security;

-- Allow users to manage only their own company's data
create policy "sf_orcamentos_select" on sf_orcamentos
  for select using (empresa_id = auth.uid());

create policy "sf_orcamentos_insert" on sf_orcamentos
  for insert with check (empresa_id = auth.uid());

create policy "sf_orcamentos_update" on sf_orcamentos
  for update using (empresa_id = auth.uid());

create policy "sf_orcamentos_delete" on sf_orcamentos
  for delete using (empresa_id = auth.uid());

-- Auto-update updated_at on row change
create or replace function update_sf_orcamentos_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sf_orcamentos_updated_at on sf_orcamentos;
create trigger sf_orcamentos_updated_at
  before update on sf_orcamentos
  for each row execute function update_sf_orcamentos_updated_at();
