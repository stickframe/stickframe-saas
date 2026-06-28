export const ONBOARDING_STEPS = [
  { key: "empresa_configurada", label: "Empresa configurada", tag: "empresa" },
  { key: "primeiro_cliente",    label: "Primeiro cliente criado", tag: "cliente" },
  { key: "primeiro_orcamento",  label: "Primeiro orçamento criado", tag: "orcamento" },
  { key: "primeira_obra",       label: "Primeira obra iniciada", tag: "obra" },
  { key: "conheceu_stickbrain", label: "Conheceu o StickBrain", tag: "brain" },
];

export const ONBOARDING_BY_PERFIL = {
  diretor: {
    label: "Diretor",
    steps: [
      { key: "empresa_configurada", label: "Cadastrar empresa", tag: "empresa" },
      { key: "primeira_obra",       label: "Criar primeira obra", tag: "obras" },
      { key: "acompanhou_financeiro", label: "Acompanhar financeiro", tag: "financeiro" },
      { key: "conheceu_stickbrain", label: "Conhecer o StickBrain", tag: "inteligencia" },
    ],
  },
  comercial: {
    label: "Comercial",
    steps: [
      { key: "empresa_configurada", label: "Configurar empresa", tag: "empresa" },
      { key: "primeiro_cliente",    label: "Criar primeiro lead", tag: "crm" },
      { key: "primeiro_orcamento",  label: "Gerar primeiro orçamento", tag: "orcamentos" },
      { key: "enviou_proposta",     label: "Enviar proposta", tag: "orcamentos" },
    ],
  },
  engenheiro: {
    label: "Engenheiro",
    steps: [
      { key: "empresa_configurada", label: "Configurar empresa", tag: "empresa" },
      { key: "usou_stickquote",     label: "Usar StickQuote", tag: "orcamento_tecnico" },
      { key: "importou_documento",  label: "Importar documento", tag: "obras" },
      { key: "gerou_tecnico",      label: "Gerar orçamento técnico", tag: "orcamento_tecnico" },
    ],
  },
  financeiro: {
    label: "Financeiro",
    steps: [
      { key: "empresa_configurada", label: "Configurar empresa", tag: "empresa" },
      { key: "acompanhou_financeiro", label: "Acompanhar financeiro", tag: "financeiro" },
      { key: "primeiro_orcamento",  label: "Revisar orçamento", tag: "orcamentos" },
      { key: "fechou_contrato",     label: "Fechar contrato", tag: "contratos" },
    ],
  },
};

export function getStepsForPerfil(perfil) {
  const journey = ONBOARDING_BY_PERFIL[perfil];
  return journey ? journey.steps : ONBOARDING_STEPS;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem("sf_onboarding_progress");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveProgress(p) {
  localStorage.setItem("sf_onboarding_progress", JSON.stringify(p));
}

export const createOnboardingSlice = (set, get) => ({
  onboardingProgress: loadProgress(),

  completeOnboardingStep: (key) => {
    set((s) => {
      const next = { ...s.onboardingProgress, [key]: true };
      saveProgress(next);
      return { onboardingProgress: next };
    });
  },

  getOnboardingCompletion: (perfil) => {
    const progress = get().onboardingProgress;
    const steps = getStepsForPerfil(perfil);
    const done = steps.filter((s) => progress[s.key]).length;
    const total = steps.length;
    return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  },

  isOnboardingComplete: (perfil) => {
    const progress = get().onboardingProgress;
    const steps = getStepsForPerfil(perfil);
    return steps.every((s) => progress[s.key]);
  },
});
