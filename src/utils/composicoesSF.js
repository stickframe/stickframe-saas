/**
 * Motor de Composição Técnica — Steel Frame
 *
 * Cada sistema define itens com consumo por m².
 * O cálculo segue o mesmo raciocínio do orçamento da Espaço Smart:
 *   Área (m²) × consumo (un/m²) = quantidade necessária
 *
 * Campos de item:
 *   nome      — descrição do produto/insumo
 *   un        — unidade de medida
 *   consumo   — quantidade por m² de área do sistema
 *   grupo     — agrupamento visual
 *   catBusca  — array de termos para localizar no CATALOGO_PRODUTOS (nome parcial, lowercase)
 */

export const COMPOSICOES_SF = [
  // ─── 1. PAREDE EXTERNA (Cimentícia + Membrana) ────────────────────────────
  {
    id: 'par-ext',
    nome: 'Parede Externa',
    descricao: 'Montante C90 + Placa Cimentícia + Membrana WRB + Base Coat + Tela',
    unidade: 'm²',
    cor: '#3b6ea5',
    itens: [
      { nome: 'Montante C 90×40×15×0,90mm', un: 'pç', consumo: 1.50, grupo: 'Estrutura',          catBusca: ['montante c 90', 'montante 90'] },
      { nome: 'Guia U 92×40×0,90mm',        un: 'm',  consumo: 1.10, grupo: 'Estrutura',          catBusca: ['guia u 92', 'guia 92'] },
      { nome: 'Placa Cimentícia 10mm 1,20×2,40m (2,88m²)', un: 'pç', consumo: 0.38, grupo: 'Fechamento', catBusca: ['ciment', 'glasroc', 'placa externa'] },
      { nome: 'Membrana WRB Typar (83,5m²/rl)', un: 'rl', consumo: 0.013, grupo: 'Impermeabilização', catBusca: ['typar', 'membrana', 'wrb'] },
      { nome: 'Tela Fibra de Vidro 165g/m²', un: 'm²', consumo: 1.15, grupo: 'Acabamento',        catBusca: ['tela.*fibra', 'fibra de vidro', 'vertex r131'] },
      { nome: 'Massa Base Coat 20kg',        un: 'sc', consumo: 0.055, grupo: 'Acabamento',       catBusca: ['base coat', 'basecoat'] },
      { nome: 'Fita Telada 100mm (rolo)',    un: 'rl', consumo: 0.025, grupo: 'Acabamento',       catBusca: ['fita telada', 'fita.*ciment'] },
      { nome: 'Parafuso TEX 4,2×38mm (cx 500pç)', un: 'cx', consumo: 0.06, grupo: 'Fixação',    catBusca: ['tex 4,2.*38', 'parafuso.*38'] },
    ],
  },

  // ─── 2. PAREDE INTERNA (Gesso ST — standard) ──────────────────────────────
  {
    id: 'par-int-st',
    nome: 'Parede Interna (Gesso ST)',
    descricao: 'Montante C90 + Placa Gesso ST (2 lados) + Massa + Fita',
    unidade: 'm²',
    cor: '#4f7d57',
    itens: [
      { nome: 'Montante C 90×40×15×0,90mm',          un: 'pç', consumo: 1.50,  grupo: 'Estrutura',  catBusca: ['montante c 90'] },
      { nome: 'Guia U 92×40×0,90mm',                 un: 'm',  consumo: 1.10,  grupo: 'Estrutura',  catBusca: ['guia u 92'] },
      // 2 lados × 1/2,16m² × 1,05 perda
      { nome: 'Placa Gesso ST 12,5mm 1200×1800mm (2,16m²)', un: 'pç', consumo: 1.00, grupo: 'Fechamento', catBusca: ['gesso st', 'placa gesso st'] },
      { nome: 'Massa para Junta Drywall 25kg',        un: 'bd', consumo: 0.025, grupo: 'Acabamento', catBusca: ['massa junta', 'junta drywall'] },
      { nome: 'Fita Papel Perfurada Junta',           un: 'pç', consumo: 0.06,  grupo: 'Acabamento', catBusca: ['fita papel', 'fita.*junta'] },
      { nome: 'Cantoneira de Canto PVC 2,50m',       un: 'pç', consumo: 0.04,  grupo: 'Acabamento', catBusca: ['cantoneira', 'canto pvc'] },
      { nome: 'Parafuso TEX 4,2×25mm (cx 500pç)',    un: 'cx', consumo: 0.04,  grupo: 'Fixação',    catBusca: ['tex 4,2.*25', 'parafuso.*25mm'] },
    ],
  },

  // ─── 3. PAREDE ÁREA MOLHADA (Glasroc X / RU) ──────────────────────────────
  {
    id: 'par-molhada',
    nome: 'Parede Área Molhada (Glasroc X)',
    descricao: 'Montante C90 + Glasroc X (resistente à umidade, 2 lados) + Impermeabilização',
    unidade: 'm²',
    cor: '#7a5ae0',
    itens: [
      { nome: 'Montante C 90×40×15×0,90mm',          un: 'pç', consumo: 1.50,  grupo: 'Estrutura',         catBusca: ['montante c 90'] },
      { nome: 'Guia U 92×40×0,90mm',                 un: 'm',  consumo: 1.10,  grupo: 'Estrutura',         catBusca: ['guia u 92'] },
      // 2 lados × 1/2,88m² × 1,05 perda = 0,73
      { nome: 'Placa Glasroc X 12,5mm 1200×2400mm (2,88m²)', un: 'pç', consumo: 0.73, grupo: 'Fechamento', catBusca: ['glasroc x', 'glasroc.*2400', 'placa.*750hs'] },
      { nome: 'Massa para Junta Drywall 25kg',        un: 'bd', consumo: 0.025, grupo: 'Acabamento',        catBusca: ['massa junta'] },
      { nome: 'Parafuso GN25 3,5×25mm c/ 100pç',    un: 'ct', consumo: 0.15,  grupo: 'Fixação',           catBusca: ['gn25', 'par.*gn25', '3,5.*25.*trombeta'] },
      { nome: 'Impermeabilizante Bianco (18L)',       un: 'gl', consumo: 0.03,  grupo: 'Impermeabilização', catBusca: ['impermeab', 'bianco', 'hidrolay'] },
    ],
  },

  // ─── 4. FORRO (Gesso Leve / ST) ───────────────────────────────────────────
  {
    id: 'forro-st',
    nome: 'Forro (Gesso ST/Leve)',
    descricao: 'Perfil F530 + Pendural + Tabica + Placa Gesso Leve/ST',
    unidade: 'm²',
    cor: '#c0892d',
    itens: [
      // 1 perfil F530 3m cobre ~1,8m × 3m = 5,4m² → 0,185 perfis/m²
      { nome: 'Perfil Forro F530 0,48×3000mm',       un: 'pç', consumo: 0.20,  grupo: 'Estrutura',  catBusca: ['perfil forro f530', 'f530.*3000'] },
      // 1 pendural a cada 1,2m no perfil → 0,083/m de perfil × 0,20 = 0,017/m² ? não, direto:
      // pendural a cada 1,2m de perfil × (1 perfil/5,4m²) × 5,4m/perfil = 1 a cada 1,4m² → ~0,71/m²
      { nome: 'Pendural Regulável F530 Z275',        un: 'pç', consumo: 0.70,  grupo: 'Estrutura',  catBusca: ['pendural', 'pendural.*f530'] },
      { nome: 'Perfil Forro Tabica 0,5×3000mm',      un: 'pç', consumo: 0.08,  grupo: 'Estrutura',  catBusca: ['tabica', 'forro tabica'] },
      { nome: 'Placa Gesso Leve 12,5mm 1200×1800mm (2,16m²)', un: 'pç', consumo: 0.52, grupo: 'Fechamento', catBusca: ['gesso leve', 'placa gesso leve', 'gesso.*leve'] },
      { nome: 'Massa para Junta Drywall 25kg',       un: 'bd', consumo: 0.02,  grupo: 'Acabamento', catBusca: ['massa junta'] },
      { nome: 'Fita Papel Perfurada Junta',          un: 'pç', consumo: 0.04,  grupo: 'Acabamento', catBusca: ['fita papel'] },
      { nome: 'Parafuso GN25 3,5×25mm c/ 100pç',   un: 'ct', consumo: 0.10,  grupo: 'Fixação',    catBusca: ['gn25', '3,5.*25'] },
    ],
  },

  // ─── 5. ISOLAMENTO (Lã de Vidro) ──────────────────────────────────────────
  {
    id: 'isolamento',
    nome: 'Isolamento Lã de Vidro 50mm',
    descricao: 'Wallfelt Popô4 50mm — paredes e forros (15m²/rolo)',
    unidade: 'm²',
    cor: '#8c847a',
    itens: [
      // 1 rolo cobre 15m² → 0,067 rolos/m²
      { nome: 'Lã de Vidro Wallfelt Popô4 50×1200×12500mm (15m²)', un: 'rl', consumo: 0.068, grupo: 'Isolamento', catBusca: ['wallfelt', 'popo4', 'la.*vidro.*15m', 'lã.*vidro.*50'] },
    ],
  },

  // ─── 6. ESTRUTURA LSF (por m² de área construída) ─────────────────────────
  {
    id: 'estrutura-lsf',
    nome: 'Estrutura LSF (Lista de Corte)',
    descricao: 'Aço LSF LE230MPa/Z350 — lista de corte com acessórios. ~15 kg/m² de área construída.',
    unidade: 'm²',
    cor: '#981915',
    itens: [
      // Baseado no PDF: 1.500kg / 100m² = 15 kg/m²
      { nome: 'LSF Lista de Corte LE230MPa / Z350G/m² c/ Acessórios', un: 'kg', consumo: 15.0, grupo: 'Estrutura', catBusca: ['lsf.*lista', 'lista.*corte', 'lsf kg'] },
      { nome: 'Arame Galvanizado N.10',                                un: 'kg', consumo: 0.03, grupo: 'Estrutura', catBusca: ['arame galv'] },
      { nome: 'Parafuso TEX 6,3×19mm (cx 500pç)',    un: 'cx', consumo: 0.025, grupo: 'Fixação', catBusca: ['tex 6,3.*19', '6,3.*19'] },
      { nome: 'Parafuso TEX 6,3×32mm (cx 500pç)',    un: 'cx', consumo: 0.015, grupo: 'Fixação', catBusca: ['tex 6,3.*32', '6,3.*32'] },
    ],
  },
];

