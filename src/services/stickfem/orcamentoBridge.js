/**
 * StickFEM™ Fase 8 — ponte Engenharia → Orçamento (StickQuote) → Compras.
 * Transforma o quantitativo estrutural (DXF → parser → perfis) em um orçamento
 * oficial dentro do ecossistema, com rastreabilidade e premissas técnicas.
 */
import { salvarStickQuote } from "../stickquoteService";
import { printHtml } from "../../utils/printHtml";
import { LOGO_STICKFRAME } from "../../utils/cdn";

const fmtBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN   = (v, d = 1) => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Precifica o quantitativo por peso de aço (R$/kg) — método transparente do MVP. */
export function precificarEstrutura(quant, { precoKg = 12 } = {}) {
  const itens = (quant.itens || []).map((it) => ({
    ...it,
    precoKg,
    custo: +(Number(it.peso_kg || 0) * precoKg).toFixed(2),
  }));
  const totalCusto = +itens.reduce((s, i) => s + i.custo, 0).toFixed(2);
  return { itens, totalCusto };
}

/**
 * Gera e persiste o orçamento estrutural como StickQuote (origem StickFEM),
 * vinculado ao projeto estrutural. Retorna { saved, dados }.
 */
export async function gerarOrcamentoEstrutural({ projeto, quant, perfilMontante, perfilGuia, precoKg = 12, obraNome, versaoDxf = 1 }) {
  const { itens, totalCusto } = precificarEstrutura(quant, { precoKg });

  const premissas = {
    origem: "Arquivo DXF (StickFEM™)",
    metodo: "Interpretação geométrica — StickAI Structural Parser™",
    perfilMontante: perfilMontante?.nome || "—",
    perfilGuia: perfilGuia?.nome || "—",
    fatorPerda: quant.resumo?.perda ?? 0.08,
    espacMontanteMm: quant.resumo?.espacMontanteMm ?? 400,
    precoKg,
    versaoDxf,
    pesoTotalKg: quant.resumo?.pesoTotal_kg ?? 0,
    montantes: quant.resumo?.montantes ?? 0,
    comprimentoParedesM: quant.resumo?.comprimentoParedes_m ?? 0,
  };

  const nome = `Orçamento Estrutural — ${projeto.nome} (StickFEM v${versaoDxf})`;
  const selecoes = [{ composicaoNome: "Estrutura Steel Frame (StickFEM™)", itens }];
  const resultado = { tipo: "estrutural", itens, totalCusto, premissas };
  const observacoes =
    `Gerado pelo StickFEM™ v${versaoDxf} · método: ${premissas.metodo} · ` +
    `perda ${(premissas.fatorPerda * 100).toFixed(0)}% · aço R$ ${fmtN(precoKg, 2)}/kg.`;

  const saved = await salvarStickQuote({
    nome, obraNome: obraNome || projeto.nome, selecoes, resultado, observacoes,
    origem: "StickFEM", projetoEstruturalId: projeto.id,
  });

  return { saved, dados: { nome, projeto, itens, totalCusto, premissas } };
}

/** PDF do orçamento estrutural com a seção "Premissas do quantitativo". */
export function gerarPdfEstrutural(dados) {
  const { nome, itens, totalCusto, premissas } = dados;
  const rows = itens.map((it, i) => `
    <tr style="background:${i % 2 ? "#fafaf9" : "#fff"}">
      <td style="padding:7px 12px;border-bottom:1px solid #eee;font-size:12px">${it.perfil}</td>
      <td style="padding:7px 12px;text-align:center;border-bottom:1px solid #eee;font-size:11px;color:#6b7280">${it.tipo}</td>
      <td style="padding:7px 12px;text-align:right;border-bottom:1px solid #eee;font-size:12px">${fmtN(it.quantidade, it.tipo === "montante" ? 0 : 1)} ${it.unidade}</td>
      <td style="padding:7px 12px;text-align:right;border-bottom:1px solid #eee;font-size:12px">${fmtN(it.peso_kg)} kg</td>
      <td style="padding:7px 12px;text-align:right;border-bottom:1px solid #eee;font-size:12px;font-weight:700">${fmtBRL(it.custo)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Orçamento Estrutural — ${nome}</title></head>
    <body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:900px;margin:auto;padding:36px 44px">
      <div style="display:flex;align-items:center;gap:14px;border-bottom:2px solid #e5e7eb;padding-bottom:16px;margin-bottom:24px">
        <img src="${LOGO_STICKFRAME}" style="width:48px;height:48px;object-fit:contain;border-radius:10px">
        <div>
          <div style="font-size:10px;letter-spacing:2px;color:#6b7280;font-weight:700;text-transform:uppercase">Orçamento Estrutural</div>
          <div style="font-size:22px;font-weight:900;color:#981915">StickFEM&trade;</div>
        </div>
      </div>
      <div style="font-size:13px;font-weight:700;margin-bottom:14px">${nome}</div>

      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:12px;margin-bottom:8px">
        <thead><tr style="background:#f9fafb">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280">Perfil</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:#6b7280">Tipo</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#6b7280">Qtd</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#6b7280">Peso</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#6b7280">Custo</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="background:#1a191c;color:#fff">
          <td colspan="4" style="padding:11px 12px;font-weight:800">TOTAL ESTRUTURA</td>
          <td style="padding:11px 12px;text-align:right;font-weight:900;font-size:15px">${fmtBRL(totalCusto)}</td>
        </tr></tfoot>
      </table>

      <div style="margin-top:24px;padding:14px 16px;background:#faf8f4;border:1px solid #e7e1d8;border-radius:8px;font-size:12px;color:#57514a;line-height:1.7">
        <div style="font-weight:800;text-transform:uppercase;letter-spacing:1px;font-size:11px;color:#8c847a;margin-bottom:6px">Premissas do quantitativo</div>
        <b>Origem:</b> ${premissas.origem}<br>
        <b>Método:</b> ${premissas.metodo}<br>
        <b>Perfil montante:</b> ${premissas.perfilMontante} &middot; <b>Guia:</b> ${premissas.perfilGuia}<br>
        <b>Espaçamento de montantes:</b> ${premissas.espacMontanteMm} mm &middot; <b>Fator de perda:</b> ${(premissas.fatorPerda * 100).toFixed(0)}%<br>
        <b>Preço do aço:</b> R$ ${fmtN(premissas.precoKg, 2)}/kg &middot; <b>Peso total:</b> ${fmtN(premissas.pesoTotalKg)} kg<br>
        <b>Comprimento de paredes:</b> ${fmtN(premissas.comprimentoParedesM, 2)} m &middot; <b>Montantes:</b> ${premissas.montantes} pç
      </div>

      <div style="margin-top:18px;padding:12px 16px;background:#f3f4f6;border-radius:8px;font-size:10px;color:#9ca3af;line-height:1.6">
        Análise computacional assistida. Quantitativo estimado por interpretação geométrica; a validação final e a
        responsabilidade técnica são do engenheiro habilitado (ART/RRT). Preços sujeitos a confirmação com fornecedores.
      </div>
    </body></html>`;

  printHtml(html, `stickfem-orcamento-${(nome || "estrutural").replace(/\s+/g, "-").toLowerCase()}`);
}
