/**
 * StickMap™ — Confirmação guiada de mapeamento IFC → composição
 *
 * Aparece na primeira importação (sem regras salvas).
 * O usuário confirma / edita o mapeamento automático e pode salvar
 * as regras para que próximas importações sejam aplicadas sem perguntas.
 */
import { useState } from "react";
import { confiancaUI } from "../../utils/ifcQuantitativo";
import { sb } from "../../services/supabase";

// IFC família → label legível
const FAMILIA_LABEL = {
  IFCWALL:             "Paredes (IfcWall)",
  IFCWALLSTANDARDCASE: "Paredes padrão (IfcWallStandardCase)",
  IFCSLAB:             "Lajes / Forros (IfcSlab)",
  IFCROOF:             "Cobertura (IfcRoof)",
  IFCROOFING:          "Cobertura (IfcRoofing)",
  IFCMEMBER:           "Membros estruturais (IfcMember)",
  IFCCOLUMN:           "Pilares (IfcColumn)",
  IFCBEAM:             "Vigas (IfcBeam)",
};

// Sugestão de composição padrão por família IFC
const FAMILIA_DEFAULT = {
  IFCWALL:             [{ composicaoId: "par-ext",      fracao: 0.60, label: "Parede externa (60%)" },
                        { composicaoId: "par-int-st",   fracao: 0.40, label: "Parede interna (40%)" }],
  IFCWALLSTANDARDCASE: [{ composicaoId: "par-ext",      fracao: 0.60, label: "Parede externa (60%)" },
                        { composicaoId: "par-int-st",   fracao: 0.40, label: "Parede interna (40%)" }],
  IFCSLAB:             [{ composicaoId: "forro-st",     fracao: 1.00, label: "Forro Steel Frame (100%)" }],
  IFCROOF:             [{ composicaoId: "estrutura-lsf",fracao: 1.00, label: "Estrutura LSF (100%)" }],
  IFCROOFING:          [{ composicaoId: "estrutura-lsf",fracao: 1.00, label: "Estrutura LSF (100%)" }],
  IFCMEMBER:           [{ composicaoId: "estrutura-lsf",fracao: 1.00, label: "Estrutura LSF (100%)" }],
  IFCCOLUMN:           [{ composicaoId: "estrutura-lsf",fracao: 1.00, label: "Estrutura LSF (100%)" }],
  IFCBEAM:             [{ composicaoId: "estrutura-lsf",fracao: 1.00, label: "Estrutura LSF (100%)" }],
};

/**
 * Busca regras salvas do Supabase para a empresa.
 * Retorna array de { ifc_familia, composicao_id, fracao, label } ou [] se não houver.
 */
export async function carregarStickMapRegras(empresaId) {
  if (!empresaId) return [];
  const { data } = await sb
    .from("stickmap_regras")
    .select("ifc_familia, composicao_id, fracao, label")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .order("criado_em");
  return data || [];
}

/**
 * Aplica regras StickMap™ salvas sobre o resultado de analisarIFCText().
 * Retorna linhas no mesmo formato de mapearComposicoes() para popular o MotorComposicao.
 */
export function aplicarStickMapRegras(analise, regras, composicoes) {
  const compMap = Object.fromEntries((composicoes || []).map((c) => [c.id, c]));
  const linhas = [];

  // Agrupar regras por família
  const porFamilia = {};
  for (const r of regras) {
    if (!porFamilia[r.ifc_familia]) porFamilia[r.ifc_familia] = [];
    porFamilia[r.ifc_familia].push(r);
  }

  function addLinha(familia, composicaoId, fracao, detectadoPor) {
    const comp = compMap[composicaoId];
    if (!comp) return;

    // Calcula área: usa count × heurística dependendo da família
    let areaBase = 0;
    if (familia === "IFCWALL" || familia === "IFCWALLSTANDARDCASE") {
      areaBase = analise.areaParede;
    } else if (familia === "IFCSLAB") {
      areaBase = analise.areaLaje;
    } else if (familia === "IFCROOF" || familia === "IFCROOFING") {
      areaBase = analise.areaCobertura || analise.areaLaje * 1.2;
    } else if (["IFCMEMBER", "IFCCOLUMN", "IFCBEAM"].includes(familia)) {
      areaBase = analise.areaConstruida;
    }

    const area = Math.round(areaBase * fracao);
    if (area <= 0) return;

    linhas.push({
      composicaoId: comp.id,
      composicaoNome: comp.nome,
      composicaoCor: comp.cor,
      area,
      detectadoPor,
    });
  }

  for (const [familia, regs] of Object.entries(porFamilia)) {
    for (const r of regs) {
      addLinha(familia, r.composicao_id, Number(r.fracao), r.label || `${FAMILIA_LABEL[familia] || familia}`);
    }
  }

  return linhas;
}

