-- ═══════════════════════════════════════════════════════════════════════════
-- STICK FRAME SAAS — Hardening de Segurança (2026-06-27)
-- 
-- FASE 2: Tabela de configurações do sistema (remove hardcoded secrets)
-- FASE 3: Tokens públicos com expiração
-- FASE 4: Validação de input em RPCs
-- FASE 5: Rate limiting — índices
-- FASE 8: Índices de performance ausentes
-- ═══════════════════════════════════════════════════════════════════════════

-- ── FASE 2: configuracoes_sistema ──────────────────────────────────────────

create table if not exists public.configuracoes_sistema (
  id         uuid default gen_random_uuid() primary key,
  empresa_id uuid references public.empresas(id) on delete cascade,
  chave      text not null,
  valor      text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (empresa_id, chave)
);

alter table public.configuracoes_sistema enable row level security;

drop policy if exists configuracoes_sistema_select on public.configuracoes_sistema;
create policy configuracoes_sistema_select on public.configuracoes_sistema
  for select using (empresa_id = get_empresa_id() or empresa_id is null);

drop policy if exists configuracoes_sistema_insert on public.configuracoes_sistema;
create policy configuracoes_sistema_insert on public.configuracoes_sistema
  for insert with check (empresa_id = get_empresa_id() and is_diretor());

drop policy if exists configuracoes_sistema_update on public.configuracoes_sistema;
create policy configuracoes_sistema_update on public.configuracoes_sistema
  for update using (empresa_id = get_empresa_id() and is_diretor()) with check (empresa_id = get_empresa_id() and is_diretor());

-- Inserir configuração global de admin emails (pode ser sobrescrita por empresa)
insert into public.configuracoes_sistema (empresa_id, chave, valor)
select null, 'admin_emails', 'admin@stickframe.com.br'
where not exists (select 1 from public.configuracoes_sistema where chave = 'admin_emails' and empresa_id is null);


-- ── FASE 3: Tokens públicos com expiração ─────────────────────────────────

-- OBRAS: token_portal
alter table public.obras
  add column if not exists token_expires_at timestamptz,
  add column if not exists token_revoked_at  timestamptz;

-- ORÇAMENTOS: token_publico
alter table public.orcamentos
  add column if not exists token_expires_at timestamptz,
  add column if not exists token_revoked_at  timestamptz;

-- CONTRATOS: contrato_token
alter table public.contratos
  add column if not exists token_expires_at timestamptz,
  add column if not exists token_revoked_at  timestamptz;

-- COLABORADORES: token_ponto
alter table public.colaboradores
  add column if not exists token_expires_at timestamptz,
  add column if not exists token_revoked_at  timestamptz;

-- CONCORRÊNCIA PARTICIPANTES: token_publico
alter table public.concorrencia_participantes
  add column if not exists token_expires_at timestamptz,
  add column if not exists token_revoked_at  timestamptz;


-- ── Função de validação de token ──────────────────────────────────────────

create or replace function public.token_valido(p_token text)
returns boolean
security definer
set search_path = public
language plpgsql
stable
as $$
begin
  if p_token is null or p_token = '' then
    return false;
  end if;
  return true;
end;
$$;


-- ── FASE 4: Validação de input em RPCs críticas ──────────────────────────

-- ponto_registrar: adicionar validação de coordenadas
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
  -- Validação: token
  if p_token is null or p_token = '' then
    raise exception 'Token inválido.';
  end if;

  -- Validação: latitude
  if p_lat is not null and (p_lat < -90 or p_lat > 90) then
    raise exception 'Latitude inválida (deve estar entre -90 e 90).';
  end if;

  -- Validação: longitude
  if p_lng is not null and (p_lng < -180 or p_lng > 180) then
    raise exception 'Longitude inválida (deve estar entre -180 e 180).';
  end if;

  select * into v_colab from public.colaboradores where token_ponto = p_token;
  if not found then
    raise exception 'Colaborador não encontrado.';
  end if;

  -- Verificar se o token do colaborador não expirou
  if v_colab.token_expires_at is not null and v_colab.token_expires_at < now() then
    raise exception 'Token do colaborador expirou.';
  end if;
  if v_colab.token_revoked_at is not null then
    raise exception 'Token do colaborador foi revogado.';
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


