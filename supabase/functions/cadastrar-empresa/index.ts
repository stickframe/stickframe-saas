import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { nomeEmpresa, nomeUsuario, email, senha } = await req.json();

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

    // Cria o usuário de autenticação
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });
    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
        throw new Error("Este e-mail já está cadastrado.");
      }
      throw authError;
    }

    const uid = authData.user.id;

    // Cria a empresa no plano free
    const { data: empresa, error: empError } = await admin
      .from("empresas")
      .insert({ nome: nomeEmpresa, plano: "free", limite_obras: 2 })
      .select("id")
      .single();
    if (empError) throw empError;

    // Cria o usuário como diretor da empresa
    const { error: usrError } = await admin.from("usuarios").insert({
      id: uid,
      email,
      nome: nomeUsuario,
      perfil: "diretor",
      empresa_id: empresa.id,
      ativo: true,
    });
    if (usrError) throw usrError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
