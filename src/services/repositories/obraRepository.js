import { sb, getEmpresaId } from "../supabase";

export async function listarObras() {
  const { data, error } = await sb.from("obras").select("*").eq("empresa_id", getEmpresaId()).order("created_at");
  if (error) throw error;
  return data;
}
export async function criarObra(obra) {
  const { data, error } = await sb.from("obras").insert({ ...obra, empresa_id: getEmpresaId() }).select().single();
  if (error) throw error;
  return data;
}
export async function atualizarObra(id, updates) {
  const { data, error } = await sb.from("obras").update({ ...updates, updated_at: new Date() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deletarObra(id) {
  const { error } = await sb.from("obras").delete().eq("id", id);
  if (error) throw error;
}
export async function atualizarFase(id, fase, progresso) {
  const { data, error } = await sb.from("obras").update({ fase, progresso, updated_at: new Date() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function listarDiario(obraId) {
  const { data, error } = await sb.from("diario").select("*").eq("obra_id", obraId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function adicionarDiario(obraId, registro, usuarioId, empresaId) {
  const { data, error } = await sb.from("diario").insert({ ...registro, obra_id: obraId, empresa_id: empresaId, usuario_id: usuarioId }).select().single();
  if (error) throw error;
  return data;
}
export async function listarMedicoes(obraId) {
  const { data, error } = await sb.from("medicoes").select("*").eq("obra_id", obraId).order("numero");
  if (error) throw error;
  return data;
}
export async function adicionarMedicao(obraId, medicao, empresaId) {
  const { data, error } = await sb.from("medicoes").insert({ ...medicao, obra_id: obraId, empresa_id: empresaId }).select().single();
  if (error) throw error;
  return data;
}
export async function aprovarMedicao(id) {
  const { data, error } = await sb.from("medicoes").update({ status: "Aprovada" }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function listarArquivos(obraId) {
  const { data, error } = await sb.from("arquivos").select("*").eq("obra_id", obraId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    ...row,
    url: row.storage_path
      ? sb.storage.from("arquivos").getPublicUrl(row.storage_path).data.publicUrl
      : null,
    path: row.storage_path,
  }));
}
export async function adicionarArquivos(obraId, arquivos, empresaId) {
  const rows = [];
  for (const a of arquivos) {
    let storagePath = null;
    if (a.file) {
      const ext  = a.file.name.split(".").pop();
      storagePath = `${empresaId}/${obraId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await sb.storage.from("arquivos").upload(storagePath, a.file, { upsert: false });
      if (upErr) throw upErr;
    }
    rows.push({
      obra_id:      obraId,
      empresa_id:   empresaId,
      nome:         a.nome,
      tipo:         a.tipo,
      tamanho:      a.tamanho,
      data:         a.data,
      categoria:    a.categoria,
      fase:         a.fase       || null,
      disciplina:   a.disciplina || null,
      status_doc:   a.status_doc || "Ativo",
      storage_path: storagePath,
    });
  }
  const { data, error } = await sb.from("arquivos").insert(rows).select();
  if (error) throw error;
  // Enriquecer com URL pública
  return (data || []).map((row) => ({
    ...row,
    url: row.storage_path
      ? sb.storage.from("arquivos").getPublicUrl(row.storage_path).data.publicUrl
      : null,
    path: row.storage_path,
  }));
}
export async function deletarArquivo(id, storagePath) {
  if (storagePath) await sb.storage.from("arquivos").remove([storagePath]);
  const { error } = await sb.from("arquivos").delete().eq("id", id);
  if (error) throw error;
}
export async function gerarCobrancaAsaas(medicaoId, { nomeCliente, cpfCnpj, valor, descricao, dataVencimento }) {
  const { data, error } = await sb.functions.invoke("asaas-cobranca", {
    body: { nomeCliente, cpfCnpj, valor, descricao, dataVencimento, medicaoId },
  });
  if (error) throw error;
  // Save back to medicao
  await sb.from("medicoes").update({
    asaas_id: data.asaas_id,
    link_pagamento: data.link_pagamento,
    asaas_status: data.status,
    data_vencimento: dataVencimento,
  }).eq("id", medicaoId);
  return data;
}

export async function atualizarVencimentoMedicao(id, data_vencimento) {
  const { data, error } = await sb.from("medicoes").update({ data_vencimento }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export function subscribeObras(callback) {
  return sb.channel("obras-rt").on("postgres_changes", { event: "*", schema: "public", table: "obras" }, callback).subscribe();
}
export function subscribeDiario(obraId, callback) {
  return sb.channel(`diario-${obraId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "diario", filter: `obra_id=eq.${obraId}` }, callback).subscribe();
}
