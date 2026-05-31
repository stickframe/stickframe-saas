import { sb, getEmpresaId } from "../supabase";

const T = "estoque_retalhos";

export async function listarRetalhos(tipos = []) {
  let q = sb.from(T)
    .select("*, obras(nome)")
    .eq("empresa_id", getEmpresaId())
    .eq("status", "Disponível")
    .order("comprimento_mm", { ascending: false });
  if (tipos.length) q = q.in("tipo_perfil", tipos);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function registrarRetalho({ tipo_perfil, comprimento_mm, obra_id = null, observacoes = "" }) {
  const { data, error } = await sb.from(T)
    .insert({ tipo_perfil, comprimento_mm, obra_id, observacoes, empresa_id: getEmpresaId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function marcarUsado(id) {
  const { error } = await sb.from(T).update({ status: "Utilizado" }).eq("id", id);
  if (error) throw error;
}

export async function marcarReservado(id) {
  const { error } = await sb.from(T).update({ status: "Reservado" }).eq("id", id);
  if (error) throw error;
}

export async function deletarRetalho(id) {
  const { error } = await sb.from(T).delete().eq("id", id);
  if (error) throw error;
}
