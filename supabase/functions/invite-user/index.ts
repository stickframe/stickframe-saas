import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, nome, perfil, empresa_id } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const { data: caller } = await supabaseAdmin.from("usuarios").select("perfil,empresa_id").eq("id", user.id).single();
    if (caller?.perfil !== "diretor" || caller?.empresa_id !== empresa_id) throw new Error("Sem permissão");

    // Verificar limite de usuários por plano
    const { data: empresaData } = await supabaseAdmin.from("empresas").select("plano").eq("id", empresa_id).single();
    const plano = empresaData?.plano ?? "free";
    const limiteUsuarios = plano === "pro" ? 10 : 1;

    const { count: countUsuarios } = await supabaseAdmin
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .eq("empresa_id", empresa_id)
      .eq("ativo", true);

    if ((countUsuarios ?? 0) >= limiteUsuarios) {
      throw new Error(
        plano === "free"
          ? "LIMITE_PLANO:Seu plano gratuito permite apenas 1 usuário. Faça upgrade para o plano Pro."
          : `LIMITE_PLANO:Seu plano Pro permite até ${limiteUsuarios} usuários. Remova um usuário para convidar outro.`
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { nome, perfil, empresa_id },
      redirectTo: `${Deno.env.get("SITE_URL") || "https://stickframe.com.br"}/login`,
    });
    if (error) throw error;

    await supabaseAdmin.from("usuarios").upsert({
      id: data.user.id,
      email,
      nome,
      perfil,
      empresa_id,
      ativo: true,
    }, { onConflict: "id" });

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
