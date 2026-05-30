import { sb, getEmpresaId } from "../supabase";

export async function listarQuantitativos(obraId) {
  const { data, error } = await sb.from("quantitativos")
    .select("*").eq("empresa_id", getEmpresaId()).eq("obra_id", obraId)
    .order("fase").order("created_at");
  if (error) throw error;
  return data;
}
export async function criarQuantitativo(q) {
  const { data, error } = await sb.from("quantitativos")
    .insert({ ...q, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function atualizarQuantitativo(id, updates) {
  const { data, error } = await sb.from("quantitativos")
    .update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deletarQuantitativo(id) {
  const { error } = await sb.from("quantitativos").delete().eq("id", id);
  if (error) throw error;
}
export async function inserirTemplate(obraId, items) {
  const empresaId = getEmpresaId();
  const rows = items.map((i) => ({ ...i, obra_id: obraId, empresa_id: empresaId }));
  const { data, error } = await sb.from("quantitativos").insert(rows).select();
  if (error) throw error;
  return data;
}