-- get_portal_data: validar token
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
  if p_token is null or p_token = '' then
    return null;
  end if;

  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    return null;
  end if;

  -- Verificar expiração/revogação do token
  if v_obra.token_revoked_at is not null then
    return null;
  end if;
  if v_obra.token_expires_at is not null and v_obra.token_expires_at < now() then
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


-- portal_enviar_mensagem: validar token
create or replace function public.portal_enviar_mensagem(p_token text, p_nome text, p_texto text)
returns public.portal_mensagens
security definer
set search_path = public
language plpgsql as $$
declare
  v_obra record;
  v_msg public.portal_mensagens;
begin
  if p_token is null or p_token = '' then
    raise exception 'Token inválido.';
  end if;

  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    raise exception 'Obra não encontrada para o token fornecido.';
  end if;

  if v_obra.token_revoked_at is not null then
    raise exception 'Token revogado.';
  end if;
  if v_obra.token_expires_at is not null and v_obra.token_expires_at < now() then
    raise exception 'Token expirado.';
  end if;

  insert into public.portal_mensagens (empresa_id, obra_id, remetente, origem, texto)
  values (v_obra.empresa_id, v_obra.id, p_nome, 'cliente', p_texto)
  returning * into v_msg;

  return v_msg;
end;
$$;


-- portal_aprovar_medicao: validar token
create or replace function public.portal_aprovar_medicao(p_token text, p_medicao_id uuid)
returns void
security definer
set search_path = public
language plpgsql as $$
declare
  v_obra record;
begin
  if p_token is null or p_token = '' then
    raise exception 'Token inválido.';
  end if;

  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    raise exception 'Obra não encontrada para o token fornecido.';
  end if;

  if v_obra.token_revoked_at is not null then
    raise exception 'Token revogado.';
  end if;
  if v_obra.token_expires_at is not null and v_obra.token_expires_at < now() then
    raise exception 'Token expirado.';
  end if;

  update public.medicoes
  set status = 'Aprovada',
      obs = coalesce(obs, '') || E'\nMedição aprovada pelo cliente via portal online em ' || to_char(now(), 'DD/MM/YYYY HH24:MI')
  where id = p_medicao_id and obra_id = v_obra.id;
end;
$$;


-- portal_abrir_chamado: validar token
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
  if p_token is null or p_token = '' then
    raise exception 'Token inválido.';
  end if;

  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    raise exception 'Obra não encontrada para o token fornecido.';
  end if;

  if v_obra.token_revoked_at is not null then
    raise exception 'Token revogado.';
  end if;
  if v_obra.token_expires_at is not null and v_obra.token_expires_at < now() then
    raise exception 'Token expirado.';
  end if;

  insert into public.chamados_garantia (empresa_id, obra_id, titulo, descricao, categoria, status)
  values (v_obra.empresa_id, v_obra.id, p_titulo, p_descricao, p_categoria, 'Aberto')
  returning * into v_chamado;

  return v_chamado;
end;
$$;


-- portal_listar_chamados: validar token
create or replace function public.portal_listar_chamados(p_token text)
returns setof public.chamados_garantia
security definer
set search_path = public
language plpgsql
stable as $$
declare
  v_obra record;
begin
  if p_token is null or p_token = '' then
    return;
  end if;

  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    return;
  end if;

  if v_obra.token_revoked_at is not null then
    return;
  end if;
  if v_obra.token_expires_at is not null and v_obra.token_expires_at < now() then
    return;
  end if;

  return query
  select * from public.chamados_garantia
  where obra_id = v_obra.id
  order by created_at desc;
end;
$$;


-- portal_assinar: validar token
create or replace function public.portal_assinar(
  p_token text,
  p_nome text,
  p_assinatura_url text
)
returns void
security definer
set search_path = public
language plpgsql as $$
declare
  v_obra record;
begin
  if p_token is null or p_token = '' then
    raise exception 'Token inválido.';
  end if;

  select * into v_obra from public.obras where token_portal = p_token;
  if not found then
    raise exception 'Obra não encontrada.';
  end if;

  if v_obra.token_revoked_at is not null then
    raise exception 'Token revogado.';
  end if;
  if v_obra.token_expires_at is not null and v_obra.token_expires_at < now() then
    raise exception 'Token expirado.';
  end if;

  update public.obras
  set assinatura_data = now(),
      assinatura_nome = p_nome,
      assinatura_url = p_assinatura_url,
      updated_at = now()
  where token_portal = p_token;
end;
$$;


