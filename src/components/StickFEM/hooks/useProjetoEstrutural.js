import { useEffect, useMemo, useState } from "react";
import { parseDXF } from "../../../services/stickfem/parser/dxfParser";
import { parseEstrutura, layersDetectados } from "../../../services/stickfem/parser/structuralParser";
import { gerarQuantitativo } from "../../../services/stickfem/quantitativo";
import { detectarConflitos } from "../../../services/stickfem/conflicts";
import { buildStructuralModel, getSolver } from "../../../services/stickfem/solver/SolverAdapter";
import { computeStickScore } from "../../../services/stickfem/score";
import { gerarOrcamentoEstrutural } from "../../../services/stickfem/orcamentoBridge";
import { sugerirPerfisInteligentes } from "../../../services/stickfem/perfilInteligente";
import { pressaoVento, combinarCargas } from "../../../services/stickfem/cargas";
import { preDimensionar } from "../../../services/stickfem/preDimensionamento";
import { auditarPreDimensionamento } from "../../../services/stickfem/auditoria";
import { montarMemorial, gerarMemorialPDF } from "../../../services/stickfem/memorial";
import {
  salvarArquivoCad, salvarElementos, salvarAnalise, atualizarStatusProjeto,
  listarOrcamentosStickFem,
} from "../../../services/stickfem/repository";

/**
 * Estado e regras de negócio de um projeto estrutural aberto no StickFEM™:
 * import de DXF, confirmação de layers, revisão de elementos, StickScore +
 * conflitos, cargas/pré-dimensionamento (Fase 5) e geração de orçamento (Fase 8).
 * Os componentes de apresentação (ViewerCAD, LayerSelector, ElementTable, ...)
 * apenas consomem o que este hook expõe.
 */
