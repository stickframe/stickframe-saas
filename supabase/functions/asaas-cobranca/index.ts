import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ASAAS_BASE = "https://sandbox.asaas.com/api/v3"; // sandbox; prod: api.asaas.com

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });

  try {
    const { nomeCliente, cpfCnpj, valor, descricao, dataVencimento, medicaoId } = await req.json();
    const apiKey = Deno.env.get("ASAAS_API_KEY") ?? "";

    // 1. Find or create customer
    const custRes = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${cpfCnpj}`, {
      headers: { "access_token": apiKey },
    });
    const custData = await custRes.json();
    let customerId = custData.data?.[0]?.id;

    if (!customerId) {
      const newCust = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "access_token": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ name: nomeCliente, cpfCnpj }),
      });
      const nc = await newCust.json();
      customerId = nc.id;
    }

    // 2. Create charge
    const chargeRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "access_token": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: customerId,
        billingType: "BOLETO",
        value: valor,
        dueDate: dataVencimento,
        description: descricao,
        externalReference: medicaoId,
      }),
    });
    const charge = await chargeRes.json();

    return new Response(JSON.stringify({
      asaas_id: charge.id,
      link_pagamento: charge.bankSlipUrl || charge.invoiceUrl,
      status: charge.status,
    }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
});
