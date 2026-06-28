/**
 * Stick Frame ÔÇö Global Style Constants
 * 
 * Objeto `C` contendo as vari├íveis sem├ónticas de cor.
 * Utilizado para manter consist├¬ncia em componentes que dependem
 * de cores via prop `style` (gr├íficos, SVGs, etc).
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

  // Sem├ónticas e Acentos de Dados
  success: '#3f7a4b',
  warning: '#b07a1e',
  danger: '#a33327',
  steel: '#3b6ea5',
  purple: '#6d557e',

  // Aliases legados + escala categ├│rica completa do handoff
  dark: '#faf8f4',
  darker: '#efeae2',
  card: '#ffffff',
  shadow: '0 1px 2px rgba(40,30,20,0.06)',
  ochre: '#c0892d',
  sage: '#4f7d57',
  plum: '#6d557e',
  clay: '#b8624a',
};

//  NAV 
export const NAV = [
  { key: "dashboard",         label: "Dashboard",            brand: "StickHubÔäó",        icon: "LayoutDashboard", grupo: "visao_geral" },
  { key: "agenda",            label: "Agenda",               icon: "CalendarDays",      grupo: "visao_geral" },
  { key: "oportunidades",     label: "Oportunidades",        brand: "StickLeadÔäó",       icon: "Zap",             grupo: "relacionamento" },
  { key: "crm",               label: "CRM / Clientes",       icon: "Users",             grupo: "relacionamento" },
  { key: "orcamentos",        label: "Or├ºamentos",           icon: "FileText",          grupo: "relacionamento" },
  { key: "obras",             label: "Gest├úo de Obras",      icon: "Building2",         grupo: "obras" },
  { key: "cronograma",        label: "Cronograma",           brand: "StickPlanÔäó",       icon: "BarChart2",       grupo: "obras" },
  { key: "medicoes",          label: "Medi├º├Áes de Obra",     icon: "Ruler",             grupo: "obras" },
  { key: "diario",            label: "Di├írio de Obra",       brand: "StickFieldÔäó",      icon: "BookOpen",          grupo: "obras" },
  { key: "vistorias",         label: "Qualidade / FVS",      brand: "StickInspectÔäó",    icon: "ClipboardCheck",  grupo: "obras" },
  { key: "bim",               label: "BIM",                  icon: "Box",               grupo: "obras" },
  { key: "quantitativos",     label: "Quantitativos",        icon: "Hash",              grupo: "obras" },
  { key: "contratos",         label: "Contratos",            icon: "FileCheck",         grupo: "obras" },
  { key: "equipe",            label: "Equipe",               brand: "StickTeamÔäó",       icon: "HardHat",         grupo: "obras" },
  { key: "equipe_sf",         label: "Equipe SF",            icon: "UsersRound",        grupo: "obras", badge: "NOVO" },
  { key: "sst",               label: "SST",                  icon: "ShieldAlert",       grupo: "obras" },
  { key: "calculadora",       label: "Calculadora SF",       icon: "Calculator",        grupo: "obras" },
  { key: "orcamento_tecnico", label: "Or├ºamento T├®cnico",    icon: "Receipt",           grupo: "obras" },
  { key: "orcamento_sf",      label: "Or├ºamento SF",         icon: "Layers",            grupo: "obras", badge: "NOVO" },
  { key: "checklists",        label: "Checklist SF",         icon: "CheckSquare",       grupo: "obras" },
  { key: "financeiro",        label: "Financeiro",           brand: "StickCashÔäó",       icon: "DollarSign",      grupo: "financeiro" },
  { key: "rentabilidade",     label: "Rentabilidade",        icon: "TrendingUp",        grupo: "financeiro", badge: "PRO" },
  { key: "historico",         label: "Hist├│rico",            icon: "History",           grupo: "financeiro" },
  { key: "fornecedores",      label: "Fornecedores",         icon: "Factory",           grupo: "suprimentos" },
  { key: "suprimentos",       label: "Almoxarifado",         brand: "StickSupplyÔäó",     icon: "PackageOpen",     grupo: "suprimentos" },
  { key: "monitor_precos",    label: "Cota├º├úo Inteligente",  icon: "TrendingUp",        grupo: "suprimentos", badge: "NOVO" },
  { key: "equipamentos",      label: "Equipamentos",         icon: "Wrench",            grupo: "suprimentos" },
  { key: "bi",                label: "Analytics",            brand: "StickPulseÔäó",      icon: "BarChart2",       grupo: "inteligencia", badge: "PRO", perfis: ["diretor"] },
  { key: "inteligencia",      label: "Intelig├¬ncia Artificial", brand: "StickBrainÔäó",   icon: "Brain",           grupo: "inteligencia", badge: "IA",  perfis: ["diretor", "engenheiro"] },
  { key: "ecossistema",       label: "Ecossistema StickÔäó",   icon: "Layers",            grupo: "gestao" },
  { key: "configuracoes",     label: "Configura├º├Áes",        icon: "Settings",          grupo: "gestao" },
];

//  PERFIS 
export const PERFIS = {
  diretor: {
    label: "Diretor",
    cor: C.red,
    paginas: ["dashboard","agenda","oportunidades","crm","orcamentos","obras","cronograma","medicoes","diario","vistorias","bim","quantitativos","financeiro","rentabilidade","contratos","historico","fornecedores","monitor_precos","calculadora","orcamento_tecnico","orcamento_sf","equipamentos","checklists","equipe","equipe_sf","sst","suprimentos","inteligencia","bi","ecossistema","configuracoes"],
  },
  comercial: {
    label: "Comercial",
    cor: C.warning,
    paginas: ["dashboard","agenda","oportunidades","crm","orcamentos","configuracoes"],
  },
  engenheiro: {
    label: "Engenheiro",
    cor: C.steel,
    paginas: ["dashboard","obras","cronograma","medicoes","diario","vistorias","bim","quantitativos","fornecedores","monitor_precos","calculadora","orcamento_tecnico","orcamento_sf","equipamentos","checklists","equipe","equipe_sf","sst","suprimentos","historico","inteligencia","configuracoes"],
  },
  financeiro: {
    label: "Financeiro",
    cor: C.success,
    paginas: ["dashboard","financeiro","contratos","historico","monitor_precos","configuracoes"],
  },
};

//  FASES 
export const FASES = [
  "Projeto executivo","Funda├º├úo","Estrutura Steel Frame",
  "Fechamentos","Instala├º├Áes","Acabamento","Entrega"
];

//  CATEGORIAS 
export const CATEGORIAS_DESPESA = ["Materiais","M├úo de obra","Projeto","Transporte","Equipamentos","Administrativo","Outros"];
export const CATEGORIAS_RECEITA = ["Entrada contrato","Medi├º├úo 1","Medi├º├úo 2","Medi├º├úo 3","Saldo final","Outros"];

//  PRECOS POR PADR├âO 
const defaultPrecos = {
  "Econ├┤mico":   { label: "Econ├┤mico",   m2: 2800 },
  "Padr├úo":      { label: "Padr├úo",      m2: 3500 },
  "Alto Padr├úo": { label: "Alto Padr├úo", m2: 4800 },
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

//  TIPOS EVENTO 
export const TIPOS_EVENTO = ["Visita de obra","Reuni├úo com cliente","Vistoria","Entrega de documentos","Medi├º├úo","Outro"];

export const COR_TIPO_EVENTO = {
  "Visita de obra":         C.red,
  "Reuni├úo com cliente":    C.warning,
  "Vistoria":               C.steel,
  "Entrega de documentos":  C.success,
  "Medi├º├úo":                C.purple,
  "Outro":                  C.muted,
};

//  CLIMAS 
export const CLIMAS = [" Ensolarado"," Nublado"," Chuvoso"," Tempestade"," Neblina"];
export const TURNOS = ["Manh├ú","Tarde","Integral"];
