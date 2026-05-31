// ─── CUB R1-N (Residencial 1 pavimento, Padrão Normal) ───────────────────────
// Valores de referência — atualizar mensalmente via SINDUSCON-UF
export const CUB_ESTADOS = {
  AC: { nome: "Acre",                cub: 1950 },
  AL: { nome: "Alagoas",             cub: 1750 },
  AM: { nome: "Amazonas",            cub: 2050 },
  AP: { nome: "Amapá",               cub: 1900 },
  BA: { nome: "Bahia",               cub: 1850 },
  CE: { nome: "Ceará",               cub: 1780 },
  DF: { nome: "Distrito Federal",    cub: 2200 },
  ES: { nome: "Espírito Santo",      cub: 1980 },
  GO: { nome: "Goiás",               cub: 1920 },
  MA: { nome: "Maranhão",            cub: 1720 },
  MG: { nome: "Minas Gerais",        cub: 1980 },
  MS: { nome: "Mato Grosso do Sul",  cub: 1960 },
  MT: { nome: "Mato Grosso",         cub: 2020 },
  PA: { nome: "Pará",                cub: 1880 },
  PB: { nome: "Paraíba",             cub: 1760 },
  PE: { nome: "Pernambuco",          cub: 1820 },
  PI: { nome: "Piauí",               cub: 1710 },
  PR: { nome: "Paraná",              cub: 2020 },
  RJ: { nome: "Rio de Janeiro",      cub: 2150 },
  RN: { nome: "Rio Grande do Norte", cub: 1740 },
  RO: { nome: "Rondônia",            cub: 1970 },
  RR: { nome: "Roraima",             cub: 1850 },
  RS: { nome: "Rio Grande do Sul",   cub: 2080 },
  SC: { nome: "Santa Catarina",      cub: 2120 },
  SE: { nome: "Sergipe",             cub: 1750 },
  SP: { nome: "São Paulo",           cub: 2340 },
  TO: { nome: "Tocantins",           cub: 1880 },
};

export const PADROES_SF = {
  "Econômico":   { fator: 0.85, desc: "Materiais básicos, acabamentos simples" },
  "Padrão":      { fator: 1.00, desc: "Materiais de boa qualidade, bom acabamento" },
  "Alto Padrão": { fator: 1.20, desc: "Materiais premium, detalhamento refinado" },
  "Luxo":        { fator: 1.50, desc: "Materiais de alto luxo, totalmente personalizado" },
};

// ─── Estrutura de cada item ────────────────────────────────────────────────────
// { nome, un, base (por m²), preco (unit ref R$), grupo (Orçamentos), categoria, desc? }
// base: aplica fator de padrão se flagged; fixo se ehFundacao ou ehFixo

// ─── SISTEMAS ─────────────────────────────────────────────────────────────────
// Cada sistema: { id, label, icon, obrigatorio, mao_obra_cub, opcoes[] | itens[] }
// mao_obra_cub: fração do CUB/m² aplicada à mão de obra deste sistema

