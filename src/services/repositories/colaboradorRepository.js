import { sb, getEmpresaId } from "../supabase";

export async function listarColaboradores() {
  const empresaId = getEmpresaId();
  if (!empresaId) throw new Error("Sessão sem empresa — recarregue a página.");
  const { data, error } = await sb.from("colaboradores").select("*").eq("empresa_id", empresaId).order("nome");
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

//  Alocações 
export async function listarAlocacoes() {
  const { data, error } = await sb.from("alocacoes").select("*").eq("empresa_id", getEmpresaId()).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function criarAlocacao(a) {
  const { data, error } = await sb.from("alocacoes").insert({ ...a, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function deletarAlocacao(id) {
  const { error } = await sb.from("alocacoes").delete().eq("id", id);
  if (error) throw error;
}

//  Horas trabalhadas 
export async function listarHoras() {
  const { data, error } = await sb.from("horas_trabalhadas").select("*").eq("empresa_id", getEmpresaId()).order("data", { ascending: false });
  if (error) throw error;
  return data;
}
export async function criarHoras(h) {
  const { data, error } = await sb.from("horas_trabalhadas").insert({ ...h, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function deletarHoras(id) {
  const { error } = await sb.from("horas_trabalhadas").delete().eq("id", id);
  if (error) throw error;
}
