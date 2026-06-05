-- Fix RLS policies for concorrencias table
ALTER TABLE concorrencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "concorrencias_insert" ON concorrencias;
DROP POLICY IF EXISTS "concorrencias_select" ON concorrencias;
DROP POLICY IF EXISTS "concorrencias_update" ON concorrencias;
DROP POLICY IF EXISTS "concorrencias_delete" ON concorrencias;
DROP POLICY IF EXISTS "insert_concorrencias" ON concorrencias;
DROP POLICY IF EXISTS "select_concorrencias" ON concorrencias;
DROP POLICY IF EXISTS "update_concorrencias" ON concorrencias;
DROP POLICY IF EXISTS "delete_concorrencias" ON concorrencias;

CREATE POLICY "concorrencias_select" ON concorrencias
  FOR SELECT USING (empresa_id = get_empresa_id());

CREATE POLICY "concorrencias_insert" ON concorrencias
  FOR INSERT WITH CHECK (empresa_id = get_empresa_id());

CREATE POLICY "concorrencias_update" ON concorrencias
  FOR UPDATE USING (empresa_id = get_empresa_id());

CREATE POLICY "concorrencias_delete" ON concorrencias
  FOR DELETE USING (empresa_id = get_empresa_id());
