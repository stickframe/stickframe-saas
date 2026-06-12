import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE = "https://www.asaas.com/api/v3";
const PLANO_VALOR = 197;

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
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
    if (!usuario) return json({ error: "Usuário não encontrado" }, 404);

    const { data: empresa } = await admin
      .from("empresas").select("*").eq("id", usuario.empresa_id).single();
    if (!empresa) return json({ error: "Empresa não encontrada" }, 404);

    const { nome, email, cpfCnpj, trial } = await req.json();
    const useTrial = trial === true;
    const apiKey = Deno.env.get("ASAAS_API_KEY") ?? "";

    // 1. Criar ou reutilizar cliente no Asaas
    let customerId = empresa.asaas_customer_id;
    if (!customerId) {
      const res = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "access_token": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nome || empresa.nome,
          email: email || empresa.email,
          cpfCnpj: cpfCnpj?.replace(/\D/g, "") || undefined,
        }),
      });
      const data = await res.json();
      if (!data.id) throw new Error("Erro ao criar cliente no Asaas: " + JSON.stringify(data));
      customerId = data.id;
      await admin.from("empresas").update({ asaas_customer_id: customerId }).eq("id", empresa.id);
    }

    // 2. Criar assinatura — trial: primeira cobrança em 14 dias
    const nextDueDate = useTrial ? addDays(14) : new Date().toISOString().slice(0, 10);
    const trialEndsAt = useTrial ? new Date(Date.now() + 14 * 86400_000).toISOString() : null;

    const subRes = await fetch(`${ASAAS_BASE}/subscriptions`, {
      method: "POST",
      headers: { "access_token": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED", // cliente escolhe PIX/boleto/cartão na primeira cobrança
        value: PLANO_VALOR,
        nextDueDate,
        cycle: "MONTHLY",
        description: "StickFrame Profissional — Assinatura Mensal",
        externalReference: empresa.id,
      }),
    });
    const sub = await subRes.json();
    if (!sub.id) throw new Error("Erro ao criar assinatura: " + JSON.stringify(sub));

    // 3. Ativar plano imediatamente no banco (não espera webhook)
    await admin.from("empresas").update({
      plano: "pro",
      ...(trialEndsAt ? { trial_ends_at: trialEndsAt, trial_reminder_sent: false } : {}),
    }).eq("id", empresa.id);

    // 4. Buscar link de pagamento da primeira cobrança
    const paymentsRes = await fetch(`${ASAAS_BASE}/subscriptions/${sub.id}/payments`, {
      headers: { "access_token": apiKey },
    });
    const payments = await paymentsRes.json();
    const firstPayment = payments?.data?.[0];
    const link = firstPayment?.invoiceUrl || firstPayment?.bankSlipUrl || null;

    return json({
      ok: true,
      subscriptionId: sub.id,
      link,
      trialEndsAt,
      nextDueDate,
    });
  } catch (e) {
    console.error("upgrade-pro:", e);
    return json({ error: (e as Error).message }, 400);
  }
});
