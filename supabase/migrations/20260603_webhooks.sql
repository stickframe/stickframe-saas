create table if not exists public.webhooks (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  url         text not null,
  eventos     text[] not null default '{}',
  ativo       boolean default true,
  segredo     text,   -- HMAC secret for signature verification
  created_at  timestamptz not null default now()
);
alter table public.webhooks enable row level security;
create policy "empresa_own" on public.webhooks
  using  (empresa_id = (select empresa_id from public.usuarios where id = auth.uid()))
  with check (empresa_id = (select empresa_id from public.usuarios where id = auth.uid()));

-- Log of dispatched webhooks
create table if not exists public.webhook_logs (
  id          uuid primary key default gen_random_uuid(),
  webhook_id  uuid references public.webhooks(id) on delete cascade,
  evento      text not null,
  payload     jsonb,
  status_code integer,
  erro        text,
  created_at  timestamptz not null default now()
);
alter table public.webhook_logs enable row level security;
create policy "empresa_own" on public.webhook_logs
  using (exists (select 1 from public.webhooks w join public.usuarios u on u.empresa_id = w.empresa_id where w.id = webhook_id and u.id = auth.uid()));
