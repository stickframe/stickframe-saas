const TOUR_STORAGE_KEY = "sf_tours_dismissed";

function loadDismissed() {
  try {
    const raw = localStorage.getItem(TOUR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveDismissed(d) {
  localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(d));
}

export const TOURS = {
  orcamentos: {
    key: "tour_orcamentos",
    title: "Crie seu primeiro orçamento",
    description: "Composições de Steel Frame prontas. Gere proposta profissional com poucos cliques.",
    page: "orcamentos",
  },
  orcamento_tecnico: {
    key: "tour_stickquote",
    title: "Extraia quantitativos automaticamente",
    description: "Importe documentos e deixe o StickQuote calcular os insumos para você.",
    page: "orcamento_tecnico",
  },
  portal: {
    key: "tour_portal",
    title: "Envie para aprovação do cliente",
    description: "Compartilhe o andamento da obra direto com o cliente acompanhar.",
    page: "portal",
  },
  obras: {
    key: "tour_obras",
    title: "Acompanhe suas obras",
    description: "Cronograma, medições, diário e financeiro em um só lugar.",
    page: "obras",
  },
  inteligencia: {
    key: "tour_stickbrain",
    title: "Conheça o StickBrain",
    description: "Faça perguntas sobre suas obras em linguagem natural.",
    page: "inteligencia",
  },
};

export const createTourSlice = (set, get) => ({
  toursDismissed: loadDismissed(),

  dismissTour: (tourKey) => {
    set((s) => {
      const next = { ...s.toursDismissed, [tourKey]: true };
      saveDismissed(next);
      return { toursDismissed: next };
    });
  },

  shouldShowTour: (tourKey) => {
    return !get().toursDismissed[tourKey];
  },

  resetTours: () => {
    saveDismissed({});
    set({ toursDismissed: {} });
  },
});
