-- Remove política RLS redundante e incorreta da ambientes_qr (empresa_id = auth.uid()).
-- As políticas corretas com get_empresa_id() permanecem; comportamento inalterado.
drop policy if exists empresa_own_ambientes on public.ambientes_qr;
