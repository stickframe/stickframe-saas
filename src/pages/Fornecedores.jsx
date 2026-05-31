import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { useToast } from "../hooks/useToast";
import { listarTodasCotacoes } from "../services/repositories/fornecedoresRepository";
import {
  listarMonitorados, adicionarMonitor, atualizarPrecoMonitor,
  removerMonitor, scrapePreco, listarHistoricoPreco,
} from "../services/repositories/precosRepository";
import { emailAlertaPreco } from "../services/emailService";
import { SISTEMAS_SF } from "../utils/insumosSF";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

// Todos os insumos de insumosSF para o select de mapeamento
const TODOS_INSUMOS = SISTEMAS_SF.flatMap((s) => {
  const itens = s.opcoes ? s.opcoes.flatMap((o) => o.itens) : s.itens;
  return itens.map((i) => ({ nome: i.nome, sistema: s.label }));
});

const fmtBRL = (v) => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "—";
const fmtData = (d) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

// ─── Gráfico de histórico de preço ───────────────────────────────────────────
function GraficoHistorico({ monitorId, nome }) {
  const [hist, setHist] = useState(null);
  useEffect(() => {
    listarHistoricoPreco(monitorId, 90)
      .then(setHist)
      .catch(() => setHist([]));
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
        <div style={{ fontSize: 11, color: C.muted }}>
          {hist.length} registros · {datas[0]} → {datas[datas.length - 1]}
        </div>
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

// ─── Monitor de Preços de Mercado ────────────────────────────────────────────
function MonitorPrecos() {
  const [itens, setItens]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [modal, setModal]     = useState(false);
  const [testando, setTestando] = useState(false);
  const [testeResult, setTesteResult] = useState(null);
  const [form, setForm]       = useState({ nome_produto: "", url: "", insumo_ref: "" });
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast]     = useState(null);
  const [grafItem, setGrafItem] = useState(null);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const urlRef = useRef();
  const empresa = useAppStore((s) => s.empresa);

  const load = () => {
    setLoading(true);
    listarMonitorados().then(setItens).catch(() => setItens([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, err) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 4000);
  };

  const testarUrl = async () => {
    if (!form.url) return;
    setTestando(true);
    setTesteResult(null);
    try {
      const r = await scrapePreco(form.url);
      setTesteResult(r);
      if (r.nome_produto && !form.nome_produto) {
        setForm((p) => ({ ...p, nome_produto: r.nome_produto }));
      }
    } catch (e) {
      setTesteResult({ status: "error", error: String(e) });
    } finally {
      setTestando(false);
    }
  };

  const salvar = async () => {
    if (!form.nome_produto || !form.url) return;
    setSalvando(true);
    try {
      const loja = (() => { try { return new URL(form.url).hostname.replace("www.", ""); } catch { return ""; } })();
      const item = await adicionarMonitor({ ...form, loja });
      // Se o teste já encontrou preço, salva imediatamente
      if (testeResult?.preco) {
        await atualizarPrecoMonitor(item.id, {
          preco_atual: testeResult.preco,
          preco_anterior: null,
          data_captura: new Date().toISOString(),
          status: "Ativo",
          erro_msg: null,
        });
      }
      setModal(false);
      setForm({ nome_produto: "", url: "", insumo_ref: "" });
      setTesteResult(null);
      load();
    } catch (e) {
      showToast("Erro ao salvar: " + e.message, true);
    } finally {
      setSalvando(false);
    }
  };

  const sincronizar = async (item) => {
    setSyncing((p) => ({ ...p, [item.id]: true }));
    try {
      const r = await scrapePreco(item.url);
      if (r?.preco) {
        await atualizarPrecoMonitor(item.id, {
          preco_anterior: item.preco_atual,
          preco_atual: r.preco,
          data_captura: new Date().toISOString(),
          status: "Ativo",
          erro_msg: null,
        });
        showToast(`${item.nome_produto}: ${fmtBRL(r.preco)}`);
        // Send email alert if price rose above threshold
        if (item.preco_atual && r.preco > item.preco_atual) {
          const variacao = ((r.preco - item.preco_atual) / item.preco_atual) * 100;
          if (variacao >= alertThreshold) {
            const emailDest = empresa?.email;
            if (emailDest) {
              emailAlertaPreco({
                nomeProduto: item.nome_produto,
                precoAnterior: item.preco_atual,
                precoAtual: r.preco,
                variacao: variacao.toFixed(1),
                loja: item.loja,
                email: emailDest,
              }).catch(() => {});
            }
          }
        }
      } else {
        await atualizarPrecoMonitor(item.id, { status: "Erro", erro_msg: r?.error || "Preço não encontrado" });
        showToast(r?.error || "Preço não encontrado", true);
      }
      load();
    } catch (e) {
      showToast("Erro: " + e.message, true);
    } finally {
      setSyncing((p) => ({ ...p, [item.id]: false }));
    }
  };

  const sincronizarTodos = async () => {
    for (const item of itens.filter((i) => i.status === "Ativo")) {
      await sincronizar(item);
    }
  };

  const remover = async (id) => {
    if (!confirm("Remover monitoramento?")) return;
    await removerMonitor(id).catch(() => {});
    load();
  };

  const corVar = (v) => v == null ? C.muted : v > 0 ? C.danger : v < 0 ? C.success : C.muted;
  const iconVar = (v) => v == null ? "" : v > 0 ? "▲" : v < 0 ? "▼" : "—";

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: C.muted }}>Carregando…</div>;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 940 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Monitor de Preços de Mercado</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
            Cole a URL de qualquer produto e o sistema captura o preço automaticamente
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted }}>
            <span>Alertar se subir mais de</span>
            <input
              type="number"
              min="1"
              max="100"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              style={{ width: 52, padding: "5px 8px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, background: "transparent", color: C.text, textAlign: "center" }}
            />
            <span>%</span>
          </div>
          {itens.length > 0 && (
            <button onClick={sincronizarTodos} style={{
              padding: "9px 16px", background: "#f0f9ff", border: `1px solid #bae6fd`,
              borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 600, color: "#0369a1",
            }}>
              🔄 Sincronizar todos
            </button>
          )}
          <button onClick={() => { setModal(true); setTesteResult(null); setForm({ nome_produto: "", url: "", insumo_ref: "" }); }} style={{
            padding: "9px 16px", background: C.red, color: "#fff",
            border: "none", borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 600,
          }}>
            + Adicionar produto
          </button>
        </div>
      </div>

      {itens.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff",
          border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Nenhum produto monitorado ainda</div>
          <div style={{ fontSize: 13 }}>
            Clique em "Adicionar produto", cole a URL da loja e o sistema captura o preço
          </div>
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
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.nome_produto}
                    </div>
                    {item.insumo_ref && (
                      <div style={{ fontSize: 11, color: "#2563eb", marginTop: 2 }}>
                        🔗 {item.insumo_ref}
                      </div>
                    )}
                    <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.muted, textDecoration: "none" }}>
                      {item.url.slice(0, 45)}{item.url.length > 45 ? "…" : ""}
                    </a>
                  </td>
                  <td style={{ ...tdSt, color: C.muted, fontSize: 12 }}>{item.loja || "—"}</td>
                  <td style={{ ...tdSt, textAlign: "right", fontWeight: 700, fontSize: 14 }}>
                    {item.preco_atual ? fmtBRL(item.preco_atual) : "—"}
                  </td>
                  <td style={{ ...tdSt, textAlign: "center" }}>
                    {item.variacao_pct != null ? (
                      <span style={{ color: corVar(item.variacao_pct), fontWeight: 700, fontSize: 12 }}>
                        {iconVar(item.variacao_pct)}{Math.abs(item.variacao_pct).toFixed(1)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ ...tdSt, fontSize: 11, color: C.muted }}>{fmtData(item.data_captura)}</td>
                  <td style={tdSt}>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 700,
                      background: item.status === "Ativo" ? "#dcfce7" : item.status === "Erro" ? "#fee2e2" : "#f3f4f6",
                      color: item.status === "Ativo" ? "#166534" : item.status === "Erro" ? "#991b1b" : C.muted,
                    }}>
                      {item.status === "Erro" ? `⚠ Erro` : item.status}
                    </span>
                  </td>
                  <td style={{ ...tdSt, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button
                        onClick={() => setGrafItem(grafItem === item.id ? null : item.id)}
                        title="Ver histórico de preço"
                        style={{ padding: "4px 8px", fontSize: 13, background: grafItem === item.id ? "#eff6ff" : "none", border: `1px solid ${grafItem === item.id ? "#93c5fd" : C.border}`, borderRadius: 5, cursor: "pointer" }}
                      >
                        📊
                      </button>
                      <button
                        onClick={() => sincronizar(item)}
                        disabled={syncing[item.id]}
                        title="Sincronizar preço agora"
                        aria-label="Sincronizar preço agora"
                        style={{ padding: "4px 8px", fontSize: 13, background: "none", border: `1px solid ${C.border}`,
                          borderRadius: 5, cursor: "pointer", opacity: syncing[item.id] ? 0.5 : 1 }}
                      >
                        {syncing[item.id] ? "…" : "🔄"}
                      </button>
                      <button onClick={() => remover(item.id)} title="Remover" aria-label="Remover produto monitorado"
                        style={{ padding: "4px 8px", fontSize: 13, background: "none", border: `1px solid ${C.border}`,
                          borderRadius: 5, cursor: "pointer", color: C.danger }}>
                        🗑
                      </button>
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

      {/* Aviso scraping */}
      <div style={{ marginTop: 14, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fcd34d",
        borderRadius: 8, fontSize: 12, color: "#92400e" }}>
        <strong>Como funciona:</strong> O sistema tenta capturar o preço diretamente do HTML da página.
        Sites com Cloudflare (Leroy Merlin, etc.) podem bloquear — nesses casos, o preço não é encontrado.
        Para lojas de Steel Frame (Espaço Smart, distribuidoras), funciona na maioria das páginas de produto.
      </div>

      {/* Modal: Adicionar produto */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "min(520px, 95vw)",
            padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Adicionar produto para monitorar</div>

            {/* URL */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>URL do produto *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={urlRef}
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://www.espacosmart.com.br/perfil-montante-..."
                  style={{ ...inputSt, flex: 1 }}
                />
                <button onClick={testarUrl} disabled={!form.url || testando} style={{
                  padding: "8px 14px", background: "#1e40af", color: "#fff", border: "none",
                  borderRadius: 6, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
                  opacity: !form.url || testando ? 0.5 : 1,
                }}>
                  {testando ? "…" : "Testar"}
                </button>
              </div>
            </div>

            {/* Resultado do teste */}
            {testeResult && (
              <div style={{
                marginBottom: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13,
                background: testeResult.status === "ok" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${testeResult.status === "ok" ? "#86efac" : "#fca5a5"}`,
                color: testeResult.status === "ok" ? "#166534" : "#991b1b",
              }}>
                {testeResult.status === "ok" ? (
                  <>
                    <strong>✓ Preço encontrado:</strong> {fmtBRL(testeResult.preco)}
                    {testeResult.loja && <span style={{ marginLeft: 8, opacity: 0.7 }}>({testeResult.loja})</span>}
                    <br /><span style={{ fontSize: 11 }}>{testeResult.candidatos} candidatos analisados</span>
                  </>
                ) : (
                  <>
                    <strong>⚠ {testeResult.status === "blocked" ? "Site bloqueou o acesso" : "Preço não encontrado"}:</strong>{" "}
                    {testeResult.error}
                  </>
                )}
              </div>
            )}

            {/* Nome */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Nome do produto *</label>
              <input type="text" value={form.nome_produto}
                onChange={(e) => setForm((p) => ({ ...p, nome_produto: e.target.value }))}
                placeholder="ex: Montante C 90×40×15×1,25mm 6m" style={inputSt} />
            </div>

            {/* Mapeamento com insumo */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelSt}>Mapear para insumo do Orçamento Técnico (opcional)</label>
              <select value={form.insumo_ref} onChange={(e) => setForm((p) => ({ ...p, insumo_ref: e.target.value }))} style={inputSt}>
                <option value="">— Não mapear —</option>
                {TODOS_INSUMOS.map((ins, i) => (
                  <option key={i} value={ins.nome}>{ins.sistema} › {ins.nome}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                Quando mapeado, o Orçamento Técnico usará o preço ao vivo deste produto
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setModal(false); setTesteResult(null); }} style={{
                padding: "9px 20px", background: "none", border: `1px solid ${C.border}`,
                borderRadius: 7, cursor: "pointer", fontSize: 13,
              }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={!form.nome_produto || !form.url || salvando} style={{
                padding: "9px 20px", background: C.red, color: "#fff", border: "none",
                borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer",
                opacity: !form.nome_produto || !form.url || salvando ? 0.5 : 1,
              }}>
                {salvando ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, padding: "10px 20px",
          background: toast.err ? C.danger : C.success, color: "#fff",
          borderRadius: 8, zIndex: 9999, fontSize: 13, maxWidth: 320 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const thSt = { padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
  color: C.muted, borderBottom: `1px solid ${C.border}`, background: C.darker };
const tdSt = { padding: "10px 14px", verticalAlign: "middle" };
const inputSt = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`,
  borderRadius: 6, fontSize: 13, background: "#fff", boxSizing: "border-box" };
const labelSt = { display: "block", fontSize: 12, fontWeight: 600, color: C.graphite, marginBottom: 5 };

// ─── Índice de Preços StickFrame ─────────────────────────────────────────────
function IndicePrecos() {
  const [todas,    setTodas]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    listarTodasCotacoes()
      .then(setTodas)
      .catch(() => setTodas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando cotações…</div>;
  if (!todas?.length) return (
    <div style={{ padding: 60, textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Nenhuma cotação registrada</div>
      <div style={{ fontSize: 13 }}>Cadastre fornecedores e registre cotações para construir o índice de preços.</div>
    </div>
  );

  // Agrupa por especialidade
  const porEsp = {};
  todas.forEach((c) => {
    if (!c.valor) return;
    const esp = c.fornecedores?.nome ? `${c.fornecedores.nome}` : "—";
    const key = c.fornecedores?.nome || "Outros";
    if (!porEsp[key]) porEsp[key] = { nome: key, cotacoes: [] };
    porEsp[key].cotacoes.push(c);
  });

  // Agrupa por mês para tendência
  const porMes = {};
  todas.filter((c) => c.valor).forEach((c) => {
    const mes = c.created_at?.slice(0, 7) || "—";
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(Number(c.valor));
  });
  const meses = Object.keys(porMes).sort();
  const mediaPorMes = meses.map((m) => {
    const vals = porMes[m];
    return { mes: m, media: vals.reduce((a, v) => a + v, 0) / vals.length, qtd: vals.length };
  });

  // Ranking por fornecedor (média de valores)
  const ranking = Object.values(porEsp).map((f) => {
    const aprovadas = f.cotacoes.filter((c) => c.status === "Aprovada");
    const todas_    = f.cotacoes;
    const mediaAll  = todas_.reduce((a, c) => a + Number(c.valor || 0), 0) / todas_.length;
    const mediaApr  = aprovadas.length ? aprovadas.reduce((a, c) => a + Number(c.valor || 0), 0) / aprovadas.length : null;
    return { nome: f.nome, total: todas_.length, aprovadas: aprovadas.length, mediaAll, mediaApr };
  }).sort((a, b) => b.total - a.total);

  const fmtR = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtMes = (m) => { const [y, mo] = m.split("-"); return `${["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][Number(mo)]}/${y?.slice(2)}`; };

  const maxMedia = Math.max(...mediaPorMes.map((m) => m.media), 1);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 860 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Índice de Preços StickFrame</h3>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
        Evolução e comparativo de preços baseado no histórico de cotações da empresa
      </p>

      {/* Gráfico de evolução mensal */}
      {mediaPorMes.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase", marginBottom: 16 }}>
            Valor médio das cotações por mês
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
            {mediaPorMes.map((m, i) => {
              const h   = Math.max((m.media / maxMedia) * 100, 4);
              const ant = mediaPorMes[i - 1]?.media;
              const var_ = ant ? ((m.media - ant) / ant * 100) : null;
              return (
                <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  {var_ !== null && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: var_ > 0 ? C.danger : C.success }}>
                      {var_ > 0 ? "▲" : "▼"}{Math.abs(var_).toFixed(0)}%
                    </span>
                  )}
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                    <div style={{ width: "100%", height: `${h}%`, background: C.red, borderRadius: "4px 4px 0 0", opacity: 0.8, minHeight: 4 }} />
                  </div>
                  <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{fmtMes(m.mes)}</span>
                  <span style={{ fontSize: 9, color: C.text, fontWeight: 700, whiteSpace: "nowrap" }}>{fmtR(m.media)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total de cotações",   value: todas.length,                                    cor: C.red    },
          { label: "Com valor registrado", value: todas.filter((c) => c.valor).length,            cor: "#4a9eff" },
          { label: "Aprovadas",           value: todas.filter((c) => c.status === "Aprovada").length, cor: C.success },
        ].map((k) => (
          <div key={k.label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.cor }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Ranking de fornecedores */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.graphite, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>
          Histórico por fornecedor
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 600 }}>Fornecedor</th>
              <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 600 }}>Cotações</th>
              <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 600 }}>Aprovadas</th>
              <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 600 }}>Média geral</th>
              <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, color: C.muted, fontWeight: 600 }}>Média aprovadas</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((f, i) => (
              <tr key={f.nome} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 ? "#fafafa" : "#fff" }}>
                <td style={{ padding: "11px 20px", fontWeight: 600 }}>{f.nome}</td>
                <td style={{ padding: "11px 14px", textAlign: "right", color: C.muted }}>{f.total}</td>
                <td style={{ padding: "11px 14px", textAlign: "right", color: C.success, fontWeight: 600 }}>{f.aprovadas}</td>
                <td style={{ padding: "11px 20px", textAlign: "right", fontWeight: 700 }}>{fmtR(f.mediaAll)}</td>
                <td style={{ padding: "11px 20px", textAlign: "right", fontWeight: 700, color: f.mediaApr ? C.success : C.muted }}>
                  {f.mediaApr ? fmtR(f.mediaApr) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VirtualFornList({ lista, sel, onSelect }) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: lista.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const f = lista[vItem.index];
          const isSelected = sel?.id === f.id;
          return (
            <div
              key={f.id}
              onClick={() => onSelect(f)}
              style={{
                position: "absolute", top: vItem.start, width: "100%",
                padding: "12px 16px", cursor: "pointer", boxSizing: "border-box",
                borderBottom: `1px solid ${C.border}`,
                background: isSelected ? C.red + "10" : "#fff",
                borderLeft: isSelected ? `3px solid ${C.red}` : "3px solid transparent",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{f.nome}</div>
              <div style={{ fontSize: 11, color: C.muted, display: "flex", gap: 8 }}>
                <span>{f.especialidade}</span>
                {f.cidade && <span>· {f.cidade}</span>}
                <span style={{ marginLeft: "auto", color: STATUS_COR[f.status] || C.muted, fontWeight: 700 }}>
                  {f.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ESPECIALIDADES = [
  "Aço / Steel Frame", "Concreto / Fundação", "Elétrica", "Hidráulica",
  "Gesso / Drywall", "OSB / Madeira", "Cimentícia / Fachada", "Ferragens",
  "Tintas / Impermeabilização", "Vidros / Esquadrias", "Transporte", "Outros",
];

const STATUS_COR = { Ativo: C.success, Inativo: C.muted, "Lista negra": C.danger };
const COT_STATUS_COR = { Pendente: C.warning, Aprovada: C.success, Recusada: C.danger, Expirada: C.muted };

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{String(children).toUpperCase()}</div>;
}

const FORM_FORN = { nome: "", cnpj: "", email: "", telefone: "", especialidade: "Aço / Steel Frame", cidade: "", estado: "", status: "Ativo", observacoes: "" };
const FORM_COT  = { descricao: "", valor: "", data_validade: "", status: "Pendente", obra_id: "", observacoes: "" };

export default function Fornecedores() {
  useModuleLoad("fornecedores");
  useModuleLoad("obras");

  const fornecedores    = useAppStore((s) => s.fornecedores);
  const cotacoes        = useAppStore((s) => s.cotacoes);
  const obras           = useAppStore((s) => s.obras);
  const addFornecedor   = useAppStore((s) => s.addFornecedor);
  const updateFornecedor= useAppStore((s) => s.updateFornecedor);
  const deleteFornecedor= useAppStore((s) => s.deleteFornecedor);
  const loadCotacoes    = useAppStore((s) => s.loadCotacoes);
  const addCotacao      = useAppStore((s) => s.addCotacao);
  const updateCotacao   = useAppStore((s) => s.updateCotacao);
  const deleteCotacao   = useAppStore((s) => s.deleteCotacao);

  const [busca,      setBusca]      = useState("");
  const [filtroEsp,  setFiltroEsp]  = useState("Todos");
  const [sel,        setSel]        = useState(null);
  const [tab,        setTab]        = useState("cotacoes");
  const [viewMode,   setViewMode]   = useState("fornecedores"); // "fornecedores" | "indice"
  const [modal,      setModal]      = useState(null); // "novo-forn" | "editar-forn" | "nova-cot" | "editar-cot"
  const [form,       setForm]       = useState(FORM_FORN);
  const [formCot,    setFormCot]    = useState(FORM_COT);
  const [cotSel,     setCotSel]     = useState(null);
  const [isSaving,   setIsSaving]   = useState(false);
  const { toast, mostrarToast } = useToast();

  const set  = useCallback((k) => (v) => setForm((f) => ({ ...f, [k]: v })), []);
  const setC = useCallback((k) => (v) => setFormCot((f) => ({ ...f, [k]: v })), []);

  function abrirFornecedor(f) {
    setSel(f);
    setTab("cotacoes");
    loadCotacoes(f.id);
  }

  async function salvarFornecedor() {
    setIsSaving(true);
    try {
      if (modal === "novo-forn") {
        const data = await addFornecedor(form);
        setSel(data);
        mostrarToast("✅ Fornecedor cadastrado!");
      } else {
        await updateFornecedor(sel.id, form);
        setSel((s) => ({ ...s, ...form }));
        mostrarToast("✅ Fornecedor atualizado!");
      }
      setModal(null);
    } catch (e) {
      mostrarToast("❌ " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function excluirFornecedor(id) {
    if (!confirm("Excluir este fornecedor e suas cotações?")) return;
    await deleteFornecedor(id);
    if (sel?.id === id) setSel(null);
    mostrarToast("Fornecedor removido.");
  }

  async function salvarCotacao() {
    setIsSaving(true);
    try {
      const payload = {
        ...formCot,
        valor:    parseFloat(String(formCot.valor).replace(",", ".")) || null,
        obra_id:  formCot.obra_id || null,
        data_validade: formCot.data_validade || null,
      };
      if (modal === "nova-cot") {
        await addCotacao(sel.id, payload);
        mostrarToast("✅ Cotação registrada!");
      } else {
        await updateCotacao(sel.id, cotSel.id, payload);
        mostrarToast("✅ Cotação atualizada!");
      }
      setModal(null);
    } catch (e) {
      mostrarToast("❌ " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  const listaFiltrada = useMemo(() => fornecedores.filter((f) => {
    const ok = f.nome?.toLowerCase().includes(busca.toLowerCase()) ||
               f.especialidade?.toLowerCase().includes(busca.toLowerCase());
    const okEsp = filtroEsp === "Todos" || f.especialidade === filtroEsp;
    return ok && okEsp;
  }), [fornecedores, busca, filtroEsp]);

  const cotsSel = sel ? (cotacoes[sel.id] || []) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>

      {/* ── Toggle de view ── */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: "#fff", padding: "0 20px", flexShrink: 0 }}>
        {[["fornecedores","🏭 Fornecedores"],["indice","📈 Índice de Preços"],["monitor","🔍 Monitor de Mercado"]].map(([k, l]) => (
          <button key={k} onClick={() => setViewMode(k)} style={{
            padding: "14px 20px", border: "none", background: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 13, fontWeight: viewMode === k ? 700 : 400,
            color: viewMode === k ? C.red : C.muted,
            borderBottom: viewMode === k ? `3px solid ${C.red}` : "3px solid transparent",
            marginBottom: -1,
          }}>{l}</button>
        ))}
      </div>

      {viewMode === "indice" ? (
        <div style={{ flex: 1, overflowY: "auto" }}><IndicePrecos /></div>
      ) : viewMode === "monitor" ? (
        <div style={{ flex: 1, overflowY: "auto" }}><MonitorPrecos /></div>
      ) : (
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

      {/* ── Painel esquerdo ─────────────────────────────────────────────────── */}
      <div style={{
        width: 300, flexShrink: 0, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", height: "100%",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Fornecedores</h2>
              <p style={{ fontSize: 12, color: C.muted }}>{fornecedores.length} cadastrados</p>
            </div>
            <Btn size="sm" onClick={() => { setForm(FORM_FORN); setModal("novo-forn"); }}>+ Novo</Btn>
          </div>
          <input
            value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou especialidade..."
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <select
            value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)}
            style={{
              width: "100%", marginTop: 8, padding: "7px 10px", borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit",
              background: "#fff", outline: "none",
            }}
          >
            <option value="Todos">Todas as especialidades</option>
            {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>

        {/* Lista virtualizada */}
        <VirtualFornList lista={listaFiltrada} sel={sel} onSelect={abrirFornecedor} />
      </div>

      {/* ── Painel direito ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!sel ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}>
            Selecione um fornecedor para ver os detalhes
          </div>
        ) : (
          <>
            {/* Header do fornecedor */}
            <div style={{ padding: "20px 24px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>{sel.nome}</h3>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    {sel.especialidade} {sel.cidade ? `· ${sel.cidade}${sel.estado ? `/${sel.estado}` : ""}` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: C.muted }}>
                    {sel.telefone && <span>📞 {sel.telefone}</span>}
                    {sel.email    && <span>✉️ {sel.email}</span>}
                    {sel.cnpj     && <span>🏢 {sel.cnpj}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setForm({ ...FORM_FORN, ...sel }); setModal("editar-forn"); }}
                    style={{ padding: "7px 14px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    ✏️ Editar
                  </button>
                  <button onClick={() => excluirFornecedor(sel.id)}
                    style={{ padding: "7px 14px", background: C.danger + "15", border: `1px solid ${C.danger}44`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}>
                    🗑 Excluir
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 0 }}>
                {[["cotacoes","💰 Cotações"],["historico","📋 Histórico"]].map(([k, l]) => (
                  <button key={k} onClick={() => setTab(k)} style={{
                    padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 13, fontWeight: tab === k ? 700 : 400,
                    color: tab === k ? C.red : C.muted,
                    borderBottom: tab === k ? `3px solid ${C.red}` : "3px solid transparent",
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Conteúdo das tabs */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {tab === "cotacoes" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {cotsSel.length} cotação{cotsSel.length !== 1 ? "ões" : ""}
                    </div>
                    <Btn size="sm" onClick={() => { setFormCot(FORM_COT); setModal("nova-cot"); }}>+ Nova cotação</Btn>
                  </div>
                  {cotsSel.length === 0 && (
                    <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: "32px 0" }}>
                      Nenhuma cotação registrada para este fornecedor.
                    </div>
                  )}
                  {cotsSel.map((c) => (
                    <div key={c.id} style={{
                      background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10,
                      padding: "16px 18px", marginBottom: 12,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.descricao}</div>
                          {c.obras?.nome && (
                            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>🏗 {c.obras.nome}</div>
                          )}
                          {c.data_validade && (
                            <div style={{ fontSize: 11, color: C.muted }}>Válida até {new Date(c.data_validade).toLocaleDateString("pt-BR")}</div>
                          )}
                          {c.observacoes && (
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontStyle: "italic" }}>{c.observacoes}</div>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {c.valor != null && (
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.red, marginBottom: 6 }}>
                              R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          )}
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
                            background: (COT_STATUS_COR[c.status] || C.muted) + "22",
                            color: COT_STATUS_COR[c.status] || C.muted,
                          }}>{c.status}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                        <button onClick={() => { setFormCot({ ...FORM_COT, ...c, obra_id: c.obra_id || "" }); setCotSel(c); setModal("editar-cot"); }}
                          style={{ padding: "5px 12px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          ✏️ Editar
                        </button>
                        <button onClick={async () => { await deleteCotacao(sel.id, c.id); mostrarToast("Cotação removida."); }}
                          style={{ padding: "5px 12px", background: C.danger + "15", border: `1px solid ${C.danger}33`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {tab === "historico" && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Resumo de cotações</div>
                  {(["Aprovada","Pendente","Recusada","Expirada"]).map((st) => {
                    const items = cotsSel.filter((c) => c.status === st);
                    const total = items.reduce((a, c) => a + (Number(c.valor) || 0), 0);
                    return (
                      <div key={st} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 16px", background: "#fff", border: `1px solid ${C.border}`,
                        borderRadius: 8, marginBottom: 8,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: COT_STATUS_COR[st] || C.muted,
                            display: "inline-block",
                          }} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{st}</span>
                          <span style={{ fontSize: 12, color: C.muted }}>({items.length})</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                          {total > 0 ? `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                        </span>
                      </div>
                    );
                  })}
                  {sel.observacoes && (
                    <div style={{ marginTop: 20, padding: "14px 16px", background: C.dark, borderRadius: 8, fontSize: 13, color: C.graphite }}>
                      <strong>Observações:</strong> {sel.observacoes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </div>
      )}

      {/* ── Modal Fornecedor ────────────────────────────────────────────────── */}
      {(modal === "novo-forn" || modal === "editar-forn") && (
        <Modal title={modal === "novo-forn" ? "Novo fornecedor" : "Editar fornecedor"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><Label>Nome *</Label><Input value={form.nome} onChange={set("nome")} placeholder="Razão social ou nome fantasia" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><Label>CNPJ / CPF</Label><Input value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={set("telefone")} placeholder="(11) 99999-9999" /></div>
            </div>
            <div><Label>Email</Label><Input value={form.email} onChange={set("email")} type="email" /></div>
            <div><Label>Especialidade</Label><Select value={form.especialidade} onChange={set("especialidade")} options={ESPECIALIDADES.map((e) => ({ value: e, label: e }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={set("cidade")} /></div>
              <div><Label>Estado</Label><Input value={form.estado} onChange={set("estado")} placeholder="SP" /></div>
            </div>
            <div><Label>Status</Label><Select value={form.status} onChange={set("status")} options={["Ativo","Inativo","Lista negra"].map((v) => ({ value: v, label: v }))} /></div>
            <div><Label>Observações</Label><Input value={form.observacoes} onChange={set("observacoes")} placeholder="Notas internas" /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn disabled={!form.nome || isSaving} onClick={salvarFornecedor}>
                {isSaving ? "Salvando…" : modal === "novo-forn" ? "Cadastrar" : "Salvar"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal Cotação ───────────────────────────────────────────────────── */}
      {(modal === "nova-cot" || modal === "editar-cot") && (
        <Modal title={modal === "nova-cot" ? "Nova cotação" : "Editar cotação"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><Label>Descrição *</Label><Input value={formCot.descricao} onChange={setC("descricao")} placeholder="Ex: Perfis C 90mm — 500 pçs" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><Label>Valor (R$)</Label><Input value={formCot.valor} onChange={setC("valor")} type="number" min="0" /></div>
              <div><Label>Válida até</Label><Input value={formCot.data_validade} onChange={setC("data_validade")} type="date" /></div>
            </div>
            <div>
              <Label>Obra vinculada</Label>
              <Select
                value={formCot.obra_id}
                onChange={setC("obra_id")}
                options={[{ value: "", label: "Nenhuma" }, ...obras.map((o) => ({ value: o.id, label: o.nome }))]}
              />
            </div>
            <div><Label>Status</Label><Select value={formCot.status} onChange={setC("status")} options={["Pendente","Aprovada","Recusada","Expirada"].map((v) => ({ value: v, label: v }))} /></div>
            <div><Label>Observações</Label><Input value={formCot.observacoes} onChange={setC("observacoes")} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn disabled={!formCot.descricao || isSaving} onClick={salvarCotacao}>
                {isSaving ? "Salvando…" : modal === "nova-cot" ? "Registrar" : "Salvar"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "#1a1a1a", color: "#fff", padding: "12px 20px",
          borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>{toast}</div>
      )}
    </div>
  );
}
