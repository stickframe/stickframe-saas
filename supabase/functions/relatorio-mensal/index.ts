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
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const mesFim    = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    // Obtém empresa_id do JWT. SEM empresa válida = acesso negado.
    // (corrige vazamento multi-tenant: antes, sem auth, consultava TODAS as empresas)
    let empresa_id: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const sbUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: userData } = await sbUser.auth.getUser();
      if (userData?.user) {
        const { data: usr } = await sb
          .from("usuarios")
          .select("empresa_id")
          .eq("id", userData.user.id)
          .single();
        empresa_id = usr?.empresa_id ?? null;
      }
    }

    if (!empresa_id) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch — sempre filtrado por empresa_id
    const [
      { data: obras },
      { data: orcamentosMes },
      { data: clientesMes },
      { data: lancamentosMes },
    ] = await Promise.all([
      sb.from("obras").select("id, nome, fase, progresso, status").eq("empresa_id", empresa_id),
      sb.from("orcamentos").select("id, valor, status").eq("empresa_id", empresa_id).gte("created_at", mesInicio).lte("created_at", mesFim),
      sb.from("clientes").select("id").eq("empresa_id", empresa_id).gte("created_at", mesInicio).lte("created_at", mesFim),
      sb.from("lancamentos").select("tipo, valor").eq("empresa_id", empresa_id).eq("tipo", "receita").gte("data", mesInicio.split("T")[0]).lte("data", mesFim.split("T")[0]),
    ]);

    const obrasAndamento = (obras ?? []).filter((o) => o.status === "Em andamento");
    const totalOrcamentos = (orcamentosMes ?? []).reduce((s: number, o: { valor?: number }) => s + (o.valor || 0), 0);
    const totalReceitas   = (lancamentosMes ?? []).reduce((s: number, l: { valor?: number }) => s + (l.valor || 0), 0);

    const mesNome = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const fmtR = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const linhasObras = obrasAndamento
      .map((o) => `<tr>
        <td style="padding:8px 16px;border-bottom:1px solid #eee;font-weight:600">${o.nome}</td>
        <td style="padding:8px 16px;border-bottom:1px solid #eee;text-align:center">${o.fase || "—"}</td>
        <td style="padding:8px 16px;border-bottom:1px solid #eee;text-align:center;font-weight:700;color:#2e9e5b">${o.progresso || 0}%</td>
      </tr>`)
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Mensal — ${mesNome}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #222; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 700px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    .header { background: #981915; color: #fff; padding: 32px; }
    .header h1 { margin: 0 0 4px; font-size: 26px; }
    .header p  { margin: 0; opacity: 0.8; font-size: 14px; }
    .kpis { display: flex; gap: 0; border-bottom: 1px solid #eee; }
    .kpi { flex: 1; padding: 20px 24px; border-right: 1px solid #eee; text-align: center; }
    .kpi:last-child { border-right: none; }
    .kpi .val { font-size: 28px; font-weight: 900; color: #981915; }
    .kpi .lbl { font-size: 12px; color: #888; margin-top: 4px; }
    .section { padding: 24px; border-bottom: 1px solid #eee; }
    .section h2 { margin: 0 0 16px; font-size: 16px; color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8f8f8; padding: 10px 16px; text-align: left; font-size: 12px; color: #888; font-weight: 600; text-transform: uppercase; }
    .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #aaa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Mensal</h1>
      <p>Stick Frame · ${mesNome}</p>
    </div>

    <div class="kpis">
      <div class="kpi">
        <div class="val">${obrasAndamento.length}</div>
        <div class="lbl">Obras em andamento</div>
      </div>
      <div class="kpi">
        <div class="val">${orcamentosMes?.length ?? 0}</div>
        <div class="lbl">Orçamentos no mês</div>
      </div>
      <div class="kpi">
        <div class="val">${clientesMes?.length ?? 0}</div>
        <div class="lbl">Novos leads</div>
      </div>
      <div class="kpi">
        <div class="val">${fmtR(totalReceitas)}</div>
        <div class="lbl">Receitas no mês</div>
      </div>
    </div>

    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;color:#555">Total orçado no mês</span>
        <strong style="font-size:18px;color:#2e9e5b">${fmtR(totalOrcamentos)}</strong>
      </div>
    </div>

    ${obrasAndamento.length > 0 ? `
    <div class="section">
      <h2>Obras em Andamento</h2>
      <table>
        <thead>
          <tr>
            <th>Obra</th>
            <th style="text-align:center">Fase</th>
            <th style="text-align:center">Progresso</th>
          </tr>
        </thead>
        <tbody>${linhasObras}</tbody>
      </table>
    </div>` : ""}

    <div class="footer">
      Stick Frame SaaS · Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} · stickframe.com.br
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendKey   = Deno.env.get("RESEND_API_KEY");
    const notifyEmail = Deno.env.get("NOTIFY_EMAIL");

    if (!resendKey || !notifyEmail) {
      return new Response(
        JSON.stringify({
          warning: "RESEND_API_KEY or NOTIFY_EMAIL not configured — returning HTML preview",
          html,
          stats: {
            obrasAndamento: obrasAndamento.length,
            orcamentos: orcamentosMes?.length ?? 0,
            novosLeads: clientesMes?.length ?? 0,
            receitas: totalReceitas,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "relatorios@stickframe.com.br",
        to: notifyEmail,
        subject: `📊 Relatório Mensal Stick Frame — ${mesNome}`,
        html,
      }),
    });

    const emailData = await emailRes.json();

    return new Response(
      JSON.stringify({
        sent: emailRes.ok,
        email: notifyEmail,
        resend: emailData,
        stats: {
          obrasAndamento: obrasAndamento.length,
          orcamentos: orcamentosMes?.length ?? 0,
          novosLeads: clientesMes?.length ?? 0,
          receitas: totalReceitas,
        },
      }),
      { status: emailRes.ok ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
