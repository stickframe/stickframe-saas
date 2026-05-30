import { sb, getEmpresaId } from "../supabase";

// ─── Fornecedores ─────────────────────────────────────────────────────────────
export async function listarFornecedores() {
  const { data, error } = await sb.from("fornecedores").select("*").eq("empresa_id", getEmpresaId()).order("nome");
  if (error) throw error;
  return data;
}

export async function criarFornecedor(f) {
  const { data, error } = await sb.from("fornecedores").insert({ ...f, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarFornecedor(id, updates) {
  const { data, error } = await sb.from("fornecedores").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarFornecedor(id) {
  const { error } = await sb.from("fornecedores").delete().eq("id", id);
  if (error) throw error;
}

// ─── Cotações ─────────────────────────────────────────────────────────────────
export async function listarCotacoes(fornecedorId) {
  const { data, error } = await sb
    .from("cotacoes")
    .select("*, obras(nome)")
    .eq("fornecedor_id", fornecedorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listarTodasCotacoes() {
  const { data, error } = await sb
    .from("cotacoes")
    .select("*, fornecedores(nome), obras(nome)")
    .eq("empresa_id", getEmpresaId())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function criarCotacao(c) {
  const { data, error } = await sb.from("cotacoes").insert({ ...c, empresa_id: getEmpresaId() }).select("*, obras(nome)").single();
  if (error) throw error;
  return data;
}

export async function atualizarCotacao(id, updates) {
  const { data, error } = await sb.from("cotacoes").update(updates).eq("id", id).select("*, obras(nome)").single();
  if (error) throw error;
  return data;
}

export async function deletarCotacao(id) {
  const { error } = await sb.from("cotacoes").delete().eq("id", id);
  if (error) throw error;
}
