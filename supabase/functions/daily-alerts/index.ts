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

const CTA = `<a href="https://app.stickframe.com.br/checkout?plan=profissional"
  style="display:inline-block;background:#981915;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:700;">
  Ativar PRO agora →
</a>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Autorização: CRON_SECRET via header ou query param (se configurado)
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
  if (cronSecret && provided !== cronSecret) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const phoneId   = Deno.env.get("WHATSAPP_PHONE_ID") ?? "";
  const waToken   = Deno.env.get("WHATSAPP_TOKEN") ?? "";

  const now    = new Date();
  const in1d   = new Date(now.getTime() + 1 * 86400_000);
  const in2d   = new Date(now.getTime() + 2 * 86400_000);
  const in3d   = new Date(now.getTime() + 3 * 86400_000);
  const ago1d  = new Date(now.getTime() - 1 * 86400_000);
  const ago2d  = new Date(now.getTime() - 2 * 86400_000);
  const ago7d  = new Date(now.getTime() - 7 * 86400_000);

  const log: string[] = [];

  async function getDiretorEmail(empresaId: string): Promise<{ nome: string; email: string } | null> {
    const { data: u } = await sb.from("usuarios").select("id, nome").eq("empresa_id", empresaId).eq("perfil", "diretor").limit(1).single();
    if (!u) return null;
    const { data: au } = await sb.auth.admin.getUserById(u.id);
    if (!au?.user?.email) return null;
    return { nome: u.nome, email: au.user.email };
  }

  // ── 1. Trial vencendo em ≤3 dias (lembrete único) ────────────────────────
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
      `Seu período de avaliação está terminando`,
      emailHtml(
        `Olá, ${contato.nome}! Seu trial acaba em breve 🕐`,
        `<p style="color:#475569;line-height:1.6;margin:0 0 20px;">
          Seu período de avaliação está terminando. Continue utilizando o StickFrame
          sem interrupções — ative o plano PRO e mantenha obras ilimitadas,
          relatórios completos e todos os recursos.
        </p>${CTA}`
      )
    );
    if (ok) {
      await sb.from("empresas").update({ trial_reminder_sent: true }).eq("id", emp.id);
      triaisLembrados++;
    }
  }
  log.push(`trials_lembrados_3d: ${triaisLembrados}`);

  // ── 2. Último dia de trial (D-1) — janela de 24h, dispara uma vez ────────
  const { data: trialsUltimoDia } = await sb.from("empresas")
    .select("id, nome")
    .eq("plano", "free")
    .gte("trial_ends_at", now.toISOString())
    .lte("trial_ends_at", in1d.toISOString());

  let triaisUltimoDia = 0;
  for (const emp of trialsUltimoDia ?? []) {
    const contato = await getDiretorEmail(emp.id);
    if (!contato || !resendKey) continue;
    await sendEmail(
      resendKey, contato.email,
      `Último dia do seu trial StickFrame`,
      emailHtml(
        `Hoje é o último dia do seu trial, ${contato.nome} ⏰`,
        `<p style="color:#475569;line-height:1.6;margin:0 0 20px;">
          Seu período de avaliação da <strong>${emp.nome}</strong> termina hoje.
          Ative o PRO agora para não perder o acesso aos seus dados e obras.
        </p>${CTA}`
      )
    );
    triaisUltimoDia++;
  }
  log.push(`trials_ultimo_dia: ${triaisUltimoDia}`);

  // ── 3. Trial expirado ontem → reativação ─────────────────────────────────
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
      `Seu acesso expirou — seus dados continuam seguros`,
      emailHtml(
        `Seu período de trial encerrou`,
        `<p style="color:#475569;line-height:1.6;margin:0 0 20px;">
          Olá, ${contato.nome}! O trial da <strong>${emp.nome}</strong> expirou.<br>
          Suas informações continuam seguras e podem ser reativadas a qualquer momento —
          basta ativar o plano PRO para retomar de onde parou.
        </p>${CTA}
        <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Tem dúvidas? Responda este e-mail e eu te ajudo.</p>`
      )
    );
    triaisReativacao++;
  }
  log.push(`trials_reativacao: ${triaisReativacao}`);

  // ── 4. Dados para churn + relatório ──────────────────────────────────────
  const { data: authList } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const { data: usuarios } = await sb.from("usuarios").select("id, empresa_id");
  const { data: todasEmpresas } = await sb.from("empresas")
    .select("id, nome, plano, created_at, trial_ends_at").eq("ativo", true);

  const empresaPorUsuario: Record<string, string> = {};
  for (const u of usuarios ?? []) empresaPorUsuario[u.id] = u.empresa_id;

  const lastSignInMap: Record<string, number> = {};
  for (const au of authList?.users ?? []) {
    const ls = au.last_sign_in_at ? new Date(au.last_sign_in_at).getTime() : 0;
    const empId = empresaPorUsuario[au.id];
    if (empId && ls > (lastSignInMap[empId] ?? 0)) lastSignInMap[empId] = ls;
  }

  const churnRisk = (todasEmpresas ?? [])
    .map(e => {
      const ls = lastSignInMap[e.id] ?? 0;
      const dias = ls > 0 ? Math.floor((now.getTime() - ls) / 86400_000) : null;
      return { ...e, dias_sem_login: dias };
    })
    .filter(e => e.dias_sem_login !== null && e.dias_sem_login >= 7)
    .sort((a, b) => (b.dias_sem_login ?? 0) - (a.dias_sem_login ?? 0));
  log.push(`churn_risk: ${churnRisk.length}`);

  // Inadimplentes via Asaas (para o relatório)
  let inadimplentes = 0;
  const asaasKey = Deno.env.get("ASAAS_API_KEY");
  if (asaasKey) {
    try {
      const r = await fetch("https://www.asaas.com/api/v3/payments?status=OVERDUE&limit=100", {
        headers: { "access_token": asaasKey },
      });
      const j = await r.json();
      inadimplentes = new Set((j?.data ?? []).map((p: { customer?: string }) => p.customer)).size;
    } catch (_e) { /* relatório segue sem o dado */ }
  }

  // ── 5. Daily Report consolidado no WhatsApp ──────────────────────────────
  if (phoneId && waToken) {
    const emps = todasEmpresas ?? [];
    const total = emps.length;
    const pro = emps.filter(e => e.plano === "pro").length;
    const trialsAtivos = emps.filter(e =>
      e.plano === "free" && e.trial_ends_at && new Date(e.trial_ends_at) > now
    ).length;
    const trialsVencendo2d = emps.filter(e =>
      e.plano === "free" && e.trial_ends_at &&
      new Date(e.trial_ends_at) > now && new Date(e.trial_ends_at) <= in2d
    ).length;
    const novos24h = emps.filter(e => new Date(e.created_at) >= ago1d).length;

    const atencao: string[] = [];
    if (trialsVencendo2d > 0) atencao.push(`• ${trialsVencendo2d} trial(s) vencem em até 2 dias`);
    if (churnRisk.length > 0) atencao.push(`• ${churnRisk.length} empresa(s) sem login há +7 dias`);
    if (inadimplentes > 0) atencao.push(`• ${inadimplentes} cliente(s) inadimplente(s)`);

    const churnLista = churnRisk.slice(0, 8)
      .map(e => `• ${e.nome} — ${e.dias_sem_login} dias`)
      .join("\n");

    const msg = [
      `📊 *StickFrame Daily Report*`,
      ``,
      `Empresas: ${total}`,
      `PRO: ${pro}`,
      `Trials ativos: ${trialsAtivos}`,
      `Inadimplentes: ${inadimplentes}`,
      ``,
      `📈 Novos cadastros (24h): ${novos24h}`,
      ...(atencao.length ? [``, `⚠️ *Atenção*`, ...atencao] : []),
      ...(churnLista ? [``, `🔻 *Sem atividade*`, churnLista] : []),
      ...(atencao.length === 0 && novos24h === 0 ? [``, `Tudo tranquilo hoje 🎉`] : []),
    ].join("\n");

    await sendWhatsApp(phoneId, waToken, OWNER_WHATSAPP, msg);
  }

  return new Response(JSON.stringify({ ok: true, log }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
