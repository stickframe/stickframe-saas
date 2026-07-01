/**
 * StickFEM™ — Repositório (Supabase). CRUD das entidades estruturais.
 * empresa_id é sempre injetado; a RLS garante o isolamento por empresa.
 */
import { sb, getEmpresaId } from "../supabase";

export async function listarPerfis() {
  const { data, error } = await sb
    .from("perfil_estrutural")
    .select("id, nome, tipo, largura_mm, altura_mm, espessura_mm, aba_mm, area_mm2, inercia_x_mm4, inercia_y_mm4, modulo_wx_mm3, peso_kg_m, empresa_id")
    .order("tipo").order("altura_mm");
  if (error) throw error;
  return data || [];
}

export async function listarProjetos() {
  const { data, error } = await sb
    .from("projeto_estrutural")
    .select("id, nome, descricao, status, obra_id, pe_direito_m, espac_montante_mm, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function criarProjeto({ nome, descricao, obraId, peDireito, espacMontante }) {
  const empresa_id = getEmpresaId();
  if (!empresa_id) throw new Error("empresa_id não encontrado");
  const { data, error } = await sb.from("projeto_estrutural").insert({
    empresa_id, nome, descricao: descricao || null, obra_id: obraId || null,
    pe_direito_m: peDireito ?? 2.8, espac_montante_mm: espacMontante ?? 400,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function atualizarStatusProjeto(id, status) {
  const { error } = await sb.from("projeto_estrutural")
    .update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function salvarArquivoCad(projetoId, arq) {
  const empresa_id = getEmpresaId();
  const { data, error } = await sb.from("arquivo_cad").insert({
    empresa_id, projeto_id: projetoId,
    nome_arquivo: arq.nomeArquivo, formato: arq.formato || "dxf",
    storage_path: arq.storagePath || null, url: arq.url || null, hash: arq.hash || null,
    layers: arq.layers || [], geometria: arq.geometria || {}, stats: arq.stats || {},
  }).select().single();
  if (error) throw error;
  return data;
}

export async function salvarElementos(projetoId, arquivoId, elementos) {
  const empresa_id = getEmpresaId();
  const rows = (elementos || []).map((e) => ({
    empresa_id, projeto_id: projetoId, arquivo_id: arquivoId || null,
    tipo: e.tipo, nome: e.nome, geometria: e.geometria || {},
    comprimento_m: e.comprimento_m ?? null, altura_m: e.altura_m ?? null,
    layer_origem: e.layer_origem || null, perfil_id: e.perfil_id || null,
    quantidade: e.quantidade ?? 1, confianca: e.confianca || "media",
    propriedades: e.propriedades || {},
  }));
  if (!rows.length) return [];
  const { data, error } = await sb.from("elemento_estrutural").insert(rows).select();
  if (error) throw error;
  return data || [];
}

export async function salvarAnalise(projetoId, { solver, status, modeloAnalitico, resultado, statusEstrutural }) {
  const empresa_id = getEmpresaId();
  const { data, error } = await sb.from("analise").insert({
    empresa_id, projeto_id: projetoId, solver: solver || null,
    status: status || "pendente", modelo_analitico: modeloAnalitico || {},
    resultado: resultado || {}, status_estrutural: statusEstrutural || null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function registrarAprovacao(projetoId, { analiseId, engenheiroNome, engenheiroCrea, status, observacoes }) {
  const empresa_id = getEmpresaId();
  const { data, error } = await sb.from("aprovacao_tecnica").insert({
    empresa_id, projeto_id: projetoId, analise_id: analiseId || null,
    engenheiro_nome: engenheiroNome || null, engenheiro_crea: engenheiroCrea || null,
    status: status || "pendente", observacoes: observacoes || null,
    aprovado_em: status === "aprovado" ? new Date().toISOString() : null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function carregarProjeto(id) {
  const [proj, arqs, els, aprovs] = await Promise.all([
    sb.from("projeto_estrutural").select("*").eq("id", id).single(),
    sb.from("arquivo_cad").select("*").eq("projeto_id", id).order("created_at", { ascending: false }),
    sb.from("elemento_estrutural").select("*").eq("projeto_id", id),
    sb.from("aprovacao_tecnica").select("*").eq("projeto_id", id).order("created_at", { ascending: false }),
  ]);
  return {
    projeto: proj.data || null,
    arquivos: arqs.data || [],
    elementos: els.data || [],
    aprovacoes: aprovs.data || [],
  };
}
