/**
 * StickFEM™ — Solver Interface (arquitetura desacoplada).
 *
 *   StructuralModel → SolverAdapter → Result
 *
 * O núcleo do StickFEM NÃO conhece nenhum solver específico. Adapters concretos
 * (OpenSees, CalculiX, ou um solver JS embutido) implementam SolverAdapter e são
 * registrados aqui. Trocar/adicionar solver não exige reescrever o núcleo.
 *
 *        StickFEM Core
 *             │
 *        SolverAdapter (interface)
 *        ┌────┴─────┐
 *     OpenSees   CalculiX   (JS embutido)   ← plugáveis no futuro
 *
 * O `StructuralModel` já nasce FEM-ready: nós, elementos, seções, materiais,
 * apoios e cargas em formato compatível com montagem de matriz de rigidez —
 * o mesmo que OpenSees/CalculiX consomem.
 */

/**
 * @typedef {Object} Node        { id, x, y, z }
 * @typedef {Object} Section     { id, area_mm2, ix_mm4, iy_mm4, wx_mm3, perfilId }
 * @typedef {Object} MaterialDef { id, e_mpa, fy_mpa, densidade }
 * @typedef {Object} Element     { id, tipo, nodes:[i,j], sectionId, materialId, elementoId }
 * @typedef {Object} Support     { nodeId, restraints:{dx,dy,dz,rx,ry,rz} }
 * @typedef {Object} LoadCase    { id, tipo, loads:[{nodeId?, elementId?, fx,fy,fz,...}] }
 * @typedef {Object} StructuralModel {
 *   unidade:'m', nodes:Node[], elements:Element[], sections:Section[],
 *   materials:MaterialDef[], supports:Support[], loadCases:LoadCase[], combinacoes:object
 * }
 * @typedef {Object} Result {
 *   status:'pendente'|'concluida'|'erro', solver:string,
 *   deslocamentoMax?:number, tensaoMax?:number, fatorSeguranca?:number,
 *   statusEstrutural?:'aprovado'|'atencao'|'revisar',
 *   porElemento?:Array<{elementId, tensao, deslocamento, ratio}>, mensagem?:string
 * }
 */

/** Contrato base — todo solver concreto estende esta classe. */
export class SolverAdapter {
  /** @param {StructuralModel} _model @returns {Promise<Result>} */
  async solve(_model) {
    throw new Error(`SolverAdapter.solve() não implementado por ${this.constructor.name}`);
  }
  get nome() { return "abstract"; }
  get disponivel() { return false; }
}

/**
 * Solver nulo — placeholder do Slice 1. O modelo é montado e persistido,
 * mas o cálculo fica pendente até plugarmos um solver real (Fase 6).
 */
export class NullSolver extends SolverAdapter {
  get nome() { return "null"; }
  get disponivel() { return true; }
  async solve(model) {
    return {
      status: "pendente",
      solver: "null",
      statusEstrutural: undefined,
      mensagem: "Modelo analítico montado. Cálculo FEM pendente — plugue um solver (Fase 6).",
      porElemento: (model.elements || []).map((e) => ({ elementId: e.id, tensao: null, deslocamento: null, ratio: null })),
    };
  }
}

// ── Registro de solvers (plugáveis) ──────────────────────────────────────────
const _registry = new Map();
export function registerSolver(nome, adapter) { _registry.set(nome, adapter); }
export function getSolver(nome) { return _registry.get(nome) || _registry.get("null"); }
export function listSolvers() { return [..._registry.keys()]; }

registerSolver("null", new NullSolver());
// Futuro: registerSolver("opensees", new OpenSeesAdapter(...));
//         registerSolver("calculix", new CalculiXAdapter(...));
//         registerSolver("js",       new JsFrameSolver());

/**
 * Monta o StructuralModel (modelo analítico FEM-ready) a partir dos elementos
 * estruturais identificados + catálogo de perfis + parâmetros do projeto.
 * Cada parede/viga vira um elemento de barra entre dois nós; apoios na base.
 */
export function buildStructuralModel(elementos, perfis, projeto = {}) {
  const nodes = [];
  const elements = [];
  const sections = [];
  const supports = [];
  const nodeKey = new Map();
  const secKey = new Map();
  const round = (v) => Math.round(v * 1000) / 1000;

  const getNode = (x, y, z = 0) => {
    const k = `${round(x)}|${round(y)}|${round(z)}`;
    if (nodeKey.has(k)) return nodeKey.get(k);
    const id = nodes.length + 1;
    nodes.push({ id, x: round(x), y: round(y), z });
    nodeKey.set(k, id);
    return id;
  };
  const getSection = (perfil) => {
    if (!perfil) return null;
    if (secKey.has(perfil.id)) return secKey.get(perfil.id);
    const id = sections.length + 1;
    sections.push({
      id, perfilId: perfil.id, area_mm2: perfil.area_mm2,
      ix_mm4: perfil.inercia_x_mm4, iy_mm4: perfil.inercia_y_mm4, wx_mm3: perfil.modulo_wx_mm3,
    });
    secKey.set(perfil.id, id);
    return id;
  };

  const perfilById = Object.fromEntries((perfis || []).map((p) => [p.id, p]));

  for (const el of elementos || []) {
    const g = el.geometria || {};
    if (g.x1 == null || g.y1 == null || g.x2 == null || g.y2 == null) continue;
    const ni = getNode(g.x1, g.y1, 0);
    const nj = getNode(g.x2, g.y2, 0);
    const perfil = el.perfil_id ? perfilById[el.perfil_id] : null;
    elements.push({
      id: elements.length + 1,
      tipo: el.tipo,
      nodes: [ni, nj],
      sectionId: getSection(perfil),
      materialId: 1,
      elementoId: el.id,
    });
  }

  // Apoios: engaste na cota mais baixa (base) — simplificação do Slice 1.
  if (nodes.length) {
    const ymin = Math.min(...nodes.map((n) => n.y));
    nodes.filter((n) => Math.abs(n.y - ymin) < 0.01).forEach((n) =>
      supports.push({ nodeId: n.id, restraints: { dx: 1, dy: 1, dz: 1, rx: 1, ry: 1, rz: 1 } }));
  }

  return {
    unidade: "m",
    nodes, elements, sections, supports,
    materials: [{ id: 1, e_mpa: 200000, fy_mpa: 250, densidade: 7850 }],
    loadCases: [],   // preenchido na Fase 5 (cargas)
    combinacoes: { elu: [], els: [] },
    meta: { projeto: projeto?.nome || null, peDireito: projeto?.pe_direito_m ?? 2.8 },
  };
}
