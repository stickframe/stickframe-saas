import { useState, useCallback, useEffect } from "react";
import { sb, getEmpresaId } from "../../services/supabase";
import { calcMotorComposicao } from "../../utils/composicoesSF";
import { gerarStickQuotePDF, salvarStickQuote } from "../../services/stickquoteService";
import { analisarDWG } from "../../utils/dwgMeasurementEngine";

const C = {
  bg: "#111013", surface: "#1b1a20", surface2: "#211f27", elev: "#2a2832",
  line: "rgba(255,255,255,.08)", line2: "rgba(255,255,255,.13)",
  ink: "#f5f2ec", ink2: "#b8b2aa", muted: "#7d776f",
  red: "#c0241c", red2: "#e0463c", redSoft: "rgba(192,36,28,.14)",
  green: "#22c578", greenSoft: "rgba(34,197,120,.14)",
  steel: "#5b9bd5", steelSoft: "rgba(91,155,213,.12)",
  amber: "#e09020", amberSoft: "rgba(224,144,32,.14)",
  blue: "#3b82f6",
};

const fmtBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v, d = 1) => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

const DWG_PARA_SF = [
  { key: "paredesExternas", composicaoId: "par-ext",       label: "Parede externa (SF 90mm)",  cor: "#5b9bd5" },
  { key: "paredesInternas", composicaoId: "par-int-st",    label: "Parede interna (Drywall)",   cor: "#7b5ea7" },
  { key: "forro",           composicaoId: "forro-st",      label: "Forro (sistema ST)",          cor: "#c07832" },
  { key: "cobertura",       composicaoId: "estrutura-lsf", label: "Estrutura LSF (cobertura)",  cor: "#2a9d8f" },
];

// ── Step indicator ──
function Steps({ current }) {
  const steps = ["Upload", "Análise", "Revisão", "Orçamento"];
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? "1 1 auto" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 800,
              background: i < current ? C.green : i === current ? C.blue : C.surface2,
              color: i < current || i === current ? "#fff" : C.muted,
              border: i === current ? `2px solid ${C.blue}` : "none",
            }}>{i < current ? "✓" : i + 1}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: i === current ? C.ink : C.muted }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < current ? C.green : C.line, margin: "0 10px" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── StickTrust™ ring ──
function TrustRing({ score, nivel }) {
  const cor = nivel === "alto" ? C.green : nivel === "medio" ? C.amber : C.red2;
  const r = 22, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: 54, height: 54 }}>
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="27" cy="27" r={r} fill="none" stroke={cor + "30"} strokeWidth="7" />
          <circle cx="27" cy="27" r={r} fill="none" stroke={cor} strokeWidth="7"
            strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: cor }}>
          {score}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: cor }}>StickTrust™ {score}%</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          {nivel === "alto" ? "Alta confiança" : nivel === "medio" ? "Confiança média" : "Baixa confiança"}
        </div>
      </div>
    </div>
  );
}

