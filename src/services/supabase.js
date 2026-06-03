import { createClient } from "@supabase/supabase-js";

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co",
  import.meta.env.VITE_SUPABASE_KEY || "placeholder"
);

let _empresaId = null;
try {
  const persisted = JSON.parse(localStorage.getItem("stickframe-storage") || "{}");
  if (persisted?.state?.empresaId) {
    _empresaId = persisted.state.empresaId;
  }
} catch (_) {}

export const setEmpresaId = (id) => { _empresaId = id; };
export const getEmpresaId = () => _empresaId;
