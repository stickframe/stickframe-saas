/**
 * StickFEM™ — Memorial de Engenharia (Fase 10).
 *
 * Gera o memorial técnico completo a partir do motor de AUDITORIA já existente
 * (auditarPreDimensionamento): entradas, cargas, combinações, memória de cálculo
 * passo a passo, normas, limitações do modelo, versão do engine e um HASH
 * determinístico do cálculo (reprodutibilidade). Nada é recomputado aqui.
 */
import { auditarPreDimensionamento } from "./auditoria";
import { ENGINE_VERSION } from "./engine/version";
import { printHtml } from "../../utils/printHtml";
import { LOGO_STICKFRAME } from "../../utils/cdn";

const fmt = (v, u) => (v == null || v === "—" ? "—" : `${v}${u && u !== "—" ? " " + u : ""}`);
const slug = (s) => String(s || "memorial").replace(/\s+/g, "-").replace(/[^\w-]/g, "").toLowerCase();

/** Hash determinístico (FNV-1a, 32-bit hex) das entradas + versão do engine. */
export function hashCalculo(auditoria) {
  const payload = JSON.stringify({ v: auditoria.versao, e: auditoria.entradas });
  let h = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Monta o objeto do memorial (auditoria + hash + metadados de responsável).
 * @param {Object} params { design, projeto, engenheiro, aprovacoes }
 */
export function montarMemorial({ design, projeto, engenheiro, aprovacoes }) {
  const auditoria = auditarPreDimensionamento(design);
  const p = design?.perfil || {};
  // Proveniência do perfil usado (catálogo local versionado no Supabase).
  const catalogo = {
    nome: p.nome ?? null, codigo: p.codigo ?? null, norma: p.norma ?? null,
    categoria: p.categoria ?? null, familia: p.familia ?? null, fonte: p.fonte ?? null,
    versao_catalogo: p.versao_catalogo ?? null, ultima_sincronizacao: p.ultima_sincronizacao ?? null,
    area_mm2: p.area_mm2 ?? null, peso_kg_m: p.peso_kg_m ?? null,
  };
  return {
    auditoria,
    hash: hashCalculo(auditoria),
    engineVersion: ENGINE_VERSION,
    projeto: projeto || {},
    engenheiro: engenheiro || null,
    aprovacoes: aprovacoes || [],
    catalogo,
    geradoEm: new Date().toISOString(),
  };
}

/** Gera o PDF técnico do memorial (via printHtml). */
export function gerarMemorialPDF(memorial) {
  const { auditoria, hash, engineVersion, projeto, engenheiro, aprovacoes, catalogo = {}, geradoEm } = memorial;
  const { entradas, memoria, resultado, motivo, avisos } = auditoria;

  const linhaEntrada = (k, v) => `<tr><td style="padding:4px 10px;color:#6b7280;font-size:11px">${k}</td><td style="padding:4px 10px;font-size:12px;font-weight:600">${v}</td></tr>`;
  const entradasRows = [
    ["Projeto", projeto?.nome || entradas.projeto], ["Tipologia", entradas.tipologia],
    ["Perfil (montante)", entradas.perfil], ["Área A", fmt(entradas.area_mm2, "mm²")],
    ["fy", fmt(entradas.fy_mpa, "MPa")], ["E", fmt(entradas.e_mpa, "MPa")],
    ["Pé-direito / comprimento", fmt(entradas.peDireitoM, "m")],
    ["Espaçamento de montantes", fmt(entradas.espacMontanteM, "m")],
    ["Largura tributária", fmt(entradas.larguraTributariaM, "m")],
    ["Carga permanente G", fmt(entradas.gPerm_kNm2, "kN/m²")],
    ["Sobrecarga Q", fmt(entradas.qSobre_kNm2, "kN/m²")], ["Vento V0", fmt(entradas.v0_ms, "m/s")],
  ].map(([k, v]) => linhaEntrada(k, v)).join("");

  let grupo = "";
  const passosRows = memoria.map((p) => {
    const head = p.grupo !== grupo ? (grupo = p.grupo, `<tr><td colspan="4" style="padding:10px 10px 4px;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#8c847a">${p.grupo}</td></tr>`) : "";
    const flag = p.simplificado ? ` <span style="font-size:9px;background:#fbeee0;color:#b07a1e;border-radius:4px;padding:1px 5px">simplificado</span>` : "";
    return head + `<tr style="border-top:1px solid #eee">
      <td style="padding:7px 10px;font-size:12px;font-weight:600">${p.etapa}${flag}${p.nota ? `<div style="font-size:10px;color:#9ca3af;margin-top:2px">${p.nota}</div>` : ""}</td>
      <td style="padding:7px 10px;font-family:monospace;font-size:11px;color:#374151">${p.formula}<div style="color:#9ca3af">= ${p.substituicao}</div></td>
      <td style="padding:7px 10px;text-align:right;font-size:12px;font-weight:700;white-space:nowrap">${fmt(p.valor, p.unidade)}</td>
      <td style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280;white-space:nowrap">${p.norma}</td></tr>`;
  }).join("");

  const cor = { aprovado: "#3f7a4b", atencao: "#b07a1e", revisar: "#981915", indefinido: "#8c847a" }[resultado.status] || "#8c847a";
  const avisosHtml = (avisos || []).map((a) => `<li style="margin-bottom:3px">${a}</li>`).join("");
  const aprovacaoHtml = (aprovacoes || []).length
    ? aprovacoes.map((a) => `<div style="font-size:11px;color:#374151"><b style="color:${a.status === "aprovado" ? "#3f7a4b" : "#981915"}">${a.status}</b> — ${a.engenheiro_nome || ""}${a.engenheiro_crea ? ` (${a.engenheiro_crea})` : ""}${a.observacoes ? ` · ${a.observacoes}` : ""}</div>`).join("")
    : `<div style="font-size:11px;color:#9ca3af">Sem aprovação técnica registrada.</div>`;

  const eng = engenheiro?.nome
    ? `${engenheiro.nome}${engenheiro.crea ? ` — ${engenheiro.crea}` : ""}`
    : "responsável técnico a designar (ART/RRT)";

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Memorial de Cálculo — ${projeto?.nome || entradas.projeto}</title></head>
    <body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:900px;margin:auto;padding:32px 40px">
      <div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid #e5e7eb;padding-bottom:14px;margin-bottom:20px">
        <img src="${LOGO_STICKFRAME}" style="width:44px;height:44px;object-fit:contain;border-radius:10px">
        <div>
          <div style="font-size:10px;letter-spacing:2px;color:#6b7280;font-weight:700;text-transform:uppercase">Memorial de Cálculo Estrutural</div>
          <div style="font-size:20px;font-weight:900;color:#981915">StickFEM&trade;</div>
        </div>
        <div style="margin-left:auto;text-align:right;font-size:10px;color:#6b7280">
          Engine v${engineVersion} · hash <b>${hash}</b><br>${new Date(geradoEm).toLocaleString("pt-BR")}
        </div>
      </div>

      <div style="font-size:12px;color:#374151;margin-bottom:14px">
        <b>Responsável técnico:</b> ${eng}
      </div>

      <div style="font-size:13px;font-weight:800;margin-bottom:6px">1 · Premissas / Entradas</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:18px">${entradasRows}</table>

      <div style="font-size:13px;font-weight:800;margin-bottom:6px">2 · Memória de cálculo</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead><tr style="background:#f9fafb">
          <th style="padding:7px 10px;text-align:left;font-size:10px;color:#6b7280">Etapa</th>
          <th style="padding:7px 10px;text-align:left;font-size:10px;color:#6b7280">Fórmula / substituição</th>
          <th style="padding:7px 10px;text-align:right;font-size:10px;color:#6b7280">Valor</th>
          <th style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280">Norma</th>
        </tr></thead><tbody>${passosRows}</tbody>
      </table>

      <div style="margin-top:16px;padding:12px 16px;border-radius:8px;background:${cor}12;border:1px solid ${cor}44">
        <div style="font-size:15px;font-weight:900;color:${cor};text-transform:uppercase">3 · Resultado: ${resultado.status} · η = ${resultado.utilizacao}</div>
        <div style="font-size:12px;color:#374151;margin-top:3px">${motivo}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px">N_Sd = ${resultado.nSd_kN} kN · N_Rd = ${resultado.nRd_kN} kN · esbeltez λ = ${resultado.esbeltez}${resultado.esbeltezOk ? "" : " (⚠ &gt; 200)"} · modo: ${resultado.modoGovernante}</div>
      </div>

      <div style="margin-top:16px;font-size:13px;font-weight:800;margin-bottom:6px">4 · Catálogo de perfis utilizado</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${[
        ["Perfil", catalogo.nome || entradas.perfil], ["Código", catalogo.codigo], ["Família", catalogo.familia],
        ["Categoria", catalogo.categoria], ["Norma", catalogo.norma],
        ["Área A", fmt(catalogo.area_mm2, "mm²")], ["Peso", fmt(catalogo.peso_kg_m, "kg/m")],
        ["Fonte do catálogo", catalogo.fonte || "base local"],
        ["Versão do catálogo", catalogo.versao_catalogo || "—"],
        ["Última sincronização", catalogo.ultima_sincronizacao ? new Date(catalogo.ultima_sincronizacao).toLocaleString("pt-BR") : "—"],
      ].filter(([, v]) => v != null && v !== "—" || true).map(([k, v]) => linhaEntrada(k, v == null ? "—" : v)).join("")}</table>

      <div style="margin-top:16px;font-size:13px;font-weight:800;margin-bottom:6px">5 · Aprovação técnica</div>
      <div style="padding:10px 14px;background:#faf8f4;border:1px solid #e7e1d8;border-radius:8px">${aprovacaoHtml}</div>

      <div style="margin-top:16px;padding:12px 16px;background:#faf8f4;border:1px solid #e7e1d8;border-radius:8px">
        <div style="font-weight:800;text-transform:uppercase;letter-spacing:1px;font-size:10px;color:#8c847a;margin-bottom:6px">6 · Limitações do modelo</div>
        <ul style="margin:0;padding-left:18px;font-size:11px;color:#57514a;line-height:1.5">${avisosHtml}</ul>
      </div>

      <div style="margin-top:14px;padding:10px 14px;background:#f3f4f6;border-radius:8px;font-size:10px;color:#9ca3af;line-height:1.6">
        Documento gerado pelo StickFEM™ (engine v${engineVersion}, hash ${hash} — reproduzível a partir das mesmas entradas).
        Pré-dimensionamento de caráter preliminar; a validação final e a responsabilidade técnica são do engenheiro
        habilitado (ART/RRT). Não substitui o dimensionamento completo conforme NBR 14762, NBR 6120, NBR 6123 e NBR 8681.
      </div>
    </body></html>`;

  printHtml(html, `stickfem-memorial-${slug(projeto?.nome || entradas.projeto)}-${hash}`);
}
