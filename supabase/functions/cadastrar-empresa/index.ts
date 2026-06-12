import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { nomeEmpresa, nomeUsuario, email, senha, leadOrigem } = await req.json();

    if (!nomeEmpresa || !nomeUsuario || !email || !senha) {
      throw new Error("Preencha todos os campos.");
    }
    if (senha.length < 6) {
      throw new Error("A senha deve ter pelo menos 6 caracteres.");
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Cria a empresa PRIMEIRO, para passar empresa_id nos metadados do auth user
    // (o trigger handle_new_user usa esses metadados para criar public.usuarios)
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: empresa, error: empError } = await admin
      .from("empresas")
      .insert({
        nome: nomeEmpresa,
        plano: "free",
        limite_obras: 2,
        trial_ends_at: trialEndsAt,
        lead_origem: typeof leadOrigem === "string" ? leadOrigem.slice(0, 60) : null,
      })
      .select("id")
      .single();
    if (empError) throw empError;

    // Cria o usuário de autenticação com metadados completos
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome: nomeUsuario, perfil: "diretor", empresa_id: empresa.id },
    });
    if (authError) {
      // Auth falhou — remove a empresa órfã criada acima
      await admin.from("empresas").delete().eq("id", empresa.id);
      if (
        authError.message.includes("already registered") ||
        authError.message.includes("already been registered") ||
        authError.message.includes("already exists")
      ) {
        throw new Error("Este e-mail já está cadastrado.");
      }
      throw authError;
    }

    const uid = authData.user.id;

    // Garante a linha em public.usuarios (o trigger já deve ter criado via
    // metadados; o upsert cobre o caso de o trigger não existir/falhar)
    const { error: usrError } = await admin.from("usuarios").upsert({
      id: uid,
      nome: nomeUsuario,
      perfil: "diretor",
      empresa_id: empresa.id,
      ativo: true,
    }, { onConflict: "id" });
    if (usrError) throw usrError;

    // Envia email de boas-vindas
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const htmlEmail = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0;">
    <h1 style="color: #dc2626; font-size: 28px; margin: 0 0 8px;">🏗️ Bem-vindo à StickFrame!</h1>
    <p style="color: #64748b; margin: 0 0 24px;">Olá, ${nomeUsuario}! Sua conta da empresa ${nomeEmpresa} foi criada com sucesso.</p>
    <p style="color: #0f172a; margin: 0 0 16px;">Aqui estão seus próximos passos:</p>
    <ul style="color: #0f172a; padding-left: 20px; margin: 0 0 24px;">
      <li style="margin-bottom: 8px;">📸 Adicione o logo da sua empresa em Configurações</li>
      <li style="margin-bottom: 8px;">🏠 Cadastre sua primeira obra</li>
      <li style="margin-bottom: 8px;">🔗 Compartilhe sua calculadora personalizada com clientes</li>
    </ul>
    <a href="https://app.stickframe.com.br" style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px;">Acessar minha conta →</a>
    <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0;">StickFrame — ERP para construtoras steel frame</p>
  </div>
</body>
</html>`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "StickFrame <oi@stickframe.com.br>",
            to: email,
            subject: `Bem-vindo à StickFrame, ${nomeUsuario}!`,
            html: htmlEmail,
          }),
        });
      } catch (emailErr) {
        console.error("Welcome email error:", emailErr);
      }
    }

    // Notifica o dono do sistema via WhatsApp
    const phoneId = Deno.env.get("WHATSAPP_PHONE_ID");
    const token   = Deno.env.get("WHATSAPP_TOKEN");
    const ownerNumber = "5511989859995";

    if (phoneId && token) {
      const texto =
`🆕 *Novo cadastro no Stickframe!*

🏢 *Empresa:* ${nomeEmpresa}
👤 *Usuário:* ${nomeUsuario}
📧 *E-mail:* ${email}`;

      const waBody = {
        messaging_product: "whatsapp",
        to: ownerNumber,
        type: "text",
        text: { body: texto, preview_url: false },
      };

      try {
        await fetch(
          `https://graph.facebook.com/v19.0/${phoneId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(waBody),
          }
        );
      } catch (waErr) {
        console.error("WhatsApp owner notification error:", waErr);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
