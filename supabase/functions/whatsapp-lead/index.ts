import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const phoneId  = Deno.env.get("WHATSAPP_PHONE_ID");
    const token    = Deno.env.get("WHATSAPP_TOKEN");

    if (!phoneId || !token) {
      return new Response(JSON.stringify({ ok: false, error: "WhatsApp não configurado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Normaliza número: remove tudo que não for dígito, garante 55 no início
    const numero = whatsapp.replace(/\D/g, "");
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
