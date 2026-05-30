import { sb, getEmpresaId } from "../supabase";

export async function listarVistorias(obraId) {
  const { data, error } = await sb.from("vistorias").select("*")
    .eq("obra_id", obraId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function criarVistoria(vistoria) {
  const { data, error } = await sb.from("vistorias")
    .insert({ ...vistoria, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function atualizarVistoria(id, updates) {
  const { data, error } = await sb.from("vistorias").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deletarVistoria(id) {
  const { error } = await sb.from("vistorias").delete().eq("id", id);
  if (error) throw error;
}
