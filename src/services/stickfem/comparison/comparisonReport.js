/**
 * StickFEM™ — Engineering Diff: Memorial Comparativo (PDF).
 * Resumo, tabela de alterações, impacto técnico e financeiro, hashes das duas
 * versões e versão do engine. Reutiliza printHtml.
 */
import { STATUS_META } from "./diffEngine";
import { ENGINE_VERSION } from "../engine/version";
import { printHtml } from "../../../utils/printHtml";
import { LOGO_STICKFRAME } from "../../../utils/cdn";

const fmtN = (v, d = 0) => (v == null ? "—" : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }));
const fmtBRL = (v) => (v == null ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }));
const sinal = (d) => (d == null ? "" : d > 0 ? `+${fmtN(d, Number.isInteger(d) ? 0 : 1)}` : fmtN(d, Number.isInteger(d) ? 0 : 1));
const corDelta = (d, bomSubir) => (d == null || d === 0 ? "#6b7280" : (d > 0) === bomSubir ? "#3f7a4b" : "#981915");
const slug = (s) => String(s || "comparacao").replace(/\s+/g, "-").replace(/[^\w-]/g, "").toLowerCase();

export function gerarRelatorioComparativoPDF({ diff, impacto, meta = {} }) {
  const { nomeAntes = "Original", nomeDepois = "Revisado", hashAntes, hashDepois } = meta;
  const r = diff.resumo;

  const chip = (st) => `<span style="font-size:10px;font-weight:800;color:#fff;background:${STATUS_META[st].cor};border-radius:4px;padding:1px 6px">${STATUS_META[st].label}</span>`;
  const resumoHtml = ["novo", "removido", "modificado", "movido", "igual"]
    .map((st) => `<span style="margin-right:12px">${chip(st)} <b>${r[st]}</b></span>`).join("");

  const alteracoes = diff.itens.filter((i) => i.status !== "igual").slice(0, 120).map((it) => {
    const campos = (it.mudancas || []).map((m) => `${m.label}: <b>${m.rotuloDe ?? m.de ?? "—"}</b>→<b>${m.rotuloPara ?? m.para ?? "—"}</b>`).join(" · ") || "—";
    return `<tr style="border-top:1px solid #eee">
      <td style="padding:6px 10px;font-size:12px;font-weight:600">${it.nome}</td>
      <td style="padding:6px 10px">${chip(it.status)}</td>
      <td style="padding:6px 10px;font-size:11px;color:#374151">${campos}</td></tr>`;
  }).join("");

  const linhaImp = (label, o, unidade = "", bomSubir = false, moeda = false) => `
    <tr style="border-top:1px solid #eee">
      <td style="padding:6px 10px;font-size:12px;font-weight:600">${label}</td>
      <td style="padding:6px 10px;text-align:right;font-size:12px">${moeda ? fmtBRL(o.antes) : fmtN(o.antes, 0)}${unidade}</td>
      <td style="padding:6px 10px;text-align:right;font-size:12px">${moeda ? fmtBRL(o.depois) : fmtN(o.depois, 0)}${unidade}</td>
      <td style="padding:6px 10px;text-align:right;font-size:12px;font-weight:800;color:${corDelta(o.delta, bomSubir)}">${o.delta == null ? "—" : (moeda ? (o.delta > 0 ? "+" : "") + fmtBRL(o.delta) : sinal(o.delta) + unidade)}</td>
    </tr>`;

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Comparação — ${nomeAntes} × ${nomeDepois}</title></head>
    <body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:900px;margin:auto;padding:32px 40px">
      <div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid #e5e7eb;padding-bottom:14px;margin-bottom:18px">
        <img src="${LOGO_STICKFRAME}" style="width:44px;height:44px;object-fit:contain;border-radius:10px">
        <div>
          <div style="font-size:10px;letter-spacing:2px;color:#6b7280;font-weight:700;text-transform:uppercase">Engineering Diff · Comparação entre versões</div>
          <div style="font-size:20px;font-weight:900;color:#981915">StickFEM&trade;</div>
        </div>
        <div style="margin-left:auto;text-align:right;font-size:10px;color:#6b7280">
          Engine v${ENGINE_VERSION}<br>${new Date().toLocaleString("pt-BR")}
        </div>
      </div>

      <div style="font-size:13px;font-weight:700;margin-bottom:8px">${nomeAntes} ${hashAntes ? `<span style="font-family:monospace;color:#9ca3af">${hashAntes}</span>` : ""} → ${nomeDepois} ${hashDepois ? `<span style="font-family:monospace;color:#9ca3af">${hashDepois}</span>` : ""}</div>

      <div style="font-size:13px;font-weight:800;margin:14px 0 6px">1 · Resumo</div>
      <div style="padding:10px 14px;background:#faf8f4;border:1px solid #e7e1d8;border-radius:8px;font-size:13px">${resumoHtml}</div>

      <div style="font-size:13px;font-weight:800;margin:16px 0 6px">2 · Impacto técnico e financeiro</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#f9fafb">
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280">Indicador</th>
          <th style="padding:6px 10px;text-align:right;font-size:10px;color:#6b7280">Antes</th>
          <th style="padding:6px 10px;text-align:right;font-size:10px;color:#6b7280">Depois</th>
          <th style="padding:6px 10px;text-align:right;font-size:10px;color:#6b7280">Δ</th>
        </tr></thead>
        <tbody>
          ${linhaImp("Peso total", impacto.peso_kg, " kg", false)}
          ${linhaImp("Montantes", impacto.montantes, "", false)}
          ${linhaImp("Guias", impacto.guias, "", false)}
          ${linhaImp("Perfis (tipos)", impacto.perfis, "", false)}
          ${linhaImp("Custo estimado", impacto.custo, "", false, true)}
          ${linhaImp("StickScore", impacto.stickScore, "", true)}
          ${linhaImp("Conflitos", impacto.conflitos, "", false)}
        </tbody>
      </table>

      <div style="font-size:13px;font-weight:800;margin:16px 0 6px">3 · Tabela de alterações</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#f9fafb">
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280">Elemento</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280">Status</th>
          <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280">Alterações</th>
        </tr></thead>
        <tbody>${alteracoes || `<tr><td colspan="3" style="padding:8px 10px;font-size:12px;color:#9ca3af">Sem alterações (versões equivalentes).</td></tr>`}</tbody>
      </table>

      <div style="margin-top:16px;padding:10px 14px;background:#f3f4f6;border-radius:8px;font-size:10px;color:#9ca3af;line-height:1.6">
        Comparação assistida por computador (StickFEM™ Engineering Diff, engine v${ENGINE_VERSION}). Custos por peso de aço
        (R$ ${fmtN(impacto.precoKg, 2)}/kg) sujeitos a confirmação. Caráter preliminar; a responsabilidade técnica é do
        engenheiro habilitado (ART/RRT).
      </div>
    </body></html>`;

  printHtml(html, `stickfem-comparacao-${slug(nomeAntes)}-${slug(nomeDepois)}`);
}
