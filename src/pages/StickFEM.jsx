/**
 * StickFEM™ — Análise estrutural inteligente a partir de CAD/DXF (Slice 1).
 * Fluxo: DXF → parser → elementos estruturais → perfis → quantitativo →
 *        modelo analítico (FEM-ready) → aprovação técnica.
 * O cálculo FEM (Fase 6) é plugável via SolverAdapter; aqui o modelo é montado
 * e persistido, com o solver "null" (cálculo pendente).
 */
import { useEffect, useState, useMemo } from "react";
import { parseDXF } from "../services/stickfem/dxfParser";
import { parseEstrutura } from "../services/stickfem/structuralParser";
import { gerarQuantitativo } from "../services/stickfem/quantitativo";
import { buildStructuralModel, getSolver } from "../services/stickfem/solver/SolverAdapter";
import {
  listarPerfis, listarProjetos, criarProjeto, atualizarStatusProjeto,
  salvarArquivoCad, salvarElementos, salvarAnalise, registrarAprovacao, carregarProjeto,
} from "../services/stickfem/repository";

const COR_TIPO = { parede: "#3b6ea5", viga: "#c0892d", abertura: "#981915", eixo: "#8c847a", montante: "#4f7d57" };

export default function StickFEM() {
  const [projetos, setProjetos] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [proj, setProj] = useState(null);        // projeto aberto
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 30, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
          StickFEM™
        </h1>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Análise estrutural via CAD/DXF</span>
      </div>
      <Disclaimer />

      {erro && <div style={ERRO}>{erro}</div>}

      {!proj ? (
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
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>Projetos estruturais</div>
        <button onClick={onNovo} style={BTN_PRIMARY}>+ Novo projeto</button>
      </div>
      {loading ? <p style={{ color: "var(--muted)" }}>Carregando…</p> : (
        projetos.length === 0 ? (
          <div style={CARD}><p style={{ color: "var(--muted)", margin: 0 }}>Nenhum projeto ainda. Crie um e importe um DXF.</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {projetos.map((p) => (
              <button key={p.id} onClick={() => onAbrir(p.id)} style={{ ...CARD, textAlign: "left", cursor: "pointer" }}>
                <div style={{ fontWeight: 700, color: "var(--ink)" }}>{p.nome}</div>
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

function StatusBadge({ status }) {
  const map = { rascunho: ["#8c847a", "Rascunho"], analisado: ["#3b6ea5", "Analisado"], aprovado: ["#3f7a4b", "Aprovado ✓"] };
  const [c, label] = map[status] || map.rascunho;
  return <span style={{ color: c, fontWeight: 700 }}>{label}</span>;
}

// ── Detalhe do projeto: import + parse + elementos + quantitativo ────────────
function ProjetoDetalhe({ data, perfis, onVoltar, onReload }) {
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

  async function onDxf(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(""); setMsg("Lendo DXF…"); setBusy(true);
    try {
      const text = await file.text();
      const geo = parseDXF(text, { peDireito: projeto.pe_direito_m });
      const { elementos: els, resumo: res } = parseEstrutura(geo, { peDireito: projeto.pe_direito_m });
      setGeometria({ ...geo, _file: file.name });
      setElementos(els);
      setResumo(res);
      setMsg(`Identificados ${res.total} elementos (${res.paredes} paredes).`);
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
        ...el, perfil_id: el.tipo === "parede" ? perfMont : (el.tipo === "viga" ? perfGuia : null),
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

  return (
    <div>
      <button onClick={onVoltar} style={BTN_GHOST}>← Projetos</button>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "10px 0 6px" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: 0 }}>{projeto.nome}</h2>
        <StatusBadge status={projeto.status} />
      </div>

      {/* Importar */}
      <div style={CARD}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8 }}>1 · Importar CAD (DXF)</div>
        <input type="file" accept=".dxf" onChange={onDxf} disabled={busy} />
        {msg && <span style={{ marginLeft: 10, fontSize: 12, color: "var(--muted)" }}>{msg}</span>}
        {geometria && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            <span>Layers: <b>{geometria.stats.layers}</b></span>
            <span>Linhas: <b>{geometria.stats.linhas}</b></span>
            <span>Polilinhas: <b>{geometria.stats.polilinhas}</b></span>
            <span>Textos: <b>{geometria.stats.textos}</b></span>
            <span>Área: <b>{geometria.stats.largura_m}×{geometria.stats.altura_m} m</b></span>
          </div>
        )}
      </div>

      {geometria && (
        <>
          <ViewerSVG geometria={geometria} elementos={elementos} />

          {/* Elementos */}
          <div style={CARD}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8 }}>
              2 · Elementos identificados (StickAI Structural Parser™)
            </div>
            {resumo && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                {resumo.paredes} paredes · {resumo.comprimentoParedes_m} m lineares · confiança {resumo.confiancaGlobal}
              </div>
            )}
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "var(--surface-2)" }}>
                  {["Elemento", "Tipo", "Comp. (m)", "Layer", "Conf."].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {elementos.slice(0, 200).map((e, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={TD}>{e.nome}</td>
                      <td style={{ ...TD, color: COR_TIPO[e.tipo] }}>{e.tipo}</td>
                      <td style={TD}>{e.comprimento_m ?? "—"}</td>
                      <td style={{ ...TD, color: "var(--muted)" }}>{e.layer_origem}</td>
                      <td style={TD}>{e.confianca}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Perfis + Quantitativo */}
          <div style={CARD}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8 }}>
              3 · Perfis &amp; quantitativo
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              <SelPerfil label="Montante" perfis={perfis.filter((p) => p.tipo === "montante")} value={perfMont} onChange={setPerfMont} />
              <SelPerfil label="Guia" perfis={perfis.filter((p) => p.tipo === "guia")} value={perfGuia} onChange={setPerfGuia} />
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
              {quant.itens.map((it) => (
                <div key={it.tipo} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontWeight: 700, color: "var(--ink)" }}>{it.perfil}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                    {it.tipo === "montante" ? `${it.quantidade} pç · ` : ""}{it.comprimento_total_m} m · {it.peso_kg} kg
                  </div>
                </div>
              ))}
              <div style={{ background: "rgba(63,122,75,.08)", border: "1px solid rgba(63,122,75,.25)", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontWeight: 800, color: "#3f7a4b" }}>Peso total: {quant.resumo.pesoTotal_kg} kg</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                  {quant.resumo.montantes} montantes · espaç. {quant.resumo.espacMontanteMm} mm · perda {(quant.resumo.perda * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={salvarTudo} disabled={busy} style={BTN_PRIMARY}>
              {busy ? "Salvando…" : "Salvar projeto + montar modelo analítico"}
            </button>
          </div>
        </>
      )}

      {erro && <div style={ERRO}>{erro}</div>}

      {/* Aprovação técnica (Fase 10) */}
      <AprovacaoTecnica projeto={projeto} aprovacoes={data.aprovacoes} onReload={onReload} />
    </div>
  );
}

function SelPerfil({ label, perfis, value, onChange }) {
  return (
    <label style={{ fontSize: 12, color: "var(--ink-2)" }}>
      {label}:{" "}
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}
        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 12 }}>
        {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
    </label>
  );
}

