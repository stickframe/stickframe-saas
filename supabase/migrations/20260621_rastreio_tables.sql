-- Tabela de painéis para rastreio QR
create table if not exists public.paineis (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas(id) on delete cascade,
  obra_id           uuid not null references public.obras(id) on delete cascade,
  token             text not null unique,
  codigo            text not null,
  descricao         text,
  local_instalacao  text,
  ifc_element_id    bigint,
  status            text not null default 'Pendente' check (status in ('Pendente', 'Em fabricação', 'Montado', 'Com problema')),
  observacoes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.paineis enable row level security;
drop policy if exists paineis_empresa on public.paineis;
create policy paineis_empresa on public.paineis for all
  using (empresa_id = get_empresa_id())
  with check (empresa_id = get_empresa_id());

create index if not exists idx_paineis_obra on public.paineis(obra_id);
create index if not exists idx_paineis_token on public.paineis(token);

-- Tabela de ambientes para rastreio QR
create table if not exists public.ambientes_qr (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  obra_id     uuid not null references public.obras(id) on delete cascade,
  token       text not null unique,
  nome        text not null,
  andar       text,
  status      text not null default 'Pendente',
  created_at  timestamptz not null default now()
);

alter table public.ambientes_qr enable row level security;
drop policy if exists ambientes_qr_empresa on public.ambientes_qr;
create policy ambientes_qr_empresa on public.ambientes_qr for all
  using (empresa_id = get_empresa_id())
  with check (empresa_id = get_empresa_id());

-- Allow public portal access via token
create policy ambientes_qr_portal on public.ambientes_qr for select
  using (token is not null);

create index if not exists idx_ambientes_qr_obra on public.ambientes_qr(obra_id);
create index if not exists idx_ambientes_qr_token on public.ambientes_qr(token);
