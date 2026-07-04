/**
 * StickFEM™ — Análise estrutural inteligente a partir de CAD/DXF (Slice 1).
 * Fluxo: DXF → parser → elementos estruturais → perfis → quantitativo →
 *        modelo analítico (FEM-ready) → aprovação técnica.
 * O cálculo FEM (Fase 6) é plugável via SolverAdapter; aqui o modelo é montado
 * e persistido, com o solver "null" (cálculo pendente).
 *
 * Este arquivo é a página fina: estado/regras de negócio vivem em
 * useProjetoEstrutural; apresentação vive em src/components/StickFEM/.
 */
import { useEffect, useState } from "react";
import { listarPerfis, listarProjetos, criarProjeto, carregarProjeto } from "../services/stickfem/repository";
import { gerarPdfEstrutural } from "../services/stickfem/orcamentoBridge";
import { useProjetoEstrutural } from "../components/StickFEM/hooks/useProjetoEstrutural";
import ViewerCAD from "../components/StickFEM/components/ViewerCAD";
import LayerSelector from "../components/StickFEM/components/LayerSelector";
import ElementTable from "../components/StickFEM/components/ElementTable";
import ConflictPanel from "../components/StickFEM/components/ConflictPanel";
import ReviewAssistant from "../components/StickFEM/components/ReviewAssistant";
import StickScore from "../components/StickFEM/components/StickScore";
import ApprovalPanel from "../components/StickFEM/components/ApprovalPanel";
import AuditPanel from "../components/StickFEM/components/AuditPanel";
import HistoryPanel from "../components/StickFEM/components/HistoryPanel";
import EngineeringPlayground from "../components/StickFEM/components/EngineeringPlayground";
import { StatusBadge, StatusEstrutural, CampoNum, SelPerfil } from "../components/StickFEM/utils/atoms";
import { CARD, BTN_PRIMARY, BTN_GHOST, INPUT, ERRO, TH, TD } from "../components/StickFEM/utils/styles";

export default function StickFEM() {
  const [projetos, setProjetos] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [proj, setProj] = useState(null);        // projeto aberto
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState("projetos");    // "projetos" | "playground"

  useEffect(() => {
    (async () => {
      try {
        const [pjs, pfs] = await Promise.all([listarProjetos(), listarPerfis()]);
        setProjetos(pjs); setPerfis(pfs);
      } catch (e) { setErro(e.message || "Erro ao carregar."); }
      finally { setLoading(false); }
    })();
  }, []);

  async function novo() {
    const nome = prompt("Nome do projeto estrutural:");
    if (!nome) return;
    try {
      const p = await criarProjeto({ nome });
      setProjetos((s) => [p, ...s]);
      setProj({ projeto: p, arquivos: [], elementos: [], aprovacoes: [] });
    } catch (e) { setErro(e.message); }
  }

  async function abrir(id) {
    setLoading(true);
    try { setProj(await carregarProjeto(id)); }
    catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, fontWeight: 800, color: "var(--text, #26231f)", margin: 0 }}>
          StickFEM™
        </h1>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Análise estrutural via CAD/DXF</span>
      </div>
      <Disclaimer />

      {/* Abas: Projetos (fluxo CAD→análise) vs Engineering Playground (bancada) */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, borderBottom: "1px solid var(--line)" }}>
        {[["projetos", "Projetos"], ["playground", "🧪 Engineering Playground"]].map(([k, label]) => (
          <button key={k} onClick={() => setAba(k)} style={{
            background: "none", border: "none", borderBottom: `2px solid ${aba === k ? "var(--red, #981915)" : "transparent"}`,
            color: aba === k ? "var(--text, #26231f)" : "var(--muted)", fontFamily: "inherit", fontSize: 13,
            fontWeight: aba === k ? 700 : 600, cursor: "pointer", padding: "8px 12px",
          }}>{label}</button>
        ))}
      </div>

      {erro && <div style={ERRO}>{erro}</div>}

      {aba === "playground" ? (
        <EngineeringPlayground perfis={perfis} />
      ) : !proj ? (
        <ListaProjetos projetos={projetos} loading={loading} onNovo={novo} onAbrir={abrir} />
      ) : (
        <ProjetoDetalhe
          data={proj} perfis={perfis}
          onVoltar={() => setProj(null)}
          onReload={() => abrir(proj.projeto.id)}
        />
      )}
    </div>
  );
}

