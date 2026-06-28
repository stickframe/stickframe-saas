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
export const getEmpresaId = () => {
  if (!_empresaId) {
    try {
      const persisted = JSON.parse(localStorage.getItem("stickframe-storage") || "{}");
      if (persisted?.state?.empresaId) {
        _empresaId = persisted.state.empresaId;
      }
    } catch (_) {}
  }
  return _empresaId;
};

const SIGNED_URL_TTL = 60 * 60; // 1 hora

export async function getSignedUrl(storagePath) {
  if (!storagePath) return null;
  try {
    const { data, error } = await sb.storage
      .from("arquivos")
      .createSignedUrl(storagePath, SIGNED_URL_TTL);
    if (error) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function getSignedUrls(storagePaths) {
  if (!storagePaths || storagePaths.length === 0) return [];
  const results = await Promise.allSettled(
    storagePaths.map((path) => getSignedUrl(path))
  );
  return results.map((r) => (r.status === "fulfilled" ? r.value : null));
}
