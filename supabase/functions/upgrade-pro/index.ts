import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE = "https://www.asaas.com/api/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } },
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const { data: usuario } = await admin.from("usuarios").select("empresa_id").eq("id", user.id).single();
    if (!usuario) throw new Error("Usuário não encontrado");

    const { data: empresa } = await admin.from("empresas").select("*").eq("id", usuario.empresa_id).single();
    if (!empresa) throw new Error("Empresa não encontrada");

    const { nome, email, cpfCnpj } = await req.json();

    const apiKey = Deno.env.get("ASAAS_API_KEY") ?? "";

    // 1. Encontrar ou criar cliente no Asaas
    let customerId = empresa.asaas_customer_id;
    if (!customerId) {
      const res = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "access_token": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ name: nome || empresa.nome, email: email || empresa.email, cpfCnpj: cpfCnpj || undefined }),
      });
      const data = await res.json();
      if (!data.id) throw new Error("Erro ao criar cliente no Asaas: " + JSON.stringify(data));
      customerId = data.id;
      await admin.from("empresas").update({ asaas_customer_id: customerId }).eq("id", empresa.id);
    }

    // 2. Criar cobrança recorrente mensal R$297
    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 3);
    const dataVenc = vencimento.toISOString().slice(0, 10);

    const chargeRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "access_token": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED", // deixa o cliente escolher PIX/boleto/cartão
        value: 297,
        dueDate: dataVenc,
        description: "StickFrame Pro — Assinatura Mensal",
        externalReference: empresa.id,
      }),
    });
    const charge = await chargeRes.json();
    if (!charge.id) throw new Error("Erro ao criar cobrança: " + JSON.stringify(charge));

    return new Response(JSON.stringify({
      link: charge.invoiceUrl || charge.bankSlipUrl,
      id: charge.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
