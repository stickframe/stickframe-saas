// ─── PALETA (TEMA CLARO) ─────────────────────────────────────────────────────
export const C = {
  red:      "#981915",
  redDark:  "#6e1210",
  graphite: "#4b4b4b",
  dark:     "#f0f0f3",
  darker:   "#e4e4ea",
  surface:  "#ffffff",
  border:   "#dcdce4",
  text:     "#1a1a1a",
  muted:    "#6b7280",
  success:  "#2e9e5b",
  warning:  "#b97a00",
  danger:   "#c0392b",
};


// ─── NAV ─────────────────────────────────────────────────────────────────────
export const NAV = [
  { key: "dashboard",  label: "Dashboard",       icon: "▣" },
  { key: "agenda",     label: "Agenda",           icon: "📅" },
  { key: "crm",        label: "CRM / Clientes",  icon: "◈" },
  { key: "orcamentos", label: "Orçamentos",       icon: "◻" },
  { key: "obras",      label: "Gestão de Obras", icon: "◆" },
  { key: "cronograma", label: "Cronograma",      icon: "📊" },
  { key: "medicoes",   label: "Medições de Obra", icon: "📐" },
  { key: "diario",     label: "Diário de Obra",  icon: "📋" },
  { key: "vistorias",  label: "Vistorias & FVS", icon: "🔍" },
  { key: "bim",        label: "BIM",             icon: "🧊" },
  { key: "quantitativos", label: "Quantitativos",  icon: "📐" },
  { key: "financeiro", label: "Financeiro",       icon: "◉" },
  { key: "contratos",  label: "Contratos",        icon: "◑" },
  { key: "historico",  label: "Histórico",        icon: "◎" },
  { key: "fornecedores",  label: "Fornecedores",    icon: "🏭" },
  { key: "monitor_precos",label: "Monitor Preços",  icon: "📈" },
  { key: "calculadora",       label: "Calculadora SF",    icon: "📐" },
  { key: "orcamento_tecnico", label: "Orçamento Técnico", icon: "🧮" },
  { key: "equipamentos",      label: "Equipamentos",      icon: "🔧" },
  { key: "checklists",        label: "Checklist SF",      icon: "✅" },
  { key: "equipe",        label: "Equipe",          icon: "👷" },
  { key: "inteligencia",  label: "🧠 Inteligência",  icon: "🧠", perfis: ["diretor", "engenheiro"] },
  { key: "configuracoes", label: "Configurações",   icon: "⚙️" },
];

// ─── PERFIS ──────────────────────────────────────────────────────────────────
export const PERFIS = {
  diretor: {
    label: "Diretor",
    cor: C.red,
    paginas: ["dashboard","agenda","crm","orcamentos","obras","cronograma","medicoes","diario","vistorias","bim","quantitativos","financeiro","contratos","historico","fornecedores","monitor_precos","calculadora","orcamento_tecnico","equipamentos","checklists","equipe","inteligencia","configuracoes"],
  },
  comercial: {
    label: "Comercial",
    cor: C.warning,
    // Foco em prospecção: sem acesso a financeiro global, obras, medições
    paginas: ["dashboard","agenda","crm","orcamentos","configuracoes"],
  },
  engenheiro: {
    label: "Engenheiro",
    cor: "#4a9eff",
    // Foco em entrega: sem CRM, financeiro global ou pipeline comercial
    paginas: ["dashboard","obras","cronograma","medicoes","diario","vistorias","bim","quantitativos","fornecedores","monitor_precos","calculadora","orcamento_tecnico","equipamentos","checklists","historico","inteligencia","configuracoes"],
  },
  financeiro: {
    label: "Financeiro",
    cor: C.success,
    // Foco em números: sem obras operacionais ou CRM
    paginas: ["dashboard","financeiro","contratos","historico","monitor_precos","configuracoes"],
  },
};

// ─── FASES ───────────────────────────────────────────────────────────────────
export const FASES = [
  "Projeto executivo","Fundação","Estrutura Steel Frame",
  "Fechamentos","Instalações","Acabamento","Entrega"
];

// ─── CATEGORIAS ──────────────────────────────────────────────────────────────
export const CATEGORIAS_DESPESA = ["Materiais","Mão de obra","Projeto","Transporte","Equipamentos","Administrativo","Outros"];
export const CATEGORIAS_RECEITA = ["Entrada contrato","Medição 1","Medição 2","Medição 3","Saldo final","Outros"];

// ─── PRECOS POR PADRÃO ───────────────────────────────────────────────────────
export const PRECOS = {
  "Econômico":   { label: "Econômico",   m2: 2800 },
  "Padrão":      { label: "Padrão",      m2: 3500 },
  "Alto Padrão": { label: "Alto Padrão", m2: 4800 },
};

// ─── TIPOS EVENTO ────────────────────────────────────────────────────────────
export const TIPOS_EVENTO = ["Visita de obra","Reunião com cliente","Vistoria","Entrega de documentos","Medição","Outro"];

export const COR_TIPO_EVENTO = {
  "Visita de obra":         C.red,
  "Reunião com cliente":    C.warning,
  "Vistoria":               "#4a9eff",
  "Entrega de documentos":  C.success,
  "Medição":                "#9b59b6",
  "Outro":                  C.muted,
};

// ─── CLIMAS ──────────────────────────────────────────────────────────────────
export const CLIMAS = ["☀️ Ensolarado","⛅ Nublado","🌧️ Chuvoso","⛈️ Tempestade","🌫️ Neblina"];
export const TURNOS = ["Manhã","Tarde","Integral"];
