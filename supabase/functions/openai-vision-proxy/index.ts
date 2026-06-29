import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// openai-vision-proxy
// Proxy server-side para a OpenAI Vision usada pelo StickQuote™ AI Vision.
//
// Por que existe: o navegador NÃO pode chamar https://api.openai.com diretamente
// (a OpenAI não envia cabeçalhos CORS → o fetch falha com "Failed to fetch").
// Esta função roda no servidor, lê a chave da empresa em `ia_config` com a
// service role (sem expor a chave ao cliente) e repassa a requisição à OpenAI.
//
// Entrada (JSON): { empresaId, messages, temperature?, max_tokens?, response_format? }
// Saída  (JSON):  { content }  — texto da resposta do modelo
// ─────────────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Modelos OpenAI com suporte a visão (espelha a lista do frontend).
const VISION_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4-turbo", "chatgpt-4o-latest"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const {
      empresaId,
      messages,
      temperature = 0.1,
      max_tokens = 1500,
      response_format = { type: "json_object" },
    } = await req.json();

    if (!empresaId) return json({ error: "empresaId é obrigatório." }, 400);
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages inválido." }, 400);
    }

    // Lê a chave da empresa com a service role (bypassa RLS; a chave nunca vai ao cliente).
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: cfg, error: cfgErr } = await admin
      .from("ia_config")
      .select("openai_key, modelo_openai")
      .eq("empresa_id", empresaId)
      .limit(1)
      .maybeSingle();

    if (cfgErr) return json({ error: `Erro ao ler configuração de IA: ${cfgErr.message}` }, 500);
    if (!cfg || !cfg.openai_key) {
      return json({ error: "Chave OpenAI não configurada. Vá em Configurações → IA e informe sua chave para usar o AI Vision." }, 400);
    }

    const modelo = VISION_MODELS.includes(cfg.modelo_openai) ? cfg.modelo_openai : "gpt-4o-mini";

    const oa = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${cfg.openai_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelo, messages, temperature, max_tokens, response_format }),
    });

    const body = await oa.text();
    if (!oa.ok) {
      // Repassa status + corpo para o frontend mapear a mensagem amigável (401/429/etc.).
      let apiCode = "";
      try { const j = JSON.parse(body); apiCode = j?.error?.code || j?.error?.type || ""; } catch (_) { /* ignore */ }
      return json({ error: "openai_error", status: oa.status, code: apiCode, raw: body }, 502);
    }

    let content = "";
    try { content = JSON.parse(body)?.choices?.[0]?.message?.content || ""; } catch (_) { /* ignore */ }
    return json({ content });
  } catch (err) {
    console.error("[openai-vision-proxy] fatal:", err);
    return json({ error: String(err) }, 500);
  }
});
