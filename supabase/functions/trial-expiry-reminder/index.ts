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

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Busca empresas no plano free com trial expirando nos próximos 3 dias
    // que ainda não receberam o lembrete.
    const { data: empresas, error: empresasError } = await sb
      .from("empresas")
      .select("id, nome, trial_ends_at")
      .eq("plano", "free")
      .eq("trial_reminder_sent", false)
      .gte("trial_ends_at", now.toISOString())
      .lte("trial_ends_at", in3Days.toISOString());

    if (empresasError) throw empresasError;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    const errors: string[] = [];

    for (const empresa of empresas ?? []) {
      // Busca o email do diretor da empresa via usuarios + auth.users
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
        errors.push(`${empresa.nome}: email não encontrado`);
        continue;
      }

      const email = authUser.user.email;
      const trialEndsAt = new Date(empresa.trial_ends_at);
      const diffMs = trialEndsAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const diasText = diffDays === 1 ? "1 dia" : `${diffDays} dias`;

      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu trial Pro expira em breve</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a1a2e;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">StickFrame</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;">
                Seu trial Pro expira em ${diasText}, ${empresa.nome}!
              </h2>
              <p style="color:#4b5563;margin:0 0 24px;line-height:1.6;">
                Olá! Passamos para avisar que o seu período de trial do plano Pro do
                <strong>StickFrame</strong> está chegando ao fim.
              </p>
              <p style="color:#4b5563;margin:0 0 24px;line-height:1.6;">
                Para continuar aproveitando todos os benefícios, assine o Pro antes que expire:
              </p>
              <ul style="color:#4b5563;margin:0 0 24px;padding-left:20px;line-height:1.8;">
                <li>Orçamentos ilimitados com CUB atualizado automaticamente</li>
                <li>Relatórios mensais completos em PDF</li>
                <li>Gestão de clientes e follow-up automático</li>
                <li>Suporte prioritário</li>
                <li>Acesso a todos os futuros recursos</li>
              </ul>
              <p style="color:#4b5563;margin:0 0 32px;line-height:1.6;">
                Não perca o acesso — assine agora e continue crescendo com o StickFrame.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px;background-color:#2563eb;">
                    <a href="https://stickframe.com.br/pricing"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;border-radius:6px;">
                      Assinar agora
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;margin:0;font-size:13px;">
                Você está recebendo este e-mail porque possui uma conta no StickFrame.<br>
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
          subject: `Seu trial Pro expira em ${diasText}, ${empresa.nome}!`,
          html,
        }),
      });

      if (resendRes.ok) {
        // Marca o lembrete como enviado
        await sb
          .from("empresas")
          .update({ trial_reminder_sent: true })
          .eq("id", empresa.id);

        sent++;
      } else {
        const errText = await resendRes.text();
        errors.push(`${empresa.nome}: ${errText}`);
      }
    }

    return new Response(
      JSON.stringify({
        sent,
        total: empresas?.length ?? 0,
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