/**
 * Busca produto no catálogo usando os termos de busca do item.
 * Retorna o produto encontrado ou null.
 */
/**
 * Retorna { produto, confidence (0–1), method } ou null.
 * confidence < 0.60 = match ambíguo (ex: C90 vs C140) → descartado.
 */
export function buscarProdutoCatalogo(item, catalogo) {
  if (!catalogo) return null;
  const norm = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  // Prioridade 1: vínculo direto por produto_id
  if (item.produtoId) {
    const pid = Number(item.produtoId);
    const byId = catalogo.find((p) => p.id === pid);
    if (byId) return { produto: byId, confidence: 1.0, method: 'produto_id' };
  }

  // Prioridade 2: catBusca — regex explícita do item estático
  if (item.catBusca && item.catBusca.length > 0) {
    for (const termo of item.catBusca) {
      const re = new RegExp(termo, 'i');
      const found = catalogo.find((p) => re.test(norm(p.nome)));
      if (found) return { produto: found, confidence: 0.90, method: 'cat_busca' };
    }
  }

  // Prioridade 3: fuzzy por nome (apenas itens BIM/Supabase sem catBusca)
  if (item.nome) {
    const nItem = norm(item.nome);
    const exact = catalogo.find((p) => norm(p.nome) === nItem);
    if (exact) return { produto: exact, confidence: 0.85, method: 'nome_exato' };

    const partial = catalogo.find(
      (p) => norm(p.nome).includes(nItem) || nItem.includes(norm(p.nome))
    );
    if (partial) {
      // Score de sobreposição — evita confundir C90 com C140
      const lenA = norm(partial.nome).length;
      const lenB = nItem.length;
      const overlap = Math.min(lenA, lenB) / Math.max(lenA, lenB);
      const confidence = overlap > 0.80 ? 0.75 : 0.45;
      if (confidence < 0.60) return null; // match ambíguo descartado
      return { produto: partial, confidence, method: 'nome_parcial' };
    }
  }

  return null;
}