export default function StickQuoteDWGModal({ onClose, obraNome = "", clienteNome = "", empresaId: empId }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [analise, setAnalise] = useState(null);
  const [medidas, setMedidas] = useState(null);
  const [composicoes, setComposicoes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [saving, setSaving] = useState(false);
  const [nomeQuote, setNomeQuote] = useState(`StickQuote™ DWG – ${obraNome || "Projeto"}`);

  useEffect(() => {
    async function load() {
      const [insRes, compRes] = await Promise.all([
        sb.from("insumos_sistema").select("id,nome,preco,un,categoria,grupo").limit(1200),
        sb.from("composicoes_sf").select("id,nome,sistema,unidade,cor").eq("ativo", true),
      ]);
      if (insRes.data) setCatalogo(insRes.data);
      if (compRes.data) setComposicoes(compRes.data);
    }
    load();
  }, []);

  const handleFile = useCallback(async (f) => {
    const ext = f.name.toLowerCase().split(".").pop();
    if (!["dwg", "dxf"].includes(ext)) {
      setErro("Envie um arquivo DWG ou DXF.");
      return;
    }
    setFile(f);
    setErro("");
    setProcessando(true);
    setStep(1);
    try {
      const res = await analisarDWG(f);
      setAnalise(res);
      setMedidas({
        area:            res.areaConstruida,
        paredesExternas: res.paredesExternas,
        paredesInternas: res.paredesInternas,
        forro:           res.forro,
        cobertura:       res.cobertura,
        alturaMedia:     res.alturaMedia,
      });

      const compMap = {};
      composicoes.forEach(c => { compMap[c.id] = c; });

      const novasLinhas = DWG_PARA_SF.map(({ key, composicaoId, label, cor }) => ({
        composicaoId,
        composicaoNome: compMap[composicaoId]?.nome || label,
        composicaoCor:  compMap[composicaoId]?.cor  || cor,
        area:           res[key] || 0,
        origem:         "DWG",
        confianca:      res.confianca,
      })).filter(l => l.area > 0);

      setLinhas(novasLinhas);
      setStep(2);
    } catch (e) {
      setErro(`Erro ao processar arquivo: ${e.message}`);
      setStep(0);
    } finally {
      setProcessando(false);
    }
  }, [composicoes]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  function aplicarMedidas() {
    setLinhas(prev => prev.map(l => {
      const chave = DWG_PARA_SF.find(p => p.composicaoId === l.composicaoId)?.key;
      return chave ? { ...l, area: medidas[chave] || 0 } : l;
    }).filter(l => l.area > 0));
    calcularOrcamento();
  }

  async function calcularOrcamento() {
    if (catalogo.length === 0) {
      setErro("Catálogo de insumos não carregado.");
      return;
    }
    const ids = linhas.map(l => l.composicaoId);
    const { data: compsCompletas } = await sb
      .from("composicoes_sf")
      .select("*, composicao_itens(*)")
      .in("id", ids);

    const selecoes = linhas.map(l => {
      const comp = (compsCompletas || []).find(c => c.id === l.composicaoId);
      return {
        composicaoId:      l.composicaoId,
        composicaoNome:    comp?.nome  || l.composicaoNome || l.composicaoId,
        composicaoCor:     comp?.cor   || l.composicaoCor  || "#666",
        composicaoSistema: comp?.sistema || "",
        area: l.area,
        itens: (comp?.composicao_itens || []).map(it => ({
          nome:      it.nome,
          un:        it.un,
          consumo:   Number(it.consumo) || 0,
          perda:     Number(it.perda)   || 0,
          grupo:     it.grupo,
          catBusca:  it.cat_busca  || undefined,
          produtoId: it.produto_id || undefined,
        })),
      };
    });

    const res = calcMotorComposicao(selecoes, catalogo, {});
    setResultado({ selecoes, ...res });
    setStep(3);
  }

  async function gerarPDF() {
    if (!resultado) return;
    setSaving(true);
    try {
      const saved = await salvarStickQuote({
        nome: nomeQuote,
        obraNome,
        clienteNome,
        selecoes: resultado.selecoes,
        resultado,
        observacoes: `Origem: DWG — ${file?.name} | StickTrust™ ${analise?.confianca}% | Área: ${medidas?.area} m²`,
      });

      // Salva no banco projetos_dwg (best-effort)
      const eid = empId || getEmpresaId();
      if (eid && file) {
        try {
          const buf = await file.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
          const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, "0")).join("");
          const storagePath = `projetos_dwg/${eid}/${Date.now()}-${file.name}`;
          const { data: up } = await sb.storage.from("arquivos").upload(storagePath, file, {
            contentType: "application/octet-stream", upsert: false,
          });
          const arquivoUrl = up?.path
            ? sb.storage.from("arquivos").getPublicUrl(up.path).data.publicUrl
            : null;
          await sb.from("projetos_dwg").insert({
            empresa_id:        eid,
            nome_arquivo:      file.name,
            arquivo_url:       arquivoUrl,
            dados_json:        analise,
            layers_detectadas: analise?.layersDetectadas || [],
            area_extraida:     medidas?.area,
            confianca:         analise?.confianca,
          });
        } catch (_) {}
      }

      gerarStickQuotePDF({
        nome: nomeQuote,
        obraNome, clienteNome,
        selecoes: resultado.selecoes,
        resultado,
        observacoes: `Origem: Projeto DWG AutoCAD — ${file?.name}\nStickTrust™ ${analise?.confianca}% (${analise?.nivel})\n${analise?.origemDetalhe || ""}\nÁrea construída: ${medidas?.area} m²\nLayers detectadas: ${(analise?.layersDetectadas || []).join(", ") || "—"}`,
        versaoId:  saved?.id,
        versaoNum: saved?.numero,
        origemIFC: null,
      });
      onClose?.();
    } catch (e) {
      setErro(`Erro ao gerar PDF: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  const CAMPOS_REVISAO = [
    { key: "area",            label: "Área construída",  unit: "m²", metaKey: "area",
      onChange: v => setMedidas(m => ({ ...m, area: v, forro: v, cobertura: parseFloat((v * 1.25).toFixed(1)) })) },
    { key: "paredesExternas", label: "Paredes externas", unit: "m²", metaKey: "paredesExternas",
      onChange: v => setMedidas(m => ({ ...m, paredesExternas: v })) },
    { key: "paredesInternas", label: "Paredes internas", unit: "m²", metaKey: "paredesInternas",
      onChange: v => setMedidas(m => ({ ...m, paredesInternas: v })) },
    { key: "forro",           label: "Forro",            unit: "m²", metaKey: "forro",
      onChange: v => setMedidas(m => ({ ...m, forro: v })) },
    { key: "cobertura",       label: "Cobertura",        unit: "m²", metaKey: "cobertura",
      onChange: v => setMedidas(m => ({ ...m, cobertura: v })) },
    { key: "alturaMedia",     label: "Pé direito",       unit: "m",  metaKey: "alturaMedia",
      onChange: v => setMedidas(m => ({ ...m, alturaMedia: v })) },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: C.bg, border: `1px solid ${C.line2}`, borderRadius: 20,
        width: "100%", maxWidth: 700, maxHeight: "92vh", overflow: "auto",
        padding: 28, position: "relative",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: C.blue, marginBottom: 4 }}>
              StickQuote™ DWG Analyzer
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: C.ink }}>
              DWG / DXF → Orçamento Steel Frame
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <Steps current={step} />

        {erro && (
          <div style={{ background: C.redSoft, border: `1px solid ${C.red}40`, borderRadius: 10,
            padding: "10px 14px", fontSize: 12, color: C.red2, marginBottom: 16 }}>
            ⚠ {erro}
          </div>
        )}

        {/* STEP 0 — Upload */}
        {step === 0 && (
          <div>
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onClick={() => document.getElementById("dwg-upload-input").click()}
              style={{
                border: `2px dashed ${drag ? C.blue : C.line2}`,
                borderRadius: 16, padding: "48px 32px", textAlign: "center", cursor: "pointer",
                background: drag ? C.steelSoft : C.surface, transition: ".2s",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.5"
                style={{ marginBottom: 16, opacity: .85 }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="3" y1="9" x2="21" y2="9"/><line x1="15" y1="3" x2="15" y2="21"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
                Arraste o DWG ou DXF aqui
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>
                Planta baixa ou projeto executivo em AutoCAD
              </div>
              <div style={{ marginTop: 16, display: "inline-block", padding: "8px 20px",
                background: C.blue, color: "#fff", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                Selecionar arquivo
              </div>
            </div>
            <input id="dwg-upload-input" type="file" accept=".dwg,.dxf" style={{ display: "none" }}
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

            <div style={{ marginTop: 16, padding: 14, background: C.surface, borderRadius: 10,
              border: `1px solid ${C.line}`, fontSize: 12, color: C.muted }}>
              <strong style={{ color: C.ink2 }}>Formatos aceitos:</strong>{" "}
              <span style={{ color: C.green }}>DXF</span> (alta precisão — leitura de layers e geometria) ·{" "}
              <span style={{ color: C.amber }}>DWG</span> (extração textual — confiança moderada)
              <br/>Dica: exporte como DXF do AutoCAD para melhores resultados.
            </div>
          </div>
        )}

        {/* STEP 1 — Processando */}
        {step === 1 && processando && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚙</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: C.ink }}>
              Analisando {file?.name?.toLowerCase().endsWith(".dxf") ? "DXF" : "DWG"}...
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>{file?.name}</div>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8, maxWidth: 340, margin: "24px auto 0" }}>
              {["Lendo layers do desenho", "Extraindo geometria", "Calculando comprimentos e áreas", "Estimando sistemas SF", "Calculando StickTrust™"].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.muted }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, opacity: .7 }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Análise + Layers */}
        {step === 2 && analise && medidas && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <TrustRing score={analise.confianca} nivel={analise.nivel} />
              <div style={{ fontSize: 12, color: C.muted, textAlign: "right" }}>
                <div>{file?.name}</div>
                <div style={{ marginTop: 3 }}>{analise.origemDetalhe}</div>
                <div style={{ marginTop: 2 }}>{analise.cotaCount} cotas · {analise.layersDetectadas.length} layers</div>
              </div>
            </div>

            {analise.layersDetectadas.length === 0 && (
              <div style={{ background: C.amberSoft, border: `1px solid ${C.amber}40`, borderRadius: 10,
                padding: "10px 14px", fontSize: 12, color: C.amber, marginBottom: 14 }}>
                ⚠ Não foram encontrados layers construtivos reconhecidos. As medidas foram estimadas por inferência.
                Recomendado: exportar como DXF ou usar PDF cotado / IFC para maior precisão.
              </div>
            )}

            {analise.layersDetectadas.length > 0 && (
              <div style={{ marginBottom: 14, padding: 12, background: C.surface, borderRadius: 10, border: `1px solid ${C.line}` }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>
                  Layers detectadas
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analise.layersDetectadas.map((l, i) => (
                    <div key={i} style={{ padding: "3px 10px", background: C.surface2, borderRadius: 6,
                      border: `1px solid ${C.line2}`, fontSize: 11, color: C.green, fontWeight: 600 }}>
                      ✓ {l}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medidas com badges extraído/inferido */}
            <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.line}`, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "10px 14px", background: C.surface2, borderBottom: `1px solid ${C.line}`,
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted }}>
                  Medidas extraídas — edite se necessário
                </span>
                <div style={{ display: "flex", gap: 8, fontSize: 10, color: C.muted }}>
                  <span style={{ color: C.green }}>✓ extraído</span>
                  <span style={{ color: C.amber }}>~ estimado</span>
                </div>
              </div>
              {CAMPOS_REVISAO.map(({ key, label, unit, onChange, metaKey }) => {
                const meta = analise?.metadados?.[metaKey];
                const isExtraido = meta?.tipo === "extraido";
                const badge = isExtraido
                  ? { l: "✓ extraído", bg: C.greenSoft, c: C.green }
                  : { l: "~ estimado", bg: C.amberSoft, c: C.amber };
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: C.ink2, fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 6,
                        background: badge.bg, color: badge.c }}>{badge.l}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number" value={medidas[key]} min="0" step="0.5"
                        onChange={e => onChange(parseFloat(e.target.value) || 0)}
                        style={{ width: 80, padding: "4px 8px", borderRadius: 7, border: `1px solid ${isExtraido ? C.green + "50" : C.amber + "50"}`,
                          background: C.surface2, color: C.ink, fontSize: 13, fontFamily: "inherit", textAlign: "right" }}
                      />
                      <span style={{ fontSize: 12, color: C.muted, width: 24 }}>{unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: "11px 0", borderRadius: 10,
                background: "none", border: `1px solid ${C.line2}`, color: C.ink2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ← Novo arquivo
              </button>
              <button onClick={aplicarMedidas} style={{ flex: 2, padding: "11px 0", borderRadius: 10,
                background: C.blue, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Confirmar e Gerar Orçamento →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Resultado */}
        {step === 3 && resultado && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <TrustRing score={analise?.confianca || 0} nivel={analise?.nivel || "baixo"} />
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { l: "Área", v: `${medidas?.area} m²` },
                  { l: "Sistemas", v: resultado.selecoes?.length },
                  { l: "Total material", v: fmtBRL(resultado.totalCusto) },
                ].map(({ l, v }) => (
                  <div key={l} style={{ background: C.surface, borderRadius: 10, padding: "10px 12px", border: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14, padding: "8px 12px", background: C.steelSoft,
              borderRadius: 8, border: `1px solid ${C.steel}30`, fontSize: 11, color: C.steel }}>
              Origem do quantitativo: <strong>DWG AutoCAD</strong> · {analise?.origemDetalhe} · StickTrust™ {analise?.confianca}%
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 6 }}>Nome do orçamento</div>
              <input value={nomeQuote} onChange={e => setNomeQuote(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.line2}`,
                  background: C.surface2, color: C.ink, fontSize: 13, fontFamily: "inherit" }} />
            </div>

            {/* Breakdown de composições */}
            <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.line}`, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "10px 14px", background: C.surface2, borderBottom: `1px solid ${C.line}`,
                fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted }}>
                Composições Steel Frame
              </div>
              {resultado.breakdown?.map((b, i) => {
                const comp = b.composicao && typeof b.composicao === "object" ? b.composicao : { nome: b.composicao, cor: b.cor };
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: comp.cor || C.steel }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{comp.nome || comp.id || "—"}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{fmtN(b.area)} m²</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: C.ink }}>
                      {fmtBRL(b.custo)}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px",
                background: "#1a191c", borderTop: `1px solid ${C.line2}` }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: 1 }}>
                  Total materiais
                </span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>
                  {fmtBRL(resultado.totalCusto)}
                </span>
              </div>
            </div>

            {/* Top insumos */}
            {resultado.lista?.length > 0 && (
              <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.line}`, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "10px 14px", background: C.surface2, borderBottom: `1px solid ${C.line}`,
                  fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted }}>
                  Principais insumos
                </div>
                {resultado.lista.slice(0, 8).map((it, i) => {
                  const badge = it.origem === "catalogo"
                    ? { l: "🟢 CAT", bg: "#22c57820", c: C.green }
                    : it.origem === "mercado"
                    ? { l: "🟡 MKT", bg: "#e0902020", c: C.amber }
                    : { l: "🔴 EST", bg: C.redSoft, c: C.red2 };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 14px", borderBottom: `1px solid ${C.line}`, fontSize: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: C.ink, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.nome}</div>
                        <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{fmtN(it.qtdTotal, 2)} {it.un}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 6, background: badge.bg, color: badge.c }}>
                          {badge.l}
                        </span>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: C.ink }}>
                          {fmtBRL(it.custoTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {resultado.lista.length > 8 && (
                  <div style={{ padding: "8px 14px", fontSize: 11, color: C.muted }}>
                    + {resultado.lista.length - 8} insumos no PDF completo
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "11px 0", borderRadius: 10,
                background: "none", border: `1px solid ${C.line2}`, color: C.ink2, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ← Editar medidas
              </button>
              <button onClick={gerarPDF} disabled={saving} style={{ flex: 2, padding: "11px 0", borderRadius: 10,
                background: saving ? C.steelSoft : C.blue, color: "#fff", border: "none",
                fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? .7 : 1 }}>
                {saving ? "Gerando..." : "⬇ Gerar StickQuote™ PDF"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