// ── Viewer CAD 2D (SVG) ──────────────────────────────────────────────────────
function ViewerSVG({ geometria, elementos }) {
  const b = geometria.bounds;
  const pad = Math.max((b.maxX - b.minX), (b.maxY - b.minY)) * 0.05 || 1;
  const vb = `${b.minX - pad} ${b.minY - pad} ${(b.maxX - b.minX) + 2 * pad} ${(b.maxY - b.minY) + 2 * pad}`;
  const flipY = b.maxY + b.minY; // espelha Y (SVG cresce pra baixo)
  const sw = Math.max((b.maxX - b.minX), (b.maxY - b.minY)) / 300 || 0.02;

  return (
    <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
      <svg viewBox={vb} style={{ width: "100%", height: 340, background: "#0f1115", display: "block" }}
        preserveAspectRatio="xMidYMid meet">
        <g transform={`matrix(1 0 0 -1 0 ${flipY})`}>
          {(geometria.lines || []).map((l, i) => (
            <line key={"l" + i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(255,255,255,.18)" strokeWidth={sw} />
          ))}
          {(geometria.polylines || []).map((p, i) => (
            <polyline key={"p" + i} points={p.pontos.map((pt) => `${pt.x},${pt.y}`).join(" ")}
              fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={sw} />
          ))}
          {(elementos || []).filter((e) => e.geometria?.x1 != null).map((e, i) => (
            <line key={"e" + i} x1={e.geometria.x1} y1={e.geometria.y1} x2={e.geometria.x2} y2={e.geometria.y2}
              stroke={COR_TIPO[e.tipo] || "#fff"} strokeWidth={sw * 2.4} strokeLinecap="round" opacity={0.9} />
          ))}
        </g>
      </svg>
    </div>
  );
}

// ── Aprovação técnica ────────────────────────────────────────────────────────
function AprovacaoTecnica({ projeto, aprovacoes, onReload }) {
  const [nome, setNome] = useState("");
  const [crea, setCrea] = useState("");
  const [obs, setObs] = useState("");
  const [busy, setBusy] = useState(false);

  async function registrar(status) {
    if (!nome) return;
    setBusy(true);
    try {
      await registrarAprovacao(projeto.id, { engenheiroNome: nome, engenheiroCrea: crea, status, observacoes: obs });
      if (status === "aprovado") await atualizarStatusProjeto(projeto.id, "aprovado");
      onReload();
      setNome(""); setCrea(""); setObs("");
    } finally { setBusy(false); }
  }

  return (
    <div style={{ ...CARD, marginTop: 18 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8 }}>
        4 · Aprovação técnica <span style={{ fontWeight: 400, color: "var(--muted)" }}>(engenheiro revisa → aprova → emite documento)</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input placeholder="Engenheiro responsável" value={nome} onChange={(e) => setNome(e.target.value)} style={INPUT} />
        <input placeholder="CREA / RRT" value={crea} onChange={(e) => setCrea(e.target.value)} style={{ ...INPUT, maxWidth: 160 }} />
        <input placeholder="Observações" value={obs} onChange={(e) => setObs(e.target.value)} style={{ ...INPUT, flex: 1, minWidth: 200 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => registrar("aprovado")} disabled={busy || !nome} style={{ ...BTN_PRIMARY, background: "#3f7a4b" }}>Aprovar</button>
        <button onClick={() => registrar("reprovado")} disabled={busy || !nome} style={{ ...BTN_GHOST, color: "#981915", borderColor: "#981915" }}>Reprovar</button>
      </div>
      {aprovacoes?.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12 }}>
          {aprovacoes.map((a) => (
            <div key={a.id} style={{ padding: "6px 0", borderTop: "1px solid var(--line)", color: "var(--ink-2)" }}>
              <b style={{ color: a.status === "aprovado" ? "#3f7a4b" : "#981915" }}>{a.status}</b> — {a.engenheiro_nome}
              {a.engenheiro_crea ? ` (${a.engenheiro_crea})` : ""} {a.observacoes ? `· ${a.observacoes}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── estilos ──────────────────────────────────────────────────────────────────
const CARD = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px", marginBottom: 14 };
const BTN_PRIMARY = { background: "var(--brick)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const BTN_GHOST = { background: "var(--surface)", color: "var(--ink-2)", border: "1.5px solid var(--line)", borderRadius: 8, padding: "8px 14px", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const INPUT = { padding: "8px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", fontFamily: "inherit", fontSize: 12.5, color: "var(--ink)" };
const TH = { textAlign: "left", padding: "7px 10px", fontSize: 11, color: "var(--muted)", fontWeight: 700 };
const TD = { padding: "6px 10px" };
const ERRO = { background: "rgba(160,50,40,.12)", border: "1px solid rgba(160,50,40,.3)", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, color: "#c0503c", margin: "12px 0" };
