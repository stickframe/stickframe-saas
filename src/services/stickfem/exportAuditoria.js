/**
 * StickFEM™ — Exportação da memória de cálculo auditável.
 * Gera JSON (download) e PDF técnico (via printHtml). Todo o conteúdo vem de
 * auditarPreDimensionamento — nada é recomputado nem enfeitado aqui.
 */
import { printHtml } from "../../utils/printHtml";
import { LOGO_STICKFRAME } from "../../utils/cdn";

const fmt = (v, u) => (v == null || v === "—" ? "—" : `${v}${u ? " " + u : ""}`);
const slug = (s) => String(s || "auditoria").replace(/\s+/g, "-").replace(/[^\w-]/g, "").toLowerCase();

/** Download da memória completa em JSON. */
export function exportarAuditoriaJSON(auditoria) {
  const blob = new Blob([JSON.stringify(auditoria, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stickfem-auditoria-${slug(auditoria?.entradas?.projeto)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** PDF técnico (memória de cálculo passo a passo, com normas e disclaimers). */
export function exportarAuditoriaPDF(auditoria) {
  const { versao, estagio, geradoEm, entradas, memoria, resultado, motivo, avisos } = auditoria;

  const entradasRows = [
    ["Projeto", entradas.projeto], ["Tipologia", entradas.tipologia],
    ["Perfil (montante)", entradas.perfil],
    ["Área A", fmt(entradas.area_mm2, "mm²")], ["Inércia Ix", fmt(entradas.inercia_x_mm4, "mm⁴")],
    ["Inércia Iy", fmt(entradas.inercia_y_mm4, "mm⁴")],
    ["fy", fmt(entradas.fy_mpa, "MPa")], ["E", fmt(entradas.e_mpa, "MPa")],
    ["Pé-direito / comprimento", fmt(entradas.peDireitoM, "m")],
    ["Espaçamento de montantes", fmt(entradas.espacMontanteM, "m")],
    ["Largura tributária", fmt(entradas.larguraTributariaM, "m")],
    ["Carga permanente G", fmt(entradas.gPerm_kNm2, "kN/m²")],
    ["Sobrecarga Q", fmt(entradas.qSobre_kNm2, "kN/m²")],
    ["Vento V0", fmt(entradas.v0_ms, "m/s")],
  ].map(([k, v]) => `<tr><td style="padding:4px 10px;color:#6b7280;font-size:11px">${k}</td><td style="padding:4px 10px;font-size:12px;font-weight:600">${v}</td></tr>`).join("");

  let grupoAtual = "";
  const passosRows = memoria.map((p) => {
    const header = p.grupo !== grupoAtual
      ? (grupoAtual = p.grupo, `<tr><td colspan="4" style="padding:10px 10px 4px;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#8c847a">${p.grupo}</td></tr>`)
      : "";
    const flag = p.simplificado ? ` <span style="font-size:9px;background:#fbeee0;color:#b07a1e;border-radius:4px;padding:1px 5px">simplificado</span>` : "";
    const nota = p.nota ? `<div style="font-size:10px;color:#9ca3af;margin-top:2px">${p.nota}</div>` : "";
    return header + `
      <tr style="border-top:1px solid #eee">
        <td style="padding:7px 10px;font-size:12px;font-weight:600">${p.etapa}${flag}${nota}</td>
        <td style="padding:7px 10px;font-family:monospace;font-size:11px;color:#374151">${p.formula}<div style="color:#9ca3af">= ${p.substituicao}</div></td>
        <td style="padding:7px 10px;text-align:right;font-size:12px;font-weight:700;white-space:nowrap">${fmt(p.valor, p.unidade)}</td>
        <td style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280;white-space:nowrap">${p.norma}</td>
      </tr>`;
  }).join("");

  const corStatus = { aprovado: "#3f7a4b", atencao: "#b07a1e", revisar: "#981915", indefinido: "#8c847a" }[resultado.status] || "#8c847a";
  const avisosHtml = (avisos || []).map((a) => `<li style="margin-bottom:3px">${a}</li>`).join("");

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Memória de cálculo — ${entradas.projeto}</title></head>
    <body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:900px;margin:auto;padding:32px 40px">
      <div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid #e5e7eb;padding-bottom:14px;margin-bottom:20px">
        <img src="${LOGO_STICKFRAME}" style="width:44px;height:44px;object-fit:contain;border-radius:10px">
        <div>
          <div style="font-size:10px;letter-spacing:2px;color:#6b7280;font-weight:700;text-transform:uppercase">Memória de Cálculo · Auditoria Técnica</div>
          <div style="font-size:20px;font-weight:900;color:#981915">StickFEM&trade;</div>
        </div>
        <div style="margin-left:auto;text-align:right;font-size:10px;color:#6b7280">
          Motor v${versao} · ${estagio}<br>${new Date(geradoEm).toLocaleString("pt-BR")}
        </div>
      </div>

      <div style="font-size:13px;font-weight:800;margin-bottom:6px">Entradas</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:18px">${entradasRows}</table>

      <div style="font-size:13px;font-weight:800;margin-bottom:6px">Cadeia de cálculo</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#f9fafb">
          <th style="padding:7px 10px;text-align:left;font-size:10px;color:#6b7280">Etapa</th>
          <th style="padding:7px 10px;text-align:left;font-size:10px;color:#6b7280">Fórmula / substituição</th>
          <th style="padding:7px 10px;text-align:right;font-size:10px;color:#6b7280">Valor</th>
          <th style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280">Norma</th>
        </tr></thead>
        <tbody>${passosRows}</tbody>
      </table>

      <div style="margin-top:16px;padding:12px 16px;border-radius:8px;background:${corStatus}12;border:1px solid ${corStatus}44">
        <div style="font-size:15px;font-weight:900;color:${corStatus};text-transform:uppercase">${resultado.status} · η = ${resultado.utilizacao}</div>
        <div style="font-size:12px;color:#374151;margin-top:3px">${motivo}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px">
          N_Sd = ${resultado.nSd_kN} kN · N_Rd = ${resultado.nRd_kN} kN · esbeltez λ = ${resultado.esbeltez}
          ${resultado.esbeltezOk ? "" : " (⚠ &gt; 200)"} · modo governante: ${resultado.modoGovernante}
        </div>
      </div>

      <div style="margin-top:16px;padding:12px 16px;background:#faf8f4;border:1px solid #e7e1d8;border-radius:8px">
        <div style="font-weight:800;text-transform:uppercase;letter-spacing:1px;font-size:10px;color:#8c847a;margin-bottom:6px">Limitações do modelo (leia antes de usar)</div>
        <ul style="margin:0;padding-left:18px;font-size:11px;color:#57514a;line-height:1.5">${avisosHtml}</ul>
      </div>

      <div style="margin-top:14px;padding:10px 14px;background:#f3f4f6;border-radius:8px;font-size:10px;color:#9ca3af;line-height:1.6">
        Pré-dimensionamento assistido por computador (StickFEM™ motor v${versao}). Caráter preliminar — a validação
        final e a responsabilidade técnica são do engenheiro habilitado (ART/RRT). Não substitui o dimensionamento
        completo conforme NBR 14762, NBR 6120, NBR 6123 e NBR 8681.
      </div>
    </body></html>`;

  printHtml(html, `stickfem-auditoria-${slug(entradas.projeto)}`);
}
