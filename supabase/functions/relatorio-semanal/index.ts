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
    // Função de cron — exige segredo para evitar disparos não autorizados.
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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Janela da semana encerrada (últimos 7 dias)
    const now = new Date();
    const semanaAtras = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Busca todas as empresas ativas
    const { data: empresas, error: empresasError } = await sb
      .from("empresas")
      .select("id, nome");

    if (empresasError) throw empresasError;

    let sent = 0;
    let total = empresas?.length ?? 0;
    const errors: string[] = [];

    for (const empresa of empresas ?? []) {
      // Busca todas as obras da empresa
      const { data: obras, error: obrasError } = await sb
        .from("obras")
        .select("id, nome, status, updated_at")
        .eq("empresa_id", empresa.id);

      if (obrasError) {
        errors.push(`${empresa.nome}: erro ao buscar obras — ${obrasError.message}`);
        continue;
      }

      const todasObras = obras ?? [];
      const totalObras = todasObras.length;
      const obrasAtivas = todasObras.filter((o) => o.status === "Em andamento").length;
      const obrasPausadas = todasObras.filter((o) => o.status === "Pausada").length;
      const obrasConcluidas = todasObras.filter((o) => o.status === "Concluída").length;

      // Obras concluídas nesta semana (updated_at >= semanaAtras e status === "Concluída")
      const concluidasNaSemana = todasObras.filter(
        (o) =>
          o.status === "Concluída" &&
          o.updated_at &&
          new Date(o.updated_at) >= semanaAtras
      ).length;

      // Busca o diretor da empresa
      const { data: usuarioData, error: usuarioError } = await sb
        .from("usuarios")
        .select("id")
        .eq("empresa_id", empresa.id)
        .eq("perfil", "diretor")
        .limit(1)
        .single();

      if (usuarioError || !usuarioData) {
        errors.push(`${empresa.nome}: diretor não encontrado`);
        continue;
      }

      const { data: authUser, error: authError } = await sb.auth.admin.getUserById(
        usuarioData.id
      );

      if (authError || !authUser?.user?.email) {
        errors.push(`${empresa.nome}: email do diretor não encontrado`);
        continue;
      }

      const email = authUser.user.email;

      const dataRelatorio = now.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Semanal — ${empresa.nome}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#981915;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0 0 4px;font-size:24px;font-weight:700;">StickFrame</h1>
              <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">Relatório Semanal</p>
            </td>
          </tr>
          <!-- Saudação -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:18px;">Olá, ${empresa.nome}!</h2>
              <p style="color:#4b5563;margin:0;font-size:14px;line-height:1.6;">
                Aqui está o resumo semanal das suas obras. Semana encerrada em <strong>${dataRelatorio}</strong>.
              </p>
            </td>
          </tr>
          <!-- KPIs -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:20px;text-align:center;border-right:1px solid #e5e7eb;">
                    <div style="font-size:32px;font-weight:900;color:#981915;">${totalObras}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Total de Obras</div>
                  </td>
                  <td style="padding:20px;text-align:center;border-right:1px solid #e5e7eb;">
                    <div style="font-size:32px;font-weight:900;color:#2e9e5b;">${obrasAtivas}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Em Andamento</div>
                  </td>
                  <td style="padding:20px;text-align:center;border-right:1px solid #e5e7eb;">
                    <div style="font-size:32px;font-weight:900;color:#c88a00;">${obrasPausadas}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Pausadas</div>
                  </td>
                  <td style="padding:20px;text-align:center;">
                    <div style="font-size:32px;font-weight:900;color:#6b7280;">${obrasConcluidas}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Concluídas</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Destaque da semana -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:13px;color:#166534;font-weight:600;margin-bottom:4px;">CONCLUÍDAS NESTA SEMANA</div>
                    <div style="font-size:28px;font-weight:900;color:#15803d;">${concluidasNaSemana}</div>
                    <div style="font-size:13px;color:#4b5563;margin-top:4px;">
                      ${concluidasNaSemana === 1 ? "obra finalizada nos últimos 7 dias" : "obras finalizadas nos últimos 7 dias"}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;margin:0;font-size:13px;line-height:1.6;">
                StickFrame · Relatório gerado em ${dataRelatorio}<br>
                <a href="https://stickframe.com.br" style="color:#6b7280;text-decoration:underline;">stickframe.com.br</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "StickFrame <oi@stickframe.com.br>",
          to: [email],
          subject: `Relatório semanal — ${empresa.nome}`,
          html,
        }),
      });

      if (resendRes.ok) {
        sent++;
      } else {
        const errText = await resendRes.text();
        errors.push(`${empresa.nome}: ${errText}`);
      }
    }

    return new Response(
      JSON.stringify({
        sent,
        total,
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
