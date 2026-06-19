-- ═══════════════════════════════════════════════════════════════════════════
-- STICK FRAME SAAS — Schema Consolidado Completo
-- Contém todos os módulos: SST, Equipe, Ponto, Suprimentos, BIM, Bidding, etc.
-- Execute no SQL Editor do Supabase para provisionar ou sincronizar o banco
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── 1. CORE TABLES ───────────────────────────────────────────────────────────

-- EMPRESAS
create table if not exists public.empresas (
  id                      uuid default gen_random_uuid() primary key,
  nome                    text not null,
  cnpj                    text,
  cidade                  text,
  email                   text,
  telefone                text,
  logo_url                text,
  ativo                   boolean default true,
  ical_token              uuid default gen_random_uuid(),
  trial_reminder_sent     boolean default false,
  onboarding_completo     boolean default false,
  api_key                 text unique,
  api_key_created_at      timestamptz,
  created_at              timestamptz default now()
);

create unique index if not exists idx_empresas_ical_token on public.empresas(ical_token);

-- Populate initial default company if none exists
insert into public.empresas (nome, cnpj, cidade, email)
select 'Stick Frame Sistemas Construtivos Ltda.', 'XX.XXX.XXX/0001-XX', 'Santo André/SP', 'contato@stickframe.com.br'
where not exists (select 1 from public.empresas);

-- USUÁRIOS
create table if not exists public.usuarios (
  id           uuid references auth.users(id) on delete cascade primary key,
  empresa_id   uuid references public.empresas(id) on delete cascade not null,
  nome         text not null,
  cargo        text,
  perfil       text default 'comercial'
                 check (perfil in ('diretor','comercial','engenheiro','financeiro','cliente')),
  ativo        boolean default true,
  created_at   timestamptz default now()
);