export const SISTEMAS_SF = [

  // ── 1. FUNDAÇÃO ────────────────────────────────────────────────────────────
  {
    id: "fundacao", label: "Fundação", icon: "🏗", obrigatorio: true,
    mao_obra_cub: 0.05, // calibrado: SP R$1.000/m² total MO / CUB 2340
    opcoes: [
      {
        id: "radier_simples", label: "Radier Simples",
        desc: "Laje de concreto armado sobre o solo — padrão Steel Frame residencial",
        itens: [
          { nome: "Concreto C-25 usinado",              un: "m³", base: 0.10, preco: 430,  grupo: "Fundação", categoria: "Fundação" },
          { nome: "Ferragem CA-50 ⌀6,3mm",              un: "kg", base: 6.00, preco: 6.80, grupo: "Fundação", categoria: "Fundação" },
          { nome: "Tela soldada Q-92 (3×2m)",           un: "pç", base: 0.17, preco: 72,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Forma lateral (tábua 3ª via)",        un: "m",  base: 0.40, preco: 9,    grupo: "Fundação", categoria: "Fundação" },
          { nome: "Manta impermeabilizante (laje/solo)", un: "m²", base: 1.05, preco: 20,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Brita ¾\" (regularização)",          un: "m³", base: 0.05, preco: 130,  grupo: "Fundação", categoria: "Fundação" },
          { nome: "Areia média lavada",                  un: "m³", base: 0.03, preco: 95,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Arame recozido nº 18",                un: "kg", base: 0.20, preco: 13,   grupo: "Fundação", categoria: "Fundação" },
        ],
      },
      {
        id: "radier_vigado", label: "Radier Vigado",
        desc: "Com vigas de bordo e nervuras — maior rigidez em solos moles ou recalques",
        itens: [
          { nome: "Concreto C-25 usinado",              un: "m³", base: 0.15, preco: 430,  grupo: "Fundação", categoria: "Fundação" },
          { nome: "Ferragem CA-50 ⌀10mm (vigas)",       un: "kg", base: 9.50, preco: 7.20, grupo: "Fundação", categoria: "Fundação" },
          { nome: "Tela soldada Q-92 (3×2m)",           un: "pç", base: 0.17, preco: 72,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Forma lateral (tábua 3ª via)",        un: "m",  base: 0.60, preco: 9,    grupo: "Fundação", categoria: "Fundação" },
          { nome: "Forma vigas (compensado 12mm)",       un: "m²", base: 0.20, preco: 45,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Manta impermeabilizante (laje/solo)", un: "m²", base: 1.05, preco: 20,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Brita ¾\"",                          un: "m³", base: 0.08, preco: 130,  grupo: "Fundação", categoria: "Fundação" },
          { nome: "Areia média lavada",                  un: "m³", base: 0.05, preco: 95,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Arame recozido nº 18",                un: "kg", base: 0.30, preco: 13,   grupo: "Fundação", categoria: "Fundação" },
        ],
      },
      {
        id: "baldrame", label: "Baldrame + Enchimento",
        desc: "Viga de concreto perimetral com enchimento de blocos — terrenos inclinados",
        itens: [
          { nome: "Concreto C-25 usinado (baldrame)",   un: "m³", base: 0.09, preco: 430,  grupo: "Fundação", categoria: "Fundação" },
          { nome: "Ferragem CA-50 ⌀12,5mm",             un: "kg", base: 5.50, preco: 7.20, grupo: "Fundação", categoria: "Fundação" },
          { nome: "Bloco de concreto 14×19×39cm",       un: "un", base: 8,    preco: 5.00, grupo: "Fundação", categoria: "Fundação" },
          { nome: "Argamassa de assentamento (sc 20kg)", un: "sc", base: 0.40, preco: 30,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Forma baldrame (tábua 3ª via)",       un: "m",  base: 0.60, preco: 9,    grupo: "Fundação", categoria: "Fundação" },
          { nome: "Manta impermeabilizante (laje/solo)", un: "m²", base: 1.05, preco: 20,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Arame recozido nº 18",                un: "kg", base: 0.20, preco: 13,   grupo: "Fundação", categoria: "Fundação" },
        ],
      },
      {
        id: "sapatas", label: "Sapatas Isoladas + Baldrame",
        desc: "Sapatas de concreto sob pilares + viga de baldrame — cargas concentradas",
        itens: [
          { nome: "Concreto C-25 usinado (sapatas)",    un: "m³", base: 0.12, preco: 430,  grupo: "Fundação", categoria: "Fundação" },
          { nome: "Concreto C-25 usinado (baldrame)",   un: "m³", base: 0.06, preco: 430,  grupo: "Fundação", categoria: "Fundação" },
          { nome: "Ferragem CA-50 ⌀10mm",               un: "kg", base: 8.00, preco: 7.20, grupo: "Fundação", categoria: "Fundação" },
          { nome: "Forma sapatas (madeira)",             un: "m²", base: 0.30, preco: 42,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Forma baldrame (tábua)",              un: "m",  base: 0.50, preco: 9,    grupo: "Fundação", categoria: "Fundação" },
          { nome: "Manta impermeabilizante (laje/solo)", un: "m²", base: 1.05, preco: 20,   grupo: "Fundação", categoria: "Fundação" },
          { nome: "Arame recozido nº 18",                un: "kg", base: 0.25, preco: 13,   grupo: "Fundação", categoria: "Fundação" },
        ],
      },
    ],
  },

  // ── 2. ESTRUTURA STEEL FRAME ──────────────────────────────────────────────
  {
    id: "estrutura", label: "Estrutura Steel Frame", icon: "🔩", obrigatorio: true,
    mao_obra_cub: 0.08,
    opcoes: [
      {
        id: "c90_090", label: "Perfis C 90mm — 0,90mm",
        desc: "Estrutura leve — partições internas, mezaninos, paredes divisórias",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Montante C 90×40×15×0,90mm",         un: "pç", base: 1.50, preco: 14,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Guia U 92×40×0,90mm",                un: "m",  base: 1.10, preco: 9,    grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Montante C 90×40×15×0,90mm (verga)", un: "pç", base: 0.30, preco: 14,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Chapa de reforço (steel plate 90mm)", un: "pç", base: 0.20, preco: 9,    grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Prego helicóptero — track fix",       un: "kg", base: 0.25, preco: 24,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Fita de vedação de guia (EPDM 50mm)", un: "m",  base: 1.20, preco: 3.80, grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "OSB 11,1mm (1,22×2,44m) — contraventamento", un: "chp", base: 0.38, preco: 55, grupo: "Estrutura", categoria: "Estrutura de Aço" },
        ],
      },
      {
        id: "c90_125", label: "Perfis C 90mm — 1,25mm",
        desc: "Residencial até 2 pav. — padrão mais comum no Brasil",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Montante C 90×40×15×1,25mm",         un: "pç", base: 1.50, preco: 19,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Guia U 92×40×1,25mm",                un: "m",  base: 1.10, preco: 12,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Montante C 90×40×15×1,25mm (verga)", un: "pç", base: 0.30, preco: 19,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Chapa de reforço (steel plate 90mm)", un: "pç", base: 0.20, preco: 9,    grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Prego helicóptero — track fix",       un: "kg", base: 0.25, preco: 24,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Fita de vedação de guia (EPDM 50mm)", un: "m",  base: 1.20, preco: 3.80, grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "OSB 11,1mm (1,22×2,44m) — contraventamento", un: "chp", base: 0.38, preco: 55, grupo: "Estrutura", categoria: "Estrutura de Aço" },
        ],
      },
      {
        id: "c90_150", label: "Perfis C 90mm — 1,50mm",
        desc: "Residencial reforçado — ventos fortes, litoral, 2+ pav.",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Montante C 90×40×15×1,50mm",         un: "pç", base: 1.50, preco: 24,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Guia U 92×40×1,50mm",                un: "m",  base: 1.10, preco: 15,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Montante C 90×40×15×1,50mm (verga)", un: "pç", base: 0.30, preco: 24,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Chapa de reforço (steel plate 90mm)", un: "pç", base: 0.25, preco: 11,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Prego helicóptero — track fix",       un: "kg", base: 0.28, preco: 24,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Fita de vedação de guia (EPDM 50mm)", un: "m",  base: 1.20, preco: 3.80, grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "OSB 11,1mm (1,22×2,44m) — contraventamento", un: "chp", base: 0.38, preco: 55, grupo: "Estrutura", categoria: "Estrutura de Aço" },
        ],
      },
      {
        id: "c150_125", label: "Perfis C 150mm — 1,25mm",
        desc: "Sobrado / pé-direito duplo — maior altura de parede",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Montante C 150×40×15×1,25mm",        un: "pç", base: 1.40, preco: 28,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Guia U 152×40×1,25mm",               un: "m",  base: 1.10, preco: 18,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Montante C 150×40×15×1,25mm (verga)", un: "pç", base: 0.25, preco: 28,  grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Chapa de reforço (steel plate 150mm)", un: "pç", base: 0.25, preco: 14,  grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Prego helicóptero — track fix",       un: "kg", base: 0.30, preco: 24,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Fita de vedação de guia (EPDM 75mm)", un: "m",  base: 1.20, preco: 5.50, grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "OSB 11,1mm (1,22×2,44m) — contraventamento", un: "chp", base: 0.40, preco: 55, grupo: "Estrutura", categoria: "Estrutura de Aço" },
        ],
      },
      {
        id: "c200_150", label: "Perfis C 200mm — 1,50mm",
        desc: "Comercial / industrial / pé-direito alto — máxima rigidez",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Montante C 200×65×15×1,50mm",        un: "pç", base: 1.30, preco: 48,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Guia U 202×65×1,50mm",               un: "m",  base: 1.10, preco: 30,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Montante C 200×65×15×1,50mm (verga)", un: "pç", base: 0.20, preco: 48,  grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Chapa de reforço (steel plate 200mm)", un: "pç", base: 0.30, preco: 22,  grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Prego helicóptero — track fix",       un: "kg", base: 0.35, preco: 24,   grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "Fita de vedação de guia (EPDM 100mm)", un: "m", base: 1.20, preco: 7.50, grupo: "Estrutura", categoria: "Estrutura de Aço" },
          { nome: "OSB 15mm (1,22×2,44m) — contraventamento", un: "chp", base: 0.40, preco: 72, grupo: "Estrutura", categoria: "Estrutura de Aço" },
        ],
      },
    ],
  },

  // ── 3. FECHAMENTO EXTERNO ─────────────────────────────────────────────────
  {
    id: "fechamento_externo", label: "Fechamento Externo", icon: "🧱", obrigatorio: true,
    mao_obra_cub: 0.04,
    opcoes: [
      {
        id: "cimenticia_10", label: "Placa Cimentícia 10mm",
        desc: "Solução mais comum no Brasil — boa resistência ao fogo e umidade",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Placa cimentícia 10mm (1,20×2,40m)",  un: "chp", base: 0.38, preco: 58,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Perfil de juntas galvanizado 10mm",   un: "m",   base: 0.80, preco: 4.50, grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Fita autoadesiva impermeável 75mm",   un: "m",   base: 1.20, preco: 5.80, grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Tela de fibra de vidro (junta)",      un: "m²",  base: 0.15, preco: 9,    grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Argamassa colante AC-II (sc 20kg)",   un: "sc",  base: 0.15, preco: 32,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Primer acrílico selador",             un: "L",   base: 0.30, preco: 22,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Textura acrílica (galão 18L)",        un: "gl",  base: 0.05, preco: 280,  grupo: "Vedação externa", categoria: "Fechamento" },
        ],
      },
      {
        id: "cimenticia_12", label: "Placa Cimentícia 12mm",
        desc: "Alta resistência — indicada para zonas de impacto e litoral",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Placa cimentícia 12mm (1,20×2,40m)",  un: "chp", base: 0.38, preco: 75,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Perfil de juntas galvanizado 12mm",   un: "m",   base: 0.80, preco: 5.50, grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Fita autoadesiva impermeável 75mm",   un: "m",   base: 1.20, preco: 5.80, grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Tela de fibra de vidro (junta)",      un: "m²",  base: 0.15, preco: 9,    grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Argamassa colante AC-II (sc 20kg)",   un: "sc",  base: 0.15, preco: 32,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Primer acrílico selador",             un: "L",   base: 0.30, preco: 22,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Textura acrílica (galão 18L)",        un: "gl",  base: 0.05, preco: 280,  grupo: "Vedação externa", categoria: "Fechamento" },
        ],
      },
      {
        id: "eifs", label: "EIFS — Isolamento + Acabamento",
        desc: "EPS + argamassa base + tela + textura — excelente desempenho térmico",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Placa EPS 30mm (1,00×0,50m)",        un: "m²",  base: 1.10, preco: 32,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Argamassa base EIFS (sc 25kg)",       un: "sc",  base: 0.18, preco: 68,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Tela de fibra de vidro 165g/m²",      un: "m²",  base: 1.15, preco: 12,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Bucha e parafuso fixação EPS",        un: "un",  base: 6,    preco: 1.20, grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Perfil de arranque em L",             un: "m",   base: 0.40, preco: 18,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Primer EIFS",                         un: "L",   base: 0.25, preco: 24,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Acabamento decorativo EIFS (sc 25kg)", un: "sc",  base: 0.10, preco: 85,   grupo: "Vedação externa", categoria: "Fechamento" },
        ],
      },
      {
        id: "acm", label: "ACM — Alumínio Composto",
        desc: "Acabamento premium — fachadas modernas, alta durabilidade",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Painel ACM 4mm (m²)",                un: "m²",  base: 1.10, preco: 155,  grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Perfil de alumínio subframe (m)",    un: "m",   base: 0.90, preco: 38,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Fixador oculto ACM",                 un: "un",  base: 5,    preco: 2.80, grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Selante MS polímero (cartuchos)",    un: "ct",  base: 0.12, preco: 38,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Fita butílica 25mm",                 un: "m",   base: 1.20, preco: 4.20, grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Parafuso cabeça chata inox",         un: "un",  base: 8,    preco: 0.80, grupo: "Vedação externa", categoria: "Fechamento" },
        ],
      },
      {
        id: "siding", label: "Siding Vinílico",
        desc: "Prático, leve, sem manutenção — americano instalado sobre OSB",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Siding vinílico (caixa 3,66m²)",     un: "cx",  base: 0.30, preco: 185,  grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Trim de acabamento vinílico",         un: "m",   base: 0.35, preco: 28,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Membrana WRB (vento/chuva) 1,5m",   un: "m²",  base: 1.10, preco: 8.50, grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Prego galvanizado (fachada)",         un: "kg",  base: 0.12, preco: 22,   grupo: "Vedação externa", categoria: "Fechamento" },
          { nome: "Fita autoadesiva impermeável 75mm",  un: "m",   base: 0.80, preco: 5.80, grupo: "Vedação externa", categoria: "Fechamento" },
        ],
      },
    ],
  },

  // ── 4. FECHAMENTO INTERNO ─────────────────────────────────────────────────
  {
    id: "fechamento_interno", label: "Fechamento Interno", icon: "🪟", obrigatorio: true,
    mao_obra_cub: 0.03,
    opcoes: [
      {
        id: "gesso_ba", label: "Gesso Acartonado BA 12,5mm",
        desc: "Standard — ambientes secos, sala, quartos, corredores",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Placa gesso BA 12,5mm (1,20×2,40m)", un: "chp", base: 0.85, preco: 18,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Massa para juntas pronta (balde 25kg)", un: "bd", base: 0.04, preco: 82,  grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Fita de juntas 50mm (rolo 90m)",      un: "rl",  base: 0.02, preco: 48,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Cantoneira metálica 31×31mm",         un: "m",   base: 0.25, preco: 4.20, grupo: "Vedação interna", categoria: "Fechamento" },
        ],
      },
      {
        id: "gesso_ru", label: "Gesso Acartonado RU 12,5mm",
        desc: "Resistente à umidade — banheiros, lavabo, cozinha",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Placa gesso RU 12,5mm (1,20×2,40m)", un: "chp", base: 0.85, preco: 24,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Massa para juntas pronta (balde 25kg)", un: "bd", base: 0.04, preco: 82,  grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Fita de juntas 50mm (rolo 90m)",      un: "rl",  base: 0.02, preco: 48,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Cantoneira metálica 31×31mm",         un: "m",   base: 0.25, preco: 4.20, grupo: "Vedação interna", categoria: "Fechamento" },
        ],
      },
      {
        id: "gesso_rf", label: "Gesso Acartonado RF 12,5mm",
        desc: "Resistente ao fogo — escadas, corredores, áreas técnicas",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Placa gesso RF 12,5mm (1,20×2,40m)", un: "chp", base: 0.85, preco: 28,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Massa para juntas pronta (balde 25kg)", un: "bd", base: 0.04, preco: 82,  grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Fita de juntas 50mm (rolo 90m)",      un: "rl",  base: 0.02, preco: 48,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Cantoneira metálica 31×31mm",         un: "m",   base: 0.25, preco: 4.20, grupo: "Vedação interna", categoria: "Fechamento" },
        ],
      },
      {
        id: "gesso_duplo_acustico", label: "Dupla Camada + Manta Acústica",
        desc: "BA 12,5mm + BA 15mm + manta — isolamento acústico superior (hotéis, studios)",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Placa gesso BA 12,5mm (1,20×2,40m)", un: "chp", base: 0.85, preco: 18,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Placa gesso BA 15mm (1,20×2,40m)",   un: "chp", base: 0.85, preco: 22,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Manta acústica 25mm (m²)",           un: "m²",  base: 1.00, preco: 32,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Massa para juntas pronta (balde 25kg)", un: "bd", base: 0.06, preco: 82,  grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Fita de juntas 50mm (rolo 90m)",      un: "rl",  base: 0.03, preco: 48,   grupo: "Vedação interna", categoria: "Fechamento" },
          { nome: "Cantoneira metálica 31×31mm",         un: "m",   base: 0.25, preco: 4.20, grupo: "Vedação interna", categoria: "Fechamento" },
        ],
      },
    ],
  },

  // ── 5. ISOLAMENTO TÉRMICO / ACÚSTICO ─────────────────────────────────────
  {
    id: "isolamento", label: "Isolamento", icon: "🌡", obrigatorio: true,
    mao_obra_cub: 0.01,
    opcoes: [
      {
        id: "la_vidro_50", label: "Lã de Vidro 50mm",
        desc: "Isolamento térmico básico — residencial padrão",
        itens: [
          { nome: "Lã de vidro 50mm (rolo m²)",         un: "m²",  base: 1.10, preco: 17,   grupo: "Isolamento", categoria: "Isolamento" },
          { nome: "Manta EPDM vedação de juntas",        un: "m",   base: 1.10, preco: 5.80, grupo: "Isolamento", categoria: "Isolamento" },
          { nome: "Fita adesiva dupla face 50mm",        un: "m",   base: 0.60, preco: 2.80, grupo: "Isolamento", categoria: "Isolamento" },
        ],
      },
      {
        id: "la_vidro_75", label: "Lã de Vidro 75mm",
        desc: "Maior conforto térmico e acústico — regiões de clima extremo",
        itens: [
          { nome: "Lã de vidro 75mm (rolo m²)",         un: "m²",  base: 1.10, preco: 24,   grupo: "Isolamento", categoria: "Isolamento" },
          { nome: "Manta EPDM vedação de juntas",        un: "m",   base: 1.10, preco: 5.80, grupo: "Isolamento", categoria: "Isolamento" },
          { nome: "Fita adesiva dupla face 50mm",        un: "m",   base: 0.60, preco: 2.80, grupo: "Isolamento", categoria: "Isolamento" },
        ],
      },
      {
        id: "la_rocha_50", label: "Lã de Rocha 50mm (RF)",
        desc: "Resistente ao fogo + isolamento — exigência AVCB em sobrados",
        itens: [
          { nome: "Lã de rocha 50mm (m²)",              un: "m²",  base: 1.10, preco: 30,   grupo: "Isolamento", categoria: "Isolamento" },
          { nome: "Manta EPDM vedação de juntas",        un: "m",   base: 1.10, preco: 5.80, grupo: "Isolamento", categoria: "Isolamento" },
          { nome: "Fita adesiva dupla face 50mm",        un: "m",   base: 0.60, preco: 2.80, grupo: "Isolamento", categoria: "Isolamento" },
        ],
      },
      {
        id: "la_rocha_75", label: "Lã de Rocha 75mm (RF superior)",
        desc: "Máxima resistência ao fogo + acústica — comercial, industrial",
        itens: [
          { nome: "Lã de rocha 75mm (m²)",              un: "m²",  base: 1.10, preco: 40,   grupo: "Isolamento", categoria: "Isolamento" },
          { nome: "Manta EPDM vedação de juntas",        un: "m",   base: 1.10, preco: 5.80, grupo: "Isolamento", categoria: "Isolamento" },
          { nome: "Fita adesiva dupla face 50mm",        un: "m",   base: 0.60, preco: 2.80, grupo: "Isolamento", categoria: "Isolamento" },
        ],
      },
    ],
  },

  // ── 6. COBERTURA ──────────────────────────────────────────────────────────
  {
    id: "cobertura", label: "Cobertura", icon: "🏠", obrigatorio: true,
    mao_obra_cub: 0.04,
    opcoes: [
      {
        id: "shingle", label: "Telha Shingle Asfáltico",
        desc: "Mais usado em SF residencial no Brasil — leve, durável, 20+ anos",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Telha shingle asfáltico (m²)",       un: "m²",  base: 1.20, preco: 72,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "OSB 11,1mm (base telhado)",          un: "chp", base: 0.40, preco: 55,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Manta subcobertura aluminizada",      un: "m²",  base: 1.25, preco: 14,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Cumeeira shingle (m)",               un: "m",   base: 0.20, preco: 30,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Calha galvanizada 25cm (m)",         un: "m",   base: 0.25, preco: 38,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Rufo galvanizado (m)",               un: "m",   base: 0.30, preco: 22,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Prego helicóptero (fixação OSB)",    un: "kg",  base: 0.15, preco: 24,   grupo: "Cobertura", categoria: "Cobertura" },
        ],
      },
      {
        id: "metalica_trap", label: "Telha Metálica Trapezoidal",
        desc: "Rápida, econômica — galpões, garagens, coberturas simples",
        itens: [
          { nome: "Telha metálica trapezoidal 0,5mm",   un: "m²",  base: 1.15, preco: 48,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Manta subcobertura aluminizada",      un: "m²",  base: 1.20, preco: 14,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Cumeeira metálica",                  un: "m",   base: 0.20, preco: 58,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Calha galvanizada 25cm",             un: "m",   base: 0.25, preco: 38,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Rufo metálico (m)",                  un: "m",   base: 0.30, preco: 35,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Parafuso autoperfurante (cx 100pç)", un: "cx",  base: 0.05, preco: 48,   grupo: "Cobertura", categoria: "Cobertura" },
        ],
      },
      {
        id: "ceramica", label: "Telha Cerâmica",
        desc: "Tradicional — menor índice pluviométrico, maior carga estrutural",
        itens: [
          { nome: "Telha cerâmica colonial",            un: "un",  base: 28,   preco: 1.90, grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Cumeeira cerâmica",                  un: "un",  base: 2.40, preco: 5.20, grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Argamassa de assentamento (sc 20kg)", un: "sc",  base: 0.06, preco: 30,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Manta subcobertura aluminizada",      un: "m²",  base: 1.20, preco: 14,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Ripa de madeira 25×50mm",            un: "m",   base: 2.50, preco: 4.20, grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Calha galvanizada 25cm",             un: "m",   base: 0.25, preco: 38,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Rufo galvanizado",                   un: "m",   base: 0.30, preco: 22,   grupo: "Cobertura", categoria: "Cobertura" },
        ],
      },
      {
        id: "sanduiche", label: "Telha Sanduíche (PIR 50mm)",
        desc: "Conforto térmico máximo — clima quente, telhado embutido",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Telha sanduíche PIR 50mm (m²)",     un: "m²",  base: 1.15, preco: 130,  grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Cumeeira sanduíche",                 un: "m",   base: 0.20, preco: 90,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Calha galvanizada 25cm",             un: "m",   base: 0.25, preco: 38,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Rufo metálico",                      un: "m",   base: 0.30, preco: 35,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Parafuso autoperfurante (cx 100pç)", un: "cx",  base: 0.05, preco: 48,   grupo: "Cobertura", categoria: "Cobertura" },
          { nome: "Selante PU (cartucho)",              un: "ct",  base: 0.10, preco: 28,   grupo: "Cobertura", categoria: "Cobertura" },
        ],
      },
    ],
  },

  // ── 7. ESTRUTURA DE COBERTURA (sempre inclusa) ────────────────────────────
  {
    id: "estrutura_cobertura", label: "Estrutura de Telhado", icon: "📐", obrigatorio: true,
    mao_obra_cub: 0.02,
    itens: [
      { nome: "Caibro C 90×40×15×1,25mm (m)",        un: "m",  base: 0.80, preco: 15,   grupo: "Cobertura", categoria: "Cobertura" },
      { nome: "Terça C 150×40×15×1,25mm (m)",        un: "m",  base: 0.40, preco: 24,   grupo: "Cobertura", categoria: "Cobertura" },
      { nome: "Cumeeira (perfil metálico U)",         un: "m",  base: 0.15, preco: 22,   grupo: "Cobertura", categoria: "Cobertura" },
      { nome: "Parafuso TEX 6,3×32mm (cx 500pç)",    un: "cx", base: 0.10, preco: 68,   grupo: "Cobertura", categoria: "Cobertura" },
      { nome: "Conector L galvanizado (rótula)",      un: "un", base: 2.00, preco: 3.80, grupo: "Cobertura", categoria: "Cobertura" },
    ],
  },

  // ── 8. FIXAÇÃO GERAL (sempre inclusa) ────────────────────────────────────
  {
    id: "fixacao", label: "Fixação Geral", icon: "🔧", obrigatorio: true,
    mao_obra_cub: 0.00, // incluso no custo de montagem estrutural
    itens: [
      { nome: "Parafuso TEX 4,2×16mm flangeado (cx 500pç)", un: "cx", base: 0.40, preco: 52, grupo: "Fixação", categoria: "Fixação" },
      { nome: "Parafuso TEX 4,2×25mm (cx 500pç)",           un: "cx", base: 0.30, preco: 52, grupo: "Fixação", categoria: "Fixação" },
      { nome: "Parafuso TEX 4,2×38mm (cx 500pç)",           un: "cx", base: 0.80, preco: 56, grupo: "Fixação", categoria: "Fixação" },
      { nome: "Parafuso TEX 6,3×19mm (cx 500pç)",           un: "cx", base: 0.16, preco: 62, grupo: "Fixação", categoria: "Fixação" },
      { nome: "Parafuso TEX 6,3×32mm (cx 500pç)",           un: "cx", base: 0.20, preco: 68, grupo: "Fixação", categoria: "Fixação" },
      { nome: "Rebite pop 4,8×12mm (cx 1000pç)",            un: "cx", base: 0.08, preco: 42, grupo: "Fixação", categoria: "Fixação" },
      { nome: "Fita de juntas 50mm (rolo 100m)",             un: "rl", base: 1.00, preco: 32, grupo: "Fixação", categoria: "Fixação" },
      { nome: "Massa para juntas pronta (balde 25kg)",        un: "bd", base: 0.04, preco: 82, grupo: "Fixação", categoria: "Fixação" },
      { nome: "Cantoneira metálica proteção 25×25mm",         un: "m",  base: 0.30, preco: 4.80, grupo: "Fixação", categoria: "Fixação" },
      { nome: "Silicone neutro (cartucho 280ml)",             un: "ct", base: 0.15, preco: 18, grupo: "Fixação", categoria: "Fixação" },
    ],
  },

  // ── 9. IMPERMEABILIZAÇÃO ─────────────────────────────────────────────────
  {
    id: "impermeabilizacao", label: "Impermeabilização", icon: "💧", obrigatorio: false,
    mao_obra_cub: 0.01,
    // Calculado sobre área molhada (parâmetro separado)
    usaAreaMolhada: true,
    itens: [
      { nome: "Impermeabilizante flex bicomponente (18L)", un: "gl", base: 0.08, preco: 220, grupo: "Impermeabilização", categoria: "Isolamento" },
      { nome: "Manta asfáltica autoadesiva 3mm",          un: "m²", base: 1.15, preco: 25,  grupo: "Impermeabilização", categoria: "Isolamento" },
      { nome: "Primer betuminoso (5L)",                    un: "gl", base: 0.06, preco: 78,  grupo: "Impermeabilização", categoria: "Isolamento" },
      { nome: "Fita de reforço de juntas 10cm",            un: "m",  base: 1.20, preco: 8,   grupo: "Impermeabilização", categoria: "Isolamento" },
      { nome: "Argamassa polimérica impermeável (sc 18kg)", un: "sc", base: 0.06, preco: 68,  grupo: "Impermeabilização", categoria: "Isolamento" },
    ],
  },

  // ── 10. INSTALAÇÃO ELÉTRICA ───────────────────────────────────────────────
  {
    id: "eletrica", label: "Instalação Elétrica", icon: "⚡", obrigatorio: false,
    mao_obra_cub: 0.04,
    itens: [
      { nome: "Eletroduto corrugado flexível 3/4\" (m)",  un: "m",  base: 1.80, preco: 2.80, grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Eletroduto corrugado flexível 1\" (m)",    un: "m",  base: 0.40, preco: 4.20, grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Caixa de embutir 4×2\"",                  un: "un", base: 0.35, preco: 2.50, grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Caixa de embutir 4×4\"",                  un: "un", base: 0.08, preco: 4.20, grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Cabo flexível 1,5mm² (m)",                un: "m",  base: 2.50, preco: 3.40, grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Cabo flexível 2,5mm² (m)",                un: "m",  base: 4.00, preco: 5.20, grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Cabo flexível 4mm² (m)",                  un: "m",  base: 0.60, preco: 9.50, grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Cabo flexível 6mm² (m)",                  un: "m",  base: 0.20, preco: 14,   grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Disjuntor unipolar 10A/16A",              un: "un", base: 0.12, preco: 14,   grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Disjuntor bipolar 20A",                   un: "un", base: 0.03, preco: 38,   grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Disjuntor bipolar 30A (chuveiro)",        un: "un", base: 0.02, preco: 42,   grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Quadro distribuição 24 disjuntores",      un: "un", base: 0.01, preco: 420,  grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Interruptor simples 10A",                 un: "un", base: 0.12, preco: 22,   grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Tomada 2P+T 10A",                        un: "un", base: 0.35, preco: 26,   grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Tomada 2P+T 20A (chuveiro/AC)",           un: "un", base: 0.05, preco: 38,   grupo: "Instalações", categoria: "Instalação Elétrica" },
      { nome: "Espelho cego / acabamento",               un: "un", base: 0.08, preco: 8.50, grupo: "Instalações", categoria: "Instalação Elétrica" },
    ],
  },

  // ── 11. INSTALAÇÃO HIDRÁULICA ─────────────────────────────────────────────
  {
    id: "hidraulica", label: "Instalação Hidráulica", icon: "🚿", obrigatorio: false,
    mao_obra_cub: 0.04,
    itens: [
      { nome: "Tubo PPR 20mm PN20 (barra 3m)",           un: "m",  base: 1.00, preco: 9.50, grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Tubo PPR 25mm PN20 (barra 3m)",           un: "m",  base: 0.35, preco: 13,   grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Tubo PPR 32mm PN20 (barra 3m)",           un: "m",  base: 0.15, preco: 20,   grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Conexões PPR (joelhos, tês, reduções)",   un: "un", base: 2.00, preco: 5.50, grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Tubo PVC esgoto 40mm (barra 6m)",         un: "m",  base: 0.40, preco: 9.20, grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Tubo PVC esgoto 50mm (barra 6m)",         un: "m",  base: 0.30, preco: 13,   grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Tubo PVC esgoto 100mm (barra 6m)",        un: "m",  base: 0.30, preco: 24,   grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Conexões PVC esgoto (joelhos, tês)",      un: "un", base: 1.20, preco: 8.50, grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Caixa sifonada 100×100mm",                un: "un", base: 0.05, preco: 22,   grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Ralo seco 100mm",                         un: "un", base: 0.04, preco: 16,   grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Caixa d'água 1000L (fibra)",              un: "un", base: 0.01, preco: 620,  grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Registro de gaveta 3/4\"",                un: "un", base: 0.06, preco: 42,   grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Válvula de pé com crivo 3/4\"",           un: "un", base: 0.01, preco: 55,   grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Caixa de inspeção PVC 30×30cm",           un: "un", base: 0.04, preco: 32,   grupo: "Instalações", categoria: "Instalação Hidráulica" },
      { nome: "Fossa séptica 1000L",                     un: "un", base: 0.01, preco: 980,  grupo: "Instalações", categoria: "Instalação Hidráulica" },
    ],
  },

  // ── 12. INSTALAÇÃO DE GÁS ────────────────────────────────────────────────
  {
    id: "gas", label: "Instalação de Gás", icon: "🔥", obrigatorio: false,
    mao_obra_cub: 0.02,
    itens: [
      { nome: "Tubo de cobre 1/2\" (m)",                un: "m",  base: 0.50, preco: 22,   grupo: "Instalações", categoria: "Instalação Gás" },
      { nome: "Tubo de cobre 3/4\" (m)",                un: "m",  base: 0.20, preco: 35,   grupo: "Instalações", categoria: "Instalação Gás" },
      { nome: "Conexão de cobre (joelhos, tês, uniões)", un: "un", base: 1.00, preco: 9,    grupo: "Instalações", categoria: "Instalação Gás" },
      { nome: "Regulador de pressão 1 estágio",          un: "un", base: 0.01, preco: 95,   grupo: "Instalações", categoria: "Instalação Gás" },
      { nome: "Válvula de corte 1/2\"",                 un: "un", base: 0.03, preco: 55,   grupo: "Instalações", categoria: "Instalação Gás" },
      { nome: "Medidor de gás (relógio) 1m³/h",         un: "un", base: 0.01, preco: 280,  grupo: "Instalações", categoria: "Instalação Gás" },
      { nome: "Selante específico gás (pasta de grafite)", un: "tp", base: 0.02, preco: 18,   grupo: "Instalações", categoria: "Instalação Gás" },
    ],
  },

  // ── 13. ESQUADRIAS ────────────────────────────────────────────────────────
  {
    id: "esquadrias", label: "Esquadrias", icon: "🚪", obrigatorio: false,
    mao_obra_cub: 0.02,
    opcoes: [
      {
        id: "aluminio_padrao", label: "Alumínio — Padrão",
        desc: "Alumínio anodizado fosco — janelas e portas externas",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Janela alumínio 1,20×1,20m (2 folhas)", un: "un", base: 0.05, preco: 620,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Janela alumínio 0,60×0,60m (banheiro)", un: "un", base: 0.03, preco: 280,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Porta externa alumínio 0,90×2,10m",     un: "un", base: 0.02, preco: 920,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Porta interna madeira 0,80×2,10m",      un: "un", base: 0.10, preco: 420,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Marco + guarnição madeira (jg)",        un: "jg", base: 0.12, preco: 240,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Soleira de granito 15cm (m)",           un: "m",  base: 0.15, preco: 70,   grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Peitoril de granito 25cm (m)",          un: "m",  base: 0.12, preco: 90,   grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Selante neutro (cartucho)",             un: "ct", base: 0.10, preco: 22,   grupo: "Esquadrias", categoria: "Esquadrias" },
        ],
      },
      {
        id: "pvc_padrao", label: "PVC — Termoacústico",
        desc: "PVC multicâmara — excelente isolamento, sem manutenção",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Janela PVC 1,20×1,20m (oscilo-batente)", un: "un", base: 0.05, preco: 980,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Janela PVC 0,60×0,60m (banheiro)",       un: "un", base: 0.03, preco: 420,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Porta PVC externa 0,90×2,10m",           un: "un", base: 0.02, preco: 1350, grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Porta interna PVC 0,80×2,10m",           un: "un", base: 0.10, preco: 680,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Soleira de granito 15cm (m)",             un: "m",  base: 0.15, preco: 70,   grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Peitoril de granito 25cm (m)",            un: "m",  base: 0.12, preco: 90,   grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Selante neutro (cartucho)",               un: "ct", base: 0.10, preco: 22,   grupo: "Esquadrias", categoria: "Esquadrias" },
        ],
      },
      {
        id: "madeira_padrao", label: "Madeira Maciça",
        desc: "Madeira de lei tratada — visual rústico, exige manutenção periódica",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Janela madeira maciça 1,20×1,20m",      un: "un", base: 0.05, preco: 820,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Janela madeira maciça 0,60×0,60m",      un: "un", base: 0.03, preco: 380,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Porta externa madeira maciça 0,90×2,10m", un: "un", base: 0.02, preco: 1200, grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Porta interna madeira 0,80×2,10m",       un: "un", base: 0.10, preco: 480,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Marco + guarnição madeira maciça (jg)",  un: "jg", base: 0.12, preco: 320,  grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Soleira de granito 15cm (m)",            un: "m",  base: 0.15, preco: 70,   grupo: "Esquadrias", categoria: "Esquadrias" },
          { nome: "Verniz marítimo (L)",                    un: "L",  base: 0.10, preco: 58,   grupo: "Esquadrias", categoria: "Esquadrias" },
        ],
      },
    ],
  },

  // ── 14. REVESTIMENTOS ─────────────────────────────────────────────────────
  {
    id: "revestimentos", label: "Revestimentos e Acabamentos", icon: "🎨", obrigatorio: false,
    mao_obra_cub: 0.05,
    opcoes: [
      {
        id: "rev_basico", label: "Básico — Cerâmica + Tinta PVA",
        desc: "Cerâmica 45×45 + tinta PVA interna + textura externa simples",
        itens: [
          { nome: "Cerâmica 45×45cm (m²)",              un: "m²",  base: 0.40, preco: 38,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Argamassa colante AC-I (sc 20kg)",   un: "sc",  base: 0.12, preco: 28,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Rejunte cinza (kg)",                  un: "kg",  base: 0.08, preco: 9,    grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Massa corrida PVA (balde 25kg)",      un: "bd",  base: 0.04, preco: 75,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Tinta látex PVA interna (18L)",       un: "gl",  base: 0.02, preco: 165,  grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Textura acrílica simples (galão 18L)", un: "gl",  base: 0.03, preco: 220,  grupo: "Revestimentos", categoria: "Revestimentos" },
        ],
      },
      {
        id: "rev_padrao", label: "Padrão — Porcelanato + Tinta Acrílica",
        desc: "Porcelanato 60×60 polido + tinta acrílica + gesso liso interno",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Porcelanato 60×60cm polido (m²)",    un: "m²",  base: 0.42, preco: 58,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Argamassa colante AC-II (sc 20kg)",  un: "sc",  base: 0.14, preco: 32,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Rejunte porcelanato (kg)",            un: "kg",  base: 0.05, preco: 15,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Gesso liso (sc 40kg)",               un: "sc",  base: 0.08, preco: 45,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Tinta acrílica semibrilho interna (18L)", un: "gl", base: 0.02, preco: 250, grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Textura acrílica premium (galão 18L)", un: "gl",  base: 0.03, preco: 320,  grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Selador acrílico (galão 18L)",        un: "gl",  base: 0.01, preco: 185,  grupo: "Revestimentos", categoria: "Revestimentos" },
        ],
      },
      {
        id: "rev_alto", label: "Alto Padrão — Porcelanato Grande Formato",
        desc: "Porcelanato 90×90 retificado + Marmorino + tinta premium",
        aplicaFatorPadrao: true,
        itens: [
          { nome: "Porcelanato 90×90cm retificado (m²)", un: "m²",  base: 0.44, preco: 110,  grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Argamassa colante AC-III (sc 20kg)", un: "sc",  base: 0.16, preco: 48,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Rejunte especial (kg)",               un: "kg",  base: 0.04, preco: 28,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Marmorino / estuco veneziano (m²)",  un: "m²",  base: 0.30, preco: 85,   grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Tinta premium acetinada (18L)",       un: "gl",  base: 0.02, preco: 380,  grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Textura premium (galão 18L)",         un: "gl",  base: 0.03, preco: 420,  grupo: "Revestimentos", categoria: "Revestimentos" },
          { nome: "Verniz (galão 18L)",                  un: "gl",  base: 0.01, preco: 280,  grupo: "Revestimentos", categoria: "Revestimentos" },
        ],
      },
    ],
  },

  // ── 15. LAJE SECA (piso do sobrado) ──────────────────────────────────────
  {
    id: "laje_seca", label: "Laje Seca (piso do sobrado)", icon: "🏢", obrigatorio: false,
    mao_obra_cub: 0.03,
    itens: [
      { nome: "OSB 18mm — base estrutural (1,22×2,44m)", un: "chp", base: 0.36, preco: 88,   grupo: "Laje Seca", categoria: "Estrutura de Aço" },
      { nome: "Viga I de madeira LVL (m)",              un: "m",   base: 0.50, preco: 65,   grupo: "Laje Seca", categoria: "Estrutura de Aço" },
      { nome: "Perfil J (portabandeja) galvanizado",    un: "m",   base: 1.10, preco: 12,   grupo: "Laje Seca", categoria: "Estrutura de Aço" },
      { nome: "Piso laminado 8mm (m²)",                 un: "m²",  base: 1.05, preco: 38,   grupo: "Laje Seca", categoria: "Revestimentos" },
      { nome: "Manta acústica subpiso 3mm",             un: "m²",  base: 1.05, preco: 8.50, grupo: "Laje Seca", categoria: "Revestimentos" },
      { nome: "Parafuso TEX 4,2×38mm (cx 500pç)",      un: "cx",  base: 0.20, preco: 56,   grupo: "Laje Seca", categoria: "Fixação" },
    ],
  },
];
