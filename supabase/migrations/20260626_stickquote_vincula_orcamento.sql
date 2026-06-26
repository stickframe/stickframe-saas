-- Costura engenharia<->comercial: vincula StickQuote tecnico a orcamento/cliente (aditivo).
alter table public.stickquote_versoes
  add column if not exists orcamento_id uuid references public.orcamentos(id) on delete set null,
  add column if not exists cliente_id   uuid references public.clientes(id) on delete set null;
create index if not exists stickquote_versoes_orcamento_idx on public.stickquote_versoes(orcamento_id);
