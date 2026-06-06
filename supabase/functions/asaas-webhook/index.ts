import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Validação opcional do token do webhook
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    if (webhookToken) {
      const incomingToken = req.headers.get("asaas-access-token");
      if (incomingToken !== webhookToken) {
        console.warn("asaas-webhook: token inválido recebido");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("asaas-webhook: ASAAS_WEBHOOK_TOKEN não configurado, pulando validação");
    }

    const body = await req.json();
    const { event, payment } = body;

    console.log(`asaas-webhook: evento recebido: ${event}`);

    // Apenas processar eventos de pagamento confirmado
    if (event !== "PAYMENT_CONFIRMED" && event !== "PAYMENT_RECEIVED") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (externalReference) {
      // Atualiza pelo ID da empresa diretamente
      const { error } = await admin
        .from("empresas")
        .update({ plano: "pro", limite_obras: 999 })
        .eq("id", externalReference);

      if (error) {
        console.error("asaas-webhook: erro ao atualizar por externalReference:", error.message);
      } else {
        console.log(`asaas-webhook: empresa ${externalReference} atualizada para pro via externalReference`);
      }
    } else if (customer) {
      // Fallback: atualiza pelo asaas_customer_id
      const { error } = await admin
        .from("empresas")
        .update({ plano: "pro", limite_obras: 999 })
        .eq("asaas_customer_id", customer);

      if (error) {
        console.error("asaas-webhook: erro ao atualizar por customer:", error.message);
      } else {
        console.log(`asaas-webhook: empresa com customer ${customer} atualizada para pro via asaas_customer_id`);
      }
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
