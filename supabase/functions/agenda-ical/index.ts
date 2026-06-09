import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Token ausente", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Valida o token buscando a empresa
  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("id, nome")
    .eq("api_key", token)
    .single();

  if (empresaError || !empresa) {
    return new Response("Token inválido", { status: 401 });
  }

  // Busca eventos dos próximos 90 dias
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + 90);

  // data é armazenada como text no formato YYYY-MM-DD
  const hojeStr = hoje.toISOString().slice(0, 10);
  const limiteStr = limite.toISOString().slice(0, 10);

  const { data: eventos } = await supabase
    .from("eventos")
    .select("id, titulo, data, hora, obs, cliente, obra, tipo")
    .eq("empresa_id", empresa.id)
    .gte("data", hojeStr)
    .lte("data", limiteStr)
    .order("data", { ascending: true });

  // Gera o feed iCal
  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StickFrame//Agenda//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:StickFrame - ${escIcal(empresa.nome)}`,
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];

  for (const ev of (eventos ?? [])) {
    const dtStart = formatDt(ev.data, ev.hora);
    const dtEnd = formatDt(ev.data, ev.hora, 60); // +1h padrão

    const descParts: string[] = [];
    if (ev.tipo) descParts.push(`Tipo: ${ev.tipo}`);
    if (ev.cliente) descParts.push(`Cliente: ${ev.cliente}`);
    if (ev.obra) descParts.push(`Obra: ${ev.obra}`);
    if (ev.obs) descParts.push(ev.obs);
    const descricao = descParts.join("\\n");

    linhas.push("BEGIN:VEVENT");
    linhas.push(`UID:${ev.id}@stickframe`);
    linhas.push(`DTSTAMP:${nowDt()}`);
    linhas.push(`DTSTART:${dtStart}`);
    linhas.push(`DTEND:${dtEnd}`);
    linhas.push(`SUMMARY:${escIcal(ev.titulo || "Sem título")}`);
    if (descricao) linhas.push(`DESCRIPTION:${descricao}`);
    linhas.push("END:VEVENT");
  }

  linhas.push("END:VCALENDAR");

  const icsContent = linhas.join("\r\n") + "\r\n";

  return new Response(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="stickframe-agenda.ics"`,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

/** Escapa caracteres especiais do iCal */
function escIcal(str: string): string {
  return (str ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Formata data+hora para iCal UTC.
 * data: "YYYY-MM-DD", hora: "HH:MM" ou null
 * offsetMin: minutos a somar (para dtEnd)
 */
function formatDt(data: string, hora: string | null, offsetMin = 0): string {
  // Interpreta como horário de Brasília (UTC-3)
  const horaStr = hora && hora.match(/^\d{2}:\d{2}/) ? hora.slice(0, 5) : "00:00";
  const [year, month, day] = data.split("-").map(Number);
  const [hh, mm] = horaStr.split(":").map(Number);

  // Brasília = UTC-3, então somamos 3h para converter para UTC
  const d = new Date(Date.UTC(year, month - 1, day, hh + 3 + Math.floor(offsetMin / 60), mm + (offsetMin % 60)));

  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Timestamp atual em formato iCal */
function nowDt(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
