import { useState, useEffect, useRef } from "react";
import { BarChart2, Link, Search, Trash2 } from "../ui/Icon";
import { C } from "../../utils/constants";
import { fmtBRL, fmtDateTime } from "../../utils/format";
import useAppStore from "../../store/useAppStore";
import {
  listarMonitorados, adicionarMonitor, atualizarPrecoMonitor,
  removerMonitor, scrapePreco, listarHistoricoPreco,
} from "../../services/repositories/precosRepository";
import { emailAlertaPreco } from "../../services/emailService";
import { SISTEMAS_SF } from "../../utils/insumosSF";

const TODOS_INSUMOS = SISTEMAS_SF.flatMap((s) => {
  const itens = s.opcoes ? s.opcoes.flatMap((o) => o.itens) : s.itens;
  return itens.map((i) => ({ nome: i.nome, sistema: s.label }));
});

const thSt = { padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
  color: C.muted, borderBottom: `1px solid ${C.border}`, background: C.darker };
const tdSt = { padding: "10px 14px", verticalAlign: "middle" };
const inputSt = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`,
  borderRadius: 6, fontSize: 13, background: "#fff", boxSizing: "border-box" };
const labelSt = { display: "block", fontSize: 12, fontWeight: 600, color: C.graphite, marginBottom: 5 };

function GraficoHistorico({ monitorId }) {
  const [hist, setHist] = useState(null);
  useEffect(() => {
    listarHistoricoPreco(monitorId, 90).then(setHist).catch(() => setHist([]));
  }, [monitorId]);

  if (hist === null) return <div style={{ padding: "12px 0", color: C.muted, fontSize: 12 }}>Carregando…</div>;
  if (hist.length === 0) return (
    <div style={{ padding: "12px 0", color: C.muted, fontSize: 12, textAlign: "center" }}>
      Sem histórico ainda — o gráfico será preenchido a cada atualização diária automática.
    </div>
  );

  const precos = hist.map((h) => Number(h.preco));
  const datas  = hist.map((h) => h.data_captura);
  const min = Math.min(...precos);
  const max = Math.max(...precos);
  const range = max - min || 1;
  const W = 100, H = 60;
  const pts = precos.map((p, i) => {
    const x = precos.length === 1 ? W / 2 : (i / (precos.length - 1)) * W;
    const y = H - ((p - min) / range) * (H * 0.8) - H * 0.1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M ${pts.join(" L ")} L ${W},${H} L 0,${H} Z`;
  const varPct = precos.length > 1 ? ((precos[precos.length - 1] - precos[0]) / precos[0]) * 100 : 0;
  const cor = varPct > 0 ? "#dc2626" : varPct < 0 ? "#16a34a" : C.muted;

  return (
    <div style={{ padding: "14px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: C.muted }}>{hist.length} registros · {datas[0]} → {datas[datas.length - 1]}</div>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <span style={{ color: C.muted }}>Mín: <strong>{fmtBRL(min)}</strong></span>
          <span style={{ color: C.muted }}>Máx: <strong>{fmtBRL(max)}</strong></span>
          <span style={{ color: cor, fontWeight: 700 }}>{varPct > 0 ? "▲" : varPct < 0 ? "▼" : "—"} {Math.abs(varPct).toFixed(1)}% no período</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80, display: "block" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`hg-${monitorId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity=".25" />
            <stop offset="100%" stopColor={cor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#hg-${monitorId})`} />
        <polyline points={pts.join(" ")} fill="none" stroke={cor} strokeWidth="1.5" strokeLinejoin="round" />
        {precos.map((p, i) => {
          const x = precos.length === 1 ? W / 2 : (i / (precos.length - 1)) * W;
          const y = H - ((p - min) / range) * (H * 0.8) - H * 0.1;
          return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="1.8" fill={cor} />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, marginTop: 2 }}>
        {hist.length <= 8 ? datas.map((d, i) => <span key={i}>{d.slice(5)}</span>) : (
          [datas[0], datas[Math.floor(datas.length / 2)], datas[datas.length - 1]].map((d, i) => <span key={i}>{d.slice(5)}</span>)
        )}
      </div>
    </div>
  );
}

export default function MonitorPrecos() {
  const [itens, setItens]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState({});
  const [modal, setModal]       = useState(false);
  const [testando, setTestando] = useState(false);
  const [testeResult, setTesteResult] = useState(null);
  const [form, setForm]         = useState({ nome_produto: "", url: "", insumo_ref: "" });
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast]       = useState(null);
  const [grafItem, setGrafItem] = useState(null);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const urlRef = useRef();
  const empresa = useAppStore((s) => s.empresa);

  const load = () => {
    setLoading(true);
    listarMonitorados().then(setItens).catch(() => setItens([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const showToast = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), 4000); };

  const testarUrl = async () => {
    if (!form.url) return;
    setTestando(true); setTesteResult(null);
    try {
      const r = await scrapePreco(form.url);
      setTesteResult(r);
      if (r.nome_produto && !form.nome_produto) setForm((p) => ({ ...p, nome_produto: r.nome_produto }));
    } catch (e) {
      setTesteResult({ status: "error", error: String(e) });
    } finally { setTestando(false); }
  };

  const salvar = async () => {
    if (!form.nome_produto || !form.url) return;
    setSalvando(true);
    try {
      const loja = (() => { try { return new URL(form.url).hostname.replace("www.", ""); } catch { return ""; } })();
      const item = await adicionarMonitor({ ...form, loja });
      if (testeResult?.preco) {
        await atualizarPrecoMonitor(item.id, { preco_atual: testeResult.preco, preco_anterior: null, data_captura: new Date().toISOString(), status: "Ativo", erro_msg: null });
      }
      setModal(false); setForm({ nome_produto: "", url: "", insumo_ref: "" }); setTesteResult(null); load();
    } catch (e) {
      showToast("Erro ao salvar: " + e.message, true);
    } finally { setSalvando(false); }
  };

  const sincronizar = async (item) => {
    setSyncing((p) => ({ ...p, [item.id]: true }));
    try {
      const r = await scrapePreco(item.url);
      if (r?.preco) {
        await atualizarPrecoMonitor(item.id, { preco_anterior: item.preco_atual, preco_atual: r.preco, data_captura: new Date().toISOString(), status: "Ativo", erro_msg: null });
        showToast(`${item.nome_produto}: ${fmtBRL(r.preco)}`);
        if (item.preco_atual && r.preco > item.preco_atual) {
          const variacao = ((r.preco - item.preco_atual) / item.preco_atual) * 100;
          if (variacao >= alertThreshold && empresa?.email) {
            emailAlertaPreco({ nomeProduto: item.nome_produto, precoAnterior: item.preco_atual, precoAtual: r.preco, variacao: variacao.toFixed(1), loja: item.loja, email: empresa.email }).catch(() => {});
          }
        }
      } else {
        await atualizarPrecoMonitor(item.id, { status: "Erro", erro_msg: r?.error || "Preço não encontrado" });
        showToast(r?.error || "Preço não encontrado", true);
      }
      load();
    } catch (e) {
      showToast("Erro: " + e.message, true);
    } finally { setSyncing((p) => ({ ...p, [item.id]: false })); }
  };

  const sincronizarTodos = async () => { for (const item of itens.filter((i) => i.status === "Ativo")) await sincronizar(item); };
  const remover = async (id) => { if (!confirm("Remover monitoramento?")) return; await removerMonitor(id).catch(() => {}); load(); };
  const corVar = (v) => v == null ? C.muted : v > 0 ? C.danger : v < 0 ? C.success : C.muted;
  const iconVar = (v) => v == null ? "" : v > 0 ? "▲" : v < 0 ? "▼" : "—";

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: C.muted }}>Carregando…</div>;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 940 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Monitor de Preços de Mercado</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Cole a URL de qualquer produto e o sistema captura o preço automaticamente</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted }}>
            <span>Alertar se subir mais de</span>
            <input type="number" min="1" max="100" value={alertThreshold} onChange={(e) => setAlertThreshold(Number(e.target.value))}
              style={{ width: 52, padding: "5px 8px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, background: "transparent", color: C.text, textAlign: "center" }} />
            <span>%</span>
          </div>
          {itens.length > 0 && (
            <button onClick={sincronizarTodos} style={{ padding: "9px 16px", background: "#f0f9ff", border: `1px solid #bae6fd`, borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 600, color: "#0369a1" }}>
              🔄 Sincronizar todos
            </button>
          )}
          <button onClick={() => { setModal(true); setTesteResult(null); setForm({ nome_produto: "", url: "", insumo_ref: "" }); }}
            style={{ padding: "9px 16px", background: C.red, color: "#fff", border: "none", borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            + Adicionar produto
          </button>
        </div>
      </div>

      {itens.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}><Search size={36} /></div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum produto monitorado ainda</div>
          <div style={{ fontSize: 13 }}>Clique em "Adicionar produto", cole a URL da loja e o sistema captura o preço</div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.darker }}>
                <th style={thSt}>Produto</th>
                <th style={{ ...thSt, width: 100 }}>Loja</th>
                <th style={{ ...thSt, width: 120, textAlign: "right" }}>Preço atual</th>
                <th style={{ ...thSt, width: 80, textAlign: "center" }}>Variação</th>
                <th style={{ ...thSt, width: 130 }}>Última sync</th>
                <th style={{ ...thSt, width: 90 }}>Status</th>
                <th style={{ ...thSt, width: 110, textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, i) => (<>
                <tr key={item.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 ? "#fafafa" : "#fff" }}>
                  <td style={{ ...tdSt, maxWidth: 220 }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.nome_produto}</div>
                    {item.insumo_ref && <div style={{ fontSize: 11, color: "#2563eb", marginTop: 2 }}><Link size={11} /> {item.insumo_ref}</div>}
                    <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.muted, textDecoration: "none" }}>
                      {item.url.slice(0, 45)}{item.url.length > 45 ? "…" : ""}
                    </a>
                  </td>
                  <td style={{ ...tdSt, color: C.muted, fontSize: 12 }}>{item.loja || "—"}</td>
                  <td style={{ ...tdSt, textAlign: "right", fontWeight: 700, fontSize: 14 }}>{item.preco_atual ? fmtBRL(item.preco_atual) : "—"}</td>
                  <td style={{ ...tdSt, textAlign: "center" }}>
                    {item.variacao_pct != null ? (
                      <span style={{ color: corVar(item.variacao_pct), fontWeight: 700, fontSize: 12 }}>
                        {iconVar(item.variacao_pct)}{Math.abs(item.variacao_pct).toFixed(1)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ ...tdSt, fontSize: 11, color: C.muted }}>{fmtDateTime(item.data_captura)}</td>
                  <td style={tdSt}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 700,
                      background: item.status === "Ativo" ? "#dcfce7" : item.status === "Erro" ? "#fee2e2" : "#f3f4f6",
                      color: item.status === "Ativo" ? "#166534" : item.status === "Erro" ? "#991b1b" : C.muted }}>
                      {item.status === "Erro" ? `⚠ Erro` : item.status}
                    </span>
                  </td>
                  <td style={{ ...tdSt, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button onClick={() => setGrafItem(grafItem === item.id ? null : item.id)} title="Ver histórico"
                        style={{ padding: "4px 8px", fontSize: 13, background: grafItem === item.id ? "#eff6ff" : "none", border: `1px solid ${grafItem === item.id ? "#93c5fd" : C.border}`, borderRadius: 5, cursor: "pointer" }}><BarChart2 size={36} /></button>
                      <button onClick={() => sincronizar(item)} disabled={syncing[item.id]} title="Sincronizar agora"
                        style={{ padding: "4px 8px", fontSize: 13, background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer", opacity: syncing[item.id] ? 0.5 : 1 }}>
                        {syncing[item.id] ? "…" : "🔄"}
                      </button>
                      <button onClick={() => remover(item.id)} title="Remover"
                        style={{ padding: "4px 8px", fontSize: 13, background: "none", border: `1px solid ${C.border}`, borderRadius: 5, cursor: "pointer", color: C.danger }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
                {grafItem === item.id && (
                  <tr key={`graf-${item.id}`} style={{ background: "#f8faff" }}>
                    <td colSpan={7} style={{ padding: "0 20px 10px" }}>
                      <GraficoHistorico monitorId={item.id} nome={item.nome_produto} />
                    </td>
                  </tr>
                )}
              </>))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 14, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
        <strong>Como funciona:</strong> O sistema tenta capturar o preço diretamente do HTML da página.
        Sites com Cloudflare (Leroy Merlin, etc.) podem bloquear — para lojas de Steel Frame funciona na maioria das páginas de produto.
      </div>

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "min(520px, 95vw)", padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Adicionar produto para monitorar</div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>URL do produto *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={urlRef} type="url" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://www.espacosmart.com.br/perfil-montante-..." style={{ ...inputSt, flex: 1 }} />
                <button onClick={testarUrl} disabled={!form.url || testando}
                  style={{ padding: "8px 14px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", opacity: !form.url || testando ? 0.5 : 1 }}>
                  {testando ? "…" : "Testar"}
                </button>
              </div>
            </div>
            {testeResult && (
              <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13, background: testeResult.status === "ok" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${testeResult.status === "ok" ? "#86efac" : "#fca5a5"}`, color: testeResult.status === "ok" ? "#166534" : "#991b1b" }}>
                {testeResult.status === "ok" ? (
                  <><strong>✓ Preço encontrado:</strong> {fmtBRL(testeResult.preco)}{testeResult.loja && <span style={{ marginLeft: 8, opacity: 0.7 }}>({testeResult.loja})</span>}<br /><span style={{ fontSize: 11 }}>{testeResult.candidatos} candidatos analisados</span></>
                ) : (
                  <><strong>⚠ {testeResult.status === "blocked" ? "Site bloqueou o acesso" : "Preço não encontrado"}:</strong> {testeResult.error}</>
                )}
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Nome do produto *</label>
              <input type="text" value={form.nome_produto} onChange={(e) => setForm((p) => ({ ...p, nome_produto: e.target.value }))} placeholder="ex: Montante C 90×40×15×1,25mm 6m" style={inputSt} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelSt}>Mapear para insumo do Orçamento Técnico (opcional)</label>
              <select value={form.insumo_ref} onChange={(e) => setForm((p) => ({ ...p, insumo_ref: e.target.value }))} style={inputSt}>
                <option value="">— Não mapear —</option>
                {TODOS_INSUMOS.map((ins, i) => <option key={i} value={ins.nome}>{ins.sistema} › {ins.nome}</option>)}
              </select>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Quando mapeado, o Orçamento Técnico usará o preço ao vivo deste produto</div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setModal(false); setTesteResult(null); }} style={{ padding: "9px 20px", background: "none", border: `1px solid ${C.border}`, borderRadius: 7, cursor: "pointer", fontSize: 13 }}>Cancelar</button>
              <button onClick={salvar} disabled={!form.nome_produto || !form.url || salvando}
                style={{ padding: "9px 20px", background: C.red, color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !form.nome_produto || !form.url || salvando ? 0.5 : 1 }}>
                {salvando ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, padding: "10px 20px", background: toast.err ? C.danger : C.success, color: "#fff", borderRadius: 8, zIndex: 9999, fontSize: 13, maxWidth: 320 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
