import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

const isValidUrl = (u) => {
  if (!u) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const supabaseUrl = isValidUrl(url) ? url : "https://placeholder.supabase.co";
const supabaseKey = (key && key !== "COLE_AQUI") ? key : "placeholder";

export const sb = createClient(supabaseUrl, supabaseKey);

let _empresaId = null;
try {
  const persisted = JSON.parse(localStorage.getItem("stickframe-storage") || "{}");
  if (persisted?.state?.empresaId) {
    _empresaId = persisted.state.empresaId;
  }
} catch (_) {}

export const setEmpresaId = (id) => { _empresaId = id; };
export const getEmpresaId = () => _empresaId;
