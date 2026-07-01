/**
 * StickFEM™ — Quantitativo estrutural.
 * A partir dos elementos (paredes) + parâmetros do projeto + catálogo de perfis,
 * estima montantes, guias e peso de aço. Saída pronta para alimentar o orçamento
 * (StickQuote) e a lista de compras numa fase posterior.
 */

const PERDA_PADRAO = 0.08; // 8%

/**
 * @param elementos  elementos identificados (parseEstrutura)
 * @param perfis     catálogo (perfil_estrutural)
 * @param opts       { espacMontanteMm=400, peDireitoM=2.8, perfilMontanteId, perfilGuiaId, perda=0.08 }
 */
export function gerarQuantitativo(elementos, perfis, opts = {}) {
  const espac = (opts.espacMontanteMm ?? 400) / 1000; // m
  const peDireito = opts.peDireitoM ?? 2.8;
  const perda = opts.perda ?? PERDA_PADRAO;
  const byId = Object.fromEntries((perfis || []).map((p) => [p.id, p]));

  const montante =
    byId[opts.perfilMontanteId] ||
    (perfis || []).find((p) => p.tipo === "montante") || null;
  const guia =
    byId[opts.perfilGuiaId] ||
    (perfis || []).find((p) => p.tipo === "guia") || null;

  const paredes = (elementos || []).filter((e) => e.tipo === "parede" && e.comprimento_m > 0);
  const compTotal = paredes.reduce((s, p) => s + p.comprimento_m, 0);

  // Montantes: por parede, n = ceil(L/espac)+1; comprimento = pé-direito.
  let qtdMontantes = 0;
  for (const p of paredes) qtdMontantes += Math.ceil(p.comprimento_m / espac) + 1;
  const compMontantes = qtdMontantes * peDireito * (1 + perda);

  // Guias: superior + inferior = 2 × comprimento de parede.
  const compGuias = compTotal * 2 * (1 + perda);

  const pesoMontantes = compMontantes * (montante?.peso_kg_m || 0);
  const pesoGuias = compGuias * (guia?.peso_kg_m || 0);

  const itens = [];
  if (montante) itens.push({
    perfilId: montante.id, perfil: montante.nome, tipo: "montante", unidade: "pç",
    quantidade: qtdMontantes, comprimento_total_m: +compMontantes.toFixed(1),
    peso_kg: +pesoMontantes.toFixed(1),
  });
  if (guia) itens.push({
    perfilId: guia.id, perfil: guia.nome, tipo: "guia", unidade: "m",
    quantidade: +compGuias.toFixed(1), comprimento_total_m: +compGuias.toFixed(1),
    peso_kg: +pesoGuias.toFixed(1),
  });

  return {
    itens,
    resumo: {
      paredes: paredes.length,
      comprimentoParedes_m: +compTotal.toFixed(2),
      montantes: qtdMontantes,
      pesoTotal_kg: +(pesoMontantes + pesoGuias).toFixed(1),
      perda,
      espacMontanteMm: opts.espacMontanteMm ?? 400,
    },
  };
}