-- CLIENTES
create table if not exists public.clientes (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references public.empresas(id) on delete cascade not null,
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

-- OBRAS
create table if not exists public.obras (
  id                uuid default gen_random_uuid() primary key,
  empresa_id        uuid references public.empresas(id) on delete cascade not null,
  cliente_id        uuid references public.clientes(id) on delete set null,
  nome              text not null,
  cliente           text,
  status            text default 'Planejamento',
  fase              text default 'Projeto executivo',
  progresso         integer default 0,
  prazo             text default '—',
  contrato          numeric default 0,
  token_portal      text unique,
  area_m2           numeric(10,2),
  latitude          numeric,
  longitude         numeric,
  assinatura_data   timestamptz,
  assinatura_nome   text,
  assinatura_url    text,
  orcamento_categorias jsonb default '{}'::jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ORÇAMENTOS
create table if not exists public.orcamentos (
  id             uuid default gen_random_uuid() primary key,
  empresa_id     uuid references public.empresas(id) on delete cascade not null,
  cliente_id     uuid references public.clientes(id) on delete set null,
  obra_id        uuid references public.obras(id) on delete set null,
  ref            text not null,
  cliente        text,
  valor          numeric default 0,
  unidades       integer default 1,
  area           numeric default 48,
  padrao         text default 'Padrão',
  status         text default 'Aguardando resposta',
  criado         text,
  token_publico  text unique,
  created_at     timestamptz default now()
);

-- CONTRATOS
create table if not exists public.contratos (
  id             uuid default gen_random_uuid() primary key,
  empresa_id     uuid references public.empresas(id) on delete cascade not null,
  cliente_id     uuid references public.clientes(id) on delete set null,
  obra_id        uuid references public.obras(id) on delete set null,
  ref            text not null,
  cliente        text,
  obra           text,
  valor          numeric default 0,
  unidades       integer default 1,
  area           numeric default 48,
  padrao         text default 'Padrão',
  prazo          text default '—',
  status         text default 'Aguardando',
  data           text,
  contrato_token text unique,
  created_at     timestamptz default now()
);

-- FINANCEIRO
create table if not exists public.financeiro (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references public.empresas(id) on delete cascade not null,
  obra_id      uuid references public.obras(id) on delete cascade not null,
  tipo         text not null check (tipo in ('receita','despesa')),
  categoria    text,
  valor        numeric not null,
  data         text,
  descricao    text,
  data_vencimento text,
  created_at   timestamptz default now()
);

-- MEDIÇÕES
create table if not exists public.medicoes (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references public.empresas(id) on delete cascade not null,
  obra_id      uuid references public.obras(id) on delete cascade not null,
  numero       integer not null,
  data         text not null,
  descricao    text,
  percentual   numeric default 0,
  valor        numeric default 0,
  status       text default 'Pendente',
  obs          text default '',
  data_medicao date,
  created_at   timestamptz default now()
);

-- DIÁRIO
create table if not exists public.diario (
  id                     uuid default gen_random_uuid() primary key,
  empresa_id             uuid references public.empresas(id) on delete cascade not null,
  obra_id                uuid references public.obras(id) on delete cascade not null,
  usuario_id             uuid references auth.users(id) on delete set null,
  data                   text not null,
  turno                  text default 'Integral',
  clima                  text default 'Ensolarado',
  temperatura            integer,
  equipe                 integer default 1,
  total_trabalhadores    integer default 0,
  responsavel            text,
  atividades             text,
  atividades_realizadas  text,
  ocorrencias            text default '',
  intercorrencias        text,
  equipamentos_utilizados text,
  fotos                  jsonb default '[]'::jsonb,
  created_at             timestamptz default now()
);

-- ARQUIVOS
create table if not exists public.arquivos (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references public.empresas(id) on delete cascade not null,
  obra_id      uuid references public.obras(id) on delete cascade not null,
  nome         text not null,
  tipo         text default 'outro',
  tamanho      text,
  categoria    text default 'Documento',
  data         text,
  storage_path text,
  created_at   timestamptz default now()
);

-- EVENTOS
create table if not exists public.eventos (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references public.empresas(id) on delete cascade not null,
  cliente_id   uuid references public.clientes(id) on delete set null,
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

-- HISTÓRICO
create table if not exists public.historico (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references public.empresas(id) on delete cascade not null,
  usuario_id   uuid references auth.users(id) on delete set null,
  tipo         text not null,
  acao         text not null,
  descricao    text,
  usuario      text,
  data         text,
  hora         text,
  created_at   timestamptz default now()
);

-- NOTIFICAÇÕES
create table if not exists public.notificacoes (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references public.empresas(id) on delete cascade not null,
  usuario_id   uuid references auth.users(id) on delete cascade,
  titulo       text not null,
  mensagem     text,
  tipo         text default 'info',
  lida         boolean default false,
  created_at   timestamptz default now()
);


-- ── 2. MODULE TABLES (EQUIPE, PONTO, SST, SUPRIMENTOS, BIM, ETC.) ─────────────

-- COLABORADORES (Equipe)
create table if not exists public.colaboradores (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  nome             text not null,
  cargo            text,
  email            text,
  telefone         text,
  especialidade    text default 'Montador',
  status           text default 'Ativo',
  salario          numeric(12,2),
  tipo_contrato    text default 'CLT',
  valor_producao   numeric(12,2),
  unidade_producao text default 'm²',
  observacoes      text,
  token_ponto      text unique default gen_random_uuid()::text,
  foto_url         text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ALOCAÇÕES
create table if not exists public.alocacoes (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  colaborador_id uuid references public.colaboradores(id) on delete cascade,
  obra_id        uuid references public.obras(id) on delete cascade,
  data_inicio    date,
  data_fim       date,
  funcao         text,
  observacoes    text,
  created_at     timestamptz default now()
);

-- HORAS TRABALHADAS (Registro Manual)
create table if not exists public.horas_trabalhadas (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  colaborador_id uuid references public.colaboradores(id) on delete cascade,
  obra_id        uuid references public.obras(id) on delete cascade,
  data           date not null,
  horas          numeric(5,2) not null default 0,
  descricao      text,
  created_at     timestamptz default now()
);

-- REGISTROS PONTO (Ponto Eletrônico)
create table if not exists public.registros_ponto (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  colaborador_id   uuid not null references public.colaboradores(id) on delete cascade,
  obra_id          uuid references public.obras(id) on delete set null,
  entrada          timestamptz not null default now(),
  saida            timestamptz,
  tipo             text default 'entrada' check (tipo in ('entrada','saida')),
  lat              numeric,
  lng              numeric,
  distancia_obra_m numeric,
  created_at       timestamptz default now()
);

-- CERTIFICAÇÕES (Compliance NR)
create table if not exists public.certificacoes (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  colaborador_id   uuid not null references public.colaboradores(id) on delete cascade,
  nr               text not null,
  descricao        text,
  data_emissao     date,
  data_validade    date not null,
  instituicao      text,
  carga_horaria    integer,
  status           text default 'Vigente',
  observacoes      text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- SST DDS
create table if not exists public.sst_dds (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  obra_id          uuid references public.obras(id) on delete cascade,
  data             date not null,
  tema             text not null,
  facilitador      text,
  participantes    text[] default '{}',
  obs              text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- SST DDS ASSINATURAS
create table if not exists public.sst_dds_assinaturas (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  dds_id           uuid not null references public.sst_dds(id) on delete cascade,
  nome             text not null,
  assinatura_base64 text not null,
  created_at       timestamptz default now()
);

-- SST INCIDENTES
create table if not exists public.sst_incidentes (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  obra_id          uuid references public.obras(id) on delete set null,
  colaborador_id   uuid references public.colaboradores(id) on delete set null,
  data             date not null default current_date,
  tipo             text not null check (tipo in ('Quase-acidente', 'Acidente', 'Incidente')),
  gravidade        text not null check (gravidade in ('Baixa', 'Média', 'Alta', 'Crítica')),
  status           text not null default 'Aberto' check (status in ('Aberto', 'Em andamento', 'Fechado')),
  descricao        text not null,
  acao_corretiva   text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- SST EPIS
create table if not exists public.sst_epis (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas(id) on delete cascade,
  colaborador_id    uuid not null references public.colaboradores(id) on delete cascade,
  obra_id           uuid references public.obras(id) on delete set null,
  item              text not null,
  quantidade        integer not null default 1,
  data_entrega      date not null default current_date,
  validade          date,
  assinado          boolean default false,
  assinatura_base64 text,
  obs               text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- SUPRIMENTOS PEDIDOS
create table if not exists public.suprimentos_pedidos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  obra_id       uuid not null references public.obras(id) on delete cascade,
  item          text not null,
  quantidade    numeric not null default 1,
  unidade       text,
  urgencia      text default 'Normal' check (urgencia in ('Normal','Urgente','Crítico')),
  status        text default 'Pendente' check (status in ('Pendente','Aprovado','Em trânsito','Entregue')),
  observacoes   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- SUPRIMENTOS ESTOQUE
create table if not exists public.suprimentos_estoque (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  item           text not null,
  saldo          numeric not null default 0,
  unidade        text,
  estoque_minimo numeric default 0,
  localizacao    text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- SUPRIMENTOS MOVIMENTOS
create table if not exists public.suprimentos_movimentos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  estoque_id    uuid not null references public.suprimentos_estoque(id) on delete cascade,
  tipo          text not null check (tipo in ('entrada','saída','saida')),
  quantidade    numeric not null default 1,
  justificativa text,
  created_at    timestamptz default now()
);

-- BIM MODELOS
create table if not exists public.bim_modelos (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  obra_id      uuid not null references public.obras(id) on delete cascade,
  nome         text not null,
  url          text not null,
  storage_path text,
  versao       text,
  created_at   timestamptz default now()
);

-- BIM APONTAMENTOS
create table if not exists public.bim_apontamentos (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  obra_id      uuid not null references public.obras(id) on delete cascade,
  modelo_id    uuid references public.bim_modelos(id) on delete cascade,
  express_id   text,
  titulo       text not null,
  descricao    text,
  status       text default 'Aberto' check (status in ('Aberto','Resolvido')),
  prioridade   text default 'Media' check (prioridade in ('Baixa','Media','Alta')),
  responsavel  text,
  prazo        date,
  created_at   timestamptz default now()
);

-- COMENTÁRIOS (BI / Obras)
create table if not exists public.comentarios (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  entidade    text not null,
  entidade_id uuid not null,
  parent_id   uuid references public.comentarios(id) on delete cascade,
  texto       text not null,
  usuario_id  uuid not null references public.usuarios(id),
  editado     boolean default false,
  created_at  timestamptz not null default now()
);

-- CONCORRÊNCIAS (Bidding)
create table if not exists public.concorrencias (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  obra_id        uuid references public.obras(id) on delete cascade,
  titulo         text not null,
  descricao      text,
  prazo_resposta date,
  status         text default 'Aberta' check (status in ('Aberta','Fechada','Cancelada')),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- CONCORRÊNCIA ITENS
create table if not exists public.concorrencia_itens (
  id              uuid primary key default gen_random_uuid(),
  concorrencia_id uuid not null references public.concorrencias(id) on delete cascade,
  descricao       text not null,
  quantidade      numeric not null,
  unidade         text,
  ordem           integer
);

-- CONCORRÊNCIA PARTICIPANTES
create table if not exists public.concorrencia_participantes (
  id              uuid primary key default gen_random_uuid(),
  concorrencia_id uuid not null references public.concorrencias(id) on delete cascade,
  nome_fornecedor text not null,
  telefone        text,
  valor_total     numeric,
  observacoes     text,
  respondido      boolean default false,
  token_publico   text unique default gen_random_uuid()::text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- CONCORRÊNCIA PROPOSTAS (Preços Enviados)
create table if not exists public.concorrencia_propostas (
  id                   uuid primary key default gen_random_uuid(),
  concorrencia_id      uuid not null references public.concorrencias(id) on delete cascade,
  participante_id      uuid not null references public.concorrencia_participantes(id) on delete cascade,
  concorrencia_item_id uuid not null references public.concorrencia_itens(id) on delete cascade,
  preco_unitario       numeric(12,2),
  observacao           text,
  created_at           timestamptz default now()
);

-- PORTAL MENSAGENS (Chat do Cliente)
create table if not exists public.portal_mensagens (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  obra_id     uuid not null references public.obras(id) on delete cascade,
  remetente   text not null,
  origem      text not null check (origem in ('cliente', 'empresa')),
  texto       text not null,
  created_at  timestamptz not null default now()
);

-- CHAMADOS GARANTIA
create table if not exists public.chamados_garantia (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  obra_id     uuid not null references public.obras(id) on delete cascade,
  titulo      text not null,
  descricao   text,
  status      text default 'Aberto' check (status in ('Aberto','Em atendimento','Fechado')),
  categoria   text default 'Outro',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- GARANTIAS
create table if not exists public.garantias (
  id           uuid default gen_random_uuid() primary key,
  empresa_id   uuid references public.empresas(id) on delete cascade,
  obra_id      uuid references public.obras(id) on delete cascade,
  item         text not null,
  fornecedor   text,
  data_inicio  date,
  data_fim     date not null,
  prazo_anos   numeric default 1,
  status       text default 'Vigente' check (status in ('Vigente','Vencendo','Vencida','Acionada')),
  observacoes  text,
  created_at   timestamptz default now()
);

-- NÃO CONFORMIDADES (FVS / Vistorias)
create table if not exists public.nao_conformidades (
  id             uuid default gen_random_uuid() primary key,
  empresa_id     uuid references public.empresas(id) on delete cascade,
  obra_id        uuid references public.obras(id) on delete cascade,
  numero         integer,
  titulo         text not null,
  descricao      text,
  disciplina     text default 'Civil',
  gravidade      text default 'Media' check (gravidade in ('Baixa','Media','Alta','Critica')),
  status         text default 'Aberta' check (status in ('Aberta','Em análise','Em correção','Verificando','Fechada')),
  criado_por     uuid references auth.users(id),
  responsavel_id uuid references public.usuarios(id),
  prazo          date,
  acao_corretiva text,
  verificado_em  timestamptz,
  fechado_em     timestamptz,
  created_at     timestamptz default now()
);

-- PERFIS CUSTOMIZADOS
create table if not exists public.perfis_customizados (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  cor        text default '#6b7280',
  paginas    text[] not null default '{}',
  created_at timestamptz default now()
);

-- RFIS (Solicitações de Informação)
create table if not exists public.rfis (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  obra_id          uuid not null references public.obras(id) on delete cascade,
  numero           text not null,
  titulo           text not null,
  descricao        text,
  disciplina       text default 'Estrutural',
  urgencia         text default 'Normal',
  status           text default 'Aberto',
  solicitante      text,
  responsavel      text,
  data_solicitacao date default current_date,
  data_resposta    date,
  resposta         text,
  created_at       timestamptz default now()
);

-- VISTORIAS
create table if not exists public.vistorias (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  obra_id       uuid not null references public.obras(id) on delete cascade,
  titulo        text not null,
  descricao     text,
  responsavel   text,
  data_vistoria date,
  status        text default 'Pendente' check (status in ('Pendente','Aprovada','Rejeitada')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- WEBHOOKS
create table if not exists public.webhooks (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  url         text not null,
  eventos     text[] not null default '{}',
  ativo       boolean default true,
  segredo     text,
  created_at  timestamptz not null default now()
);

-- WEBHOOK LOGS
create table if not exists public.webhook_logs (
  id          uuid primary key default gen_random_uuid(),
  webhook_id  uuid references public.webhooks(id) on delete cascade,
  evento      text not null,
  payload     jsonb,
  status_code integer,
  erro        text,
  created_at  timestamptz not null default now()
);

-- CHECKLISTS CANTEDIRO (checklists_sf)
create table if not exists public.checklists_sf (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  obra_id     uuid not null references public.obras(id) on delete cascade,
  etapa       text not null,
  item        text not null,
  status      text not null,
  obs         text,
  updated_at  timestamptz default now(),
  unique (obra_id, etapa, item)
);

-- EQUIPAMENTOS
create table if not exists public.equipamentos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  obra_id    uuid references public.obras(id) on delete set null,
  nome       text not null,
  status     text default 'Disponível',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MONITORAMENTO PREÇOS (Monitor de Preços)
create table if not exists public.monitoramento_precos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  nome_produto   text not null,
  url            text,
  insumo_ref     text,
  loja           text,
  status         text default 'Ativo',
  preco_atual    numeric,
  preco_anterior numeric,
  data_captura   text,
  erro_msg       text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- HISTÓRICO PREÇOS
create table if not exists public.historico_precos (
  id           uuid primary key default gen_random_uuid(),
  monitor_id   uuid not null references public.monitoramento_precos(id) on delete cascade,
  preco        numeric not null,
  data_captura text not null,
  created_at   timestamptz default now()
);

-- ESTOQUE RETALHOS (LSF Scrap Tracking)
create table if not exists public.estoque_retalhos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  tipo_perfil    text not null,
  comprimento_mm numeric not null,
  obra_id        uuid references public.obras(id) on delete set null,
  observacoes    text,
  status         text default 'Disponível' check (status in ('Disponível','Reservado','Utilizado')),
  created_at     timestamptz default now()
);

-- CHANGE ORDERS (Contratos Aditivos)
create table if not exists public.change_orders (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  obra_id         uuid not null references public.obras(id) on delete cascade,
  numero          text not null,
  titulo          text not null,
  descricao       text,
  tipo            text default 'Aditivo',
  valor           numeric(12,2) default 0,
  impacto_prazo   integer default 0,
  status          text default 'Rascunho' check (status in ('Rascunho','Pendente','Aprovado','Rejeitado')),
  solicitado_por  text,
  aprovado_por    text,
  data_solicitacao date default current_date,
  data_aprovacao  timestamptz,
  justificativa   text,
  observacoes     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- SAVED VIEWS
create table if not exists public.saved_views (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  module      text not null,
  label       text not null,
  filters     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ANOTAÇÕES (BIM / PDF Viewer)
create table if not exists public.anotacoes (
  id          uuid default gen_random_uuid() primary key,
  empresa_id  uuid references public.empresas(id) on delete cascade,
  arquivo_id  uuid references public.arquivos(id) on delete cascade,
  usuario_id  uuid references auth.users(id),
  layer_json  jsonb,
  pagina      integer default 1,
  created_at  timestamptz default now()
);

-- RATE LIMIT HITS
create table if not exists public.rate_limit_hits (
  id bigserial primary key,
  bucket text not null,
  ip text not null,
  created_at timestamptz not null default now()
);


-- ── 3. VIEWS ─────────────────────────────────────────────────────────────────

-- PONTOS (Virtual list joining registros_ponto with colaborador names)
create or replace view public.pontos as
select
  rp.id,
  rp.empresa_id,
  rp.colaborador_id,
  rp.obra_id,
  rp.tipo,
  rp.entrada,
  rp.saida,
  rp.lat,
  rp.lng,
  rp.distancia_obra_m,
  rp.created_at,
  c.nome as nome
from public.registros_ponto rp
join public.colaboradores c on rp.colaborador_id = c.id;


-- ── 4. FUNCTIONS & DATABASE FUNCTIONS (RPC) ──────────────────────────────────

-- get_empresa_id (SECURITY DEFINER to avoid RLS recursion)
create or replace function public.get_empresa_id()
returns uuid
security definer
set search_path = public
language plpgsql
stable
as $$
begin
  return (
    select empresa_id 
    from public.usuarios 
    where id = auth.uid()
  );
end;
$$;

-- is_funcionario
create or replace function public.is_funcionario()
returns boolean
security definer
set search_path = public
language plpgsql
stable
as $$
begin
  return exists (
    select 1 
    from public.usuarios 
    where id = auth.uid() 
      and perfil in ('diretor', 'comercial', 'engenheiro', 'financeiro')
      and ativo = true
  );
end;
$$;

-- is_diretor
create or replace function public.is_diretor()
returns boolean
security definer
set search_path = public
language plpgsql
stable
as $$
begin
  return exists (
    select 1 
    from public.usuarios 
    where id = auth.uid() 
      and perfil = 'diretor'
      and ativo = true
  );
end;
$$;

-- generate_api_key
create or replace function public.generate_api_key()
returns text
security definer
set search_path = public
language sql
as $$
  select 'sf_live_' || encode(gen_random_bytes(24), 'hex');
$$;

-- check_rate_limit
create or replace function public.check_rate_limit(
  p_bucket text, p_ip text, p_max int, p_window_secs int
) returns boolean
security definer
set search_path = public
language plpgsql as $$
declare
  cnt int;
begin
  select count(*) into cnt from public.rate_limit_hits
   where bucket = p_bucket and ip = p_ip
     and created_at > now() - make_interval(secs => p_window_secs);
  if cnt >= p_max then
    return false;
  end if;
  insert into public.rate_limit_hits (bucket, ip) values (p_bucket, p_ip);
  return true;
end;
$$;
revoke execute on function public.check_rate_limit(text,text,int,int) from anon, authenticated;

-- get_obra_nivel
create or replace function public.get_obra_nivel(p_obra_id uuid)
returns text
security definer
set search_path = public
language sql
stable as $$
  select nivel from public.obra_membros
  where obra_id = p_obra_id and usuario_id = auth.uid()
  limit 1;
$$;

-- incrementar_estoque
create or replace function public.incrementar_estoque(p_id uuid, p_delta numeric)
returns public.suprimentos_estoque
security definer
set search_path = public
language plpgsql as $$
declare
  v_res public.suprimentos_estoque;
begin
  update public.suprimentos_estoque
  set saldo = saldo + p_delta,
      updated_at = now()
  where id = p_id
  returning * into v_res;

  return v_res;
end;
$$;

-- apurar_empreiteiro
create or replace function public.apurar_empreiteiro(
  p_empresa_id uuid,
  p_colaborador_id uuid,
  p_obra_id uuid,
  p_data_inicio date,
  p_data_fim date
)
returns json
security definer
set search_path = public
language plpgsql as $$
declare
  v_colab record;
  v_dias integer;
  v_qtd numeric;
  v_total numeric;
  v_unidade text;
  v_lancamento_id uuid;
begin
  select * into v_colab from public.colaboradores where id = p_colaborador_id and empresa_id = p_empresa_id;
  if not found then
    raise exception 'Colaborador não encontrado.';
  end if;

  v_dias := p_data_fim - p_data_inicio + 1;
  if v_dias <= 0 then
    v_dias := 1;
  end if;

  v_unidade := coalesce(v_colab.unidade_producao, 'm²');
  if v_unidade = 'm²' then
    v_qtd := 10 * v_dias;
  else
    v_qtd := v_dias;
  end if;

  v_total := coalesce(v_colab.valor_producao, 0) * v_qtd;

  if v_total > 0 then
    insert into public.financeiro (
      empresa_id,
      obra_id,
      tipo,
      categoria,
      valor,
      data,
      descricao
    )
    values (
      p_empresa_id,
      p_obra_id,
      'despesa',
      'Mão de obra',
      v_total,
      current_date::text,
      'Produção — ' || v_colab.nome || ' — ' || to_char(p_data_inicio, 'DD/MM') || ' a ' || to_char(p_data_fim, 'DD/MM')
    )
    returning id into v_lancamento_id;
  end if;

  return json_build_object(
    'total', v_total,
    'quantidade', v_qtd,
    'unidade', v_unidade
  );
end;
$$;

-- ponto_get_colaborador
create or replace function public.ponto_get_colaborador(p_token text)
returns json
security definer
set search_path = public
language plpgsql
stable as $$
declare
  v_colab record;
  v_colab_json json;
  v_obras_json json;
  v_pontos_json json;
begin
  select * into v_colab from public.colaboradores where token_ponto = p_token;
  if not found then
    return null;
  end if;

  v_colab_json := row_to_json(v_colab);

  select coalesce(json_agg(row_to_json(o)), '[]'::json) into v_obras_json
  from public.alocacoes a
  join public.obras o on a.obra_id = o.id
  where a.colaborador_id = v_colab.id;

  select coalesce(json_agg(row_to_json(p)), '[]'::json) into v_pontos_json
  from (
    select * from public.registros_ponto
    where colaborador_id = v_colab.id
      and created_at::date = current_date
    order by created_at desc
  ) p;

  return json_build_object(
    'colaborador', v_colab_json,
    'obras', v_obras_json,
    'pontos_hoje', v_pontos_json
  );
end;
$$;

-- ponto_registrar
create or replace function public.ponto_registrar(
  p_token text,
  p_lat numeric,
  p_lng numeric,
  p_obra_id uuid default null
)
returns json
security definer
set search_path = public
language plpgsql as $$
declare
  v_colab record;
  v_ultimo record;
  v_tipo text;
  v_registro record;
  v_distancia numeric := null;
  v_fora_da_obra boolean := false;
  v_obra_lat numeric := null;
  v_obra_lng numeric := null;
begin
  select * into v_colab from public.colaboradores where token_ponto = p_token;
  if not found then
    raise exception 'Colaborador não encontrado.';
  end if;

  select * into v_ultimo
  from public.registros_ponto
  where colaborador_id = v_colab.id
    and created_at::date = current_date
  order by created_at desc
  limit 1;

  if v_ultimo is null or v_ultimo.tipo = 'saida' then
    v_tipo := 'entrada';
  else
    v_tipo := 'saida';
  end if;

  if p_obra_id is not null then
    select latitude, longitude into v_obra_lat, v_obra_lng from public.obras where id = p_obra_id;
    if v_obra_lat is not null and v_obra_lng is not null and p_lat is not null and p_lng is not null then
      begin
        v_distancia := round((6371000 * acos(
          cos(radians(p_lat)) * cos(radians(v_obra_lat)) * cos(radians(v_obra_lng) - radians(p_lng)) +
          sin(radians(p_lat)) * sin(radians(v_obra_lat))
        ))::numeric, 0);
        
        if v_distancia > 500 then
          v_fora_da_obra := true;
        end if;
      exception
        when others then
          v_distancia := null;
      end;
    end if;
  end if;

  insert into public.registros_ponto (
    empresa_id,
    colaborador_id,
    obra_id,
    tipo,
    entrada,
    saida,
    lat,
    lng,
    distancia_obra_m
  )
  values (
    v_colab.empresa_id,
    v_colab.id,
    p_obra_id,
    v_tipo,
    case when v_tipo = 'entrada' then now() else null end,
    case when v_tipo = 'saida' then now() else null end,
    p_lat,
    p_lng,
    v_distancia
  )
  returning * into v_registro;

  return json_build_object(
    'tipo', v_tipo,
    'hora', to_char(now() at time zone 'America/Sao_Paulo', 'HH24:MI'),
    'distancia_m', v_distancia,
    'fora_da_obra', v_fora_da_obra
  );
end;
$$;

-- concorrencia_get_dados
create or replace function public.concorrencia_get_dados(p_token text)
returns json
security definer
set search_path = public
language plpgsql
stable as $$
declare
  v_part record;
  v_conc record;
  v_itens json;
  v_props json;
begin
  select * into v_part from public.concorrencia_participantes where token_publico = p_token;
  if not found then
    return null;
  end if;

  select * into v_conc from public.concorrencias where id = v_part.concorrencia_id;

  select coalesce(json_agg(row_to_json(i)), '[]'::json) into v_itens
  from (
    select * from public.concorrencia_itens
    where concorrencia_id = v_conc.id
    order by ordem
  ) i;

  select coalesce(json_agg(row_to_json(pr)), '[]'::json) into v_props
  from (
    select * from public.concorrencia_propostas
    where participante_id = v_part.id
  ) pr;

  return json_build_object(
    'concorrencia', row_to_json(v_conc),
    'participante', row_to_json(v_part),
    'itens', v_itens,
    'propostas', v_props
  );
end;
$$;

-- concorrencia_enviar_proposta
create or replace function public.concorrencia_enviar_proposta(p_token text, p_propostas json)
returns void
security definer
set search_path = public
language plpgsql as $$
declare
  v_part record;
  v_prop json;
  v_item_id uuid;
  v_preco numeric;
  v_obs text;
  v_total_valor numeric := 0;
begin
  select * into v_part from public.concorrencia_participantes where token_publico = p_token;
  if not found then
    raise exception 'Participante não encontrado para o token fornecido.';
  end if;

  delete from public.concorrencia_propostas where participante_id = v_part.id;

  for v_prop in select * from json_array_elements(p_propostas) loop
    v_item_id := (v_prop->>'concorrencia_item_id')::uuid;
    v_preco := (v_prop->>'preco_unitario')::numeric;
    v_obs := v_prop->>'observacao';

    insert into public.concorrencia_propostas (concorrencia_id, participante_id, concorrencia_item_id, preco_unitario, observacao)
    values (v_part.concorrencia_id, v_part.id, v_item_id, v_preco, v_obs);

    v_total_valor := v_total_valor + coalesce(v_preco * (select quantidade from public.concorrencia_itens where id = v_item_id), 0);
  end loop;

  update public.concorrencia_participantes
  set respondido = true,
      valor_total = v_total_valor,
      updated_at = now()
  where id = v_part.id;
end;
$$;

-- concorrencia_get_resultado
create or replace function public.concorrencia_get_resultado(p_concorrencia_id uuid, p_empresa_id uuid)
returns json
security definer
set search_path = public
language plpgsql
stable as $$
declare
  v_res json;
begin
  select coalesce(json_agg(t), '[]'::json) into v_res
  from (
    select
      p.id as participante_id,
      p.nome_fornecedor,
      p.telefone,
      p.valor_total,
      p.respondido,
      coalesce(
        json_agg(
          json_build_object(
            'item_id', pr.concorrencia_item_id,
            'preco_unitario', pr.preco_unitario,
            'observacao', pr.observacao
          )
        ) filter (where pr.id is not null),
        '[]'::json
      ) as propostas
    from public.concorrencia_participantes p
    left join public.concorrencia_propostas pr on pr.participante_id = p.id
    where p.concorrencia_id = p_concorrencia_id
    group by p.id, p.nome_fornecedor, p.telefone, p.valor_total, p.respondido
  ) t;
  return v_res;
end;
$$;

-- get_portal_data
create or replace function public.get_portal_data(p_token text)
returns json
security definer
set search_path = public
language plpgsql
stable as $$
declare
  v_obra record;
  v_empresa record;
  v_financeiro json;
  v_diario json;
  v_medicoes json;
  v_documentos json;
  v_vistorias json;
  v_mensagens json;
begin
  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    return null;
  end if;

  select * into v_empresa from public.empresas where id = v_obra.empresa_id;

  select coalesce(json_agg(row_to_json(f)), '[]'::json) into v_financeiro
  from public.financeiro f
  where f.obra_id = v_obra.id;

  select coalesce(json_agg(row_to_json(d)), '[]'::json) into v_diario
  from public.diario d
  where d.obra_id = v_obra.id;

  select coalesce(json_agg(row_to_json(m)), '[]'::json) into v_medicoes
  from public.medicoes m
  where m.obra_id = v_obra.id
  order by m.numero;

  select coalesce(json_agg(row_to_json(a)), '[]'::json) into v_documentos
  from public.arquivos a
  where a.obra_id = v_obra.id and a.categoria = 'Documento';

  select coalesce(json_agg(row_to_json(v)), '[]'::json) into v_vistorias
  from public.vistorias v
  where v.obra_id = v_obra.id;

  select coalesce(json_agg(row_to_json(msg)), '[]'::json) into v_mensagens
  from (
    select * from public.portal_mensagens
    where obra_id = v_obra.id
    order by created_at
  ) msg;

  return json_build_object(
    'obra', row_to_json(v_obra),
    'empresa', row_to_json(v_empresa),
    'financeiro', v_financeiro,
    'diario', v_diario,
    'medicoes', v_medicoes,
    'documentos', v_documentos,
    'vistorias', v_vistorias,
    'mensagens', v_mensagens
  );
end;
$$;

-- portal_enviar_mensagem
create or replace function public.portal_enviar_mensagem(p_token text, p_nome text, p_texto text)
returns public.portal_mensagens
security definer
set search_path = public
language plpgsql as $$
declare
  v_obra record;
  v_msg public.portal_mensagens;
begin
  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    raise exception 'Obra não encontrada para o token fornecido.';
  end if;

  insert into public.portal_mensagens (empresa_id, obra_id, remetente, origem, texto)
  values (v_obra.empresa_id, v_obra.id, p_nome, 'cliente', p_texto)
  returning * into v_msg;

  return v_msg;
end;
$$;

-- portal_responder_mensagem
create or replace function public.portal_responder_mensagem(
  p_obra_id uuid,
  p_empresa_id uuid,
  p_nome text,
  p_texto text
)
returns public.portal_mensagens
security definer
set search_path = public
language plpgsql as $$
declare
  v_msg public.portal_mensagens;
begin
  insert into public.portal_mensagens (empresa_id, obra_id, remetente, origem, texto)
  values (p_empresa_id, p_obra_id, p_nome, 'empresa', p_texto)
  returning * into v_msg;

  return v_msg;
end;
$$;

-- portal_aprovar_medicao
create or replace function public.portal_aprovar_medicao(p_token text, p_medicao_id uuid)
returns void
security definer
set search_path = public
language plpgsql as $$
declare
  v_obra record;
begin
  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    raise exception 'Obra não encontrada para o token fornecido.';
  end if;

  update public.medicoes
  set status = 'Aprovada',
      obs = coalesce(obs, '') || E'\nMedição aprovada pelo cliente via portal online em ' || to_char(now(), 'DD/MM/YYYY HH24:MI')
  where id = p_medicao_id and obra_id = v_obra.id;
end;
$$;

-- portal_abrir_chamado
create or replace function public.portal_abrir_chamado(
  p_token text,
  p_titulo text,
  p_descricao text,
  p_categoria text
)
returns public.chamados_garantia
security definer
set search_path = public
language plpgsql as $$
declare
  v_obra record;
  v_chamado public.chamados_garantia;
begin
  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    raise exception 'Obra não encontrada para o token fornecido.';
  end if;

  insert into public.chamados_garantia (empresa_id, obra_id, titulo, descricao, categoria, status)
  values (v_obra.empresa_id, v_obra.id, p_titulo, p_descricao, p_categoria, 'Aberto')
  returning * into v_chamado;

  return v_chamado;
end;
$$;

-- portal_listar_chamados
create or replace function public.portal_listar_chamados(p_token text)
returns setof public.chamados_garantia
security definer
set search_path = public
language plpgsql
stable as $$
declare
  v_obra record;
begin
  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    return;
  end if;

  return query
  select * from public.chamados_garantia
  where obra_id = v_obra.id
  order by created_at desc;
end;
$$;

-- portal_assinar
create or replace function public.portal_assinar(
  p_token text,
  p_nome text,
  p_assinatura_url text
)
returns void
security definer
set search_path = public
language plpgsql as $$
begin
  update public.obras
  set assinatura_data = now(),
      assinatura_nome = p_nome,
      assinatura_url = p_assinatura_url,
      updated_at = now()
  where token_portal = p_token;
end;
$$;

-- get_contrato_data
create or replace function public.get_contrato_data(p_token text)
returns json
security definer
set search_path = public
language plpgsql
stable as $$
declare
  v_contrato record;
  v_empresa record;
begin
  select * into v_contrato from public.contratos where contrato_token = p_token or id::text = p_token;
  if not found then
    return null;
  end if;

  select * into v_empresa from public.empresas where id = v_contrato.empresa_id;

  return json_build_object(
    'contrato', row_to_json(v_contrato),
    'empresa', row_to_json(v_empresa)
  );
end;
$$;

-- get_proposta_data
create or replace function public.get_proposta_data(p_token text)
returns json
security definer
set search_path = public
language plpgsql
stable as $$
declare
  v_orc record;
  v_cliente record;
  v_empresa record;
begin
  select * into v_orc from public.orcamentos where token_publico = p_token or id::text = p_token;
  if not found then
    return null;
  end if;

  select * into v_cliente from public.clientes where id = v_orc.cliente_id;
  select * into v_empresa from public.empresas where id = v_orc.empresa_id;

  return json_build_object(
    'orcamento', row_to_json(v_orc),
    'cliente', row_to_json(v_cliente),
    'empresa', row_to_json(v_empresa)
  );
end;
$$;

-- handle_new_user (auth sync function)
create or replace function public.handle_new_user()
returns trigger AS $$
declare
  v_empresa_id uuid;
begin
  begin
    v_empresa_id := (new.raw_user_meta_data->>'empresa_id')::uuid;
  exception when others then
    v_empresa_id := null;
  end;

  if v_empresa_id is null then
    return new;
  end if;

  insert into public.usuarios (id, empresa_id, nome, perfil, ativo)
  values (
    new.id,
    v_empresa_id,
    coalesce(new.raw_user_meta_data->>'nome', 'Novo Usuário'),
    coalesce(new.raw_user_meta_data->>'perfil', 'comercial'),
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;


-- ── 5. TRIGGERS ──────────────────────────────────────────────────────────────

-- Trigger sync auth users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger set_co_numero (change orders auto number)
create or replace function public.set_co_numero()
returns trigger as $$
begin
  if new.numero is null or new.numero = '' then
    new.numero := 'CO-' || lpad(
      (select count(*) + 1 from public.change_orders where obra_id = new.obra_id)::text, 3, '0'
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_co_numero on public.change_orders;
create trigger trg_co_numero before insert on public.change_orders for each row execute function public.set_co_numero();

-- Trigger set_ncr_numero (nao conformidades auto number)
create or replace function public.set_ncr_numero()
returns trigger as $$
begin
  select coalesce(max(numero),0)+1 into new.numero from public.nao_conformidades where obra_id = new.obra_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ncr_numero on public.nao_conformidades;
create trigger trg_ncr_numero before insert on public.nao_conformidades for each row execute function public.set_ncr_numero();

-- Trigger set_rfi_numero (rfis auto number)
create or replace function public.set_rfi_numero()
returns trigger as $$
begin
  if new.numero is null or new.numero = '' then
    new.numero := 'RFI-' || lpad((select count(*)+1 from public.rfis where obra_id = new.obra_id)::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rfi_numero on public.rfis;
create trigger trg_rfi_numero before insert on public.rfis for each row execute function public.set_rfi_numero();


-- ── 6. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────

alter table public.empresas               enable row level security;
alter table public.usuarios               enable row level security;
alter table public.clientes               enable row level security;
alter table public.obras                  enable row level security;
alter table public.orcamentos             enable row level security;
alter table public.contratos              enable row level security;
alter table public.financeiro             enable row level security;
alter table public.medicoes               enable row level security;
alter table public.diario                 enable row level security;
alter table public.arquivos               enable row level security;
alter table public.eventos                enable row level security;
alter table public.historico              enable row level security;
alter table public.notificacoes           enable row level security;
alter table public.colaboradores          enable row level security;
alter table public.alocacoes              enable row level security;
alter table public.horas_trabalhadas      enable row level security;
alter table public.registros_ponto        enable row level security;
alter table public.certificacoes          enable row level security;
alter table public.sst_dds                enable row level security;
alter table public.sst_dds_assinaturas    enable row level security;
alter table public.sst_incidentes         enable row level security;
alter table public.sst_epis               enable row level security;
alter table public.suprimentos_pedidos    enable row level security;
alter table public.suprimentos_estoque    enable row level security;
alter table public.suprimentos_movimentos enable row level security;
alter table public.bim_modelos            enable row level security;
alter table public.bim_apontamentos       enable row level security;
alter table public.comentarios            enable row level security;
alter table public.concorrencias          enable row level security;
alter table public.concorrencia_itens     enable row level security;
alter table public.concorrencia_participantes enable row level security;
alter table public.concorrencia_propostas enable row level security;
alter table public.portal_mensagens       enable row level security;
alter table public.chamados_garantia      enable row level security;
alter table public.garantias              enable row level security;
alter table public.nao_conformidades      enable row level security;
alter table public.perfis_customizados    enable row level security;
alter table public.rfis                   enable row level security;
alter table public.vistorias              enable row level security;
alter table public.webhooks               enable row level security;
alter table public.webhook_logs          enable row level security;
alter table public.checklists_sf          enable row level security;
alter table public.equipamentos           enable row level security;
alter table public.monitoramento_precos   enable row level security;
alter table public.historico_precos       enable row level security;
alter table public.estoque_retalhos       enable row level security;
alter table public.change_orders          enable row level security;
alter table public.saved_views            enable row level security;
alter table public.anotacoes              enable row level security;

-- Drop all old policies to avoid duplicates
drop policy if exists "empresas_select" on public.empresas;
drop policy if exists "empresas_update" on public.empresas;
drop policy if exists "empresas_delete" on public.empresas;
drop policy if exists "usuarios_select" on public.usuarios;
drop policy if exists "usuarios_insert" on public.usuarios;
drop policy if exists "usuarios_update" on public.usuarios;
drop policy if exists "usuarios_delete" on public.usuarios;
drop policy if exists "clientes_select" on public.clientes;
drop policy if exists "clientes_insert" on public.clientes;
drop policy if exists "clientes_update" on public.clientes;
drop policy if exists "clientes_delete" on public.clientes;
drop policy if exists "obras_select" on public.obras;
drop policy if exists "obras_insert" on public.obras;
drop policy if exists "obras_update" on public.obras;
drop policy if exists "obras_delete" on public.obras;
drop policy if exists "orcamentos_select" on public.orcamentos;
drop policy if exists "orcamentos_insert" on public.orcamentos;
drop policy if exists "orcamentos_update" on public.orcamentos;
drop policy if exists "orcamentos_delete" on public.orcamentos;
drop policy if exists "contratos_select" on public.contratos;
drop policy if exists "contratos_insert" on public.contratos;
drop policy if exists "contratos_update" on public.contratos;
drop policy if exists "contratos_delete" on public.contratos;
drop policy if exists "financeiro_select" on public.financeiro;
drop policy if exists "financeiro_insert" on public.financeiro;
drop policy if exists "financeiro_update" on public.financeiro;
drop policy if exists "financeiro_delete" on public.financeiro;
drop policy if exists "medicoes_select" on public.medicoes;
drop policy if exists "medicoes_insert" on public.medicoes;
drop policy if exists "medicoes_update" on public.medicoes;
drop policy if exists "medicoes_delete" on public.medicoes;
drop policy if exists "diario_select" on public.diario;
drop policy if exists "diario_insert" on public.diario;
drop policy if exists "diario_update" on public.diario;
drop policy if exists "diario_delete" on public.diario;
drop policy if exists "arquivos_select" on public.arquivos;
drop policy if exists "arquivos_insert" on public.arquivos;
drop policy if exists "arquivos_update" on public.arquivos;
drop policy if exists "arquivos_delete" on public.arquivos;
drop policy if exists "eventos_select" on public.eventos;
drop policy if exists "eventos_insert" on public.eventos;
drop policy if exists "eventos_update" on public.eventos;
drop policy if exists "eventos_delete" on public.eventos;
drop policy if exists "historico_select" on public.historico;
drop policy if exists "historico_insert" on public.historico;
drop policy if exists "historico_no_update" on public.historico;
drop policy if exists "historico_no_delete" on public.historico;
drop policy if exists "notificacoes_select" on public.notificacoes;
drop policy if exists "notificacoes_update" on public.notificacoes;
drop policy if exists "notificacoes_delete" on public.notificacoes;

-- Core Policies
create policy "empresas_select" on public.empresas for select using (id = get_empresa_id());
create policy "empresas_update" on public.empresas for update using (id = get_empresa_id() and is_diretor()) with check (id = get_empresa_id() and is_diretor());
create policy "empresas_delete" on public.empresas for delete using (id = get_empresa_id() and is_diretor());

create policy "usuarios_select" on public.usuarios for select using (empresa_id = get_empresa_id());
create policy "usuarios_insert" on public.usuarios for insert with check (empresa_id = get_empresa_id() and is_diretor());
create policy "usuarios_update" on public.usuarios for update using (empresa_id = get_empresa_id() and is_diretor()) with check (empresa_id = get_empresa_id() and is_diretor());
create policy "usuarios_delete" on public.usuarios for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "clientes_select" on public.clientes for select using (empresa_id = get_empresa_id() and is_funcionario());
create policy "clientes_insert" on public.clientes for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "clientes_update" on public.clientes for update using (empresa_id = get_empresa_id() and is_funcionario()) with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "clientes_delete" on public.clientes for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "obras_select" on public.obras for select using (empresa_id = get_empresa_id() or token_portal is not null); -- Allow portal access
create policy "obras_insert" on public.obras for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "obras_update" on public.obras for update using (empresa_id = get_empresa_id() or token_portal is not null) with check (empresa_id = get_empresa_id() or token_portal is not null);
create policy "obras_delete" on public.obras for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "orcamentos_select" on public.orcamentos for select using (empresa_id = get_empresa_id() or token_publico is not null);
create policy "orcamentos_insert" on public.orcamentos for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "orcamentos_update" on public.orcamentos for update using (empresa_id = get_empresa_id() or token_publico is not null) with check (empresa_id = get_empresa_id() or token_publico is not null);
create policy "orcamentos_delete" on public.orcamentos for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "contratos_select" on public.contratos for select using (empresa_id = get_empresa_id() or contrato_token is not null);
create policy "contratos_insert" on public.contratos for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "contratos_update" on public.contratos for update using (empresa_id = get_empresa_id() or contrato_token is not null) with check (empresa_id = get_empresa_id() or contrato_token is not null);
create policy "contratos_delete" on public.contratos for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "financeiro_select" on public.financeiro for select using (empresa_id = get_empresa_id());
create policy "financeiro_insert" on public.financeiro for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "financeiro_update" on public.financeiro for update using (empresa_id = get_empresa_id() and is_funcionario()) with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "financeiro_delete" on public.financeiro for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "medicoes_select" on public.medicoes for select using (empresa_id = get_empresa_id() or exists (select 1 from public.obras o where o.id = obra_id and o.token_portal is not null));
create policy "medicoes_insert" on public.medicoes for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "medicoes_update" on public.medicoes for update using (empresa_id = get_empresa_id() or exists (select 1 from public.obras o where o.id = obra_id and o.token_portal is not null)) with check (empresa_id = get_empresa_id() or exists (select 1 from public.obras o where o.id = obra_id and o.token_portal is not null));
create policy "medicoes_delete" on public.medicoes for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "diario_select" on public.diario for select using (empresa_id = get_empresa_id() or exists (select 1 from public.obras o where o.id = obra_id and o.token_portal is not null));
create policy "diario_insert" on public.diario for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "diario_update" on public.diario for update using (empresa_id = get_empresa_id() and is_funcionario()) with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "diario_delete" on public.diario for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "arquivos_select" on public.arquivos for select using (empresa_id = get_empresa_id() or exists (select 1 from public.obras o where o.id = obra_id and o.token_portal is not null));
create policy "arquivos_insert" on public.arquivos for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "arquivos_update" on public.arquivos for update using (empresa_id = get_empresa_id() and is_funcionario()) with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "arquivos_delete" on public.arquivos for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "eventos_select" on public.eventos for select using (empresa_id = get_empresa_id() and is_funcionario());
create policy "eventos_insert" on public.eventos for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "eventos_update" on public.eventos for update using (empresa_id = get_empresa_id() and is_funcionario()) with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "eventos_delete" on public.eventos for delete using (empresa_id = get_empresa_id() and is_diretor());

create policy "historico_select" on public.historico for select using (empresa_id = get_empresa_id() and is_funcionario());
create policy "historico_insert" on public.historico for insert with check (empresa_id = get_empresa_id() and is_funcionario());
create policy "historico_no_update" on public.historico for update using (false);
create policy "historico_no_delete" on public.historico for delete using (false);

create policy "notificacoes_select" on public.notificacoes for select using (usuario_id = auth.uid());
create policy "notificacoes_update" on public.notificacoes for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "notificacoes_delete" on public.notificacoes for delete using (usuario_id = auth.uid());

-- Module/Generic Policies (empresa_id own RLS)
DO $$
DECLARE
  t text;
  tables_to_rls text[] := array[
    'colaboradores', 'alocacoes', 'horas_trabalhadas', 'registros_ponto', 'certificacoes',
    'sst_dds', 'sst_dds_assinaturas', 'sst_incidentes', 'sst_epis',
    'suprimentos_pedidos', 'suprimentos_estoque', 'suprimentos_movimentos',
    'bim_modelos', 'bim_apontamentos', 'comentarios',
    'concorrencias', 'concorrencia_itens', 'concorrencia_participantes', 'concorrencia_propostas',
    'portal_mensagens', 'chamados_garantia', 'garantias', 'nao_conformidades', 'perfis_customizados',
    'rfis', 'vistorias', 'webhooks', 'webhook_logs', 'checklists_sf', 'equipamentos',
    'monitoramento_precos', 'historico_precos', 'estoque_retalhos', 'change_orders',
    'saved_views', 'anotacoes'
  ];
BEGIN
  foreach t in array tables_to_rls loop
    execute format('drop policy if exists %I_all_policy on public.%I', t, t);
    execute format('drop policy if exists %I_empresa on public.%I', t, t);
    execute format('create policy %I_empresa on public.%I for all using (empresa_id = get_empresa_id()) with check (empresa_id = get_empresa_id())', t, t);
  end loop;
END $$;

-- Exceptions to generic policies for public portal access:
drop policy if exists sst_epis_portal on public.sst_epis;
create policy sst_epis_portal on public.sst_epis for select
  using (empresa_id = get_empresa_id() or exists (select 1 from public.obras o where o.id = obra_id and o.token_portal is not null));

drop policy if exists portal_mensagens_portal on public.portal_mensagens;
create policy portal_mensagens_portal on public.portal_mensagens for all
  using (empresa_id = get_empresa_id() or exists (select 1 from public.obras o where o.id = obra_id and o.token_portal is not null));

drop policy if exists chamados_garantia_portal on public.chamados_garantia;
create policy chamados_garantia_portal on public.chamados_garantia for all
  using (empresa_id = get_empresa_id() or exists (select 1 from public.obras o where o.id = obra_id and o.token_portal is not null));

drop policy if exists concorrencia_participantes_portal on public.concorrencia_participantes;
create policy concorrencia_participantes_portal on public.concorrencia_participantes for all
  using (empresa_id = get_empresa_id() or token_publico is not null);

drop policy if exists concorrencia_propostas_portal on public.concorrencia_propostas;
create policy concorrencia_propostas_portal on public.concorrencia_propostas for all
  using (
    concorrencia_id in (select id from public.concorrencias where empresa_id = get_empresa_id()) 
    or participante_id in (select id from public.concorrencia_participantes where token_publico is not null)
  );

drop policy if exists checklists_sf_portal on public.checklists_sf;
create policy checklists_sf_portal on public.checklists_sf for all
  using (empresa_id = get_empresa_id() or exists (select 1 from public.obras o where o.id = obra_id and o.token_portal is not null));


-- ── 7. INDEXES ───────────────────────────────────────────────────────────────

create index if not exists idx_clientes_empresa           on public.clientes(empresa_id);
create index if not exists idx_obras_empresa              on public.obras(empresa_id);
create index if not exists idx_obras_cliente              on public.obras(cliente_id);
create index if not exists idx_financeiro_obra            on public.financeiro(obra_id);
create index if not exists idx_diario_obra                on public.diario(obra_id);
create index if not exists idx_medicoes_obra              on public.medicoes(obra_id);
create index if not exists idx_arquivos_obra              on public.arquivos(obra_id);
create index if not exists idx_historico_empresa          on public.historico(empresa_id);
create index if not exists idx_eventos_empresa            on public.eventos(empresa_id);
create index if not exists idx_colaboradores_empresa      on public.colaboradores(empresa_id);
create index if not exists idx_alocacoes_empresa          on public.alocacoes(empresa_id);
create index if not exists idx_alocacoes_obra             on public.alocacoes(obra_id);
create index if not exists idx_horas_empresa              on public.horas_trabalhadas(empresa_id);
create index if not exists idx_registros_ponto_colab      on public.registros_ponto(colaborador_id);
create index if not exists idx_cert_empresa                on public.certificacoes(empresa_id);
create index if not exists idx_cert_colaborador            on public.certificacoes(colaborador_id);
create index if not exists idx_cert_validade               on public.certificacoes(data_validade);
create index if not exists idx_sst_dds_empresa             on public.sst_dds(empresa_id);
create index if not exists idx_sst_epis_colab              on public.sst_epis(colaborador_id);
create index if not exists idx_suprimentos_pedidos_obra    on public.suprimentos_pedidos(obra_id);
create index if not exists idx_suprimentos_estoque_item    on public.suprimentos_estoque(empresa_id, item);
create index if not exists idx_bim_modelos_obra            on public.bim_modelos(obra_id);
create index if not exists idx_bim_apontamentos_obra       on public.bim_apontamentos(obra_id);
create index if not exists idx_comentarios_entidade        on public.comentarios (entidade, entidade_id);
create index if not exists idx_rfis_obra                   on public.rfis(obra_id);
create index if not exists idx_vistorias_obra              on public.vistorias(obra_id);
create index if not exists idx_co_obra                     on public.change_orders(obra_id);


-- ── 8. REALTIME SUBSCRIPTIONS ────────────────────────────────────────────────

DO $$
BEGIN
  -- Recreate publication channels safely
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables individually if not already present
  DECLARE
    t text;
    realtime_tables text[] := array[
      'obras', 'diario', 'notificacoes', 'comentarios', 'portal_mensagens', 
      'sst_dds', 'sst_incidentes', 'sst_epis', 'registros_ponto'
    ];
  BEGIN
    foreach t in array realtime_tables loop
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    end loop;
  END;
END $$;
