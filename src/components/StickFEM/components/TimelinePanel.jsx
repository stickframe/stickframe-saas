import { useMemo, useState } from "react";
import { agruparEventos, filtrarEventos, pesquisarEventos, indicadoresDashboard, usuariosDistintos } from "../../../services/stickfem/timeline/timelineLogic";
import { MODULOS, SEVERIDADES } from "../../../services/stickfem/timeline/events";
import { exportarTimelineCSV, exportarTimelineJSON, exportarTimelinePDF } from "../../../services/stickfem/timeline/exportTimeline";
import { CARD, BTN_GHOST, INPUT } from "../utils/styles";

const COR_SEV = { info: "#3b6ea5", atencao: "#b07a1e", critico: "#981915" };
const relativo = (ms) => {
  if (ms == null) return "—";
  const min = Math.round(ms / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
};
const quando = (e) => (e ? new Date(e.data).toLocaleString("pt-BR") : "—");

function Indicador({ label, valor }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 12px", minWidth: 130 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text, #26231f)", marginTop: 2 }}>{valor}</div>
    </div>
  );
}

/**
 * Linha do Tempo da Engenharia — caixa-preta de rastreabilidade.
 * Render-only: recebe `eventos` (já persistidos/otimistas) do hook.
 */
export default function TimelinePanel({ eventos = [], projetoNome = "projeto" }) {
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState({ usuario: "", modulo: "", severidade: "", preset: "" });
  const [expandido, setExpandido] = useState({});

  const ind = useMemo(() => indicadoresDashboard(eventos), [eventos]);
  const usuarios = useMemo(() => usuariosDistintos(eventos), [eventos]);

  const filtrados = useMemo(() => {
    let r = filtrarEventos(eventos, {
      usuario: filtros.usuario || undefined, modulo: filtros.modulo || undefined,
      severidade: filtros.severidade || undefined, preset: filtros.preset || undefined,
    });
    return pesquisarEventos(r, busca);
  }, [eventos, filtros, busca]);

  const grupos = useMemo(() => agruparEventos(filtrados), [filtrados]);
  const setF = (k, v) => setFiltros((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ ...CARD, marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted, #57514a)" }}>
          Linha do tempo da engenharia <span style={{ fontWeight: 400, color: "var(--muted)" }}>(rastreabilidade · {eventos.length} eventos)</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => exportarTimelineCSV(filtrados, projetoNome)} style={BTN_GHOST}>CSV</button>
          <button onClick={() => exportarTimelineJSON(filtrados, projetoNome)} style={BTN_GHOST}>JSON</button>
          <button onClick={() => exportarTimelinePDF(filtrados, projetoNome)} style={BTN_GHOST}>PDF</button>
        </div>
      </div>

      {/* Dashboard */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Indicador label="Última atividade" valor={quando(ind.ultimaAtividade)} />
        <Indicador label="Última aprovação" valor={quando(ind.ultimaAprovacao)} />
        <Indicador label="Último memorial" valor={ind.ultimoMemorial?.hash || quando(ind.ultimoMemorial)} />
        <Indicador label="Última comparação" valor={quando(ind.ultimaComparacao)} />
        <Indicador label="Último cálculo" valor={quando(ind.ultimoCalculo)} />
        <Indicador label="Desde a última alteração" valor={relativo(ind.tempoDesdeUltimaAlteracaoMs)} />
      </div>

      {/* Filtros + busca */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <input placeholder="Buscar (ex.: Ue140, hash, aprovação…)" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ ...INPUT, flex: 1, minWidth: 180 }} />
        <select value={filtros.modulo} onChange={(e) => setF("modulo", e.target.value)} style={{ ...INPUT, padding: "7px 8px" }}>
          <option value="">Todos os módulos</option>
          {MODULOS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtros.severidade} onChange={(e) => setF("severidade", e.target.value)} style={{ ...INPUT, padding: "7px 8px" }}>
          <option value="">Toda severidade</option>
          {SEVERIDADES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {usuarios.length > 0 && (
          <select value={filtros.usuario} onChange={(e) => setF("usuario", e.target.value)} style={{ ...INPUT, padding: "7px 8px" }}>
            <option value="">Todos os usuários</option>
            {usuarios.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
        <select value={filtros.preset} onChange={(e) => setF("preset", e.target.value)} style={{ ...INPUT, padding: "7px 8px" }}>
          <option value="">Sem atalho</option>
          <option value="engenharia">Só engenharia</option>
          <option value="ia">Só IA</option>
          <option value="auditoria">Só auditoria</option>
        </select>
      </div>

      {/* Timeline */}
      {grupos.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Nenhum evento{eventos.length ? " para o filtro atual" : " ainda"}.</div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto", paddingLeft: 6, borderLeft: "2px solid var(--line)" }}>
          {grupos.map((g, i) => {
            const rep = g.representante;
            const aberto = expandido[i];
            return (
              <div key={i} style={{ position: "relative", padding: "8px 0 8px 16px" }}>
                <span style={{ position: "absolute", left: -7, top: 11, width: 10, height: 10, borderRadius: "50%", background: COR_SEV[rep.severidade] || "#8c847a", border: "2px solid var(--surface)" }} />
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 118 }}>{new Date(rep.data).toLocaleString("pt-BR")}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text, #26231f)" }}>{rep.icone} {rep.label}</span>
                  {g.count > 1 && (
                    <button onClick={() => setExpandido((s) => ({ ...s, [i]: !s[i] }))} style={{ ...BTN_GHOST, padding: "1px 8px", fontSize: 11 }}>
                      {g.count} eventos {aberto ? "▲" : "▼"}
                    </button>
                  )}
                  {rep.usuario && <span style={{ fontSize: 11, color: "var(--muted)" }}>· {rep.usuario}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted, #57514a)", marginTop: 2 }}>{rep.descricao}{rep.hash ? ` · ${rep.hash}` : ""}</div>
                {aberto && g.count > 1 && (
                  <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: "1px dashed var(--line)" }}>
                    {g.itens.map((it, j) => (
                      <div key={j} style={{ fontSize: 11, color: "var(--muted)", padding: "2px 0" }}>
                        {new Date(it.data).toLocaleTimeString("pt-BR")} — {it.descricao}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
