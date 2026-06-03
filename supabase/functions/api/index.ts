import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return new Response(JSON.stringify({ erro: "x-api-key obrigatório" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate API key against empresas table (add api_key column concept — just validate for now)
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "");

  const respond = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  // GET /obras
  if (req.method === "GET" && path === "/obras") {
    const { data, error } = await sb.from("obras").select("id, nome, status, fase, progresso, prazo, contrato, created_at").limit(100);
    if (error) return respond({ erro: error.message }, 500);
    return respond({ data, total: data?.length });
  }

  // GET /obras/:id
  const obraMatch = path.match(/^\/obras\/([a-f0-9-]+)$/);
  if (req.method === "GET" && obraMatch) {
    const { data, error } = await sb.from("obras").select("*").eq("id", obraMatch[1]).single();
    if (error) return respond({ erro: "Obra não encontrada" }, 404);
    return respond({ data });
  }

  // GET /clientes
  if (req.method === "GET" && path === "/clientes") {
    const { data, error } = await sb.from("clientes").select("id, nome, email, telefone, status, created_at").limit(100);
    if (error) return respond({ erro: error.message }, 500);
    return respond({ data, total: data?.length });
  }

  return respond({ erro: "Rota não encontrada", rotas: ["GET /obras", "GET /obras/:id", "GET /clientes"] }, 404);
});
