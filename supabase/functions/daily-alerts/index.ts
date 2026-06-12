import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_WHATSAPP = "5511989859995";

async function sendWhatsApp(phoneId: string, token: string, to: string, text: string) {
  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp", to, type: "text",
      text: { body: text, preview_url: false },
    }),
  });
}

async function sendEmail(resendKey: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "StickFrame <oi@stickframe.com.br>", to, subject, html }),
  });
  return res.ok;
}

function emailHtml(title: string, body: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:40px 20px;background:#f8fafc;font-family:Inter,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e2e8f0;">
    <h1 style="color:#981915;font-size:24px;margin:0 0 16px;">🏗️ StickFrame</h1>
    <h2 style="color:#0f172a;font-size:18px;margin:0 0 16px;">${title}</h2>
    ${body}
    <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;">StickFrame · <a href="https://app.stickframe.com.br" style="color:#94a3b8;">app.stickframe.com.br</a></p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Autorização: CRON_SECRET via header ou query param
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
  if (cronSecret && authHeader !== cronSecret) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const phoneId   = Deno.env.get("WHATSAPP_PHONE_ID") ?? "";
  const waToken   = Deno.env.get("WHATSAPP_TOKEN") ?? "";

  const now    = new Date();
  const in3d   = new Date(now.getTime() + 3 * 86400_000);
  const ago1d  = new Date(now.getTime() - 1  * 86400_000);
  const ago2d  = new Date(now.getTime() - 2  * 86400_000);
  const ago7d  = new Date(now.getTime() - 7  * 86400_000);

  const log: string[] = [];

  // ── Helpers ───────────────────────────────────────────────────────────────
  async function getDiretorEmail(empresaId: string): Promise<{ nome: string; email: string } | null> {
    const { data: u } = await sb.from("usuarios").select("id, nome").eq("empresa_id", empresaId).eq("perfil", "diretor").limit(1).single();
    if (!u) return null;
    const { data: au } = await sb.auth.admin.getUserById(u.id);
    if (!au?.user?.email) return null;
    return { nome: u.nome, email: au.user.email };
  }

  // ── 1. Trial vencendo em ≤3 dias (ainda não enviou lembrete) ─────────────
  const { data: trialsProximos } = await sb.from("empresas")
    .select("id, nome")
    .eq("plano", "free")
    .eq("trial_reminder_sent", false)
    .gte("trial_ends_at", now.toISOString())
    .lte("trial_ends_at", in3d.toISOString());

  let triaisLembrados = 0;
  for (const emp of trialsProximos ?? []) {
    const contato = await getDiretorEmail(emp.id);
    if (!contato || !resendKey) continue;
    const ok = await sendEmail(
      resendKey, contato.email,
      `Seu trial StickFrame vence em breve — ative o PRO`,
      emailHtml(
        `Olá, ${contato.nome}! Seu trial acaba em breve 🕐`,
        `<p style="color:#475569;line-height:1.6;margin:0 0 20px;">
          Aproveite que você ainda tem acesso completo e ative o plano PRO antes que expire.<br>
          Com o PRO você tem obras ilimitadas, relatórios completos e muito mais.
        </p>
        <a href="https://app.stickframe.com.br/checkout?plan=profissional"
          style="display:inline-block;background:#981915;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;">
          Ativar PRO agora →
        </a>`
      )
    );
    if (ok) {
      await sb.from("empresas").update({ trial_reminder_sent: true }).eq("id", emp.id);
      triaisLembrados++;
    }
  }
  log.push(`trials_lembrados: ${triaisLembrados}`);

  // ── 2. Trial expirado ontem → e-mail de reativação ───────────────────────
  const { data: trialsExpirados } = await sb.from("empresas")
    .select("id, nome")
    .eq("plano", "free")
    .gte("trial_ends_at", ago2d.toISOString())
    .lte("trial_ends_at", ago1d.toISOString());

  let triaisReativacao = 0;
  for (const emp of trialsExpirados ?? []) {
    const contato = await getDiretorEmail(emp.id);
    if (!contato || !resendKey) continue;
    await sendEmail(
      resendKey, contato.email,
      `Seu trial StickFrame expirou — não perca o acesso`,
      emailHtml(
        `Seu período de trial encerrou 😔`,
        `<p style="color:#475569;line-height:1.6;margin:0 0 20px;">
          Olá, ${contato.nome}! Seu trial gratuito da <strong>${emp.nome}</strong> expirou ontem.<br>
          Ative o plano PRO agora e continue gerenciando suas obras sem interrupção.
        </p>
        <a href="https://app.stickframe.com.br/checkout?plan=profissional"
          style="display:inline-block;background:#981915;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;">
          Reativar acesso PRO →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Tem dúvidas? Responda este e-mail e eu te ajudo.</p>`
      )
    );
    triaisReativacao++;
  }
  log.push(`trials_reativacao: ${triaisReativacao}`);

  // ── 3. Churn risk: empresas sem login há ≥7 dias (todas) ─────────────────
  const { data: authList } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const { data: usuarios } = await sb.from("usuarios").select("id, empresa_id, nome, perfil");
  const { data: todasEmpresas } = await sb.from("empresas").select("id, nome, plano").eq("ativo", true);

  // Monta ultimo login por empresa
  const lastSignInMap: Record<string, number> = {};
  const emailMapU: Record<string, string> = {};
  for (const au of authList?.users ?? []) {
    if (au.last_sign_in_at) emailMapU[au.id] = au.email ?? "";
    const ls = au.last_sign_in_at ? new Date(au.last_sign_in_at).getTime() : 0;
    const empId = usuarios?.find(u => u.id === au.id)?.empresa_id;
    if (empId && ls > (lastSignInMap[empId] ?? 0)) lastSignInMap[empId] = ls;
  }

  const churnRisk = (todasEmpresas ?? []).filter(e => {
    const ls = lastSignInMap[e.id] ?? 0;
    return ls > 0 && ls < ago7d.getTime();
  });

  if (churnRisk.length > 0 && phoneId && waToken) {
    const lista = churnRisk
      .slice(0, 10)
      .map(e => `• ${e.nome} (${e.plano})`)
      .join("\n");
    const texto =
`⚠️ *${churnRisk.length} empresa(s) sem login há +7 dias:*

${lista}${churnRisk.length > 10 ? `\n...e mais ${churnRisk.length - 10}` : ""}

Considere entrar em contato 👆`;
    await sendWhatsApp(phoneId, waToken, OWNER_WHATSAPP, texto);
  }
  log.push(`churn_risk: ${churnRisk.length}`);

  // ── 4. Resumo diário para o dono ─────────────────────────────────────────
  if (phoneId && waToken) {
    const lines = [
      `📊 *Resumo diário StickFrame*`,
      ``,
      `✅ Lembretes de trial enviados: ${triaisLembrados}`,
      `📧 E-mails de reativação: ${triaisReativacao}`,
      `⚠️ Em risco de churn: ${churnRisk.length}`,
    ];
    if (triaisLembrados === 0 && triaisReativacao === 0 && churnRisk.length === 0) {
      lines.push(`\nTudo tranquilo hoje 🎉`);
    }
    await sendWhatsApp(phoneId, waToken, OWNER_WHATSAPP, lines.join("\n"));
  }

  return new Response(JSON.stringify({ ok: true, log }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
