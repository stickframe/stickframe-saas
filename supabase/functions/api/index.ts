import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

async function getEmpresaByApiKey(supabase: any, apiKey: string) {
  const { data } = await supabase
    .from("empresas")
    .select("id, nome")
    .eq("api_key", apiKey)
    .single();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth
  const auth = req.headers.get("Authorization");
  const apiKey = auth?.replace("Bearer ", "").trim();
  if (!apiKey?.startsWith("sf_live_")) {
    return new Response(JSON.stringify({ error: "API key inválida" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const empresa = await getEmpresaByApiKey(supabase, apiKey);
  if (!empresa) {
    return new Response(JSON.stringify({ error: "API key não encontrada" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const url = new URL(req.url);
  // strip /api prefix
  const path = url.pathname.replace(/^\/api/, "").replace(/^\/functions\/v1\/api/, "");
  const parts = path.split("/").filter(Boolean);

  try {
    let data: any = null;

    if (parts[0] === "obras" && !parts[1]) {
      // GET /obras
      const { data: obras } = await supabase.from("obras").select("*").eq("empresa_id", empresa.id).order("created_at", { ascending: false });
      data = { data: obras, total: obras?.length };
    } else if (parts[0] === "obras" && parts[1] && !parts[2]) {
      // GET /obras/:id
      const { data: obra } = await supabase.from("obras").select("*").eq("id", parts[1]).eq("empresa_id", empresa.id).single();
      data = { data: obra };
    } else if (parts[0] === "obras" && parts[1] && parts[2] === "financeiro") {
      // GET /obras/:id/financeiro
      const { data: fin } = await supabase.from("financeiro").select("*").eq("obra_id", parts[1]).eq("empresa_id", empresa.id);
      data = { data: fin, total: fin?.length };
    } else if (parts[0] === "clientes") {
      const { data: clientes } = await supabase.from("clientes").select("id,nome,status,cidade,email,contato,valor,created_at").eq("empresa_id", empresa.id).order("created_at", { ascending: false });
      data = { data: clientes, total: clientes?.length };
    } else if (parts[0] === "financeiro") {
      const { data: fin } = await supabase.from("financeiro").select("*").eq("empresa_id", empresa.id).order("data", { ascending: false }).limit(100);
      data = { data: fin, total: fin?.length };
    } else if (parts[0] === "webhooks" && parts[1] === "test" && req.method === "POST") {
      data = { message: "Webhook recebido com sucesso", timestamp: new Date().toISOString() };
    } else {
      return new Response(JSON.stringify({ error: "Rota não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: true, empresa: empresa.nome, ...data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
