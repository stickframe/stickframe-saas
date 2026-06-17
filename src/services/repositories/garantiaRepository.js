import { sb, getEmpresaId } from "../supabase";

export async function listarChamados(obraId) {
  const { data, error } = await sb
    .from("chamados_garantia")
    .select("*")
    .eq("obra_id", obraId)
    .eq("empresa_id", getEmpresaId())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adicionarChamado(chamado) {
  const { data, error } = await sb
    .from("chamados_garantia")
    .insert({ ...chamado, empresa_id: getEmpresaId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarChamado(id, payload) {
  const { data, error } = await sb
    .from("chamados_garantia")
    .update(payload)
    .eq("id", id)
    .eq("empresa_id", getEmpresaId())
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function excluirChamado(id) {
  const { error } = await sb
    .from("chamados_garantia")
    .delete()
    .eq("id", id)
    .eq("empresa_id", getEmpresaId());
  if (error) throw error;
}

//  Garantias (warranty tracking) 

export async function listarGarantias(obraId) {
  const { data, error } = await sb.from("garantias")
    .select("*").eq("obra_id", obraId).order("data_fim");
  if (error) throw error;
  // Auto-update status based on dates
  const hoje = new Date();
  return (data || []).map(g => {
    const fim = new Date(g.data_fim);
    const diasRestantes = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
    let status = g.status;
    if (status !== "Acionada") {
      if (diasRestantes < 0) status = "Vencida";
      else if (diasRestantes <= 90) status = "Vencendo";
      else status = "Vigente";
    }
    return { ...g, status, diasRestantes };
  });
}

export async function criarGarantia(payload) {
  const { data, error } = await sb.from("garantias").insert({
    ...payload, empresa_id: getEmpresaId(),
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function atualizarGarantia(id, updates) {
  const { data, error } = await sb.from("garantias").update(updates).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deletarGarantia(id) {
  const { error } = await sb.from("garantias").delete().eq("id", id);
  if (error) throw error;
}
