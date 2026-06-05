import { sb, getEmpresaId } from "../supabase";

export async function listarCertificacoes(colaboradorId = null) {
  let q = sb.from("certificacoes").select("*, colaborador:colaboradores(nome,cargo)").eq("empresa_id", getEmpresaId());
  if (colaboradorId) q = q.eq("colaborador_id", colaboradorId);
  const { data, error } = await q.order("data_validade");
  if (error) throw error;
  return (data || []).map(c => ({
    ...c,
    diasRestantes: Math.ceil((new Date(c.data_validade) - new Date()) / 86400000),
    status: calcStatus(c.data_validade),
  }));
}

function calcStatus(validade) {
  const dias = Math.ceil((new Date(validade) - new Date()) / 86400000);
  if (dias < 0) return "Vencida";
  if (dias <= 30) return "Vencendo";
  return "Vigente";
}

export async function criarCertificacao(c) {
  const { data, error } = await sb.from("certificacoes").insert({ ...c, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarCertificacao(id, updates) {
  const { data, error } = await sb.from("certificacoes").update({ ...updates, updated_at: new Date() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletarCertificacao(id) {
  const { error } = await sb.from("certificacoes").delete().eq("id", id);
  if (error) throw error;
}

export async function listarVencendoEm30Dias() {
  const em30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const { data, error } = await sb
    .from("certificacoes")
    .select("*, colaborador:colaboradores(nome)")
    .eq("empresa_id", getEmpresaId())
    .lte("data_validade", em30)
    .order("data_validade");
  if (error) throw error;
  return data || [];
}
