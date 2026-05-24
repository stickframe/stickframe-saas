import { sb, getEmpresaId, restoreEmpresaId } from "../supabase";

async function empresaId() {
  return getEmpresaId() || await restoreEmpresaId();
}

export async function listarClientes() {
  const { data, error } = await sb.from("clientes").select("*").eq("empresa_id", await empresaId()).order("created_at");
  if (error) throw error;
  return data;
}

export async function criarCliente(cliente) {
  const { data, error } = await sb.from("clientes").insert({ ...cliente, empresa_id: await empresaId() }).select().single();
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
