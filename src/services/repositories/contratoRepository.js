import { sb, getEmpresaId } from "../supabase";

export async function listarContratos() {
  const { data, error } = await sb.from("contratos").select("*").eq("empresa_id", getEmpresaId()).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function criarContrato(contrato) {
  const { data, error } = await sb.from("contratos").insert({ ...contrato, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function atualizarContrato(id, updates) {
  const { data, error } = await sb.from("contratos").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deletarContrato(id) {
  const { error } = await sb.from("contratos").delete().eq("id", id);
  if (error) throw error;
}
