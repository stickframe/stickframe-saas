// ─── PALETA ──────────────────────────────────────────────────────────────────
export const C = {
  red:      "#981915",
  redDark:  "#6e1210",
  graphite: "#414141",
  dark:     "#121212",
  darker:   "#1A1A1A",
  surface:  "#242424",
  border:   "#2e2e2e",
  text:     "#f0f0f0",
  muted:    "#888888",
  success:  "#2e9e5b",
  warning:  "#c88a00",
  danger:   "#c0392b",
};

// ─── NAV ─────────────────────────────────────────────────────────────────────
export const NAV = [
  { key: "dashboard",  label: "Dashboard",       icon: "▣" },
  { key: "agenda",     label: "Agenda",           icon: "📅" },
  { key: "crm",        label: "CRM / Clientes",  icon: "◈" },
  { key: "orcamentos", label: "Orçamentos",       icon: "◻" },
  { key: "obras",      label: "Gestão de Obras", icon: "◆" },
  { key: "medicoes",   label: "Medições de Obra", icon: "📐" },
  { key: "diario",     label: "Diário de Obra",  icon: "📋" },
  { key: "financeiro", label: "Financeiro",       icon: "◉" },
  { key: "contratos",  label: "Contratos",        icon: "◑" },
  { key: "historico",  label: "Histórico",        icon: "◎" },
];

// ─── PERFIS ──────────────────────────────────────────────────────────────────
export const PERFIS = {
  diretor: {
    label: "Diretor",
    cor: C.red,
    paginas: ["dashboard","agenda","crm","orcamentos","obras","medicoes","diario","financeiro","contratos","historico"],
  },
  comercial: {
    label: "Comercial",
    cor: C.warning,
    paginas: ["dashboard","agenda","crm","orcamentos","contratos"],
  },
  engenheiro: {
    label: "Engenheiro",
    cor: "#4a9eff",
    paginas: ["dashboard","agenda","obras","medicoes","diario","historico"],
  },
  financeiro: {
    label: "Financeiro",
    cor: C.success,
    paginas: ["dashboard","financeiro","contratos","historico"],
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
