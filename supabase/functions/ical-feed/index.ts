import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function parseDateTime(dataISO: string, horaStr?: string | null): Date {
  let normalizedDate = dataISO;
  if (dataISO.includes("/")) {
    const [d, m, a] = dataISO.split("/");
    normalizedDate = `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const [y, m, d] = normalizedDate.split("-").map(Number);
  const [hh, mm]  = (horaStr || "09:00").split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm));
}

function formatICalDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${y}${m}${d}T${hh}${mm}00`;
}

function formatUTCStamp(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function escapeText(val?: string | null): string {
  if (!val) return "";
  return val
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Token ausente", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return new Response("Token inválido", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id, nome")
      .eq("ical_token", token)
      .single();

    if (empresaError || !empresa) {
      return new Response("Empresa não encontrada ou token inválido", { status: 404, headers: { "Content-Type": "text/plain" } });
    }

    // Buscar eventos
    const { data: eventos, error: eventosError } = await supabase
      .from("eventos")
      .select("*")
      .eq("empresa_id", empresa.id);

    if (eventosError) {
      throw eventosError;
    }

    const now = new Date();
    const dtStamp = formatUTCStamp(now);

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//StickFrame//Agenda//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:StickFrame - ${empresa.nome}`,
      "X-WR-TIMEZONE:America/Sao_Paulo",
    ];

    eventos?.forEach((e: any) => {
      if (!e.data) return;

      const startDate = parseDateTime(e.data, e.hora);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1h

      const dtStartStr = formatICalDate(startDate);
      const dtEndStr = formatICalDate(endDate);

      const descParts = [];
      if (e.tipo) descParts.push(`Tipo: ${e.tipo}`);
      if (e.cliente) descParts.push(`Cliente: ${e.cliente}`);
      if (e.obra) descParts.push(`Obra: ${e.obra}`);
      if (e.obs) descParts.push(`Obs: ${e.obs}`);
      const description = descParts.join("\n");

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:evento-${e.id}@stickframe.com.br`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART:${dtStartStr}`);
      lines.push(`DTEND:${dtEndStr}`);
      lines.push(`SUMMARY:${escapeText(e.titulo || "Compromisso")}`);
      if (description) {
        lines.push(`DESCRIPTION:${escapeText(description)}`);
      }
      if (e.obra) {
        lines.push(`LOCATION:${escapeText(e.obra)}`);
      }
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");

    const icsContent = lines.join("\r\n");

    return new Response(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="agenda-${empresa.nome.toLowerCase().replace(/[^a-z0-9]/g, "-")}.ics"`,
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(`Erro ao processar calendário: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain", ...corsHeaders },
    });
  }
});
