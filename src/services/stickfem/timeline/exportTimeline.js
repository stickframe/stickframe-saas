/**
 * StickFEM™ — Linha do Tempo: exportação (CSV, JSON, PDF).
 */
import { printHtml } from "../../utils/printHtml";
import { LOGO_STICKFRAME } from "../../utils/cdn";

const slug = (s) => String(s || "timeline").replace(/\s+/g, "-").replace(/[^\w-]/g, "").toLowerCase();
const baixar = (conteudo, nome, mime) => {
  const blob = new Blob([conteudo], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  URL.revokeObjectURL(url);
};

const csvCampo = (v) => {
  const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportarTimelineCSV(eventos, projeto = "projeto") {
  const cols = ["data", "tipo", "modulo", "severidade", "usuario", "engineVersion", "hash", "descricao", "payload"];
  const linhas = [cols.join(";")];
  for (const e of eventos) linhas.push(cols.map((c) => csvCampo(e[c])).join(";"));
  baixar(linhas.join("\n"), `stickfem-timeline-${slug(projeto)}.csv`, "text/csv");
}

export function exportarTimelineJSON(eventos, projeto = "projeto") {
  baixar(JSON.stringify(eventos, null, 2), `stickfem-timeline-${slug(projeto)}.json`, "application/json");
}

export function exportarTimelinePDF(eventos, projeto = "projeto") {
  const rows = eventos.map((e) => `
    <tr style="border-top:1px solid #eee">
      <td style="padding:6px 10px;font-size:11px;color:#6b7280;white-space:nowrap">${new Date(e.data).toLocaleString("pt-BR")}</td>
      <td style="padding:6px 10px;font-size:12px">${e.icone || ""} ${e.label || e.tipo}</td>
      <td style="padding:6px 10px;font-size:10.5px;color:#6b7280">${e.modulo}</td>
      <td style="padding:6px 10px;font-size:11px">${e.descricao || ""}</td>
      <td style="padding:6px 10px;font-family:monospace;font-size:10px;color:#9ca3af">${e.hash || ""}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Linha do Tempo — ${projeto}</title></head>
    <body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:900px;margin:auto;padding:32px 40px">
      <div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid #e5e7eb;padding-bottom:14px;margin-bottom:18px">
        <img src="${LOGO_STICKFRAME}" style="width:44px;height:44px;object-fit:contain;border-radius:10px">
        <div>
          <div style="font-size:10px;letter-spacing:2px;color:#6b7280;font-weight:700;text-transform:uppercase">Linha do Tempo da Engenharia</div>
          <div style="font-size:20px;font-weight:900;color:#981915">StickFEM&trade;</div>
        </div>
        <div style="margin-left:auto;text-align:right;font-size:10px;color:#6b7280">${projeto}<br>${new Date().toLocaleString("pt-BR")} · ${eventos.length} eventos</div>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#f9fafb">
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280">Data/hora</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280">Evento</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280">Módulo</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280">Descrição</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280">Hash</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
  printHtml(html, `stickfem-timeline-${slug(projeto)}`);
}
