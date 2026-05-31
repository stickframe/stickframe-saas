import { sb, getEmpresaId } from "../supabase";

const T = "monitoramento_precos";

export async function listarMonitorados() {
  const { data, error } = await sb
    .from(T)
    .select("*")
    .eq("empresa_id", getEmpresaId())
    .order("nome_produto");
  if (error) throw error;
  return data;
}

export async function adicionarMonitor({ nome_produto, url, insumo_ref, loja }) {
  const { data, error } = await sb
    .from(T)
    .insert({ nome_produto, url, insumo_ref: insumo_ref || null, loja: loja || null, empresa_id: getEmpresaId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarPrecoMonitor(id, { preco_atual, preco_anterior, data_captura, status, erro_msg }) {
  const payload = { status };
  if (preco_atual !== undefined) payload.preco_atual = preco_atual;
  if (preco_anterior !== undefined) payload.preco_anterior = preco_anterior;
  if (data_captura !== undefined) payload.data_captura = data_captura;
  if (erro_msg !== undefined) payload.erro_msg = erro_msg;
  const { data, error } = await sb.from(T).update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function removerMonitor(id) {
  const { error } = await sb.from(T).delete().eq("id", id);
  if (error) throw error;
}

export async function listarPrecosVivos() {
  const { data, error } = await sb
    .from(T)
    .select("insumo_ref, preco_atual, data_captura, loja")
    .eq("empresa_id", getEmpresaId())
    .eq("status", "Ativo")
    .not("insumo_ref", "is", null)
    .not("preco_atual", "is", null);
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => { map[r.insumo_ref] = r; });
  return map;
}

// Chama a Edge Function de scraping
export async function scrapePreco(url) {
  const { data, error } = await sb.functions.invoke("scrape-preco", { body: { url } });
  if (error) throw error;
  return data; // { preco, loja, nome_produto, status, error? }
}
