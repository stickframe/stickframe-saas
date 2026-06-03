-- ── change_orders: Aditivos e supressões de contrato ─────────────────────────
create table if not exists public.change_orders (
  id            uuid primary key default gen_random_uuid(),
  obra_id       uuid not null references public.obras(id) on delete cascade,
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  numero        integer not null,
  titulo        text not null,
  descricao     text,
  justificativa text,
  tipo          text not null default 'aditivo'
                  check (tipo in ('aditivo', 'supressao', 'prazo')),
  valor         numeric not null default 0,        -- positivo = aditivo, negativo = supressão
  prazo_dias    integer default 0,                 -- dias adicionados/removidos ao prazo
  status        text not null default 'pendente'
                  check (status in ('pendente', 'aprovado', 'reprovado')),
  criado_por    uuid references public.usuarios(id),
  aprovado_por  uuid references public.usuarios(id),
  aprovado_em   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.change_orders enable row level security;

create policy "empresa_own" on public.change_orders
  using  (empresa_id = (select empresa_id from public.usuarios where id = auth.uid()))
  with check (empresa_id = (select empresa_id from public.usuarios where id = auth.uid()));

create index on public.change_orders (obra_id);
create index on public.change_orders (empresa_id, status);

-- Sequence de número por obra via trigger
create or replace function set_co_numero()
returns trigger language plpgsql as $$
begin
  select coalesce(max(numero), 0) + 1
    into new.numero
    from public.change_orders
   where obra_id = new.obra_id;
  return new;
end;
$$;

create trigger trg_co_numero
  before insert on public.change_orders
  for each row execute function set_co_numero();
