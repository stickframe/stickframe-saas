-- ============================================================
-- STICK FRAME — Schema Supabase
-- Cole no SQL Editor: supabase.com → seu projeto → SQL Editor
-- ============================================================

-- 1. CLIENTES
create table clientes (
  id          bigserial primary key,
  nome        text not null,
  cidade      text,
  contato     text,
  status      text default 'Lead',
  valor       numeric default 0,
  unidades    int default 0,
  created_at  timestamptz default now()
);

-- 2. ORÇAMENTOS
create table orcamentos (
  id          bigserial primary key,
  ref         text,
  cliente_id  bigint references clientes(id) on delete set null,
  valor       numeric,
  unidades    int,
  area        numeric,
  padrao      text default 'padrao',
  status      text default 'Aguardando resposta',
  created_at  timestamptz default now()
);

-- 3. OBRAS
create table obras (
  id          bigserial primary key,
  nome        text not null,
  cliente_id  bigint references clientes(id) on delete set null,
  progresso   int default 0,
  fase        text default 'Projeto executivo',
  prazo       text,
  status      text default 'Em andamento',
  contrato    numeric default 0,
  created_at  timestamptz default now()
);

-- 4. LANÇAMENTOS FINANCEIROS
create table lancamentos (
  id          bigserial primary key,
  obra_id     bigint references obras(id) on delete cascade,
  tipo        text not null check (tipo in ('receita','despesa')),
  categoria   text,
  valor       numeric not null,
  data        text,
  descricao   text,
  created_at  timestamptz default now()
);

-- ── ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────────
-- Ativa RLS em todas as tabelas (apenas usuários autenticados acessam)
alter table clientes    enable row level security;
alter table orcamentos  enable row level security;
alter table obras       enable row level security;
alter table lancamentos enable row level security;

-- Política: autenticado pode fazer tudo
create policy "auth_all" on clientes    for all using (auth.role() = 'authenticated');
create policy "auth_all" on orcamentos  for all using (auth.role() = 'authenticated');
create policy "auth_all" on obras       for all using (auth.role() = 'authenticated');
create policy "auth_all" on lancamentos for all using (auth.role() = 'authenticated');

-- ── USUÁRIOS (crie via Supabase Auth) ────────────────────────────────────────
-- No painel: Authentication → Users → Invite user
-- E-mail: andre@stickframe.com.br  (defina a senha no primeiro acesso)
-- E-mail: vendas@stickframe.com.br
