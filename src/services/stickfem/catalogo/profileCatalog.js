/**
 * ProfileCatalogSync — importação/validação/versionamento do catálogo de perfis.
 *
 * Princípio (exigência de arquitetura): o StickFEM NUNCA consulta um catálogo
 * externo durante o cálculo. O fluxo é:
 *
 *     Fonte (CalcSteel API | CSV | JSON)
 *            │  importarCatalogo()
 *            ▼
 *     validar + normalizar + diff (esta lógica é PURA e testável)
 *            │  persistirCatalogo()
 *            ▼
 *     Supabase (perfil_estrutural)  ← cópia local versionada
 *            │
 *            ▼
 *     StickFEM Engine (lê sempre a cópia local)
 *
 * Assim os cálculos são reprodutíveis, não dependem da internet nem consomem
 * créditos, e cada projeto pode fixar a versão de catálogo usada.
 *
 * Este módulo NÃO chama a API do CalcSteel — recebe o payload já obtido (pela
 * Edge Function proxy, quando existir) ou de um arquivo. A parte que fala com o
 * Supabase (persistirCatalogo) fica isolada; a lógica de negócio é pura.
 */

// Campos numéricos aceitos (nome canônico → coluna no banco).
export const CAMPOS_NUMERICOS = {
  largura_mm: "largura_mm", altura_mm: "altura_mm", espessura_mm: "espessura_mm",
  aba_mm: "aba_mm", raio_mm: "raio_mm", diametro_mm: "diametro_mm",
  area_mm2: "area_mm2", inercia_x_mm4: "inercia_x_mm4", inercia_y_mm4: "inercia_y_mm4",
  modulo_wx_mm3: "modulo_wx_mm3", modulo_wy_mm3: "modulo_wy_mm3",
  modulo_zx_mm3: "modulo_zx_mm3", modulo_zy_mm3: "modulo_zy_mm3",
  raio_giracao_x_mm: "raio_giracao_x_mm", raio_giracao_y_mm: "raio_giracao_y_mm",
  constante_torcao_mm4: "constante_torcao_mm4", constante_empenamento_mm6: "constante_empenamento_mm6",
  peso_kg_m: "peso_kg_m",
};
export const CAMPOS_TEXTO = ["nome", "tipo", "codigo", "familia", "categoria", "norma"];

const toNum = (v) => {
  if (v == null || v === "" || v === "—") return null;
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Valida e normaliza um perfil bruto do catálogo.
 * @returns {{ ok:boolean, perfil?:object, erros?:string[] }}
 */
export function validarPerfil(bruto) {
  const erros = [];
  const nome = (bruto?.nome ?? bruto?.descricao ?? "").toString().trim();
  if (!nome) erros.push("nome ausente");

  const perfil = { nome };
  for (const campo of CAMPOS_TEXTO) {
    if (campo === "nome") continue;
    if (bruto[campo] != null && bruto[campo] !== "") perfil[campo] = String(bruto[campo]).trim();
  }
  for (const campo of Object.keys(CAMPOS_NUMERICOS)) {
    if (campo in bruto) {
      const n = toNum(bruto[campo]);
      if (bruto[campo] != null && bruto[campo] !== "" && bruto[campo] !== "—" && n == null) erros.push(`${campo} inválido`);
      if (n != null) perfil[campo] = n;
    }
  }
  // Chave de identidade: código (se houver) senão nome. Usada no diff/upsert.
  perfil._chave = (perfil.codigo || perfil.nome).toLowerCase();
  if (perfil.area_mm2 != null && perfil.area_mm2 <= 0) erros.push("área não-positiva");

  return erros.length ? { ok: false, erros } : { ok: true, perfil };
}

/** true se algum campo relevante mudou entre o existente e o novo. */
export function perfilMudou(existente, novo) {
  const campos = [...CAMPOS_TEXTO, ...Object.keys(CAMPOS_NUMERICOS)];
  return campos.some((c) => {
    const a = existente?.[c] ?? null;
    const b = novo?.[c] ?? null;
    if (typeof a === "number" || typeof b === "number") return Number(a) !== Number(b);
    return (a ?? "") !== (b ?? "");
  });
}

/**
 * Calcula o plano de sincronização (PURO — sem I/O). Nunca remove registros.
 * @param {object[]} brutos     perfis do catálogo (fonte)
 * @param {object[]} existentes perfis já no banco
 * @returns {{ novos, alterados, invalidos, total }}
 */
export function planejarSync(brutos, existentes = []) {
  const idxExistentes = new Map();
  for (const e of existentes) idxExistentes.set((e.codigo || e.nome || "").toLowerCase(), e);

  const novos = [], alterados = [], invalidos = [];
  for (const bruto of brutos || []) {
    const v = validarPerfil(bruto);
    if (!v.ok) { invalidos.push({ bruto, erros: v.erros }); continue; }
    const atual = idxExistentes.get(v.perfil._chave);
    if (!atual) novos.push(v.perfil);
    else if (perfilMudou(atual, v.perfil)) alterados.push({ id: atual.id, perfil: v.perfil });
  }
  return { novos, alterados, invalidos, total: (brutos || []).length };
}

// ── Camada de persistência (isolada; só aqui há I/O com o Supabase) ──────────
/**
 * Aplica o plano no Supabase (upsert new/changed, nunca delete) e registra o log.
 * Recebe `sb` e `getEmpresaId` por injeção para manter a lógica testável.
 */
export async function persistirCatalogo({ sb, getEmpresaId, brutos, fonte = "manual", versao = null }) {
  const t0 = Date.now();
  const empresa_id = getEmpresaId?.() || null;
  const { data: existentes, error: e1 } = await sb
    .from("perfil_estrutural")
    .select("id, nome, tipo, codigo, familia, categoria, norma, largura_mm, altura_mm, espessura_mm, aba_mm, area_mm2, inercia_x_mm4, inercia_y_mm4, modulo_wx_mm3, peso_kg_m");
  if (e1) throw e1;

  const plano = planejarSync(brutos, existentes || []);
  const carimbo = { fonte, versao_catalogo: versao, ultima_sincronizacao: new Date().toISOString() };
  const semChave = (p) => { const { _chave, ...r } = p; return r; };

  if (plano.novos.length) {
    const rows = plano.novos.map((p) => ({ ...semChave(p), ...carimbo, empresa_id }));
    const { error } = await sb.from("perfil_estrutural").insert(rows);
    if (error) throw error;
  }
  for (const { id, perfil } of plano.alterados) {
    const { error } = await sb.from("perfil_estrutural").update({ ...semChave(perfil), ...carimbo }).eq("id", id);
    if (error) throw error;
  }

  const log = {
    empresa_id, fonte, versao_catalogo: versao, quantidade_total: plano.total,
    quantidade_novos: plano.novos.length, quantidade_alterados: plano.alterados.length,
    tempo_ms: Date.now() - t0, erros: plano.invalidos.length ? JSON.stringify(plano.invalidos.slice(0, 20)) : null,
  };
  await sb.from("perfil_catalogo_sync").insert(log).then(() => {}, () => {});

  return { ...plano, tempoMs: log.tempo_ms };
}
