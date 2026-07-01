/**
 * StickQuoteBIMModal — IFC → StickQuote™ quantification modal
 * Shows detected systems from IFC analysis, lets user edit areas, then generates StickQuote™.
 */
import { useState, useEffect } from "react";
import { analisarIFCText, mapearComposicoes } from "../../utils/ifcQuantitativo";
import { calcMotorComposicao } from "../../utils/composicoesSF";
import { gerarStickQuotePDF, salvarStickQuote } from "../../services/stickquoteService";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CORES_SISTEMA = {
  "par-ext":      "#3b6ea5",
  "par-int-st":   "#5a8a6a",
  "par-molhada":  "#7a6aa5",
  "forro-st":     "#c0892d",
  "isolamento":   "#888",
  "estrutura-lsf":"#981915",
};

export default function StickQuoteBIMModal({ ifcFile, obraId, obraNome, onClose, onGerado }) {
  const [loading, setLoading]       = useState(true);
  const [analise, setAnalise]       = useState(null);
  const [linhas, setLinhas]         = useState([]);
  const [composicoes, setComposicoes] = useState([]);
  const [nomeQuote, setNomeQuote]   = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [obs, setObs]               = useState("");
  const [saving, setSaving]         = useState(false);
  const [erro, setErro]             = useState(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // Load composicoes from Supabase
        const { data: comps } = await sb
          .from("composicoes_sf")
          .select("id, nome, sistema, unidade, cor, tipo")
          .order("ordem");
        const disponiveis = comps || [];
        setComposicoes(disponiveis);

        // Parse IFC text
        const text = await ifcFile.text();
        const result = analisarIFCText(text);
        setAnalise(result);

        // Map to composicao suggestions
        const sugestoes = mapearComposicoes(result, disponiveis);

        // If nothing detected, show empty row for manual entry
        if (sugestoes.length === 0) {
          setLinhas([{ composicaoId: "", area: 0, detectadoPor: "manual" }]);
        } else {
          setLinhas(sugestoes.map((s) => ({ ...s, area: s.areaEstimada })));
        }
      } catch (e) {
        console.error("StickQuoteBIM init error", e);
        setErro("Erro ao analisar o arquivo IFC.");
      } finally {
        setLoading(false);
      }
    }
    if (ifcFile) init();
  }, [ifcFile]);

  function setLinha(idx, patch) {
    setLinhas((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLinha() {
    setLinhas((prev) => [...prev, { composicaoId: "", area: 0, detectadoPor: "manual" }]);
  }

  function removeLinha(idx) {
    setLinhas((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleGerar() {
    const linhasValidas = linhas.filter((l) => l.composicaoId && l.area > 0);
    if (linhasValidas.length === 0) {
      setErro("Adicione ao menos um sistema com área válida.");
      return;
    }
    setSaving(true);
    setErro(null);
    try {
      // Load full composicoes with itens for calc
      const { data: compsCompletas } = await sb
        .from("composicoes_sf")
        .select("*, composicao_itens(*)")
        .in("id", [...new Set(linhasValidas.map((l) => l.composicaoId))]);

      // Build selecoes format for calcMotorComposicao
      const selecoes = linhasValidas.map((l) => {
        const comp = (compsCompletas || []).find((c) => c.id === l.composicaoId);
        return {
          composicaoId: l.composicaoId,
          composicaoNome: comp?.nome || l.composicaoNome || l.composicaoId,
          composicaoCor: comp?.cor || l.composicaoCor || "#666",
          composicaoSistema: comp?.sistema || "",
          area: l.area,
          itens: (comp?.composicao_itens || []).map((it) => ({
            nome: it.nome,
            un: it.unidade,
            consumo: it.consumo_por_m2,
            perda: it.perda_pct || 0,
            grupo: it.grupo,
          })),
        };
      });

      const resultado = calcMotorComposicao(selecoes, [], {});

      const versaoId = await salvarStickQuote({
        nome: nomeQuote || `StickQuote™ BIM – ${obraNome || "obra"}`,
        obraNome: obraNome || "",
        clienteNome,
        selecoes,
        resultado,
        observacoes: obs,
      });

      gerarStickQuotePDF({
        nome: nomeQuote || `StickQuote™ BIM – ${obraNome || "obra"}`,
        obraNome: obraNome || "",
        clienteNome,
        selecoes,
        resultado,
        observacoes: obs,
        versaoId,
        versaoNum: 1,
        origemIFC: ifcFile?.name,
      });

      onGerado?.();
      onClose();
    } catch (e) {
      console.error("StickQuoteBIM gerar error", e);
      setErro("Erro ao gerar StickQuote™. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const totalArea = linhas.reduce((s, l) => s + (Number(l.area) || 0), 0);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#16151a", border: "1px solid rgba(255,255,255,.09)", borderRadius: 16,
        width: "100%", maxWidth: 660, maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,.7)",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              background: "rgba(152,25,21,.15)", border: "1px solid rgba(152,25,21,.3)",
              borderRadius: 8, padding: "5px 10px", fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: .3,
            }}>
              StickQuote™ <span style={{ color: "#981915" }}>BIM</span>
            </div>
            {ifcFile && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                {ifcFile.name}
              </span>
            )}
            <button onClick={onClose} style={{
              marginLeft: "auto", background: "none", border: "none",
              color: "rgba(255,255,255,.3)", fontSize: 18, cursor: "pointer", lineHeight: 1,
            }}>×</button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,.35)" }}>
            Revisão e edição dos sistemas detectados automaticamente pelo modelo BIM IFC.
          </p>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.3)", fontSize: 13 }}>
              Analisando modelo IFC…
            </div>
          )}

          {!loading && analise && (
            <>
              {/* Detection summary */}
              <div style={{
                background: "rgba(63,122,75,.08)", border: "1px solid rgba(63,122,75,.2)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                display: "flex", gap: 20, flexWrap: "wrap",
              }}>
                <DetStat label="Paredes" value={analise.wallCount} />
                <DetStat label="Lajes" value={analise.slabCount} />
                <DetStat label="Cobertura" value={analise.roofCount} />
                <DetStat label="Membros" value={analise.mbrCount} />
                {analise.totalAreaMedida > 0 && (
                  <DetStat label="Área IFC" value={`${analise.totalAreaMedida} m²`} />
                )}
                {!analise.temDados && (
                  <span style={{ fontSize: 11, color: "#c0892d", alignSelf: "center" }}>
                    ⚠ Nenhum elemento reconhecido — insira áreas manualmente.
                  </span>
                )}
              </div>

              {/* Identification */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,.4)", display: "block", marginBottom: 4 }}>
                    Nome do orçamento
                  </label>
                  <input
                    value={nomeQuote}
                    onChange={(e) => setNomeQuote(e.target.value)}
                    placeholder={`StickQuote™ BIM – ${obraNome || "obra"}`}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,.4)", display: "block", marginBottom: 4 }}>
                    Cliente
                  </label>
                  <input
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Nome do cliente"
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Systems table */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>
                  SISTEMAS DETECTADOS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {linhas.map((linha, idx) => {
                    const comp = composicoes.find((c) => c.id === linha.composicaoId);
                    const cor = comp?.cor || CORES_SISTEMA[linha.composicaoId] || "#555";
                    return (
                      <div key={idx} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
                        borderRadius: 8, padding: "8px 10px",
                      }}>
                        <div style={{ width: 4, height: 32, borderRadius: 2, background: cor, flexShrink: 0 }} />
                        <select
                          value={linha.composicaoId}
                          onChange={(e) => setLinha(idx, { composicaoId: e.target.value })}
                          style={{ ...INPUT_STYLE, flex: 1, fontSize: 12 }}
                        >
                          <option value="">— selecionar sistema —</option>
                          {composicoes.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={linha.area}
                            onChange={(e) => setLinha(idx, { area: Number(e.target.value) })}
                            style={{ ...INPUT_STYLE, width: 80, textAlign: "right" }}
                          />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>m²</span>
                        </div>
                        {linha.detectadoPor && (
                          <span style={{
                            fontSize: 10, color: "rgba(255,255,255,.25)", flexShrink: 0,
                            whiteSpace: "nowrap", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis",
                          }} title={linha.detectadoPor}>
                            {linha.detectadoPor}
                          </span>
                        )}
                        <button onClick={() => removeLinha(idx)} style={{
                          background: "none", border: "none", color: "rgba(255,255,255,.2)",
                          cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0,
                        }}>×</button>
                      </div>
                    );
                  })}
                </div>
                <button onClick={addLinha} style={{
                  marginTop: 8, background: "none", border: "1px dashed rgba(255,255,255,.12)",
                  borderRadius: 7, padding: "6px 14px", fontSize: 11.5,
                  color: "rgba(255,255,255,.35)", cursor: "pointer", width: "100%",
                }}>
                  + Adicionar sistema
                </button>
              </div>

              {/* Observations */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,.4)", display: "block", marginBottom: 4 }}>
                  Observações
                </label>
                <textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Premissas, notas técnicas, condições especiais…"
                  rows={2}
                  style={{ ...INPUT_STYLE, resize: "vertical", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              {/* Summary bar */}
              {totalArea > 0 && (
                <div style={{
                  background: "rgba(152,25,21,.08)", border: "1px solid rgba(152,25,21,.2)",
                  borderRadius: 8, padding: "8px 14px", marginBottom: 14,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>
                    {linhas.filter((l) => l.composicaoId && l.area > 0).length} sistemas · {Math.round(totalArea)} m² total
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>
                    Premissas calculadas automaticamente pelo modelo BIM IFC
                  </span>
                </div>
              )}

              {erro && (
                <div style={{
                  background: "rgba(160,50,40,.15)", border: "1px solid rgba(160,50,40,.3)",
                  borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#e07060", marginBottom: 12,
                }}>
                  {erro}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={{
                  background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)",
                  borderRadius: 8, padding: "8px 16px", fontSize: 12.5,
                  color: "rgba(255,255,255,.5)", cursor: "pointer",
                }}>
                  Cancelar
                </button>
                <button onClick={handleGerar} disabled={saving} style={{
                  background: saving ? "rgba(152,25,21,.4)" : "#981915",
                  border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13,
                  fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 7,
                }}>
                  {saving ? "Gerando…" : "📄 Gerar StickQuote™"}
                </button>
              </div>
            </>
          )}

          {!loading && erro && !analise && (
            <div style={{ textAlign: "center", padding: 32, color: "#e07060", fontSize: 13 }}>
              {erro}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetStat({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: .5 }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: value === 0 ? "rgba(255,255,255,.2)" : "#fff" }}>
        {value}
      </span>
    </div>
  );
}

const INPUT_STYLE = {
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 6,
  padding: "6px 10px",
  fontFamily: "inherit",
  fontSize: 12.5,
  color: "#fff",
  outline: "none",
};
