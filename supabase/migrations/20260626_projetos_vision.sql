-- StickQuote™ AI Vision — registro de plantas analisadas por IA de visão
create table if not exists public.projetos_vision (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas (id) on delete cascade,
  nome_arquivo  text,
  arquivo_url   text,
  hash_documento text,
  dados_json    jsonb,
  area_extraida numeric,
  confianca     integer,
  modelo_ia     text,
  created_at    timestamptz not null default now()
);

create index if not exists projetos_vision_empresa_idx
  on public.projetos_vision (empresa_id, created_at desc);

alter table public.projetos_vision enable row level security;

-- Acesso restrito à própria empresa do usuário (mesma convenção das demais tabelas)
drop policy if exists projetos_vision_empresa on public.projetos_vision;
create policy projetos_vision_empresa on public.projetos_vision for all
  using (empresa_id = get_empresa_id())
  with check (empresa_id = get_empresa_id());
