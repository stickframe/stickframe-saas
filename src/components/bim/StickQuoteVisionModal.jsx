import { useState, useCallback, useEffect } from "react";
import { sb, getEmpresaId } from "../../services/supabase";
import { calcMotorComposicao } from "../../utils/composicoesSF";
import { gerarStickQuotePDF, salvarStickQuote } from "../../services/stickquoteService";
import { analisarVision } from "../../utils/visionMeasurementEngine";
import QuoteModalShell from "./QuoteModalShell";

const C = {
  bg: "#111013", surface: "#1b1a20", surface2: "#211f27", elev: "#2a2832",
  line: "rgba(255,255,255,.08)", line2: "rgba(255,255,255,.13)",
  ink: "#f5f2ec", ink2: "#b8b2aa", muted: "#7d776f",
  violet: "#8b5cf6", violet2: "#a78bfa", violetSoft: "rgba(139,92,246,.14)",
  green: "#22c578", greenSoft: "rgba(34,197,120,.14)",
  amber: "#e09020", red2: "#e0463c",
};

const fmtBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v, d = 1) => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

// mapeamento VISION → composicao_id (mesmo destino dos demais analisadores)
const VISION_PARA_SF = [
  { key: "paredesExternas", composicaoId: "par-ext",       label: "Parede externa (SF 90mm)",  cor: "#5b9bd5" },
  { key: "paredesInternas", composicaoId: "par-int-st",    label: "Parede interna (Drywall)",  cor: "#7b5ea7" },
  { key: "forro",           composicaoId: "forro-st",      label: "Forro (sistema ST)",        cor: "#c07832" },
  { key: "cobertura",       composicaoId: "estrutura-lsf", label: "Estrutura LSF (cobertura)", cor: "#2a9d8f" },
];

function Steps({ current }) {
  const steps = ["Upload", "Análise IA", "Revisão", "Orçamento"];
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? "1 1 auto" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 800,
              background: i < current ? C.green : i === current ? C.violet : C.surface2,
              color: i < current || i === current ? "#fff" : C.muted,
              border: i === current ? `2px solid ${C.violet2}` : "none",
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
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: cor }}>{score}</div>
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

function EditField({ label, value, onChange, unit = "m²" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontSize: 13, color: C.ink2, fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="number" value={value} min="0" step="0.5"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={{ width: 80, padding: "4px 8px", borderRadius: 7, border: `1px solid ${C.line2}`,
            background: C.surface2, color: C.ink, fontSize: 13, fontFamily: "inherit", textAlign: "right" }} />
        <span style={{ fontSize: 12, color: C.muted, width: 24 }}>{unit}</span>
      </div>
    </div>
  );
}

