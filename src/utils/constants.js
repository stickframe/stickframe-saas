/**
 * Stick Frame — Global Style Constants
 * 
 * Objeto `C` contendo as variáveis semânticas de cor.
 * Utilizado para manter consistência em componentes que dependem
 * de cores via prop `style` (gráficos, SVGs, etc).
 */
export const C = {
  // Marca
  red: '#981915',
  redDark: '#7d1411',
  brickSoft: '#f3e7e5',

  // Neutros Quentes
  surface: '#ffffff',
  surface2: '#faf8f4',
  bg: '#f4f1ec',
  border: '#e7e1d8',
  text: '#26231f',
  muted: '#8c847a',
  graphite: '#2b2b2e',

  // Semânticas e Acentos de Dados
  success: '#3f7a4b',
  warning: '#b07a1e',
  danger: '#a33327',
  steel: '#3b6ea5',
  purple: '#6d557e'
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
    paginas: ["dashboard","agenda","crm","orcamentos","configuracoes"],
  },
  engenheiro: {
    label: "Engenheiro",
    cor: C.steel,
    paginas: ["dashboard","obras","cronograma","medicoes","diario","vistorias","bim","quantitativos","fornecedores","monitor_precos","calculadora","orcamento_tecnico","equipamentos","checklists","equipe","sst","suprimentos","historico","inteligencia","configuracoes"],
  },
  financeiro: {
    label: "Financeiro",
    cor: C.success,
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
const defaultPrecos = {
  "Econômico":   { label: "Econômico",   m2: 2800 },
  "Padrão":      { label: "Padrão",      m2: 3500 },
  "Alto Padrão": { label: "Alto Padrão", m2: 4800 },
};

export const PRECOS = new Proxy({}, {
  get(target, prop) {
    try {
      const local = localStorage.getItem("sf_precos_m2");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && parsed[prop]) {
          return parsed[prop];
        }
      }
    } catch (_) {}
    return defaultPrecos[prop];
  },
  ownKeys(target) {
    try {
      const local = localStorage.getItem("sf_precos_m2");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed) return Reflect.ownKeys(parsed);
      }
    } catch (_) {}
    return Reflect.ownKeys(defaultPrecos);
  },
  getOwnPropertyDescriptor(target, prop) {
    return {
      enumerable: true,
      configurable: true,
    };
  }
});

// ─── TIPOS EVENTO ────────────────────────────────────────────────────────────
export const TIPOS_EVENTO = ["Visita de obra","Reunião com cliente","Vistoria","Entrega de documentos","Medição","Outro"];

export const COR_TIPO_EVENTO = {
  "Visita de obra":         C.red,
  "Reunião com cliente":    C.warning,
  "Vistoria":               C.steel,
  "Entrega de documentos":  C.success,
  "Medição":                C.purple,
  "Outro":                  C.muted,
};

// ─── CLIMAS ──────────────────────────────────────────────────────────────────
export const CLIMAS = ["☀️ Ensolarado","⛅ Nublado","🌧️ Chuvoso","⛈️ Tempestade","🌫️ Neblina"];
export const TURNOS = ["Manhã","Tarde","Integral"];