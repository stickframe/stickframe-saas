import { sb, getEmpresaId } from "../supabase";

//  Pedidos 
export async function listarPedidos(filters = {}) {
  let q = sb.from("suprimentos_pedidos")
    .select("*, obra:obras(nome)")
    .eq("empresa_id", getEmpresaId())
    .order("created_at", { ascending: false });
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.obra_id) q = q.eq("obra_id", filters.obra_id);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function criarPedido(d) {
  const { data, error } = await sb.from("suprimentos_pedidos")
    .insert({ ...d, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarPedido(id, updates) {
  const { data, error } = await sb.from("suprimentos_pedidos").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarPedido(id) {
  const { error } = await sb.from("suprimentos_pedidos").delete().eq("id", id);
  if (error) throw error;
}

//  Estoque 
export async function listarEstoque() {
  const { data, error } = await sb.from("suprimentos_estoque")
    .select("*")
    .eq("empresa_id", getEmpresaId())
    .order("item");
  if (error) throw error;
  return data || [];
}

export async function criarItemEstoque(d) {
  const { data, error } = await sb.from("suprimentos_estoque")
    .insert({ ...d, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarItemEstoque(id, updates) {
  const { data, error } = await sb.from("suprimentos_estoque").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarItemEstoque(id) {
  const { error } = await sb.from("suprimentos_estoque").delete().eq("id", id);
  if (error) throw error;
}

//  Movimentos 
export async function registrarMovimento(d) {
  const { data, error } = await sb.from("suprimentos_movimentos")
    .insert({ ...d, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  // Atualiza saldo do item
  const delta = d.tipo === "entrada" ? d.quantidade : -d.quantidade;
  await sb.rpc("incrementar_estoque", { p_id: d.estoque_id, p_delta: delta }).maybeSingle();
  return data;
}

export async function listarMovimentos(estoque_id) {
  const { data, error } = await sb.from("suprimentos_movimentos")
    .select("*")
    .eq("empresa_id", getEmpresaId())
    .eq("estoque_id", estoque_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
