// 
// StickFrame StickFlow Repository
// 

import { sb, getEmpresaId } from "../supabase";

export async function listarStickFlows() {
  const { data, error } = await sb.from("stickflow").select("*").eq("empresa_id", getEmpresaId()).order("created_at");
  if (error) throw error;
  return data;
}

export async function criarStickFlow(stickflow) {
  const empresaId = getEmpresaId();
  if (!empresaId) throw new Error("Sessão expirada. Faça login novamente.");
  const { data, error } = await sb.from("stickflow").insert({ ...stickflow, empresa_id: empresaId }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarStickFlow(id, updates) {
  const { data, error } = await sb.from("stickflow").update({ ...updates, updated_at: new Date() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarStickFlow(id) {
  const { error } = await sb.from("stickflow").delete().eq("id", id);
  if (error) throw error;
}
