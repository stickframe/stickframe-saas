import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Validação OBRIGATÓRIA do token do webhook (fail-closed).
    // Sem o token, qualquer um poderia forjar um upgrade de plano.
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const incomingToken = req.headers.get("asaas-access-token");
    if (!webhookToken || incomingToken !== webhookToken) {
      console.warn("asaas-webhook: token ausente ou inválido — rejeitado");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { event, payment } = body;

    console.log(`asaas-webhook: evento recebido: ${event}`);

    const UPGRADE_EVENTS = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];
    const DOWNGRADE_EVENTS = ["PAYMENT_OVERDUE", "SUBSCRIPTION_DELETED", "PAYMENT_DELETED"];

    if (!UPGRADE_EVENTS.includes(event) && !DOWNGRADE_EVENTS.includes(event)) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isDowngrade = DOWNGRADE_EVENTS.includes(event);

    if (!payment) {
      console.warn("asaas-webhook: payload sem campo payment");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { externalReference, customer } = payment;

    const novoPlano = isDowngrade ? "free" : "pro";
    const novoLimite = isDowngrade ? 2 : 999;

    if (externalReference) {
      const { error } = await admin
        .from("empresas")
        .update({ plano: novoPlano, limite_obras: novoLimite })
        .eq("id", externalReference);
      if (error) console.error("asaas-webhook: erro ao atualizar por externalReference:", error.message);
      else console.log(`asaas-webhook: empresa ${externalReference} → ${novoPlano}`);
    } else if (customer) {
      const { error } = await admin
        .from("empresas")
        .update({ plano: novoPlano, limite_obras: novoLimite })
        .eq("asaas_customer_id", customer);
      if (error) console.error("asaas-webhook: erro ao atualizar por customer:", error.message);
      else console.log(`asaas-webhook: empresa customer ${customer} → ${novoPlano}`);
    } else {
      console.warn("asaas-webhook: payment sem externalReference nem customer, ignorando");
    }

    // Sempre retornar 200 para o Asaas não reenviar indefinidamente
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("asaas-webhook: erro inesperado:", e.message);
    // Retornar 200 mesmo em erro para evitar reenvios do Asaas
    return new Response(JSON.stringify({ received: true, warning: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
