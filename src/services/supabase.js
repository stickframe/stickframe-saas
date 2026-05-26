import { createClient } from "@supabase/supabase-js";

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

let _empresaId = null;
export const setEmpresaId = (id) => { _empresaId = id; };
export const getEmpresaId = () => _empresaId;
