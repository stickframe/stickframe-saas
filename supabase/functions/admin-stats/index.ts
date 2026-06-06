import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "andrequeirozcandido@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) throw new Error("Acesso negado");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Busca todas as empresas
    const { data: empresas, error: errEmpresas } = await supabaseAdmin
      .from("empresas")
      .select("id, nome, plano, created_at, limite_obras")
      .order("created_at", { ascending: false });
    if (errEmpresas) throw errEmpresas;

    // Busca obras ativas por empresa
    const { data: obrasAtivas } = await supabaseAdmin
      .from("obras")
      .select("empresa_id")
      .not("status", "eq", "Concluída")
      .not("status", "eq", "Cancelada");

    // Busca usuários por empresa
    const { data: usuarios } = await supabaseAdmin
      .from("usuarios")
      .select("empresa_id");

    // Monta contadores por empresa
    const obrasMap: Record<string, number> = {};
    for (const o of obrasAtivas ?? []) {
      obrasMap[o.empresa_id] = (obrasMap[o.empresa_id] ?? 0) + 1;
    }

    const usuariosMap: Record<string, number> = {};
    for (const u of usuarios ?? []) {
      usuariosMap[u.empresa_id] = (usuariosMap[u.empresa_id] ?? 0) + 1;
    }

    const result = (empresas ?? []).map((e) => ({
      ...e,
      obras_ativas: obrasMap[e.id] ?? 0,
      total_usuarios: usuariosMap[e.id] ?? 0,
    }));

    const totals = {
      total: result.length,
      free: result.filter((e) => e.plano === "free").length,
      pro: result.filter((e) => e.plano === "pro").length,
    };

    return new Response(JSON.stringify({ empresas: result, totals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