/**
 * Calcula os materiais necessários para um conjunto de composições com suas áreas.
 * Retorna lista de itens com qtd e custo total.
 *
 * @param {Array<{composicaoId: string, area: number}>} selecoes
 * @param {Array} catalogo — CATALOGO_PRODUTOS
 * @param {Object} precosCustom — preços personalizados opcionais { 'nome ou id': preco }
 */
export function calcMotorComposicao(selecoes, catalogo, precosCustom = {}) {
  const compMap = Object.fromEntries(COMPOSICOES_SF.map((c) => [c.id, c]));
  const acumulado = {};     // key = item.nome → { ...item, qtd, custo, produtoCat }
  const breakdown = [];     // por composição

  for (const sel of selecoes) {
    if (!sel.area || sel.area <= 0) continue;

    // Usa itens passados diretamente na seleção (BIM/Supabase) se disponíveis,
    // caso contrário busca na biblioteca estática COMPOSICOES_SF (path manual)
    const comp = compMap[sel.composicaoId] || {
      id:     sel.composicaoId,
      nome:   sel.composicaoNome || sel.composicaoId,
      cor:    sel.composicaoCor  || "#666",
      sistema: sel.composicaoSistema || "",
      itens:  [],
    };
    const itensBase = (sel.itens && sel.itens.length > 0) ? sel.itens : comp.itens;
    if (!itensBase || itensBase.length === 0) continue;

    const itensComp = itensBase.map((item) => {
      // Aplica perda: qtd_bruta = consumo × área × (1 + perda%)
      const fatorPerda = 1 + (Number(item.perda || item.perda_pct || 0) / 100);
      const qtdBruta   = item.consumo * sel.area * fatorPerda;
      const match      = buscarProdutoCatalogo(item, catalogo);
      const produtoCat = match?.produto || null;

      // Determina origem do preço para rastreabilidade
      let origemPreco, preco;
      if (precosCustom[item.nome] != null) {
        preco = precosCustom[item.nome];
        origemPreco = 'catalogo'; // preço da empresa (customizado)
      } else if (produtoCat) {
        preco = produtoCat.preco;
        origemPreco = match.confidence >= 0.90 ? 'catalogo' : 'mercado';
      } else if (item.preco) {
        preco = item.preco;
        origemPreco = 'fallback';
      } else {
        preco = 0;
        origemPreco = 'fallback';
      }

      const custo = qtdBruta * preco;
      return {
        ...item,
        qtd:           qtdBruta,
        qtdArredondada: Math.ceil(qtdBruta),
        preco,
        custo,
        produtoCat,
        origemPreco,
        matchConfidence: match?.confidence ?? 0,
        matchMethod:     match?.method ?? 'none',
      };
    });

    breakdown.push({ composicao: comp, area: sel.area, itens: itensComp });

    // Acumula por nome de insumo
    for (const it of itensComp) {
      if (!acumulado[it.nome]) {
        acumulado[it.nome] = { ...it, qtd: 0, qtdArredondada: 0, custo: 0 };
      }
      acumulado[it.nome].qtd += it.qtd;
      acumulado[it.nome].qtdArredondada = Math.ceil(acumulado[it.nome].qtd);
      acumulado[it.nome].custo += it.custo;
    }
  }

  const lista = Object.values(acumulado);
  const totalCusto = lista.reduce((s, it) => s + it.custo, 0);

  return { breakdown, lista, totalCusto };
}
