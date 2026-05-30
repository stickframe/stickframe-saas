import { sb, getEmpresaId } from "../supabase";

export async function listarColaboradores() {
  const { data, error } = await sb.from("colaboradores").select("*").eq("empresa_id", getEmpresaId()).order("nome");
  if (error) throw error;
  return data;
}
export async function criarColaborador(c) {
  const { data, error } = await sb.from("colaboradores").insert({ ...c, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function atualizarColaborador(id, updates) {
  const { data, error } = await sb.from("colaboradores").update({ ...updates, updated_at: new Date() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deletarColaborador(id) {
  const { error } = await sb.from("colaboradores").delete().eq("id", id);
  if (error) throw error;
}
