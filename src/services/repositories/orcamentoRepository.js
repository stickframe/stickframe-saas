import { sb, getEmpresaId } from "../supabase";

export async function listarOrcamentos() {
  const { data, error } = await sb.from("orcamentos").select("*").eq("empresa_id", getEmpresaId()).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function criarOrcamento(o) {
  const { data, error } = await sb.from("orcamentos").insert({ ...o, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function atualizarOrcamento(id, updates) {
  const { data, error } = await sb.from("orcamentos").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deletarOrcamento(id) {
  const { error } = await sb.from("orcamentos").delete().eq("id", id);
  if (error) throw error;
}
