import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nome, whatsapp, area, padrao, valorSF, valorAlv, prazo } = await req.json();

    // ── Rate limit por IP: máx 3 simulações por minuto ─────────
    // (endpoint público — evita spam de WhatsApp usando os créditos da conta)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: allowed } = await admin.rpc("check_rate_limit", {
      p_bucket: "whatsapp-lead", p_ip: ip, p_max: 3, p_window_secs: 60,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ ok: false, error: "Muitas tentativas. Aguarde um minuto." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    // ── Validação de input ─────────────────────────────────────
    const numero = String(whatsapp ?? "").replace(/\D/g, "");
    if (numero.length < 10 || numero.length > 13) {
      return new Response(JSON.stringify({ ok: false, error: "Número inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }
    const areaNum = Number(area);
    if (!Number.isFinite(areaNum) || areaNum <= 0 || areaNum > 100000) {
      return new Response(JSON.stringify({ ok: false, error: "Área inválida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }

    const phoneId  = Deno.env.get("WHATSAPP_PHONE_ID");
    const token    = Deno.env.get("WHATSAPP_TOKEN");

    if (!phoneId || !token) {
      return new Response(JSON.stringify({ ok: false, error: "WhatsApp não configurado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Garante 55 no início
    const to = numero.startsWith("55") ? numero : `55${numero}`;

    const nomeFormatado = nome?.split(" ")[0] || "Olá";
    const sfFmt  = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(valorSF  || 0);
    const alvFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(valorAlv || 0);

    const texto =
`🏗️ *${nomeFormatado}, sua simulação Stickframe está pronta!*

📐 *Área:* ${area} m²
✨ *Padrão:* ${padrao}

💰 *Steel Frame:* ${sfFmt}
🧱 *Alvenaria:* ${alvFmt}
⚡ *Prazo Steel Frame:* ${prazo || "5–8 meses"}

O Steel Frame é até 40% mais rápido e com estrutura metálica de alta durabilidade.

👇 *Quer uma proposta detalhada e personalizada?*
Responda *SIM* e nossa equipe entra em contato em até 24h.

_Stickframe — Construção Inteligente_`;

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: texto, preview_url: false },
    };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("WhatsApp API error:", JSON.stringify(data));
      return new Response(JSON.stringify({ ok: false, error: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // não explode o fluxo do lead
      });
    }

    return new Response(JSON.stringify({ ok: true, messageId: data.messages?.[0]?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
