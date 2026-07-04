/**
 * Mapeamento CalcSteel → StickFEM (catálogo de perfis).
 *
 * Contrato REAL confirmado em https://calcsteel.com/docs/api-reference:
 *   GET /api/v1/profiles → objetos com os campos abaixo. Unidades já em mm /
 *   mm² / mm³ / mm⁴ / mm⁶ / (kg/m) — batem com as colunas de perfil_estrutural.
 *
 * Exemplo documentado (W310×97):
 *   { id:"AISC_W310X97", name:"W310×97", family:"W", standard:"AISC",
 *     category:"hot_rolled", h:308, b:305, tw:9.9, tf:15.4,
 *     weight_per_meter:97.0, A:12300, Ix:222e6, Iy:72.4e6,
 *     Sx:1440e3, Sy:475e3, Zx:1600e3, Zy:724e3, rx:134, ry:76.7,
 *     J:1030e3, Cw:1540e9 }
 *
 * Nota honesta: a espessura da mesa (tf) não tem coluna dedicada em
 * perfil_estrutural hoje — para perfis laminados guardamos a espessura da alma
 * (tw) em espessura_mm. Se a fidelidade geométrica de laminados for necessária,
 * criar coluna mesa_espessura_mm num próximo migration. O motor atual (formado
 * a frio) usa apenas A/Ix/Iy, que são mapeados fielmente.
 */

// Normas suportadas (design_standard). O identificador EXATO usado como parâmetro
// deve ser confirmado na resposta de GET /standards; aqui ficam as designações
// formais documentadas + o mapa StickFEM→norma para exibição/seleção.
export const CALCSTEEL_STANDARDS = {
  "NBR 8800:2008": { categoria: "hot_rolled", pais: "BR" },
  "NBR 14762:2010": { categoria: "cold_formed", pais: "BR" }, // steel frame — relevante ao StickFEM
  "AISC 360-16": { categoria: "hot_rolled", pais: "US" },
  "EN 1993-1-1": { categoria: "hot_rolled", pais: "EU" },
  "EN 1993-1-3:2006": { categoria: "cold_formed", pais: "EU" },
  "EN 1993-1-4:2006": { categoria: "stainless", pais: "EU" },
  "IS 800:2007": { categoria: "hot_rolled", pais: "IN" },
  "IS 811:1987": { categoria: "cold_formed", pais: "IN" },
};

const num = (v) => (v == null || v === "" ? null : Number(v));

/** Deduz o tipo interno do StickFEM a partir de family/category do CalcSteel. */
export function tipoStickFem({ family, category }) {
  const f = String(family || "").toUpperCase();
  if (category === "cold_formed") {
    if (["UE", "C", "CARTOLA"].includes(f)) return "montante";
    if (["U"].includes(f)) return "guia";
    return "montante";
  }
  return "perfil"; // laminados/tubos: catálogo de referência (fora do fluxo montante/guia)
}

/**
 * Converte um perfil do CalcSteel (GET /profiles) para uma linha de
 * perfil_estrutural (ainda sem carimbo de fonte/versão — feito no persistir).
 */
export function mapProfileFromCalcSteel(p) {
  return {
    codigo: p.id ?? null,
    nome: p.name ?? p.id ?? null,
    tipo: tipoStickFem(p),
    familia: p.family ?? null,
    categoria: p.category ?? null,
    norma: p.standard ?? null,
    altura_mm: num(p.h),
    largura_mm: num(p.b),
    espessura_mm: num(p.tw),        // alma (ver nota no cabeçalho)
    peso_kg_m: num(p.weight_per_meter),
    area_mm2: num(p.A),
    inercia_x_mm4: num(p.Ix),
    inercia_y_mm4: num(p.Iy),
    modulo_wx_mm3: num(p.Sx),
    modulo_wy_mm3: num(p.Sy),
    modulo_zx_mm3: num(p.Zx),
    modulo_zy_mm3: num(p.Zy),
    raio_giracao_x_mm: num(p.rx),
    raio_giracao_y_mm: num(p.ry),
    constante_torcao_mm4: num(p.J),
    constante_empenamento_mm6: num(p.Cw),
  };
}
