/**
 * StickFEM™ Validation Framework™ — runner de modelos de referência.
 *
 * Roda cada modelo de referência pelo MESMO motor de produção
 * (auditarPreDimensionamento + gerarQuantitativo) e compara com o resultado
 * esperado dentro de tolerâncias. É a base da regressão contínua: qualquer
 * mudança no motor que altere um resultado esperado quebra o CI.
 */
import { auditarPreDimensionamento } from "../auditoria";
import { gerarQuantitativo } from "../quantitativo";

/** Executa um modelo de referência e devolve os indicadores calculados. */
export function rodarModelo(model) {
  const design = {
    perfil: model.perfil, material: model.material,
    peDireitoM: model.peDireitoM, espacMontanteM: model.espacMontanteM,
    larguraTributariaM: model.larguraTributariaM,
    gPerm_kNm2: model.gPerm_kNm2, qSobre_kNm2: model.qSobre_kNm2, v0_ms: model.v0_ms,
    meta: { projeto: model.nome, tipologia: model.tipologia },
  };
  const aud = auditarPreDimensionamento(design);

  const perfis = [{ id: "m1", tipo: "montante", ...model.perfil }];
  const elementos = (model.paredes || []).map((p) => ({ tipo: "parede", nome: p.nome, comprimento_m: p.comprimento_m, perfil_id: "m1" }));
  const quant = gerarQuantitativo(elementos, perfis, {
    espacMontanteMm: model.espacMontanteM * 1000, peDireitoM: model.peDireitoM, perfilMontanteId: "m1",
  });

  return {
    perfil: model.perfil.nome,
    utilizacao: aud.resultado.utilizacao,
    esbeltez: aud.resultado.esbeltez,
    esbeltezOk: aud.resultado.esbeltezOk,
    modoGovernante: aud.resultado.modoGovernante,
    status: aud.resultado.status,
    peso_total_kg: quant.resumo.pesoTotal_kg,
    montantes: quant.resumo.montantes,
    pass: aud.resultado.status !== "revisar" && aud.resultado.esbeltezOk,
  };
}

const TOL = { utilizacao: 0.01, peso_total_kg: 0.02, esbeltez: 0, montantes: 0 }; // relativa p/ floats; 0 = exato

/** Compara resultado × esperado. @returns { pass, diferencas:[{ campo, esperado, obtido, difPct }] } */
export function compararComEsperado(resultado, esperado) {
  const diferencas = [];
  for (const campo of Object.keys(esperado)) {
    const esp = esperado[campo], obt = resultado[campo];
    if (typeof esp === "number" && typeof obt === "number") {
      const tol = TOL[campo] ?? 0.01;
      const difPct = esp === 0 ? (obt === 0 ? 0 : 1) : Math.abs(obt - esp) / Math.abs(esp);
      if (difPct > tol) diferencas.push({ campo, esperado: esp, obtido: obt, difPct: +(difPct * 100).toFixed(2) });
    } else if (esp !== obt) {
      diferencas.push({ campo, esperado: esp, obtido: obt, difPct: null });
    }
  }
  return { pass: diferencas.length === 0, diferencas };
}

/** Roda um conjunto de casos (modelo + esperado) e sumariza a cobertura. */
export function rodarSuite(casos) {
  const resultados = casos.map(({ model, expected }) => {
    const resultado = rodarModelo(model);
    const cmp = compararComEsperado(resultado, expected);
    return { id: model.id, nome: model.nome, resultado, esperado: expected, ...cmp };
  });
  const aprovados = resultados.filter((r) => r.pass).length;
  return {
    resultados,
    total: resultados.length,
    aprovados,
    cobertura: resultados.length ? Math.round((aprovados / resultados.length) * 100) : 0,
  };
}