// ── Componente modal ──────────────────────────────────────────────────────────

export default function StickMapModal({ analise, composicoes, empresaId, onConfirm, onClose }) {
  // Famílias detectadas com count > 0
  const familiasDetectadas = buildFamiliasDetectadas(analise);

  // Estado: mapeamento editável por família
  const [mapa, setMapa] = useState(() => buildMapaInicial(familiasDetectadas, composicoes));
  const [salvarRegras, setSalvarRegras] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erroFracoes, setErroFracoes] = useState(null);

  function setRegra(familia, idx, patch) {
    setMapa((prev) => ({
      ...prev,
      [familia]: prev[familia].map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));
  }

  function addRegra(familia) {
    setMapa((prev) => ({
      ...prev,
      [familia]: [...(prev[familia] || []), { composicaoId: "", fracao: 1.0 }],
    }));
  }

  function removeRegra(familia, idx) {
    setMapa((prev) => ({
      ...prev,
      [familia]: prev[familia].filter((_, i) => i !== idx),
    }));
  }

  // Valida que a soma de frações por família não excede 1.0
  function validarFracoes() {
    for (const [familia, regras] of Object.entries(mapa)) {
      const soma = regras.reduce((s, r) => s + Number(r.fracao || 0), 0);
      if (soma > 1.001) {
        return `Soma de frações para "${FAMILIA_LABEL[familia] || familia}" é ${Math.round(soma * 100)}% — máximo permitido é 100%.`;
      }
    }
    return null;
  }

  // P0-1: Redistribui frações proporcionalmente para que somem exatamente 1.0
  function ajustarDistribuicao(familia) {
    setMapa((prev) => {
      const regras = prev[familia] || [];
      const soma   = regras.reduce((s, r) => s + Number(r.fracao || 0), 0);
      if (soma <= 0) return prev;
      const ajustadas = regras.map((r) => ({
        ...r,
        fracao: Math.round((Number(r.fracao) / soma) * 100) / 100,
      }));
      // Corrigir arredondamento: garantir que soma seja exatamente 1.0
      const somaAdj = ajustadas.reduce((s, r) => s + r.fracao, 0);
      const diff    = Math.round((1.0 - somaAdj) * 100) / 100;
      if (diff !== 0 && ajustadas.length > 0) {
        ajustadas[0] = { ...ajustadas[0], fracao: Math.round((ajustadas[0].fracao + diff) * 100) / 100 };
      }
      return { ...prev, [familia]: ajustadas };
    });
    setErroFracoes(null);
  }

  async function handleConfirmar() {
    const erroFracao = validarFracoes();
    if (erroFracao) {
      setErroFracoes(erroFracao);
      return;
    }
    setErroFracoes(null);
    setSaving(true);
    try {
      // Salvar regras no Supabase
      if (salvarRegras && empresaId) {
        // Desativar apenas regras das famílias que estão sendo remapeadas (não todas)
        const familias = Object.keys(mapa);
        if (familias.length > 0) {
          await sb.from("stickmap_regras")
            .update({ ativo: false })
            .eq("empresa_id", empresaId)
            .in("ifc_familia", familias);
        }

        // Inserir novas
        const novas = [];
        for (const [familia, regras] of Object.entries(mapa)) {
          for (const r of regras) {
            if (!r.composicaoId || !r.fracao) continue;
            novas.push({
              empresa_id:    empresaId,
              ifc_familia:   familia,
              composicao_id: r.composicaoId,
              fracao:        Number(r.fracao),
              label:         r.label || FAMILIA_LABEL[familia] || familia,
            });
          }
        }
        if (novas.length > 0) {
          await sb.from("stickmap_regras").insert(novas);
        }
      }

      // Construir linhas para StickQuoteBIMModal
      const compMap = Object.fromEntries((composicoes || []).map((c) => [c.id, c]));
      const linhas = [];
      for (const [familia, regras] of Object.entries(mapa)) {
        const areaBase = getAreaBase(analise, familia);
        for (const r of regras) {
          if (!r.composicaoId || !r.fracao) continue;
          const comp = compMap[r.composicaoId];
          if (!comp) continue;
          const area = Math.round(areaBase * Number(r.fracao));
          if (area <= 0) continue;
          linhas.push({
            composicaoId:  comp.id,
            composicaoNome: comp.nome,
            composicaoCor:  comp.cor,
            area,
            detectadoPor: `${FAMILIA_LABEL[familia] || familia} · StickMap™`,
          });
        }
      }

      onConfirm(linhas);
    } finally {
      setSaving(false);
    }
  }

  const totalFamilias = familiasDetectadas.length;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#16151a", border: "1px solid rgba(255,255,255,.09)", borderRadius: 18,
        width: "100%", maxWidth: 680, maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 28px 80px rgba(0,0,0,.75)",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              background: "linear-gradient(135deg,rgba(152,25,21,.2),rgba(59,110,165,.15))",
              border: "1px solid rgba(152,25,21,.35)", borderRadius: 9,
              padding: "5px 12px", display: "flex", alignItems: "center", gap: 7,
            }}>
              <span style={{ fontSize: 14 }}>🗺️</span>
              <span style={{
                fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14,
                fontWeight: 700, color: "#fff", letterSpacing: .3,
              }}>StickMap™</span>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                Mapeamento IFC → Composições
              </div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.35)" }}>
                {totalFamilias} famílias detectadas · confirme o De/Para antes de gerar o orçamento
              </div>
            </div>
            {analise?.confianca && (() => {
              const c = confiancaUI(analise.confianca);
              return (
                <div style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 6, padding: "3px 10px", fontSize: 11,
                  fontWeight: 700, color: c.cor, flexShrink: 0,
                }}>
                  Confiança {c.label}
                </div>
              );
            })()}
            <button onClick={onClose} style={{
              marginLeft: "auto", background: "none", border: "none",
              color: "rgba(255,255,255,.3)", fontSize: 20, cursor: "pointer", lineHeight: 1,
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {familiasDetectadas.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.3)", fontSize: 13 }}>
              Nenhuma família IFC reconhecida neste arquivo.
            </div>
          ) : (
            <>
              {/* Intro */}
              <div style={{
                background: "rgba(59,110,165,.08)", border: "1px solid rgba(59,110,165,.2)",
                borderRadius: 9, padding: "10px 14px", marginBottom: 18, fontSize: 12,
                color: "rgba(255,255,255,.5)", lineHeight: 1.6,
              }}>
                O StickMap™ detectou automaticamente as famílias abaixo e sugeriu o mapeamento mais compatível com steel frame.
                Confirme ou ajuste cada De→Para antes de gerar o orçamento — as regras são salvas para importações futuras.
              </div>

              {/* Tabela De/Para por família */}
              {familiasDetectadas.map(({ familia, count, areaBase }) => (
                <div key={familia} style={{
                  background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: 10, marginBottom: 12, overflow: "hidden",
                }}>
                  {/* Linha header da família */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,.05)",
                    background: "rgba(255,255,255,.03)",
                  }}>
                    <div style={{
                      background: "rgba(152,25,21,.2)", border: "1px solid rgba(152,25,21,.3)",
                      borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 700,
                      color: "#e07060", fontFamily: "monospace",
                    }}>
                      {familia}
                    </div>
                    <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.5)" }}>
                      {FAMILIA_LABEL[familia] || familia}
                    </span>
                    <span style={{ fontSize: 10.5, color: "rgba(255,255,255,.25)", marginLeft: "auto" }}>
                      {count} instâncias · ~{Math.round(areaBase)} m² estimado
                    </span>
                    {(() => {
                      const soma = (mapa[familia] || []).reduce((s, r) => s + Number(r.fracao || 0), 0);
                      const pct  = Math.round(soma * 100);
                      const excede = soma > 1.001;
                      const barCor = excede ? "#981915" : soma >= 0.99 ? "#059669" : "#b07a1e";
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {/* Barra de soma */}
                          <div style={{ width: 60, height: 5, borderRadius: 3, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: barCor, borderRadius: 3, transition: "width .2s" }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: barCor }}>
                            {pct}%
                          </span>
                          {excede && (
                            <button
                              onClick={() => ajustarDistribuicao(familia)}
                              style={{ fontSize: 9.5, color: "#fcd34d", background: "rgba(176,122,30,.2)",
                                border: "1px solid rgba(176,122,30,.3)", borderRadius: 4,
                                padding: "1px 6px", cursor: "pointer" }}>
                              Ajustar
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Regras desta família */}
                  <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                    {(mapa[familia] || []).map((regra, idx) => {
                      const comp = (composicoes || []).find((c) => c.id === regra.composicaoId);
                      return (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {regra._sugerido && regra.composicaoId && (
                            <div style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              fontSize: 10, color: "#fbbf24",
                              background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)",
                              borderRadius: 5, padding: "2px 8px", alignSelf: "flex-start",
                            }}>
                              ✨ Sugestão StickMap™ — confirme antes de prosseguir
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 3, height: 28, borderRadius: 2, flexShrink: 0,
                            background: comp?.cor || "rgba(255,255,255,.15)",
                          }} />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", flexShrink: 0, width: 20 }}>→</span>
                          <select
                            value={regra.composicaoId}
                            onChange={(e) => setRegra(familia, idx, { composicaoId: e.target.value, _sugerido: false })}
                            style={{ ...SEL, flex: 1, border: regra._sugerido && regra.composicaoId ? "1px solid rgba(251,191,36,.35)" : SEL.border }}
                          >
                            <option value="">— sem mapeamento —</option>
                            {(composicoes || []).map((c) => (
                              <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                          </select>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            <input
                              type="number" min="0.01" max="1" step="0.05"
                              value={regra.fracao}
                              onChange={(e) => setRegra(familia, idx, { fracao: e.target.value })}
                              style={{ ...SEL, width: 60, textAlign: "center" }}
                            />
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>×área</span>
                          </div>
                          <span style={{
                            fontSize: 10.5, color: "rgba(255,255,255,.25)",
                            minWidth: 48, textAlign: "right", flexShrink: 0,
                          }}>
                            ~{Math.round(areaBase * Number(regra.fracao || 0))} m²
                          </span>
                          <button onClick={() => removeRegra(familia, idx)} style={{
                            background: "none", border: "none", color: "rgba(255,255,255,.2)",
                            cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0,
                          }}>×</button>
                        </div>
                        </div>
                      );
                    })}
                    <button onClick={() => addRegra(familia)} style={{
                      background: "none", border: "1px dashed rgba(255,255,255,.1)",
                      borderRadius: 6, padding: "4px 10px", fontSize: 11,
                      color: "rgba(255,255,255,.25)", cursor: "pointer", alignSelf: "flex-start",
                    }}>
                      + regra
                    </button>
                  </div>
                </div>
              ))}

              {/* Salvar regras */}
              <label style={{
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                padding: "12px 14px", background: "rgba(255,255,255,.025)",
                border: "1px solid rgba(255,255,255,.07)", borderRadius: 9, marginBottom: 16,
              }}>
                <input
                  type="checkbox"
                  checked={salvarRegras}
                  onChange={(e) => setSalvarRegras(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: "#981915" }}
                />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,.7)" }}>
                    Salvar mapeamento para próximas importações
                  </div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.3)", marginTop: 2 }}>
                    O StickMap™ aplicará essas regras automaticamente em futuros arquivos IFC desta empresa.
                  </div>
                </div>
              </label>

              {/* Erro de validação de fração */}
              {erroFracoes && (
                <div style={{
                  background: "rgba(152,25,21,.15)", border: "1px solid rgba(152,25,21,.35)",
                  borderRadius: 8, padding: "9px 14px", marginBottom: 12,
                  fontSize: 12, color: "#fca5a5", lineHeight: 1.5,
                }}>
                  ⚠ {erroFracoes}
                </div>
              )}

              {/* Ações */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={{
                  background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)",
                  borderRadius: 8, padding: "8px 16px", fontSize: 12.5,
                  color: "rgba(255,255,255,.5)", cursor: "pointer", fontFamily: "inherit",
                }}>
                  Cancelar
                </button>
                <button onClick={handleConfirmar} disabled={saving} style={{
                  background: saving ? "rgba(152,25,21,.4)" : "linear-gradient(135deg,#981915,#b02820)",
                  border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13,
                  fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7,
                }}>
                  {saving ? "Salvando…" : "✓ Confirmar mapeamento"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildFamiliasDetectadas(analise) {
  if (!analise) return [];
  const entries = [
    { familia: "IFCWALL",             count: analise.wallCount, areaBase: analise.areaParede },
    { familia: "IFCSLAB",             count: analise.slabCount, areaBase: analise.areaLaje },
    { familia: "IFCROOF",             count: analise.roofCount, areaBase: analise.areaCobertura },
    { familia: "IFCMEMBER",           count: analise.mbrCount,  areaBase: analise.areaConstruida },
  ];
  return entries.filter((e) => e.count > 0);
}

// Palavras-chave por família IFC para busca fuzzy nas composições
const FAMILIA_KEYWORDS = {
  IFCWALL:             ["parede", "wall", "fechamento", "panel", "painel"],
  IFCWALLSTANDARDCASE: ["parede", "wall", "fechamento", "panel"],
  IFCSLAB:             ["laje", "slab", "piso", "forro", "losa"],
  IFCROOF:             ["cobertura", "telhado", "roof", "estrutura", "lsf"],
  IFCROOFING:          ["cobertura", "telhado", "roof"],
  IFCMEMBER:           ["estrutura", "perfil", "montante", "lsf", "steel", "membro"],
  IFCCOLUMN:           ["pilar", "coluna", "column", "estrutura"],
  IFCBEAM:             ["viga", "beam", "estrutura", "lsf"],
};

function sugerirComposicao(familia, composicoes) {
  if (!composicoes?.length) return null;
  const keywords = FAMILIA_KEYWORDS[familia] || [];
  let best = null, bestScore = 0;
  for (const comp of composicoes) {
    const nome = (comp.nome || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    let score = 0;
    for (const kw of keywords) {
      if (nome.includes(kw)) score++;
    }
    if (score > bestScore) { bestScore = score; best = comp; }
  }
  return bestScore > 0 ? { composicao: best, score: bestScore, maxScore: keywords.length } : null;
}

function buildMapaInicial(familiasDetectadas, composicoes) {
  const compIds = new Set((composicoes || []).map((c) => c.id));
  const mapa = {};
  for (const { familia } of familiasDetectadas) {
    // Primeiro tenta IDs hardcoded
    const defaults = (FAMILIA_DEFAULT[familia] || []).filter((r) => compIds.has(r.composicaoId));
    if (defaults.length > 0) {
      mapa[familia] = defaults.map((r) => ({ composicaoId: r.composicaoId, fracao: r.fracao }));
    } else {
      // Fallback: busca fuzzy por nome
      const sugestao = sugerirComposicao(familia, composicoes);
      mapa[familia] = [{ composicaoId: sugestao?.composicao?.id || "", fracao: 1.0, _sugerido: !!sugestao }];
    }
  }
  return mapa;
}

function getAreaBase(analise, familia) {
  if (!analise) return 0;
  if (familia === "IFCWALL" || familia === "IFCWALLSTANDARDCASE") return analise.areaParede || 0;
  if (familia === "IFCSLAB") return analise.areaLaje || 0;
  if (familia === "IFCROOF" || familia === "IFCROOFING") return analise.areaCobertura || analise.areaLaje * 1.2 || 0;
  return analise.areaConstruida || 0;
}

const SEL = {
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 6,
  padding: "5px 9px",
  fontFamily: "inherit",
  fontSize: 12,
  color: "#fff",
  outline: "none",
};
