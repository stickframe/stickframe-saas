import { createClient } from "@supabase/supabase-js";

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

let _empresaId = null;
let _restoring = false; // evita loop

export const setEmpresaId = (id) => { _empresaId = id; };
export const getEmpresaId = () => _empresaId;

export async function restoreEmpresaId() {
  if (_empresaId) return _empresaId;
  if (_restoring) return null; // evita recursão
  _restoring = true;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return null;
    const { data } = await sb
      .from("usuarios")
      .select("empresa_id")
      .eq("id", session.user.id)
      .single();
    if (data?.empresa_id) {
      _empresaId = data.empresa_id;
    }
    return _empresaId;
  } catch {
    return null;
  } finally {
    _restoring = false;
  }
}
