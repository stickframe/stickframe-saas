import { create } from "zustand";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const _sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

// ─── MAPA DE USUÁRIOS ────────────────────────────────────────────────────────
const PERFIL_MAP = {
  "andre@stickframe.com.br":        "diretor",
  "jonathan@stickframe.com.br":     "diretor",
  "vendas@stickframe.com.br":       "comercial",
  "eng@stickframe.com.br":          "engenheiro",
  "financeiro@stickframe.com.br":   "financeiro",
};

const NOME_MAP = {
  "andre@stickframe.com.br":        { nome: "André",         cargo: "Diretor Comercial" },
  "jonathan@stickframe.com.br":     { nome: "Jonathan",      cargo: "Diretor" },
  "vendas@stickframe.com.br":       { nome: "Equipe Vendas", cargo: "Consultor" },
  "eng@stickframe.com.br":          { nome: "Engenheiro",    cargo: "Eng. Civil" },
  "financeiro@stickframe.com.br":   { nome: "Financeiro",    cargo: "Analista Financeiro" },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_CLIENTES = [
  { id:1, nome:"Milton Ferreira",        contato:"11999990001", email:"milton@email.com",     status:"Fechado",           cidade:"São Paulo",   valor:1250000, unidades:25 },
  { id:2, nome:"Pref. de Socorro",       contato:"19988880002", email:"prefeitura@socorro.sp", status:"Em execução",       cidade:"Socorro",     valor:930000,  unidades:18 },
  { id:3, nome:"Construtora Alphaville", contato:"11977770003", email:"contato@alphaville.com",status:"Proposta enviada",  cidade:"Barueri",     valor:480000,  unidades:8  },
  { id:4, nome:"Rodrigo Mendes",         contato:"11966660004", email:"rodrigo@email.com",    status:"Em negociação",     cidade:"Santo André", valor:320000,  unidades:6  },
  { id:5, nome:"Fabiana Costa",          contato:"11955550005", email:"fabiana@email.com",    status:"Lead",              cidade:"Campinas",    valor:180000,  unidades:3  },
];

const MOCK_OBRAS = [
  { id:1, nome:"Residencial Bofete — 25 UH",  cliente:"Milton Ferreira",        status:"Em andamento", fase:"Projeto executivo",    progresso:12,  prazo:"Dez/2025" },
  { id:2, nome:"Conjunto Socorro — 18 UH",     cliente:"Pref. de Socorro",       status:"Em andamento", fase:"Montagem estrutural",  progresso:78,  prazo:"Jun/2025" },
  { id:3, nome:"Alphaville Offices",            cliente:"Construtora Alphaville", status:"Planejamento", fase:"Projeto executivo",    progresso:0,   prazo:"—" },
];

const MOCK_ORCAMENTOS = [
  { id:1, ref:"ORC-2025-031", cliente:"Milton Ferreira",        cliente_id:1, valor:1250000, unidades:25, area:48, padrao:"Padrão",      status:"Aprovado",          criado:"10/05/2025" },
  { id:2, ref:"ORC-2025-028", cliente:"Construtora Alphaville", cliente_id:3, valor:480000,  unidades:8,  area:72, padrao:"Alto Padrão", status:"Em revisão",        criado:"02/05/2025" },
  { id:3, ref:"ORC-2025-019", cliente:"Pref. de Socorro",       cliente_id:2, valor:930000,  unidades:18, area:50, padrao:"Econômico",   status:"Aprovado",          criado:"14/03/2025" },
];

const MOCK_FINANCEIRO = {
  1: { contrato:1250000, lancamentos:[
    { id:1, tipo:"receita",  categoria:"Entrada contrato", valor:375000, data:"10/04/2025", descricao:"30% assinatura" },
    { id:2, tipo:"despesa",  categoria:"Materiais",         valor:82000,  data:"15/04/2025", descricao:"Perfis steel frame lote 1" },
    { id:3, tipo:"despesa",  categoria:"Mão de obra",       valor:28000,  data:"30/04/2025", descricao:"Equipe montagem abr/25" },
    { id:4, tipo:"despesa",  categoria:"Projeto",           valor:12000,  data:"05/04/2025", descricao:"Projeto executivo" },
  ]},
  2: { contrato:930000, lancamentos:[
    { id:1, tipo:"receita",  categoria:"Entrada contrato", valor:279000, data:"15/02/2025", descricao:"30% assinatura" },
    { id:2, tipo:"receita",  categoria:"Medição 1",        valor:372000, data:"01/04/2025", descricao:"40% estrutura concluída" },
    { id:3, tipo:"receita",  categoria:"Medição 2",        valor:93000,  data:"30/04/2025", descricao:"10% fechamentos" },
    { id:4, tipo:"despesa",  categoria:"Materiais",         valor:310000, data:"20/02/2025", descricao:"Perfis + OSB + placa cimentícea" },
    { id:5, tipo:"despesa",  categoria:"Mão de obra",       valor:98000,  data:"31/03/2025", descricao:"Equipe fev-mar/25" },
    { id:6, tipo:"despesa",  categoria:"Mão de obra",       valor:52000,  data:"30/04/2025", descricao:"Equipe abr/25" },
  ]},
  3: { contrato:480000, lancamentos:[
    { id:1, tipo:"despesa",  categoria:"Projeto",           valor:3500,   data:"28/04/2025", descricao:"Anteprojeto" },
  ]},
};

const MOCK_DIARIO = {
  1: [
    { id:1, data:"20/04/2025", turno:"Integral", clima:"☀️ Ensolarado", equipe:8, responsavel:"Carlos Silva", atividades:"Execução do projeto executivo. Revisão das plantas com engenheiro responsável.", ocorrencias:"", fotos:[], created:"20/04/2025 08:30" },
    { id:2, data:"21/04/2025", turno:"Manhã",    clima:"⛅ Nublado",     equipe:6, responsavel:"Carlos Silva", atividades:"Início da locação da obra. Implantação do canteiro.",                           ocorrencias:"Atraso de 2h por falta de gabarito.", fotos:[], created:"21/04/2025 07:45" },
  ],
  2: [
    { id:1, data:"01/04/2025", turno:"Integral", clima:"☀️ Ensolarado", equipe:12, responsavel:"João Melo", atividades:"Montagem da estrutura steel frame — bloco A concluído.",  ocorrencias:"", fotos:[], created:"01/04/2025 07:00" },
    { id:2, data:"02/04/2025", turno:"Integral", clima:"🌧️ Chuvoso",    equipe:10, responsavel:"João Melo", atividades:"Continuação — bloco B. Aplicação da OSB nas vedações.", ocorrencias:"Paralisação 14h-16h por chuva.", fotos:[], created:"02/04/2025 07:00" },
  ],
  3: [],
};

const MOCK_HISTORICO = [
  { id:1,  tipo:"cliente",    acao:"criado",  desc:"Cliente Milton Ferreira cadastrado",                         usuario:"André", data:"10/04/2025", hora:"09:12" },
  { id:2,  tipo:"orcamento",  acao:"criado",  desc:"Orçamento ORC-2025-031 gerado para Milton Ferreira",         usuario:"André", data:"10/04/2025", hora:"09:45" },
  { id:3,  tipo:"contrato",   acao:"criado",  desc:"Contrato CTR-2025-001 criado — Residencial Bofete",          usuario:"André", data:"10/04/2025", hora:"10:30" },
  { id:4,  tipo:"financeiro", acao:"receita", desc:"Entrada de R$ 375.000 registrada — Bofete",                  usuario:"André", data:"10/04/2025", hora:"14:00" },
  { id:5,  tipo:"obra",       acao:"fase",    desc:"Obra Bofete avançou para: Projeto executivo",                usuario:"André", data:"12/04/2025", hora:"08:20" },
];

const MOCK_EVENTOS = [
  { id:1, titulo:"Visita Residencial Bofete",  tipo:"Visita de obra",       data:"26/05/2025", hora:"09:00", cliente:"Milton Ferreira",       obra:"Residencial Bofete",  obs:"Verificar fundações",       cor:"#981915" },
  { id:2, titulo:"Reunião Alphaville",          tipo:"Reunião com cliente",  data:"27/05/2025", hora:"14:00", cliente:"Construtora Alphaville", obra:"Alphaville Offices",  obs:"Definir escopo do projeto", cor:"#c88a00" },
  { id:3, titulo:"Medição Socorro — bloco A",   tipo:"Medição",              data:"28/05/2025", hora:"08:00", cliente:"Pref. de Socorro",      obra:"Conjunto Socorro",     obs:"",                          cor:"#4a9eff" },
];

const MOCK_ARQUIVOS = {
  1: [
    { id:1, nome:"Planta_baixa_tipo.pdf",    tipo:"pdf",    tamanho:"2.4 MB", data:"10/04/2025", categoria:"Projeto"   },
    { id:2, nome:"Projeto_estrutural.pdf",   tipo:"pdf",    tamanho:"5.1 MB", data:"12/04/2025", categoria:"Projeto"   },
    { id:3, nome:"Foto_fundacao_01.jpg",     tipo:"imagem", tamanho:"3.2 MB", data:"20/04/2025", categoria:"Foto"      },
  ],
  2: [
    { id:1, nome:"Contrato_assinado.pdf",    tipo:"pdf",    tamanho:"1.1 MB", data:"15/02/2025", categoria:"Documento" },
    { id:2, nome:"Foto_estrutura_pronta.jpg",tipo:"imagem", tamanho:"4.8 MB", data:"05/04/2025", categoria:"Foto"      },
  ],
  3: [],
};

const MOCK_MEDICOES = {
  1: [
    { id:1, numero:1, data:"15/04/2025", descricao:"Projeto executivo e locação", percentual:12, valor:150000, status:"Aprovada", obs:"" },
  ],
  2: [
    { id:1, numero:1, data:"01/03/2025", descricao:"Fundação e infraestrutura",   percentual:20, valor:186000, status:"Aprovada", obs:"" },
    { id:2, numero:2, data:"01/04/2025", descricao:"Estrutura steel frame",       percentual:40, valor:372000, status:"Aprovada", obs:"" },
    { id:3, numero:3, data:"01/05/2025", descricao:"Fechamentos e vedações",      percentual:18, valor:167400, status:"Pendente", obs:"Aguardando vistoria" },
  ],
  3: [],
};

const MOCK_CONTRATOS = [
  { id:1, ref:"CTR-2025-001", cliente:"Milton Ferreira",        obra:"Residencial Bofete — 25 UH", valor:1250000, unidades:25, area:48, padrao:"Padrão",      prazo:"Dez/2025", status:"Assinado",   data:"10/04/2025" },
  { id:2, ref:"CTR-2025-002", cliente:"Pref. de Socorro",       obra:"Conjunto Socorro — 18 UH",   valor:930000,  unidades:18, area:50, padrao:"Econômico",   prazo:"Jun/2025", status:"Em execução", data:"15/02/2025" },
  { id:3, ref:"CTR-2025-003", cliente:"Construtora Alphaville", obra:"Alphaville Offices",          valor:480000,  unidades:8,  area:72, padrao:"Alto Padrão", prazo:"—",        status:"Aguardando",  data:"28/04/2025" },
];

// ─── STORE ────────────────────────────────────────────────────────────────────
const useAppStore = create((set, get) => ({
  // ── Auth ──
  user: null,
  activePage: "dashboard",

  // ── Data ──
  clientes:   MOCK_CLIENTES,
  orcamentos: MOCK_ORCAMENTOS,
  obras:      MOCK_OBRAS,
  financeiro: MOCK_FINANCEIRO,
  diario:     MOCK_DIARIO,
  historico:  MOCK_HISTORICO,
  eventos:    MOCK_EVENTOS,
  arquivos:   MOCK_ARQUIVOS,
  medicoes:   MOCK_MEDICOES,
  contratos:  MOCK_CONTRATOS,

  // ── Auth actions ──
  login: async (email, password) => {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error("E-mail ou senha incorretos.");
    const info   = NOME_MAP[email.toLowerCase()] || { nome: email.split("@")[0], cargo: "Usuário" };
    const perfil = PERFIL_MAP[email.toLowerCase()] || "comercial";
    set({ user: { email, nome: info.nome, cargo: info.cargo, perfil } });
  },

  logout: async () => {
    await _sb.auth.signOut();
    set({ user: null, activePage: "dashboard" });
  },

  setActivePage: (page) => set({ activePage: page }),

  // ── Historico ──
  registrar: (tipo, acao, desc) => {
    const agora = new Date();
    const { user } = get();
    const novo = {
      id: Date.now(), tipo, acao, desc,
      usuario: user?.nome || "Sistema",
      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    set((s) => ({ historico: [novo, ...s.historico] }));
  },

  // ── Clientes ──
  addCliente: (c) => {
    set((s) => ({ clientes: [...s.clientes, { ...c, id: Date.now() }] }));
    get().registrar("cliente", "criado", `Cliente ${c.nome} cadastrado`);
  },
  updateCliente: (id, data) => {
    set((s) => ({ clientes: s.clientes.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
    get().registrar("cliente", "editado", `Cliente ${data.nome} atualizado`);
  },
  deleteCliente: (id) => {
    const c = get().clientes.find((x) => x.id === id);
    set((s) => ({ clientes: s.clientes.filter((x) => x.id !== id) }));
    get().registrar("cliente", "deletado", `Cliente ${c?.nome} removido`);
  },

  // ── Orçamentos ──
  addOrcamento: (o) => {
    set((s) => ({ orcamentos: [{ ...o, id: Date.now() }, ...s.orcamentos] }));
    get().registrar("orcamento", "criado", `Orçamento ${o.ref} gerado para ${o.cliente}`);
  },
  updateOrcamento: (id, data) => {
    set((s) => ({ orcamentos: s.orcamentos.map((o) => (o.id === id ? { ...o, ...data } : o)) }));
    get().registrar("orcamento", "editado", `Orçamento editado — ${data.cliente || ""}`);
  },
  deleteOrcamento: (id) => {
    const o = get().orcamentos.find((x) => x.id === id);
    set((s) => ({ orcamentos: s.orcamentos.filter((x) => x.id !== id) }));
    get().registrar("orcamento", "deletado", `Orçamento ${o?.ref} removido`);
  },

  // ── Obras ──
  avancarFase: (obraId, novaFase, progresso) => {
    set((s) => ({ obras: s.obras.map((o) => o.id === obraId ? { ...o, fase: novaFase, progresso } : o) }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("obra", "fase", `Obra ${o?.nome?.split("—")[0]?.trim()} avançou para: ${novaFase}`);
  },

  // ── Arquivos ──
  addArquivos: (obraId, novos) => {
    set((s) => ({ arquivos: { ...s.arquivos, [obraId]: [...novos, ...(s.arquivos[obraId] || [])] } }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("obra", "editado", `${novos.length} arquivo(s) adicionado(s) em ${o?.nome?.split("—")[0]?.trim()}`);
  },
  deleteArquivo: (obraId, arqId) => {
    set((s) => ({ arquivos: { ...s.arquivos, [obraId]: s.arquivos[obraId].filter((a) => a.id !== arqId) } }));
  },

  // ── Financeiro ──
  addLancamento: (obraId, lancamento) => {
    set((s) => {
      const fin = s.financeiro[obraId] || { contrato: 0, lancamentos: [] };
      return { financeiro: { ...s.financeiro, [obraId]: { ...fin, lancamentos: [...fin.lancamentos, { ...lancamento, id: Date.now() }] } } };
    });
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("financeiro", lancamento.tipo === "receita" ? "receita" : "despesa",
      `${lancamento.tipo === "receita" ? "Receita" : "Despesa"} de R$ ${lancamento.valor} — ${o?.nome?.split("—")[0]?.trim()}`);
  },

  // ── Diário ──
  addDiario: (obraId, registro) => {
    set((s) => ({ diario: { ...s.diario, [obraId]: [{ ...registro, id: Date.now() }, ...(s.diario[obraId] || [])] } }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("obra", "editado", `Diário registrado em ${o?.nome?.split("—")[0]?.trim()} — ${registro.data}`);
  },

  // ── Medições ──
  addMedicao: (obraId, medicao) => {
    const lista = get().medicoes[obraId] || [];
    const novo  = { ...medicao, id: Date.now(), numero: lista.length + 1, status: "Pendente" };
    set((s) => ({ medicoes: { ...s.medicoes, [obraId]: [...lista, novo] } }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("financeiro", "criado", `Medição ${novo.numero} registrada — ${o?.nome?.split("—")[0]?.trim()}`);
  },
  aprovarMedicao: (obraId, id) => {
    set((s) => ({ medicoes: { ...s.medicoes, [obraId]: s.medicoes[obraId].map((m) => m.id === id ? { ...m, status: "Aprovada" } : m) } }));
    const o = get().obras.find((x) => x.id === obraId);
    get().registrar("financeiro", "receita", `Medição aprovada — ${o?.nome?.split("—")[0]?.trim()}`);
  },

  // ── Contratos ──
  addContrato: (contrato) => {
    set((s) => ({ contratos: [{ ...contrato, id: Date.now() }, ...s.contratos] }));
    get().registrar("contrato", "criado", `Contrato ${contrato.ref} criado para ${contrato.cliente}`);
  },

  // ── Eventos/Agenda ──
  addEvento: (evento) => {
    set((s) => ({ eventos: [...s.eventos, { ...evento, id: Date.now() }] }));
    get().registrar("cliente", "criado", `Evento agendado: ${evento.titulo} — ${evento.data}`);
  },
  deleteEvento: (id) => {
    set((s) => ({ eventos: s.eventos.filter((e) => e.id !== id) }));
  },
}));

export default useAppStore;
