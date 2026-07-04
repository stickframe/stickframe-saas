// StickFEM™ — Proxy seguro para a API CalcSteel (Supabase Edge Function).
//
// OBJETIVO (segurança, item #11): o Access/Refresh Token do CalcSteel NUNCA
// chega ao browser. O cliente chama esta função; ela autentica do lado servidor
// (segredos em Supabase → Settings → Edge Functions → Secrets), faz login/refresh
// do JWT (15 min) e repassa a chamada à API CalcSteel (https://calcsteel.com/api/v1).
//
// STATUS: ESQUELETO NÃO IMPLANTADO. Retorna 501 até que existam credenciais
// oficiais + licença comercial confirmada. Não há segredos neste arquivo.
//
// Secrets esperados quando for ativar (via `supabase secrets set`):
//   CALCSTEEL_EMAIL, CALCSTEEL_PASSWORD   (conta de serviço)  — ou
//   CALCSTEEL_API_KEY                      (se a API oferecer chave estática)
//
// Deploy (quando autorizado): `supabase functions deploy calcsteel-proxy`.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const CALCSTEEL_BASE = "https://calcsteel.com/api/v1";
// Allowlist de rotas que o proxy aceita repassar (defesa em profundidade).
const ROTAS_PERMITIDAS = [/^\/profiles(\/.*|\?.*)?$/, /^\/standards$/, /^\/analysis$/, /^\/auth\/me$/];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// TODO(ativação): login + cache/refresh do JWT do CalcSteel usando os secrets.
async function obterTokenCalcSteel(): Promise<string> {
  throw new Error("CalcSteel proxy não configurado (secrets ausentes).");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/calcsteel-proxy/, "") + url.search;
  if (!ROTAS_PERMITIDAS.some((re) => re.test(path))) {
    return new Response(JSON.stringify({ detail: "rota não permitida" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
  }

  // Enquanto não houver credenciais/licença, o proxy responde 501 e o front cai
  // no solver local (fallback do AnalysisProviderManager) — nunca trava o usuário.
  try {
    const token = await obterTokenCalcSteel(); // lança até ser configurado
    const resp = await fetch(CALCSTEEL_BASE + path, {
      method: req.method,
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: req.method === "POST" ? await req.text() : undefined,
    });
    const body = await resp.text();
    return new Response(body, { status: resp.status, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ detail: "CalcSteel proxy indisponível", motivo: String(e?.message || e) }), {
      status: 501, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
