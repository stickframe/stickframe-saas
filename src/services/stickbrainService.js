// ─────────────────────────────────────────────────────────────────────────────
// StickBrain™ Analytics — inteligência de conversão do funil técnico→comercial.
// Métricas reais via RPC stickbrain_metricas() + copiloto de decisão (OpenAI).
//
// PRIVACIDADE: ao acionar o copiloto enviamos apenas AGREGADOS numéricos do funil
// (contagens, taxas, valores totais) — nunca dados pessoais de clientes.
// ─────────────────────────────────────────────────────────────────────────────

import { sb } from "./supabase";

const VISION_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4-turbo", "chatgpt-4o-latest", "gpt-3.5-turbo"];

/** Carrega as métricas do funil (escopadas à empresa via RLS/SECURITY DEFINER). */
export async function carregarMetricasFunil() {
  const { data, error } = await sb.rpc("stickbrain_metricas");
  if (error) throw error;
  return data || {};
}

/** Dashboard Analytics completo (pipeline, KPIs, funil, origens, evolução). */
export async function carregarDashboard(periodo = "90d") {
  const { data, error } = await sb.rpc("stickbrain_dashboard", { p_periodo: periodo });
  if (error) throw error;
  return data || {};
}

async function carregarChaveIA(empresaId) {
  let q = sb.from("ia_config").select("openai_key, modelo_openai");
  if (empresaId) q = q.eq("empresa_id", empresaId);
  const { data } = await q.limit(1).maybeSingle();
  if (!data || !data.openai_key) {
    throw new Error("Chave OpenAI não configurada. Vá em Configurações → IA para usar o copiloto StickBrain.");
  }
  const modelo = VISION_MODELS.includes(data.modelo_openai) ? data.modelo_openai : "gpt-4o-mini";
  return { key: data.openai_key, modelo };
}

const PROMPT_STICKBRAIN = `Você é o StickBrain™, copiloto de inteligência comercial para uma empresa de construção em Steel Frame. Recebe MÉTRICAS AGREGADAS do funil (lead → StickQuote técnico → orçamento → proposta → negociação → fechado/perdido). Sua função é gerar DECISÕES, não apenas análises.

Regras:
- Não invente dados. Use apenas os números recebidos. Se algo for 0 ou ausente, diga "dado insuficiente" em vez de supor.
- Seja objetivo e direto. Priorize impacto financeiro.
- "taxa_orfao" alta = StickQuotes calculados que nunca viraram orçamento (desperdício de engenharia).

Responda APENAS com JSON válido (sem markdown):
{
  "resumo": "5 linhas no máximo, direto ao ponto",
  "alertas": ["gargalos que destroem conversão / desperdício / leads quentes parados"],
  "oportunidades": ["onde mexer para faturar mais rápido"],
  "acoes": ["ações práticas priorizadas por impacto, ex.: 'Vincular os 11 StickQuotes órfãos a orçamentos'"],
  "insights": ["padrões de fechamento e de perda observados nos números"],
  "previsao": "tendência simples baseada no comportamento atual",
  "impacto_estimado": "estimativa de ganho potencial, ex.: '+X% conversão'"
}`;

/** Aciona o copiloto: envia os agregados e devolve decisões estruturadas. */
export async function analisarComStickBrain(metricas, { empresaId } = {}) {
  const { key, modelo } = await carregarChaveIA(empresaId);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelo,
      messages: [
        { role: "system", content: PROMPT_STICKBRAIN },
        { role: "user", content: `Métricas do funil (JSON):\n${JSON.stringify(metricas)}` },
      ],
      temperature: 0.2,
      max_tokens: 1100,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Conta OpenAI sem saldo. Adicione crédito em platform.openai.com/account/billing.");
    if (res.status === 401) throw new Error("Chave OpenAI inválida. Atualize em Configurações → IA.");
    throw new Error(`Falha no copiloto (${res.status}). ${t.slice(0, 120)}`);
  }

  const j = await res.json();
  const content = j.choices?.[0]?.message?.content || "{}";
  let txt = content.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  const a = txt.indexOf("{"), b = txt.lastIndexOf("}");
  if (a >= 0 && b > a) txt = txt.slice(a, b + 1);
  return JSON.parse(txt);
}
