import { sb, getEmpresaId } from "../supabase";

export async function listarNCRs(obraId) {
  const { data, error } = await sb.from("nao_conformidades")
    .select("*").eq("obra_id", obraId).order("numero");
  if (error) throw error;
  return data || [];
}

export async function criarNCR(payload) {
  const { data: me } = await sb.auth.getUser();
  const { data, error } = await sb.from("nao_conformidades").insert({
    ...payload, empresa_id: getEmpresaId(), criado_por: me.user?.id,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function atualizarNCR(id, updates) {
  const { data, error } = await sb.from("nao_conformidades").update(updates).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function fecharNCR(id, acaoCorretiva) {
  const { data: me } = await sb.auth.getUser();
  const { data, error } = await sb.from("nao_conformidades").update({
    status: "Fechada", acao_corretiva: acaoCorretiva,
    verificado_em: new Date().toISOString(), fechado_em: new Date().toISOString(),
  }).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deletarNCR(id) {
  const { error } = await sb.from("nao_conformidades").delete().eq("id", id);
  if (error) throw error;
}