// ── Disclaimer técnico (Fase 10) ─────────────────────────────────────────────
function Disclaimer() {
  return (
    <div style={{
      background: "rgba(176,122,30,.10)", border: "1px solid rgba(176,122,30,.30)",
      borderRadius: 10, padding: "10px 14px", margin: "12px 0 20px", fontSize: 12.5, color: "#8a6a1e", lineHeight: 1.5,
    }}>
      ⚠ <strong>Análise computacional assistida.</strong> Os resultados do StickFEM™ têm caráter
      preliminar. A validação final e a responsabilidade técnica devem ser realizadas por
      <strong> engenheiro habilitado (com ART/RRT)</strong>.
    </div>
  );
}

// ── Lista de projetos ────────────────────────────────────────────────────────
function ListaProjetos({ projetos, loading, onNovo, onAbrir }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted, #57514a)" }}>Projetos estruturais</div>
        <button onClick={onNovo} style={BTN_PRIMARY}>+ Novo projeto</button>
      </div>
      {loading ? <p style={{ color: "var(--muted)" }}>Carregando…</p> : (
        projetos.length === 0 ? (
          <div style={CARD}><p style={{ color: "var(--muted)", margin: 0 }}>Nenhum projeto ainda. Crie um e importe um DXF.</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {projetos.map((p) => (
              <button key={p.id} onClick={() => onAbrir(p.id)} style={{ ...CARD, textAlign: "left", cursor: "pointer" }}>
                <div style={{ fontWeight: 700, color: "var(--text, #26231f)" }}>{p.nome}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                  <StatusBadge status={p.status} /> · pé-direito {p.pe_direito_m} m
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ── Detalhe do projeto: import + parse + elementos + quantitativo ────────────
function ProjetoDetalhe({ data, perfis, onVoltar, onReload }) {
  const s = useProjetoEstrutural({ data, perfis, onReload });

  return (
    <div>
      <button onClick={onVoltar} style={BTN_GHOST}>← Projetos</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 6px", flexWrap: "wrap" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 800, color: "var(--text, #26231f)", margin: 0 }}>{s.projeto.nome}</h2>
        <StatusBadge status={s.projeto.status} />
        {s.geometria && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <StickScore score={s.stickScoreResult.score} details={s.stickScoreResult.details} onDetailsClick={s.handleScoreClick} />
            <ConflictPanel conflitos={s.conflitos} />
          </div>
        )}
      </div>

      {/* Importar */}
      <div style={CARD}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 8 }}>1 · Importar CAD (DXF)</div>
        <input type="file" accept=".dxf" onChange={s.onDxf} disabled={s.busy} />
        {s.msg && <span style={{ marginLeft: 10, fontSize: 12, color: "var(--muted)" }}>{s.msg}</span>}
        {s.geometria && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            <span>Layers: <b>{s.geometria.stats.layers}</b></span>
            <span>Linhas: <b>{s.geometria.stats.linhas}</b></span>
            <span>Polilinhas: <b>{s.geometria.stats.polilinhas}</b></span>
            <span>Textos: <b>{s.geometria.stats.textos}</b></span>
            <span>Área: <b>{s.geometria.stats.largura_m}×{s.geometria.stats.altura_m} m</b></span>
          </div>
        )}
      </div>

      {s.geometria && (
        <>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <ViewerCAD geometria={s.geometria} elementos={s.elementos} perfis={perfis} />
            </div>
            <div style={{ width: '280px' }}>
              <ReviewAssistant elementos={s.elementos} conflitos={s.conflitos}
                onAceitarSugestao={s.aceitarSugestaoRevisao} onCorrigir={s.corrigirManual} />
            </div>
          </div>

          <LayerSelector layers={s.layers} layerCfg={s.layerCfg} onLayerCfgChange={s.onLayerCfgChange} onReprocessar={s.reprocessar} />

          <ElementTable elementos={s.elementos} perfis={perfis} resumo={s.resumo}
            perfMont={s.perfMont} perfGuia={s.perfGuia} onSetEl={s.setEl} onValidarTodas={s.validarTodas}
            foco={s.focoElemento} onFocoConsumido={() => s.setFocoElemento(null)} />

          {/* Perfis + Quantitativo */}
          <div style={CARD}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 8 }}>
              4 · Perfis &amp; quantitativo
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              <SelPerfil label="Montante" perfis={perfis.filter((p) => p.tipo === "montante")} value={s.perfMont} onChange={s.setPerfMont} />
              <SelPerfil label="Guia" perfis={perfis.filter((p) => p.tipo === "guia")} value={s.perfGuia} onChange={s.setPerfGuia} />
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
              {s.quant.itens.map((it) => (
                <div key={it.tipo} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontWeight: 700, color: "var(--text, #26231f)" }}>{it.perfil}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                    {it.tipo === "montante" ? `${it.quantidade} pç · ` : ""}{it.comprimento_total_m} m · {it.peso_kg} kg
                  </div>
                </div>
              ))}
              <div style={{ background: "rgba(63,122,75,.08)", border: "1px solid rgba(63,122,75,.25)", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontWeight: 800, color: "#3f7a4b" }}>Peso total: {s.quant.resumo.pesoTotal_kg} kg</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                  {s.quant.resumo.montantes} montantes · espaç. {s.quant.resumo.espacMontanteMm} mm · perda {(s.quant.resumo.perda * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={s.salvarTudo} disabled={s.busy} style={BTN_PRIMARY}>
              {s.busy ? "Salvando…" : "Salvar projeto + montar modelo analítico"}
            </button>
          </div>

          {/* 5 · Cargas + pré-dimensionamento (Fase 5) */}
          <div style={{ ...CARD, marginTop: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 8 }}>
              5 · Cargas &amp; pré-dimensionamento <span style={{ fontWeight: 400, color: "var(--muted)" }}>(preliminar — não substitui NBR 14762/6123)</span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
              <CampoNum label="Permanente G (kN/m²)" value={s.carga.gPerm} onChange={(v) => s.setC("gPerm", v)} />
              <CampoNum label="Sobrecarga Q (kN/m²)" value={s.carga.qSobre} onChange={(v) => s.setC("qSobre", v)} />
              <CampoNum label="Larg. tributária laje (m)" value={s.carga.largTrib} onChange={(v) => s.setC("largTrib", v)} />
              <CampoNum label="Vento V0 (m/s)" value={s.carga.v0} onChange={(v) => s.setC("v0", v)} />
              <button onClick={s.rodarPreDim} style={BTN_PRIMARY}>Calcular pré-dimensionamento</button>
            </div>

            {s.predim && (
              <>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                  <StatusEstrutural status={s.predim.resumo.statusGlobal} />
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    Utilização máx <b>{s.predim.resumo.ratioMax}</b> · N_Rd {s.predim.resumo.nRd_kN} kN · N_Sd {s.predim.resumo.nSd_kN} kN ·
                    modo {s.predim.resumo.modoGovernante} · esbeltez λ={s.predim.resumo.esbeltez}{s.predim.resumo.esbeltezOk ? "" : " ⚠>200"}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Vento q={s.predim.vento.q_kN_m2} kN/m² (Vk {s.predim.vento.vk} m/s)</span>
                  <button onClick={s.abrirAuditoria} style={{ ...BTN_GHOST, marginLeft: "auto" }}>🔍 Auditar cálculo</button>
                  <button onClick={s.salvarPreDim} disabled={s.savingPd} style={BTN_GHOST}>
                    {s.savingPd ? "Salvando…" : "Salvar análise"}
                  </button>
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr style={{ background: "var(--surface-2)" }}>
                      {["Parede", "Comp. (m)", "Montantes", "N_Sd (kN)", "N_Rd (kN)", "Utilização", "Status"].map((h) => <th key={h} style={TH}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {s.predim.porParede.slice(0, 200).map((p, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                          <td style={TD}>{p.nome}</td><td style={TD}>{p.comprimento_m}</td><td style={TD}>{p.montantes}</td>
                          <td style={TD}>{p.nSd_kN}</td><td style={TD}>{p.nRd_kN}</td>
                          <td style={{ ...TD, fontWeight: 700 }}>{p.ratio}</td>
                          <td style={TD}><StatusEstrutural status={p.status} mini /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* 6 · Orçamento estrutural (Fase 8) */}
          <div style={{ ...CARD, marginTop: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 8 }}>
              6 · Gerar orçamento estrutural <span style={{ fontWeight: 400, color: "var(--muted)" }}>→ StickQuote (origem StickFEM™)</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, color: "var(--text-muted, #57514a)" }}>
                Preço do aço (R$/kg):{" "}
                <input type="number" min="0" step="0.5" value={s.precoKg} onChange={(e) => s.setPrecoKg(e.target.value)}
                  style={{ ...INPUT, width: 90 }} />
              </label>
              <label style={{ fontSize: 12, color: "var(--text-muted, #57514a)" }}>
                Área construída (m²):{" "}
                <input type="number" min="0" step="1" value={s.areaM2} onChange={(e) => s.setAreaM2(e.target.value)}
                  placeholder="p/ benchmark" style={{ ...INPUT, width: 110 }} />
              </label>
              <label style={{ fontSize: 12, color: "var(--text-muted, #57514a)" }}>
                Tipologia:{" "}
                <select value={s.tipologia} onChange={(e) => s.setTipologia(e.target.value)}
                  style={{ ...INPUT, padding: "7px 8px" }}>
                  <option>Residencial Térreo</option>
                  <option>Residencial Alto Padrão</option>
                  <option>Comercial / Loja</option>
                </select>
              </label>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                Peso total {s.quant.resumo.pesoTotal_kg} kg · estimado {(s.quant.resumo.pesoTotal_kg * (Number(s.precoKg) || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              <button onClick={s.gerarOrc} disabled={s.gerando} style={{ ...BTN_PRIMARY, marginLeft: "auto" }}>
                {s.gerando ? "Gerando…" : "Gerar orçamento estrutural"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Histórico de orçamentos gerados */}
      {s.orcs.length > 0 && (
        <div style={{ ...CARD, marginTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)", marginBottom: 8 }}>
            Orçamentos gerados a partir deste projeto
          </div>
          {s.orcs.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid var(--line)", fontSize: 12.5 }}>
              <span style={{ background: "rgba(152,25,21,.1)", color: "var(--red, #981915)", fontWeight: 700, fontSize: 10.5, borderRadius: 5, padding: "2px 7px" }}>StickFEM™</span>
              <span style={{ color: "var(--text, #26231f)", fontWeight: 600 }}>#{o.numero} · {o.nome}</span>
              <span style={{ color: "var(--muted)" }}>{(o.resultado?.totalCusto || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              <button onClick={() => gerarPdfEstrutural({ nome: o.nome, itens: o.resultado?.itens || [], totalCusto: o.resultado?.totalCusto || 0, premissas: o.resultado?.premissas || {} })}
                style={{ ...BTN_GHOST, marginLeft: "auto", padding: "5px 12px" }}>PDF</button>
            </div>
          ))}
        </div>
      )}

      {s.erro && <div style={ERRO}>{s.erro}</div>}

      {/* Histórico de revisões */}
      {s.geometria && (
        <HistoryPanel revisoes={s.revisoes} salvando={s.salvandoRev}
          onSalvar={s.salvarRevisaoAtual} onRestaurar={s.restaurarRevisao} onMemorial={s.memorialDaRevisao} />
      )}

      {/* Aprovação técnica (Fase 10) */}
      <ApprovalPanel projeto={s.projeto} aprovacoes={data.aprovacoes} onReload={onReload} onGerarMemorial={s.gerarMemorial} />

      {/* Modo Auditoria — memória de cálculo completa */}
      {s.auditoria && <AuditPanel auditoria={s.auditoria} onClose={s.fecharAuditoria} />}
    </div>
  );
}