export default function StickQuoteVisionModal({ onClose, obraNome = "", clienteNome = "", empresaId: empId }) {
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
  const [nomeQuote, setNomeQuote] = useState(`StickQuote™ Vision – ${obraNome || "Projeto"}`);

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
    const ok = f && (f.type.startsWith("image/") || f.type === "application/pdf");
    if (!ok) { setErro("Envie uma planta em PNG, JPG ou PDF."); return; }
    setFile(f);
    setErro("");
    setProcessando(true);
    setStep(1);
    try {
      const res = await analisarVision(f, { empresaId: empId || getEmpresaId() });
      setAnalise(res);
      setMedidas({
        area: res.areaConstruida,
        paredesExternas: res.paredesExternas,
        paredesInternas: res.paredesInternas,
        forro: res.forro,
        cobertura: res.cobertura,
        alturaMedia: res.alturaMedia,
      });

      const compMap = {};
      composicoes.forEach((c) => { compMap[c.id] = c; });

      // mantém todas as linhas (mesmo com área 0) para o usuário revisar
      const novasLinhas = VISION_PARA_SF.map(({ key, composicaoId, label, cor }) => ({
        composicaoId,
        composicaoNome: compMap[composicaoId]?.nome || label,
        composicaoCor: compMap[composicaoId]?.cor || cor,
        area: res[key] || 0,
        origem: "VISION",
        confianca: res.confianca,
      }));

      setLinhas(novasLinhas);
      setStep(1);
    } catch (e) {
      setErro(e.message || "Erro ao analisar a planta.");
      setStep(0);
    } finally {
      setProcessando(false);
    }
  }, [composicoes, empId]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  function aplicarMedidas() {
    setLinhas((prev) => prev.map((l) => {
      const chave = VISION_PARA_SF.find((p) => p.composicaoId === l.composicaoId)?.key;
      return chave ? { ...l, area: medidas[chave] || 0 } : l;
    }));
    setStep(3);
    calcularOrcamento();
  }

  async function calcularOrcamento() {
    if (catalogo.length === 0) { setErro("Catálogo de insumos não carregado."); return; }
    const ativas = linhas.filter((l) => l.area > 0);
    const ids = ativas.map((l) => l.composicaoId);
    const { data: compsCompletas } = await sb
      .from("composicoes_sf")
      .select("*, composicao_itens(*)")
      .in("id", ids);

    const selecoes = ativas.map((l) => {
      const comp = (compsCompletas || []).find((c) => c.id === l.composicaoId);
      return {
        composicaoId: l.composicaoId,
        composicaoNome: comp?.nome || l.composicaoNome || l.composicaoId,
        composicaoCor: comp?.cor || l.composicaoCor || "#666",
        composicaoSistema: comp?.sistema || "",
        area: l.area,
        itens: (comp?.composicao_itens || []).map((it) => ({
          nome: it.nome, un: it.un,
          consumo: Number(it.consumo) || 0,
          perda: Number(it.perda) || 0,
          grupo: it.grupo,
          catBusca: it.cat_busca || undefined,
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
      const ambientesTxt = (analise?.ambientes || []).slice(0, 12)
        .map((a) => `${a.nome} ${a.area ? fmtN(a.area) + "m²" : ""}`.trim()).join(", ");

      const saved = await salvarStickQuote({
        nome: nomeQuote, obraNome, clienteNome,
        selecoes: resultado.selecoes, resultado,
        observacoes: `Origem: IA Vision — ${file?.name} | StickTrust™ ${analise?.confianca}% | Área: ${medidas?.area} m²`,
      });

      // Registro best-effort em projetos_vision com upload da planta
      const eid = empId || getEmpresaId();
      if (eid && file) {
        try {
          const buf = await file.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
          const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
          const storagePath = `projetos_vision/${eid}/${Date.now()}-${file.name}`;
          const { data: up } = await sb.storage.from("arquivos").upload(storagePath, file, {
            contentType: file.type, upsert: false,
          });
          const arquivoUrl = up?.path ? sb.storage.from("arquivos").getPublicUrl(up.path).data.publicUrl : null;
          await sb.from("projetos_vision").insert({
            empresa_id: eid,
            nome_arquivo: file.name,
            area_extraida: medidas?.area,
            confianca: analise?.confianca,
            dados_json: analise,
            arquivo_url: arquivoUrl,
            hash_documento: hashHex,
            modelo_ia: analise?.modeloIA,
          });
        } catch (_) { /* best-effort */ }
      }

      gerarStickQuotePDF({
        nome: nomeQuote, obraNome, clienteNome,
        selecoes: resultado.selecoes, resultado,
        observacoes: [
          `Origem: planta analisada por IA Vision (${analise?.modeloIA || "OpenAI"})`,
          `StickTrust™ ${analise?.confianca}% (${analise?.nivel}) — validação: usuário confirmou medidas`,
          `Área construída: ${medidas?.area} m² · Pé-direito: ${fmtN(medidas?.alturaMedia)} m`,
          ambientesTxt ? `Ambientes detectados: ${ambientesTxt}` : "",
          analise?.aberturas ? `Aberturas: ${analise.aberturas.portas} portas, ${analise.aberturas.janelas} janelas` : "",
        ].filter(Boolean).join("\n"),
        versaoId: saved?.id,
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

  const sumArea = linhas.reduce((a, l) => a + (l.area > 0 ? 1 : 0), 0);

  return (
    <QuoteModalShell tipo="AI Vision" accent="#6d557e" descricao="Planta visual → orçamento Steel Frame" arquivo={file?.name} onClose={onClose}>
        <Steps current={step} />

        {erro && (
          <div style={{ background: "rgba(224,70,60,.12)", border: `1px solid rgba(224,70,60,.3)`,
            borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#f0a09a" }}>{erro}</div>
        )}

        {/* STEP 0 — Upload */}
        {step === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            style={{ border: `2px dashed ${drag ? C.violet2 : C.line2}`, borderRadius: 16,
              padding: "44px 24px", textAlign: "center", background: drag ? C.violetSoft : C.surface,
              transition: "all .15s" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Envie sua planta</div>
            <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 18, lineHeight: 1.5 }}>
              PDF escaneado, PNG ou JPG.<br />A IA interpreta visualmente o desenho — ideal para plantas sem cotas em texto.
            </div>
            <label style={{ display: "inline-block", background: C.violet, color: "#fff", fontWeight: 700,
              fontSize: 13, padding: "10px 22px", borderRadius: 10, cursor: "pointer" }}>
              Selecionar arquivo
              <input type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" hidden
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
            </label>
            <div style={{ fontSize: 10.5, color: C.muted, marginTop: 16, lineHeight: 1.5 }}>
              🔒 Apenas o desenho técnico é enviado à IA para leitura de medidas.<br />Nenhum dado pessoal é rastreado.
            </div>
          </div>
        )}

        {/* STEP 1 — Processando */}
        {step === 1 && processando && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${C.line2}`, borderTopColor: C.violet2,
              borderRadius: "50%", margin: "0 auto 18px", animation: "sf-spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Interpretando a planta com IA…</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Reconhecendo ambientes, paredes, cotas e aberturas.</div>
            <style>{`@keyframes sf-spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* STEP 1 — Análise IA */}
        {step === 1 && !processando && analise && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <TrustRing score={analise.confianca} nivel={analise.nivel} />
              <div style={{ textAlign: "right", fontSize: 11, color: C.muted }}>
                <div>{analise.origemDetalhe}</div>
                <div style={{ marginTop: 2 }}>Modelo: {analise.modeloIA}</div>
              </div>
            </div>

            {/* O que a IA identificou */}
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.violet2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                A IA identificou
              </div>
              {[
                ["Ambientes", `${(analise.ambientes || []).length} encontrados`, (analise.ambientes || []).length > 0],
                ["Área construída", `${fmtN(analise.areaConstruida)} m²`, analise.areaConstruida > 0],
                ["Paredes externas", `${fmtN(analise.paredesExternas)} m²`, analise.paredesExternas > 0],
                ["Cotas legíveis", `${analise.cotaCount} detectadas`, analise.cotaCount > 0],
                ["Aberturas", `${analise.aberturas.portas} portas · ${analise.aberturas.janelas} janelas`, (analise.aberturas.portas + analise.aberturas.janelas) > 0],
              ].map(([k, v, ok], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5 }}>
                  <span style={{ color: C.ink2 }}>{ok ? "✔" : "○"} {k}</span>
                  <span style={{ color: ok ? C.ink : C.muted, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              {(analise.ambientes || []).length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.line}`, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analise.ambientes.slice(0, 14).map((a, i) => (
                    <span key={i} style={{ fontSize: 10.5, background: C.violetSoft, color: C.violet2,
                      borderRadius: 20, padding: "2px 9px", fontWeight: 600 }}>
                      {a.nome}{a.area ? ` · ${fmtN(a.area)}m²` : ""}
                    </span>
                  ))}
                </div>
              )}
              {analise.observacoes && (
                <div style={{ marginTop: 8, fontSize: 11, color: C.muted, fontStyle: "italic" }}>{analise.observacoes}</div>
              )}
            </div>

            {analise.nivel === "baixo" && (
              <div style={{ background: "rgba(224,144,32,.1)", border: "1px solid rgba(224,144,32,.3)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#e0b070", lineHeight: 1.5 }}>
                ⚠️ Confiança baixa — a planta tem pouca informação legível. Revise e ajuste as medidas no próximo passo.
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(0)} style={btnGhost}>Voltar</button>
              <button onClick={() => setStep(2)} style={{ ...btnPrimary, flex: 1 }}>Revisar medidas →</button>
            </div>
          </div>
        )}

        {/* STEP 2 — Revisão */}
        {step === 2 && medidas && (
          <div>
            <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 12, lineHeight: 1.5 }}>
              Confira e ajuste as medidas estimadas pela IA antes de gerar o orçamento.
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              <EditField label="Área construída" value={medidas.area} onChange={(v) => setMedidas({ ...medidas, area: v, forro: v })} />
              <EditField label="Paredes externas" value={medidas.paredesExternas} onChange={(v) => setMedidas({ ...medidas, paredesExternas: v })} />
              <EditField label="Paredes internas" value={medidas.paredesInternas} onChange={(v) => setMedidas({ ...medidas, paredesInternas: v })} />
              <EditField label="Forro" value={medidas.forro} onChange={(v) => setMedidas({ ...medidas, forro: v })} />
              <EditField label="Cobertura" value={medidas.cobertura} onChange={(v) => setMedidas({ ...medidas, cobertura: v })} />
              <EditField label="Pé-direito" value={medidas.alturaMedia} onChange={(v) => setMedidas({ ...medidas, alturaMedia: v })} unit="m" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={btnGhost}>Voltar</button>
              <button onClick={aplicarMedidas} disabled={medidas.area <= 0}
                style={{ ...btnPrimary, flex: 1, opacity: medidas.area <= 0 ? 0.5 : 1, cursor: medidas.area <= 0 ? "not-allowed" : "pointer" }}>
                {medidas.area <= 0 ? "Informe a área construída ↑" : "Calcular orçamento →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP — Orçamento */}
        {step === 3 && resultado && (
          <div>
            <input value={nomeQuote} onChange={(e) => setNomeQuote(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 9, border: `1px solid ${C.line2}`,
                background: C.surface2, color: C.ink, fontSize: 13, fontWeight: 600, fontFamily: "inherit", marginBottom: 14 }} />

            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Total estimado</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, fontWeight: 800, color: C.green }}>
                {fmtBRL(resultado.total)}
              </div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>
                {resultado.breakdown?.length || 0} sistemas · {fmtN(medidas?.area)} m² · StickTrust™ {analise?.confianca}%
              </div>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              {(resultado.breakdown || []).map((b, i) => {
                const comp = b.composicao && typeof b.composicao === "object" ? b.composicao : { nome: b.composicao, cor: b.cor };
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", borderBottom: i < resultado.breakdown.length - 1 ? `1px solid ${C.line}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: comp.cor || "#666" }} />
                      <span style={{ fontSize: 12.5, color: C.ink }}>{comp.nome}</span>
                    </div>
                    <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 700 }}>{fmtBRL(b.total)}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setResultado(null); setStep(2); }} style={btnGhost}>Revisar</button>
              <button onClick={gerarPDF} disabled={saving}
                style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Gerando…" : "Gerar StickQuote™ PDF"}
              </button>
            </div>
          </div>
        )}
    </QuoteModalShell>
  );
}

const btnPrimary = {
  background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 10,
  padding: "11px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};
const btnGhost = {
  background: "transparent", color: "#b8b2aa", border: "1px solid rgba(255,255,255,.13)",
  borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
