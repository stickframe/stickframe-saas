import { sb, getEmpresaId } from "../supabase";

export async function listarClientes() {
  const { data, error } = await sb.from("clientes").select("*").eq("empresa_id", getEmpresaId()).order("created_at");
  if (error) throw error;
  return data;
}
export async function criarCliente(cliente) {
  const empresaId = getEmpresaId();
  if (!empresaId) throw new Error("Sessão expirada. Faça login novamente.");
  const { data, error } = await sb.from("clientes").insert({ ...cliente, empresa_id: empresaId }).select().single();
  if (error) throw error;
  return data;
}
export async function atualizarCliente(id, updates) {
  const { data, error } = await sb.from("clientes").update({ ...updates, updated_at: new Date() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deletarCliente(id) {
  const { error } = await sb.from("clientes").delete().eq("id", id);
  if (error) throw error;
}
export async function importarClientes(lista) {
  const empresaId = getEmpresaId();
  if (!empresaId) throw new Error("Sessão expirada. Faça login novamente.");
  const rows = lista.map((c) => ({ ...c, empresa_id: empresaId }));
  const { data, error } = await sb.from("clientes").insert(rows).select();
  if (error) throw error;
  return data;
}
