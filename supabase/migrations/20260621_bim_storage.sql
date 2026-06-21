-- Create BIM storage bucket if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bim',
  'bim',
  true,
  524288000, -- 500MB
  array['application/octet-stream', 'model/ifc', 'application/ifc', 'application/x-step']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 524288000;

-- Storage RLS policies for bim bucket
drop policy if exists "bim_select"  on storage.objects;
drop policy if exists "bim_insert"  on storage.objects;
drop policy if exists "bim_delete"  on storage.objects;

create policy "bim_select" on storage.objects for select
  using (bucket_id = 'bim');

create policy "bim_insert" on storage.objects for insert
  with check (bucket_id = 'bim' and auth.role() = 'authenticated');

create policy "bim_delete" on storage.objects for delete
  using (bucket_id = 'bim' and auth.role() = 'authenticated');

-- Add tipo column to bim_modelos if missing
alter table public.bim_modelos add column if not exists tipo text;
