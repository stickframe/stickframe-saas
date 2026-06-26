-- Funil comercial: estágio do lead/orçamento no pipeline de vendas (aditivo).
alter table public.orcamentos
  add column if not exists status_funil text default 'orcamento_criado',
  add column if not exists lead_score integer,
  add column if not exists documentos jsonb default '[]'::jsonb,
  add column if not exists ultima_interacao timestamptz;

update public.orcamentos set status_funil =
  case when status = 'Aprovado' then 'fechado'
       when status = 'Recusado' then 'perdido'
       else 'orcamento_criado' end
where status_funil is null or status_funil = 'orcamento_criado';
