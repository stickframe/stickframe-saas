import { sb, getEmpresaId } from "../supabase";

export async function listarConcorrencias() {
  const { data, error } = await sb
    .from("concorrencias")
    .select("*, concorrencia_itens(*), concorrencia_participantes(*)")
    .eq("empresa_id", getEmpresaId())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarConcorrencia(payload) {
  const { itens, participantes, ...conc } = payload;
  const { data: concData, error } = await sb
    .from("concorrencias")
    .insert({ ...conc, empresa_id: getEmpresaId() })
    .select()
    .single();
  if (error) throw error;

  if (itens?.length) {
    const { error: eI } = await sb.from("concorrencia_itens")
      .insert(itens.map((it, i) => ({ ...it, concorrencia_id: concData.id, ordem: i })));
    if (eI) throw eI;
  }

  if (participantes?.length) {
    const { error: eP } = await sb.from("concorrencia_participantes")
      .insert(participantes.map((p) => ({ ...p, concorrencia_id: concData.id })));
    if (eP) throw eP;
  }

  return concData;
}

export async function atualizarStatusConcorrencia(id, status) {
  const { error } = await sb.from("concorrencias").update({ status }).eq("id", id).eq("empresa_id", getEmpresaId());
  if (error) throw error;
}

export async function getResultado(concorrenciaId) {
  const { data, error } = await sb.rpc("concorrencia_get_resultado", {
    p_concorrencia_id: concorrenciaId,
    p_empresa_id: getEmpresaId(),
  });
  if (error) throw error;
  return data;
}

export async function adicionarParticipante(concorrenciaId, part) {
  const { data, error } = await sb.from("concorrencia_participantes")
    .insert({ ...part, concorrencia_id: concorrenciaId })
    .select().single();
  if (error) throw error;
  return data;
}
