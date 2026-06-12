import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = [
  "andrequeirozcandido@gmail.com",
  "andre@stickframe.com.br",
];

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
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) throw new Error("Acesso negado");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Busca todas as empresas
    const { data: empresas, error: errEmpresas } = await supabaseAdmin
      .from("empresas")
      .select("id, nome, plano, created_at, limite_obras, trial_ends_at")
      .order("created_at", { ascending: false });
    if (errEmpresas) throw errEmpresas;

    // Busca obras ativas por empresa
    const { data: obrasAtivas } = await supabaseAdmin
      .from("obras")
      .select("empresa_id")
      .not("status", "eq", "Concluída")
      .not("status", "eq", "Cancelada");

    // Busca usuários por empresa (com nome/perfil para identificar o contato)
    const { data: usuarios } = await supabaseAdmin
      .from("usuarios")
      .select("id, empresa_id, nome, perfil");

    // E-mails vêm do auth (não existem em public.usuarios)
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap: Record<string, string> = {};
    for (const au of authList?.users ?? []) {
      emailMap[au.id] = au.email ?? "";
    }

    // Monta contadores por empresa
    const obrasMap: Record<string, number> = {};
    for (const o of obrasAtivas ?? []) {
      obrasMap[o.empresa_id] = (obrasMap[o.empresa_id] ?? 0) + 1;
    }

    const usuariosMap: Record<string, number> = {};
    const contatoMap: Record<string, { nome: string; email: string }> = {};
    for (const u of usuarios ?? []) {
      usuariosMap[u.empresa_id] = (usuariosMap[u.empresa_id] ?? 0) + 1;
      // Primeiro diretor encontrado vira o contato da empresa
      if (u.perfil === "diretor" && !contatoMap[u.empresa_id]) {
        contatoMap[u.empresa_id] = { nome: u.nome, email: emailMap[u.id] ?? "" };
      }
    }

    const result = (empresas ?? []).map((e) => ({
      ...e,
      obras_ativas: obrasMap[e.id] ?? 0,
      total_usuarios: usuariosMap[e.id] ?? 0,
      contato_nome: contatoMap[e.id]?.nome ?? null,
      contato_email: contatoMap[e.id]?.email ?? null,
      trial_ativo: e.plano === "free" && e.trial_ends_at && new Date(e.trial_ends_at) > new Date(),
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
