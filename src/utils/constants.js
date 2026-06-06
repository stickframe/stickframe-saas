// ─── PALETA (TEMA CLARO) ─────────────────────────────────────────────────────
export const C = {
  red:      "#dc2626",
  redDark:  "#b91c1c",
  graphite: "#334155",
  dark:     "#f8fafc",
  darker:   "#f1f5f9",
  surface:  "#ffffff",
  border:   "#e2e8f0",
  shadow:   "0 1px 3px rgba(0,0,0,0.08)",
  text:     "#0f172a",
  muted:    "#64748b",
  success:  "#16a34a",
  warning:  "#d97706",
  danger:   "#dc2626",
  card:     "#ffffff",
  bg:       "#f8fafc",
};


// ─── NAV ─────────────────────────────────────────────────────────────────────
export const NAV = [
  { key: "dashboard",          label: "Dashboard",         icon: "LayoutDashboard" },
  { key: "agenda",             label: "Agenda",            icon: "CalendarDays" },
  { key: "crm",                label: "CRM / Clientes",   icon: "Users" },
  { key: "orcamentos",         label: "Orçamentos",        icon: "FileText" },
  { key: "obras",              label: "Gestão de Obras",  icon: "Building2" },
  { key: "cronograma",         label: "Cronograma",       icon: "BarChart2" },
  { key: "medicoes",           label: "Medições de Obra", icon: "Ruler" },
  { key: "diario",             label: "Diário de Obra",   icon: "BookOpen" },
  { key: "vistorias",          label: "Vistorias & FVS",  icon: "ClipboardCheck" },
  { key: "bim",                label: "BIM",              icon: "Box" },
  { key: "quantitativos",      label: "Quantitativos",    icon: "Hash" },
  { key: "financeiro",         label: "Financeiro",       icon: "DollarSign" },
  { key: "contratos",          label: "Contratos",        icon: "FileCheck" },
  { key: "historico",          label: "Histórico",        icon: "History" },
  { key: "fornecedores",       label: "Fornecedores",     icon: "Factory" },
  { key: "monitor_precos",     label: "Monitor Preços",   icon: "TrendingUp" },
  { key: "calculadora",        label: "Calculadora SF",   icon: "Calculator" },
  { key: "orcamento_tecnico",  label: "Orçamento Técnico",icon: "Receipt" },
  { key: "equipamentos",       label: "Equipamentos",     icon: "Wrench" },
  { key: "checklists",         label: "Checklist SF",     icon: "CheckSquare" },
  { key: "equipe",             label: "Equipe",           icon: "HardHat" },
  { key: "sst",               label: "SST",              icon: "ShieldAlert" },
  { key: "suprimentos",       label: "Suprimentos",      icon: "PackageOpen" },
  { key: "inteligencia",       label: "Inteligência",     icon: "Brain", perfis: ["diretor", "engenheiro"] },
  { key: "bi",                 label: "BI",               icon: "TrendingUp", perfis: ["diretor"] },
  { key: "configuracoes",      label: "Configurações",    icon: "Settings" },
];

// ─── PERFIS ──────────────────────────────────────────────────────────────────
export const PERFIS = {
  diretor: {
    label: "Diretor",
    cor: C.red,
    paginas: ["dashboard","agenda","crm","orcamentos","obras","cronograma","medicoes","diario","vistorias","bim","quantitativos","financeiro","contratos","historico","fornecedores","monitor_precos","calculadora","orcamento_tecnico","equipamentos","checklists","equipe","sst","suprimentos","inteligencia","bi","configuracoes"],
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
    paginas: ["dashboard","obras","cronograma","medicoes","diario","vistorias","bim","quantitativos","fornecedores","monitor_precos","calculadora","orcamento_tecnico","equipamentos","checklists","equipe","sst","suprimentos","historico","inteligencia","configuracoes"],
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
