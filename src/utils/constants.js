/**
 * Stick Frame ÔÇö Global Style Constants
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
  purple: '#6d557e',

  // Aliases legados + escala categórica completa do handoff
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
  { key: "dashboard",         label: "Dashboard",            brand: "StickHub™",        icon: "LayoutDashboard", grupo: "visao_geral" },
  { key: "agenda",            label: "Agenda",               icon: "CalendarDays",      grupo: "visao_geral" },
  { key: "oportunidades",     label: "Oportunidades",        brand: "StickLead™",       icon: "Zap",             grupo: "relacionamento" },
  { key: "crm",               label: "CRM / Clientes",       icon: "Users",             grupo: "relacionamento" },
  { key: "orcamentos",        label: "Orçamentos",           icon: "FileText",          grupo: "relacionamento" },
  { key: "obras",             label: "Gestão de Obras",      icon: "Building2",         grupo: "obras" },
  { key: "cronograma",        label: "Cronograma",           brand: "StickPlan™",       icon: "BarChart2",       grupo: "obras" },
  { key: "medicoes",          label: "Medições de Obra",     icon: "Ruler",             grupo: "obras" },
  { key: "diario",            label: "Diário de Obra",       brand: "StickField™",      icon: "BookOpen",          grupo: "obras" },
  { key: "vistorias",         label: "Qualidade / FVS",      brand: "StickInspect™",    icon: "ClipboardCheck",  grupo: "obras" },
  { key: "bim",               label: "BIM",                  icon: "Box",               grupo: "obras" },
  { key: "stickfem",          label: "StickFEM™",            icon: "Cpu",               grupo: "obras", badge: "NOVO" },
  { key: "quantitativos",     label: "Quantitativos",        icon: "Hash",              grupo: "obras" },
  { key: "contratos",         label: "Contratos",            icon: "FileCheck",         grupo: "obras" },
  { key: "equipe",            label: "Equipe",               brand: "StickTeam™",       icon: "HardHat",         grupo: "obras" },
  { key: "equipe_sf",         label: "Equipe SF",            icon: "UsersRound",        grupo: "obras", badge: "NOVO" },
  { key: "sst",               label: "SST",                  icon: "ShieldAlert",       grupo: "obras" },
  { key: "calculadora",       label: "Calculadora SF",       icon: "Calculator",        grupo: "obras" },
  { key: "orcamento_tecnico", label: "Orçamento Técnico",    icon: "Receipt",           grupo: "obras" },
  { key: "orcamento_sf",      label: "Orçamento SF",         icon: "Layers",            grupo: "obras", badge: "NOVO" },
  { key: "checklists",        label: "Checklist SF",         icon: "CheckSquare",       grupo: "obras" },
  { key: "financeiro",        label: "Financeiro",           brand: "StickCash™",       icon: "DollarSign",      grupo: "financeiro" },
  { key: "rentabilidade",     label: "Rentabilidade",        icon: "TrendingUp",        grupo: "financeiro", badge: "PRO" },
  { key: "historico",         label: "Histórico",            icon: "History",           grupo: "financeiro" },
  { key: "fornecedores",      label: "Fornecedores",         icon: "Factory",           grupo: "suprimentos" },
  { key: "suprimentos",       label: "Almoxarifado",         brand: "StickSupply™",     icon: "PackageOpen",     grupo: "suprimentos" },
  { key: "monitor_precos",    label: "Cotação Inteligente",  icon: "TrendingUp",        grupo: "suprimentos", badge: "NOVO" },
  { key: "equipamentos",      label: "Equipamentos",         icon: "Wrench",            grupo: "suprimentos" },
  { key: "stickbrain",        label: "Analytics",            brand: "StickBrain™",      icon: "Brain",           grupo: "inteligencia", badge: "IA",   perfis: ["diretor", "engenheiro", "comercial"] },
  { key: "stickbrain_op",     label: "Operacional",          brand: "StickBrain™",      icon: "Zap",             grupo: "inteligencia", badge: "LIVE", perfis: ["diretor", "comercial"] },
  { key: "bi",                label: "Analytics",            brand: "StickPulse™",      icon: "BarChart2",       grupo: "inteligencia", badge: "PRO", perfis: ["diretor"] },
  { key: "inteligencia",      label: "Inteligência Artificial", brand: "StickBrain™",   icon: "Brain",           grupo: "inteligencia", badge: "IA",  perfis: ["diretor", "engenheiro"] },
  { key: "benchmarks",        label: "Benchmarks Setor",     brand: "StickPulse™",      icon: "TrendingUp",      grupo: "inteligencia", badge: "PRO" },
  { key: "biblioteca",        label: "Biblioteca Técnica",   brand: "CBCA Layer™",      icon: "BookOpen",        grupo: "visao_geral" },
  { key: "ecossistema",       label: "Ecossistema Stick™",   icon: "Layers",            grupo: "gestao" },
  { key: "configuracoes",     label: "Configurações",        icon: "Settings",          grupo: "gestao" },
];

//  PERFIS 
export const PERFIS = {
  diretor: {
    label: "Diretor",
    cor: C.red,
    paginas: ["dashboard","agenda","oportunidades","crm","orcamentos","obras","cronograma","medicoes","diario","vistorias","bim","stickfem","quantitativos","financeiro","rentabilidade","contratos","historico","fornecedores","monitor_precos","calculadora","orcamento_tecnico","orcamento_sf","equipamentos","checklists","equipe","equipe_sf","sst","suprimentos","stickbrain","stickbrain_op","inteligencia","bi","ecossistema","configuracoes","biblioteca","benchmarks"],
  },
  comercial: {
    label: "Comercial",
    cor: C.warning,
    paginas: ["dashboard","agenda","oportunidades","crm","orcamentos","stickbrain","stickbrain_op","configuracoes","biblioteca"],
  },
  engenheiro: {
    label: "Engenheiro",
    cor: C.steel,
    paginas: ["dashboard","obras","cronograma","medicoes","diario","vistorias","bim","stickfem","quantitativos","fornecedores","monitor_precos","calculadora","orcamento_tecnico","orcamento_sf","equipamentos","checklists","equipe","equipe_sf","sst","suprimentos","historico","stickbrain","inteligencia","configuracoes","biblioteca","benchmarks"],
  },
  financeiro: {
    label: "Financeiro",
    cor: C.success,
    paginas: ["dashboard","financeiro","contratos","historico","monitor_precos","configuracoes","biblioteca"],
  },
};

//  FASES 
export const FASES = [
  "Projeto executivo","Fundação","Estrutura Steel Frame",
  "Fechamentos","Instalações","Acabamento","Entrega"
];

//  CATEGORIAS
export const CATEGORIAS_DESPESA = ["Materiais","Mão de obra","Projeto","Transporte","Equipamentos","Administrativo","Outros"];
export const CATEGORIAS_RECEITA = ["Entrada contrato","Medição 1","Medição 2","Medição 3","Saldo final","Outros"];

//  PRECOS POR PADRÃO
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

//  TIPOS EVENTO 
export const TIPOS_EVENTO = ["Visita de obra","Reunião com cliente","Vistoria","Entrega de documentos","Medição","Outro"];

export const COR_TIPO_EVENTO = {
  "Visita de obra":         C.red,
  "Reunião com cliente":    C.warning,
  "Vistoria":               C.steel,
  "Entrega de documentos":  C.success,
  "Medição":                C.purple,
  "Outro":                  C.muted,
};

//  CLIMAS 
export const CLIMAS = [" Ensolarado"," Nublado"," Chuvoso"," Tempestade"," Neblina"];
export const TURNOS = ["Manhã","Tarde","Integral"];

//  STATUS DE LEAD (CRM)
export const LEAD_STATUS = {
  NOVO: "Novo",
  ATENDIMENTO: "Em Atendimento",
  ORCAMENTO: "Orçamento Enviado",
  NEGOCIACAO: "Negociação",
  CONVERTIDO: "Convertido",
  PERDIDO: "Perdido",
  ARQUIVADO: "Arquivado",
};

