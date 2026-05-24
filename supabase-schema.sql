-- ═══════════════════════════════════════════════════════════════════════════
-- STICK FRAME SAAS — Schema v2 (multiempresa, RLS, Realtime)
-- Execute no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── EMPRESAS ─────────────────────────────────────────────────────────────────
create table if not exists empresas (
  id           uuid default gen_random_uuid() primary key,
  nome         text not null,
  cnpj         text,
  cidade       text,
  email        text,
  telefone     text,
  logo_url     text,
  ativo        boolean default true,
  created_at   timestamptz default now()
);

insert into empresas (nome, cnpj, cidade, email) values
  ('Stick Frame Sistemas Construtivos Ltda.', 'XX.XXX.XXX/0001-XX', 'Santo André/SP', 'contato@stickframe.com.br');

-- ── USUÁRIOS ─────────────────────────────────────────────────────────────────
create table if not exists usuarios (
  id           uuid references auth.users(id) on delete cascade primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  nome         text not null,
  cargo        text,
  perfil       text default 'comercial'
                 check (perfil in ('diretor','comercial','engenheiro','financeiro','cliente')),
  ativo        boolean default true,
  created_at   timestamptz default now()
);

-- ── CLIENTES ─────────────────────────────────────────────────────────────────
create table if not exists clientes (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  nome         text not null,
  cidade       text,
  contato      text,
  email        text,
  status       text default 'Lead',
  valor        numeric default 0,
  unidades     integer default 0,
  observacoes  text default '',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── OBRAS ─────────────────────────────────────────────────────────────────────
create table if not exists obras (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  cliente_id   uuid references clientes(id) on delete set null,
  nome         text not null,
  cliente      text,
  status       text default 'Planejamento',
  fase         text default 'Projeto executivo',
  progresso    integer default 0,
  prazo        text default '—',
  contrato     numeric default 0,
  token_portal text unique,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── ORÇAMENTOS ───────────────────────────────────────────────────────────────
create table if not exists orcamentos (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  cliente_id   uuid references clientes(id) on delete set null,
  obra_id      uuid references obras(id) on delete set null,
  ref          text not null,
  cliente      text,
  valor        numeric default 0,
  unidades     integer default 1,
  area         numeric default 48,
  padrao       text default 'Padrão',
  status       text default 'Aguardando resposta',
  criado       text,
  created_at   timestamptz default now()
);

-- ── CONTRATOS ────────────────────────────────────────────────────────────────
create table if not exists contratos (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  cliente_id   uuid references clientes(id) on delete set null,
  obra_id      uuid references obras(id) on delete set null,
  ref          text not null,
  cliente      text,
  obra         text,
  valor        numeric default 0,
  unidades     integer default 1,
  area         numeric default 48,
  padrao       text default 'Padrão',
  prazo        text default '—',
  status       text default 'Aguardando',
  data         text,
  created_at   timestamptz default now()
);

-- ── FINANCEIRO ───────────────────────────────────────────────────────────────
create table if not exists financeiro (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  obra_id      uuid references obras(id) on delete cascade not null,
  tipo         text not null check (tipo in ('receita','despesa')),
  categoria    text,
  valor        numeric not null,
  data         text,
  descricao    text,
  created_at   timestamptz default now()
);

-- ── MEDIÇÕES ─────────────────────────────────────────────────────────────────
create table if not exists medicoes (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  obra_id      uuid references obras(id) on delete cascade not null,
  numero       integer not null,
  data         text not null,
  descricao    text,
  percentual   numeric default 0,
  valor        numeric default 0,
  status       text default 'Pendente',
  obs          text default '',
  created_at   timestamptz default now()
);

-- ── DIÁRIO ───────────────────────────────────────────────────────────────────
create table if not exists diario (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  obra_id      uuid references obras(id) on delete cascade not null,
  usuario_id   uuid references auth.users(id) on delete set null,
  data         text not null,
  turno        text default 'Integral',
  clima        text,
  equipe       integer default 1,
  responsavel  text,
  atividades   text,
  ocorrencias  text default '',
  created_at   timestamptz default now()
);

-- ── ARQUIVOS ─────────────────────────────────────────────────────────────────
create table if not exists arquivos (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  obra_id      uuid references obras(id) on delete cascade not null,
  nome         text not null,
  tipo         text default 'outro',
  tamanho      text,
  categoria    text default 'Documento',
  data         text,
  storage_path text,
  created_at   timestamptz default now()
);

-- ── EVENTOS ──────────────────────────────────────────────────────────────────
create table if not exists eventos (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  cliente_id   uuid references clientes(id) on delete set null,
  titulo       text not null,
  tipo         text,
  data         text not null,
  hora         text,
  cliente      text,
  obra         text default '',
  obs          text default '',
  cor          text default '#981915',
  created_at   timestamptz default now()
);

-- ── HISTÓRICO ────────────────────────────────────────────────────────────────
create table if not exists historico (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  usuario_id   uuid references auth.users(id) on delete set null,
  tipo         text not null,
  acao         text not null,
  descricao    text,
  usuario      text,
  data         text,
  hora         text,
  created_at   timestamptz default now()
);

-- ── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
create table if not exists notificacoes (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references empresas(id) on delete cascade not null,
  usuario_id   uuid references auth.users(id) on delete cascade,
  titulo       text not null,
  mensagem     text,
  tipo         text default 'info',
  lida         boolean default false,
  created_at   timestamptz default now()
);

-- ── FUNÇÃO RLS ───────────────────────────────────────────────────────────────
create or replace function get_empresa_id()
returns uuid language sql stable as $$
  select empresa_id from usuarios where id = auth.uid()
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table empresas      enable row level security;
alter table usuarios      enable row level security;
alter table clientes      enable row level security;
alter table obras         enable row level security;
alter table orcamentos    enable row level security;
alter table contratos     enable row level security;
alter table financeiro    enable row level security;
alter table medicoes      enable row level security;
alter table diario        enable row level security;
alter table arquivos      enable row level security;
alter table eventos       enable row level security;
alter table historico     enable row level security;
alter table notificacoes  enable row level security;

create policy "empresas_rls"     on empresas     for all using (id = get_empresa_id());
create policy "usuarios_rls"     on usuarios     for all using (empresa_id = get_empresa_id());
create policy "clientes_rls"     on clientes     for all using (empresa_id = get_empresa_id());
create policy "obras_rls"        on obras        for all using (empresa_id = get_empresa_id());
create policy "orcamentos_rls"   on orcamentos   for all using (empresa_id = get_empresa_id());
create policy "contratos_rls"    on contratos    for all using (empresa_id = get_empresa_id());
create policy "financeiro_rls"   on financeiro   for all using (empresa_id = get_empresa_id());
create policy "medicoes_rls"     on medicoes     for all using (empresa_id = get_empresa_id());
create policy "diario_rls"       on diario       for all using (empresa_id = get_empresa_id());
create policy "arquivos_rls"     on arquivos     for all using (empresa_id = get_empresa_id());
create policy "eventos_rls"      on eventos      for all using (empresa_id = get_empresa_id());
create policy "historico_rls"    on historico    for all using (empresa_id = get_empresa_id());
create policy "notificacoes_rls" on notificacoes for all using (usuario_id = auth.uid());

-- ── REALTIME ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table obras;
alter publication supabase_realtime add table diario;
alter publication supabase_realtime add table notificacoes;

-- ── ÍNDICES ──────────────────────────────────────────────────────────────────
create index if not exists idx_clientes_empresa  on clientes(empresa_id);
create index if not exists idx_obras_empresa     on obras(empresa_id);
create index if not exists idx_obras_cliente     on obras(cliente_id);
create index if not exists idx_financeiro_obra   on financeiro(obra_id);
create index if not exists idx_diario_obra       on diario(obra_id);
create index if not exists idx_medicoes_obra     on medicoes(obra_id);
create index if not exists idx_arquivos_obra     on arquivos(obra_id);
create index if not exists idx_historico_empresa on historico(empresa_id);
create index if not exists idx_eventos_empresa   on eventos(empresa_id);
