import { sb, getEmpresaId, restoreEmpresaId } from "../supabase";

async function empresaId() {
  return await empresaId() || await restoreEmpresaId();
}

export async function listarHistorico() {
  const { data, error } = await sb.from("historico").select("*").eq("empresa_id", await empresaId()).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data;
}
export async function adicionarHistorico(registro) {
  const { data, error } = await sb.from("historico").insert({ ...registro, empresa_id: await empresaId() }).select().single();
  if (error) throw error;
  return data;
}
