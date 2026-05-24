import { createClient } from "@supabase/supabase-js";

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

// Helper: retorna empresa_id do usuário logado via cache na store
let _empresaId = null;
export const setEmpresaId = (id) => { _empresaId = id; };
export const getEmpresaId = () => _empresaId;
