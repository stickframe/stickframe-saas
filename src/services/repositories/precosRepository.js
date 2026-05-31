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
    .insert({ nome_produto, url: url || null, insumo_ref: insumo_ref || null, loja: loja || null, empresa_id: getEmpresaId(), status: "Ativo" })
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

// Histórico de preço de um produto (últimos N dias)
export async function listarHistoricoPreco(monitorId, dias = 60) {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  const { data, error } = await sb
    .from("historico_precos")
    .select("preco, data_captura")
    .eq("monitor_id", monitorId)
    .gte("data_captura", desde.toISOString().split("T")[0])
    .order("data_captura", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Chama a Edge Function de scraping
export async function scrapePreco(url) {
  const { data, error } = await sb.functions.invoke("scrape-preco", { body: { url } });
  if (error) throw error;
  return data;
}

// Chama a Edge Function de scraping de categoria (retorna lista de produtos)
export async function scraperCategoria(url) {
  const { data, error } = await sb.functions.invoke("scrape-categoria", { body: { url } });
  if (error) throw error;
  return data; // { status, total, produtos: [{ nome_produto, url, loja, preco_atual }] }
}

// Insere múltiplos itens de uma vez (import de categoria)
export async function importarMonitores(itens) {
  const empresaId = getEmpresaId();
  const rows = itens.map((i) => ({
    empresa_id:   empresaId,
    nome_produto: i.nome_produto,
    url:          i.url || null,
    loja:         i.loja || null,
    preco_atual:  i.preco_atual || null,
    data_captura: i.preco_atual ? new Date().toISOString() : null,
    status:       "Ativo",
  }));
  const { data, error } = await sb.from(T).insert(rows).select();
  if (error) throw error;
  return data;
}
