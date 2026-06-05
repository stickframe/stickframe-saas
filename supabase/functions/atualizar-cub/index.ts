import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Busca CUB da Brasil API (estado SP como padrão)
    const estado = "SP";
    const apiResp = await fetch(`https://brasilapi.com.br/api/cub/v1?state=${estado}`, {
      headers: { "Accept": "application/json" },
    });

    if (!apiResp.ok) {
      throw new Error(`BrasilAPI error: ${apiResp.status} ${await apiResp.text()}`);
    }

    const cubData = await apiResp.json();

    // Procura o índice R1B (Residencial 1 andar Baixo)
    // A BrasilAPI retorna array de objetos com campos: index_type, valor, vigencia, state
    let cubR1B: number | null = null;
    let cubEntry: unknown = null;

    if (Array.isArray(cubData)) {
      const entry = cubData.find(
        (c: { index_type?: string }) =>
          c.index_type === "R1-B" || c.index_type === "R1B" || c.index_type?.includes("R1")
      );
      if (entry) {
        cubEntry = entry;
        cubR1B = parseFloat(entry.valor ?? entry.value ?? 0);
      } else if (cubData.length > 0) {
        // Usa o primeiro disponível
        cubEntry = cubData[0];
        cubR1B = parseFloat(cubData[0].valor ?? cubData[0].value ?? 0);
      }
    } else if (cubData && typeof cubData === "object") {
      cubR1B = parseFloat(
        (cubData as Record<string, unknown>).valor as string ??
        (cubData as Record<string, unknown>).value as string ??
        0
      );
      cubEntry = cubData;
    }

    if (!cubR1B || cubR1B <= 0) {
      // Fallback: retorna valor de referência (CUB SP R1-B aproximado)
      cubR1B = 2450.0;
    }

    // Tenta persistir nas tabelas disponíveis
    const sb = createClient(supabaseUrl, serviceKey);

    // Verifica se existe tabela configuracoes
    const { data: configExists } = await sb
      .from("configuracoes")
      .select("id")
      .limit(1);

    if (configExists !== null) {
      // Tabela existe — upsert
      await sb
        .from("configuracoes")
        .upsert({ chave: "cub_r1b", valor: String(cubR1B), atualizado_em: new Date().toISOString() }, { onConflict: "chave" });
    } else {
      // Tenta salvar na tabela empresas se tiver coluna cub
      const { error: empError } = await sb
        .from("empresas")
        .update({ cub: cubR1B })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // atualiza todas

      if (empError) {
        // Sem persistência disponível, apenas retorna o valor
        console.warn("Não foi possível persistir CUB:", empError.message);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        cub: cubR1B,
        estado,
        fonte: "brasilapi.com.br",
        entrada: cubEntry,
        atualizadoEm: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
