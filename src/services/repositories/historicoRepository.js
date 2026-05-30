import { sb, getEmpresaId } from "../supabase";

export async function listarHistorico() {
  const { data, error } = await sb.from("historico").select("*").eq("empresa_id", getEmpresaId()).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data;
}
export async function adicionarHistorico(registro) {
  const { data, error } = await sb.from("historico").insert({ ...registro, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function listarHistoricoObra(obraId) {
  const { data, error } = await sb.from("historico").select("*").eq("obra_id", obraId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data;
}