export function useProjetoEstrutural({ data, perfis, onReload }) {
  const { projeto } = data;
  const [geometria, setGeometria] = useState(null);
  const [elementos, setElementos] = useState(data.elementos || []);
  const [resumo, setResumo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const montanteId = useMemo(() => (perfis.find((p) => p.tipo === "montante") || {}).id, [perfis]);
  const guiaId = useMemo(() => (perfis.find((p) => p.tipo === "guia") || {}).id, [perfis]);
  const [perfMont, setPerfMont] = useState(montanteId);
  const [perfGuia, setPerfGuia] = useState(guiaId);
  useEffect(() => { setPerfMont(montanteId); setPerfGuia(guiaId); }, [montanteId, guiaId]);

  const quant = useMemo(() => gerarQuantitativo(elementos, perfis, {
    espacMontanteMm: projeto.espac_montante_mm, peDireitoM: projeto.pe_direito_m,
    perfilMontanteId: perfMont, perfilGuiaId: perfGuia,
  }), [elementos, perfis, projeto, perfMont, perfGuia]);

  const [conflitos, setConflitos] = useState([]);
  const stickScoreResult = useMemo(() => {
    if (!geometria) return null;
    const elementosComPerfil = elementos.map((e) => (e.tipo === "parede" ? { ...e, perfil_id: e.perfil_id || perfMont } : e));

    const conflitosDetectados = detectarConflitos({ elementos: elementosComPerfil, geometria, perfis });
    setConflitos(conflitosDetectados);

    return computeStickScore({ elementos: elementosComPerfil, geometria, conflitos: conflitosDetectados });
  }, [elementos, geometria, perfMont, perfis]);

  const handleScoreClick = () => {
    if (!stickScoreResult) return;
    const detailsText = Object.entries(stickScoreResult.details)
      .map(([key, value]) => `  - ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}/100`)
      .join('\\n');
    alert(`Relatório de Pontuação (WIP):\\n${detailsText}`);
  };

  // Fase 8 — orçamento estrutural
  const [orcs, setOrcs] = useState([]);
  const [precoKg, setPrecoKg] = useState(12);
  const [areaM2, setAreaM2] = useState("");
  const [tipologia, setTipologia] = useState("Residencial Térreo");
  const [gerando, setGerando] = useState(false);
  const versaoDxf = (data.arquivos?.length || 0) + (geometria ? 1 : 0) || 1;

  useEffect(() => {
    listarOrcamentosStickFem(projeto.id).then(setOrcs).catch(() => {});
  }, [projeto.id]);

  async function gerarOrc() {
    if (!quant.itens.length) { setErro("Sem quantitativo — importe um DXF com paredes."); return; }
    setGerando(true); setErro("");
    try {
      const { saved } = await gerarOrcamentoEstrutural({
        projeto, quant,
        perfilMontante: perfis.find((p) => p.id === perfMont),
        perfilGuia: perfis.find((p) => p.id === perfGuia),
        precoKg: Number(precoKg) || 12, obraNome: projeto.nome, versaoDxf,
        areaM2: Number(areaM2) || null, tipologia,
      });
      setMsg(`Orçamento estrutural gerado (StickQuote #${saved?.numero ?? "—"}).`);
      setOrcs(await listarOrcamentosStickFem(projeto.id));
    } catch (err) {
      setErro("Erro ao gerar orçamento: " + (err.message || err));
    } finally { setGerando(false); }
  }

  // ── Validação humana ───────────────────────────────────────────────────────
  const [layerCfg, setLayerCfg] = useState({});
  const layers = useMemo(() => (geometria ? layersDetectados(geometria) : []), [geometria]);
  const onLayerCfgChange = (layer, value) => setLayerCfg((c) => ({ ...c, [layer]: value }));

  function setEl(idx, patch) {
    setElementos((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch, validado: patch.validado ?? true } : e)));
  }
  function reprocessar() {
    if (!geometria) return;
    const { elementos: els, resumo: res } = parseEstrutura(geometria, {
      peDireito: projeto.pe_direito_m, layerConfig: layerCfg,
    });
    setElementos(els); setResumo(res);
    setMsg(`Reprocessado: ${res.total} elementos.`);
  }
  function validarTodas() {
    setElementos((prev) => prev.map((e) => ({ ...e, validado: true })));
  }

  // ── Assistente de Revisão: ações que realmente alteram o modelo ─────────────
  const [focoElemento, setFocoElemento] = useState(null);
  function aceitarSugestaoRevisao(idx) {
    setElementos((prev) => prev.map((e, i) => {
      if (i !== idx) return e;
      const patch = { validado: true, confianca: "alta", confiancaScore: Math.min(100, (e.confiancaScore ?? 60) + 15) };
      if (e.sugestaoPerfil?.perfil_id_sugerido) patch.perfil_id = e.sugestaoPerfil.perfil_id_sugerido;
      return { ...e, ...patch };
    }));
  }
  function corrigirManual(idx) { setFocoElemento(idx); }

  // ── Fase 5 — cargas + pré-dimensionamento (preliminar) ─────────────────────
  const [carga, setCarga] = useState({ gPerm: 1.5, qSobre: 1.5, largTrib: 2.5, v0: 40 });
  const [predim, setPredim] = useState(null);
  const [savingPd, setSavingPd] = useState(false);
  const setC = (k, v) => setCarga((c) => ({ ...c, [k]: v }));

  function rodarPreDim() {
    const paredesCalc = elementos.filter((e) => e.tipo === "parede" && e.incluir_calculo !== false);
    const gLine = (Number(carga.gPerm) || 0) * (Number(carga.largTrib) || 0);   // kN/m
    const qLine = (Number(carga.qSobre) || 0) * (Number(carga.largTrib) || 0);  // kN/m
    const comb = combinarCargas({ g: gLine, q: qLine, w: 0 });
    const perfil = perfis.find((p) => p.id === perfMont);
    const res = preDimensionar({
      paredes: paredesCalc, perfil, material: { fy_mpa: 250, e_mpa: 200000 },
      peDireitoM: projeto.pe_direito_m, espacMontanteM: (projeto.espac_montante_mm || 400) / 1000,
      qParedeUlt_kN_m: comb.elu.gravitacional,
    });
    setPredim({ ...res, comb, vento: pressaoVento({ v0: Number(carga.v0) || 40 }) });
  }

  // ── Modo "Auditar cálculo" (memória de cálculo completa) ───────────────────
  const [auditoria, setAuditoria] = useState(null);
  function dimParaAuditoria() {
    const perfil = perfis.find((p) => p.id === perfMont);
    return {
      perfil, material: { fy_mpa: 250, e_mpa: 200000 },
      peDireitoM: projeto.pe_direito_m,
      espacMontanteM: (projeto.espac_montante_mm || 400) / 1000,
      larguraTributariaM: Number(carga.largTrib) || 0,
      gPerm_kNm2: Number(carga.gPerm) || 0,
      qSobre_kNm2: Number(carga.qSobre) || 0,
      v0_ms: Number(carga.v0) || 40,
      meta: { projeto: projeto.nome, tipologia },
    };
  }
  function abrirAuditoria() {
    if (!perfis.find((p) => p.id === perfMont)) { setErro("Selecione um perfil de montante para auditar."); return; }
    setAuditoria(auditarPreDimensionamento(dimParaAuditoria()));
  }
  const fecharAuditoria = () => setAuditoria(null);

  // ── Memorial de Engenharia (PDF completo, com hash + versão do engine) ──────
  function gerarMemorial() {
    const perfil = perfis.find((p) => p.id === perfMont);
    if (!perfil) { setErro("Selecione um perfil de montante para gerar o memorial."); return; }
    const ultimaAprov = (data.aprovacoes || [])[0];
    const memorial = montarMemorial({
      design: dimParaAuditoria(), projeto,
      engenheiro: ultimaAprov ? { nome: ultimaAprov.engenheiro_nome, crea: ultimaAprov.engenheiro_crea } : null,
      aprovacoes: data.aprovacoes || [],
    });
    gerarMemorialPDF(memorial);
  }

  async function salvarPreDim() {
    if (!predim) return;
    setSavingPd(true);
    try {
      await salvarAnalise(projeto.id, {
        solver: "predim", status: "concluida",
        cargas: { ...carga, vento: predim.vento }, combinacoes: predim.comb,
        resultado: { porParede: predim.porParede, resumo: predim.resumo, premissas: predim.premissas },
        statusEstrutural: predim.resumo.statusGlobal,
      });
      setMsg("Pré-dimensionamento salvo.");
    } catch (err) { setErro(err.message); }
    finally { setSavingPd(false); }
  }

  async function onDxf(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(""); setMsg("Lendo DXF…"); setBusy(true);
    try {
      const text = await file.text();
      const geo = parseDXF(text, { peDireito: projeto.pe_direito_m });
      const { elementos: els, resumo: res } = parseEstrutura(geo, { peDireito: projeto.pe_direito_m });

      // Fase 6: Perfis Inteligentes
      const elementosComSugestoes = sugerirPerfisInteligentes(els, perfis);

      setGeometria({ ...geo, _file: file.name });
      setElementos(elementosComSugestoes);
      setResumo(res);
      setMsg(`Identificados ${res.total} elementos (${res.paredes} paredes). Sugestões de perfis geradas.`);
    } catch (err) {
      setErro("Falha ao ler o DXF: " + (err.message || err));
      setMsg("");
    } finally { setBusy(false); }
  }

  async function salvarTudo() {
    if (!geometria || !elementos.length) { setErro("Importe um DXF primeiro."); return; }
    setBusy(true); setErro(""); setMsg("Salvando…");
    try {
      const arq = await salvarArquivoCad(projeto.id, {
        nomeArquivo: geometria._file, formato: "dxf",
        layers: geometria.layers, geometria: {
          lines: geometria.lines, polylines: geometria.polylines, bounds: geometria.bounds,
        }, stats: geometria.stats,
      });
      const els = elementos.map((el) => ({
        ...el,
        perfil_id: el.perfil_id || (el.tipo === "parede" ? perfMont : el.tipo === "viga" ? perfGuia : null),
      }));
      const salvos = await salvarElementos(projeto.id, arq.id, els);

      // Modelo analítico FEM-ready + solver (null no Slice 1).
      const modelo = buildStructuralModel(salvos, perfis, projeto);
      const result = await getSolver("null").solve(modelo);
      await salvarAnalise(projeto.id, {
        solver: "null", status: result.status, modeloAnalitico: modelo,
        resultado: result, statusEstrutural: result.statusEstrutural,
      });
      await atualizarStatusProjeto(projeto.id, "analisado");
      setMsg("Salvo. Modelo analítico montado (cálculo FEM pendente).");
      onReload();
    } catch (err) {
      setErro("Erro ao salvar: " + (err.message || err));
    } finally { setBusy(false); }
  }

  return {
    projeto,
    geometria, elementos, resumo, busy, msg, erro,
    perfMont, setPerfMont, perfGuia, setPerfGuia,
    quant, conflitos, stickScoreResult, handleScoreClick,
    orcs, precoKg, setPrecoKg, areaM2, setAreaM2, tipologia, setTipologia, gerando, gerarOrc,
    layerCfg, layers, onLayerCfgChange,
    setEl, reprocessar, validarTodas,
    focoElemento, setFocoElemento, aceitarSugestaoRevisao, corrigirManual,
    carga, setC, predim, savingPd, rodarPreDim, salvarPreDim,
    auditoria, abrirAuditoria, fecharAuditoria, gerarMemorial,
    onDxf, salvarTudo,
  };
}
