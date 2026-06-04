import { sb, getEmpresaId } from "../supabase";

export async function listarRFIs(obraId) {
  const { data, error } = await sb.from("rfis")
    .select("*").eq("obra_id", obraId).order("numero");
  if (error) throw error;
  return data || [];
}

export async function criarRFI(payload) {
  const { data, error } = await sb.from("rfis").insert({
    ...payload, empresa_id: getEmpresaId(),
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function atualizarRFI(id, updates) {
  const { data, error } = await sb.from("rfis").update(updates).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function responderRFI(id, resposta) {
  const { data, error } = await sb.from("rfis").update({
    resposta,
    status: "Respondido",
    data_resposta: new Date().toISOString().split("T")[0],
  }).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deletarRFI(id) {
  const { error } = await sb.from("rfis").delete().eq("id", id);
  if (error) throw error;
}
