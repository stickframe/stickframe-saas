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
    // Função de cron — exige segredo. Sem ele, qualquer um dispararia
    // envios de WhatsApp em massa.
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    const { data: clientes, error } = await sb
      .from("clientes")
      .select("id, nome, telefone, empresa_id")
      .eq("proximo_contato", today)
      .not("status", "in", '("Fechado","Em execução","Perdido")');

    if (error) throw error;

    const phoneId = Deno.env.get("WHATSAPP_PHONE_ID");
    const token   = Deno.env.get("WHATSAPP_TOKEN");

    if (!phoneId || !token) {
      return new Response(
        JSON.stringify({ error: "WHATSAPP_PHONE_ID or WHATSAPP_TOKEN not configured", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    const errors: string[] = [];

    for (const cliente of clientes ?? []) {
      const phone = cliente.telefone?.replace(/\D/g, "");
      if (!phone) continue;

      const message =
        `Olá ${cliente.nome}! 👋\n\nPassando para dar continuidade ao seu interesse em construção em Steel Frame. Posso ajudar com mais informações?\n\nStick Frame · stickframe.com.br`;

      const res = await fetch(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: message },
          }),
        }
      );

      if (res.ok) {
        sent++;
      } else {
        const err = await res.text();
        errors.push(`${cliente.nome}: ${err}`);
      }
    }

    return new Response(
      JSON.stringify({
        sent,
        total: clientes?.length ?? 0,
        date: today,
        errors: errors.length ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
