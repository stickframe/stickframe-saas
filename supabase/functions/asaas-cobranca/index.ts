import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ASAAS_BASE = "https://sandbox.asaas.com/api/v3"; // sandbox; prod: api.asaas.com

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Autenticação obrigatória ───────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Não autorizado" }, 401);

    const { data: usuario } = await admin
      .from("usuarios").select("empresa_id").eq("id", user.id).single();
    if (!usuario?.empresa_id) return json({ error: "Usuário sem empresa" }, 403);

    // ── Validação de input ─────────────────────────────────────
    const { nomeCliente, cpfCnpj, valor, descricao, dataVencimento, medicaoId } = await req.json();

    const cpf = String(cpfCnpj ?? "").replace(/\D/g, "");
    if (cpf.length !== 11 && cpf.length !== 14) return json({ error: "CPF/CNPJ inválido" }, 400);

    const valorNum = Number(valor);
    if (!Number.isFinite(valorNum) || valorNum <= 0 || valorNum > 10_000_000)
      return json({ error: "Valor inválido" }, 400);

    if (!dataVencimento || !/^\d{4}-\d{2}-\d{2}$/.test(String(dataVencimento)))
      return json({ error: "Data de vencimento inválida" }, 400);

    if (!medicaoId) return json({ error: "medicaoId obrigatório" }, 400);

    // A medição precisa pertencer à empresa do usuário (isolamento multi-tenant)
    const { data: medicao } = await admin
      .from("medicoes").select("id, empresa_id").eq("id", medicaoId).single();
    if (!medicao || medicao.empresa_id !== usuario.empresa_id)
      return json({ error: "Medição não encontrada" }, 404);

    const nome = String(nomeCliente ?? "").slice(0, 120);
    const desc = String(descricao ?? "").slice(0, 200);

    const apiKey = Deno.env.get("ASAAS_API_KEY") ?? "";

    // 1. Encontrar ou criar cliente
    const custRes = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${cpf}`, {
      headers: { "access_token": apiKey },
    });
    const custData = await custRes.json();
    let customerId = custData.data?.[0]?.id;

    if (!customerId) {
      const newCust = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "access_token": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ name: nome, cpfCnpj: cpf }),
      });
      const nc = await newCust.json();
      customerId = nc.id;
    }

    // 2. Criar cobrança
    const chargeRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "access_token": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: customerId,
        billingType: "BOLETO",
        value: valorNum,
        dueDate: dataVencimento,
        description: desc,
        externalReference: medicaoId,
      }),
    });
    const charge = await chargeRes.json();

    return json({
      asaas_id: charge.id,
      link_pagamento: charge.bankSlipUrl || charge.invoiceUrl,
      status: charge.status,
    });
  } catch (_e) {
    console.error("asaas-cobranca erro:", _e);
    return json({ error: "Erro ao gerar cobrança" }, 500);
  }
});
