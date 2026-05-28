import { createClient } from "@supabase/supabase-js";

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

let _empresaId = null;
try {
  const persisted = JSON.parse(localStorage.getItem("stickframe-storage") || "{}");
  if (persisted?.state?.empresaId) {
    _empresaId = persisted.state.empresaId;
  }
} catch (e) {
  console.error("Erro ao carregar empresaId do localStorage:", e);
}

export const setEmpresaId = (id) => { _empresaId = id; };
export const getEmpresaId = () => _empresaId;
