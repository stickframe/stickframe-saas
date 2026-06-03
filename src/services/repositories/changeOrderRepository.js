import { sb, getEmpresaId } from "../supabase";

export async function listarChangeOrders(obraId) {
  const { data, error } = await sb
    .from("change_orders")
    .select("*, criado_por:usuarios!criado_por(nome), aprovado_por:usuarios!aprovado_por(nome)")
    .eq("obra_id", obraId)
    .order("numero");
  if (error) throw error;
  return data || [];
}

export async function criarChangeOrder(obraId, payload) {
  const { data: me } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("change_orders")
    .insert({ ...payload, obra_id: obraId, empresa_id: getEmpresaId(), criado_por: me.user?.id })
    .select("*, criado_por:usuarios!criado_por(nome), aprovado_por:usuarios!aprovado_por(nome)")
    .single();
  if (error) throw error;
  return data;
}

export async function aprovarChangeOrder(id, obraId) {
  const { data: me } = await sb.auth.getUser();
  const { data: co } = await sb.from("change_orders").select("valor, tipo").eq("id", id).single();

  const { data, error } = await sb
    .from("change_orders")
    .update({ status: "aprovado", aprovado_por: me.user?.id, aprovado_em: new Date().toISOString() })
    .eq("id", id)
    .select("*, criado_por:usuarios!criado_por(nome), aprovado_por:usuarios!aprovado_por(nome)")
    .single();
  if (error) throw error;

  // Atualiza contrato da obra se for aditivo/supressão
  if (co && co.tipo !== "prazo" && co.valor !== 0) {
    const { data: obra } = await sb.from("obras").select("contrato").eq("id", obraId).single();
    const novoContrato = (Number(obra?.contrato) || 0) + Number(co.valor);
    await sb.from("obras").update({ contrato: novoContrato, updated_at: new Date() }).eq("id", obraId);
  }

  return data;
}

export async function reprovarChangeOrder(id) {
  const { data: me } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("change_orders")
    .update({ status: "reprovado", aprovado_por: me.user?.id, aprovado_em: new Date().toISOString() })
    .eq("id", id)
    .select("*, criado_por:usuarios!criado_por(nome), aprovado_por:usuarios!aprovado_por(nome)")
    .single();
  if (error) throw error;
  return data;
}

export async function deletarChangeOrder(id) {
  const { error } = await sb.from("change_orders").delete().eq("id", id).eq("status", "pendente");
  if (error) throw error;
}