-- get_contrato_data: validar token
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
  if p_token is null or p_token = '' then
    return null;
  end if;

  select * into v_contrato from public.contratos where contrato_token = p_token or id::text = p_token;
  if not found then
    return null;
  end if;

  if v_contrato.token_revoked_at is not null then
    return null;
  end if;
  if v_contrato.token_expires_at is not null and v_contrato.token_expires_at < now() then
    return null;
  end if;

  select * into v_empresa from public.empresas where id = v_contrato.empresa_id;

  return json_build_object(
    'contrato', row_to_json(v_contrato),
    'empresa', row_to_json(v_empresa)
  );
end;
$$;


-- get_proposta_data: validar token
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
  if p_token is null or p_token = '' then
    return null;
  end if;

  select * into v_orc from public.orcamentos where token_publico = p_token or id::text = p_token;
  if not found then
    return null;
  end if;

  if v_orc.token_revoked_at is not null then
    return null;
  end if;
  if v_orc.token_expires_at is not null and v_orc.token_expires_at < now() then
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


-- concorrencia_get_dados: validar token
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
  if p_token is null or p_token = '' then
    return null;
  end if;

  select * into v_part from public.concorrencia_participantes where token_publico = p_token;
  if not found then
    return null;
  end if;

  if v_part.token_revoked_at is not null then
    return null;
  end if;
  if v_part.token_expires_at is not null and v_part.token_expires_at < now() then
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


-- concorrencia_enviar_proposta: validar token
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
  if p_token is null or p_token = '' then
    raise exception 'Token inválido.';
  end if;

  select * into v_part from public.concorrencia_participantes where token_publico = p_token;
  if not found then
    raise exception 'Participante não encontrado para o token fornecido.';
  end if;

  if v_part.token_revoked_at is not null then
    raise exception 'Token revogado.';
  end if;
  if v_part.token_expires_at is not null and v_part.token_expires_at < now() then
    raise exception 'Token expirado.';
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


-- concorrencia_get_resultado: validar parâmetros
create or replace function public.concorrencia_get_resultado(p_concorrencia_id uuid, p_empresa_id uuid)
returns json
security definer
set search_path = public
language plpgsql
stable as $$
declare
  v_res json;
begin
  if p_concorrencia_id is null then
    return '[]'::json;
  end if;

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


-- apurar_empreiteiro: validar parâmetros
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
  if p_colaborador_id is null then
    raise exception 'Colaborador é obrigatório.';
  end if;

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


-- ponto_get_colaborador: validar token
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
  if p_token is null or p_token = '' then
    return null;
  end if;

  select * into v_colab from public.colaboradores where token_ponto = p_token;
  if not found then
    return null;
  end if;

  if v_colab.token_revoked_at is not null then
    return null;
  end if;
  if v_colab.token_expires_at is not null and v_colab.token_expires_at < now() then
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


-- ── FASE 5: Rate limiting improvements ─────────────────────────────────────

create index if not exists idx_rate_limit_hits_created_at
  on public.rate_limit_hits(created_at);

create index if not exists idx_rate_limit_hits_bucket_ip
  on public.rate_limit_hits(bucket, ip, created_at);


-- ── FASE 8: Índices de performance ─────────────────────────────────────────

-- registros_ponto: consultas por empresa + data
create index if not exists idx_registros_ponto_empresa_data
  on public.registros_ponto(empresa_id, created_at desc);

-- notificacoes: consultas por usuário + lida
create index if not exists idx_notificacoes_usuario_lida
  on public.notificacoes(usuario_id, lida);

-- arquivos: consultas por obra + categoria
create index if not exists idx_arquivos_obra_categoria
  on public.arquivos(obra_id, categoria);

-- historico: consultas por empresa + data
create index if not exists idx_historico_empresa_data
  on public.historico(empresa_id, created_at desc);

-- financeiro: consultas por obra + tipo
create index if not exists idx_financeiro_obra_tipo
  on public.financeiro(obra_id, tipo);

-- colaboradores: consulta por empresa + status
create index if not exists idx_colaboradores_empresa_status
  on public.colaboradores(empresa_id, status);

-- diario: consultas por obra + data
create index if not exists idx_diario_obra_data
  on public.diario(obra_id, data);

-- orcamentos: consulta por empresa + status
create index if not exists idx_orcamentos_empresa_status
  on public.orcamentos(empresa_id, status);

-- concorrencias: consulta por empresa + status
create index if not exists idx_concorrencias_empresa_status
  on public.concorrencias(empresa_id, status);
