import { sb, getEmpresaId } from "../supabase";

export async function listarApontamentos(obraId) {
  const { data, error } = await sb
    .from("apontamentos")
    .select("*, responsavel:usuarios!responsavel_id(nome), criador:auth.users!criado_por(email)")
    .eq("obra_id", obraId)
    .order("created_at");
  if (error) throw error;
  return data || [];
}

export async function listarApontamentosArquivo(arquivoId) {
  const { data, error } = await sb
    .from("apontamentos")
    .select("*")
    .eq("arquivo_id", arquivoId)
    .order("created_at");
  if (error) throw error;
  return data || [];
}

export async function criarApontamento(payload) {
  const { data: me } = await sb.auth.getUser();
  const { data, error } = await sb.from("apontamentos").insert({
    ...payload,
    empresa_id: getEmpresaId(),
    criado_por: me.user?.id,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function atualizarApontamento(id, updates) {
  const { data, error } = await sb.from("apontamentos").update(updates).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function resolverApontamento(id, fotodepois = null) {
  const { data: me } = await sb.auth.getUser();
  const { data, error } = await sb.from("apontamentos").update({
    status: "Resolvido",
    resolvido_em: new Date().toISOString(),
    resolvido_por: me.user?.id,
    ...(fotodepois ? { foto_depois: fotodepois } : {}),
  }).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deletarApontamento(id) {
  const { error } = await sb.from("apontamentos").delete().eq("id", id);
  if (error) throw error;
}
