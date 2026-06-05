import { sb, getEmpresaId } from "../supabase";

export async function listarChangeOrders(obraId) {
  const { data, error } = await sb
    .from("change_orders")
    .select("*")
    .eq("obra_id", obraId)
    .eq("empresa_id", getEmpresaId())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarChangeOrder(co) {
  const { data, error } = await sb
    .from("change_orders")
    .insert({ ...co, empresa_id: getEmpresaId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarChangeOrder(id, updates) {
  const { data, error } = await sb
    .from("change_orders")
    .update({ ...updates, updated_at: new Date() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function aprovarChangeOrder(id, aprovadoPor) {
  return atualizarChangeOrder(id, {
    status: "Aprovado",
    aprovado_por: aprovadoPor,
    data_aprovacao: new Date().toISOString(),
  });
}

export async function rejeitarChangeOrder(id, motivo) {
  return atualizarChangeOrder(id, { status: "Rejeitado", observacoes: motivo });
}

export async function deletarChangeOrder(id) {
  const { error } = await sb.from("change_orders").delete().eq("id", id);
  if (error) throw error;
}
