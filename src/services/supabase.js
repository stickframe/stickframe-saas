import { createClient } from "@supabase/supabase-js";

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

let _empresaId = null;
export const setEmpresaId = (id) => { _empresaId = id; };
export const getEmpresaId = () => _empresaId;

// Restaura empresa_id após refresh de página
export async function restoreEmpresaId() {
  if (_empresaId) return _empresaId;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("usuarios").select("empresa_id").eq("id", user.id).single();
  if (data?.empresa_id) setEmpresaId(data.empresa_id);
  return data?.empresa_id || null;
}
