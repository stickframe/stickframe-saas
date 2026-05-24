import { sb, getEmpresaId, restoreEmpresaId } from "../supabase";

async function empresaId() {
  return await empresaId() || await restoreEmpresaId();
}

export async function listarObras() {
  const { data, error } = await sb.from("obras").select("*").eq("empresa_id", await empresaId()).order("created_at");
  if (error) throw error;
  return data;
}
export async function atualizarFase(id, fase, progresso) {
  const { data, error } = await sb.from("obras").update({ fase, progresso, updated_at: new Date() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function listarDiario(obraId) {
  const { data, error } = await sb.from("diario").select("*").eq("obra_id", obraId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function adicionarDiario(obraId, registro, usuarioId, empresaId) {
  const { data, error } = await sb.from("diario").insert({ ...registro, obra_id: obraId, empresa_id: empresaId, usuario_id: usuarioId }).select().single();
  if (error) throw error;
  return data;
}
export async function listarMedicoes(obraId) {
  const { data, error } = await sb.from("medicoes").select("*").eq("obra_id", obraId).order("numero");
  if (error) throw error;
  return data;
}
export async function adicionarMedicao(obraId, medicao, empresaId) {
  const { data, error } = await sb.from("medicoes").insert({ ...medicao, obra_id: obraId, empresa_id: empresaId }).select().single();
  if (error) throw error;
  return data;
}
export async function aprovarMedicao(id) {
  const { data, error } = await sb.from("medicoes").update({ status: "Aprovada" }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function listarArquivos(obraId) {
  const { data, error } = await sb.from("arquivos").select("*").eq("obra_id", obraId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function adicionarArquivos(obraId, arquivos, empresaId) {
  const rows = arquivos.map((a) => ({ ...a, obra_id: obraId, empresa_id: empresaId }));
  const { data, error } = await sb.from("arquivos").insert(rows).select();
  if (error) throw error;
  return data;
}
export async function deletarArquivo(id) {
  const { error } = await sb.from("arquivos").delete().eq("id", id);
  if (error) throw error;
}
export function subscribeObras(callback) {
  return sb.channel("obras-rt").on("postgres_changes", { event: "*", schema: "public", table: "obras" }, callback).subscribe();
}
export function subscribeDiario(obraId, callback) {
  return sb.channel(`diario-${obraId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "diario", filter: `obra_id=eq.${obraId}` }, callback).subscribe();
}
