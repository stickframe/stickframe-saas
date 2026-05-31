import { useState, useEffect, useMemo } from "react";
import { useToast } from "../hooks/useToast";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import {
  listarMonitorados,
  adicionarMonitor,
  atualizarPrecoMonitor,
  removerMonitor,
  scrapePreco,
} from "../services/repositories/precosRepository";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function variacao(atual, anterior) {
  if (!atual || !anterior || anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

function fmtPct(v) {
  if (v === null) return "—";
  const s = v > 0 ? "+" : "";
  return `${s}${v.toFixed(1)}%`;
}

function fmtR(v) {
  if (!v && v !== 0) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

const corVariacao = (v) => {
  if (v === null) return C.muted;
  if (v > 5) return "#dc2626";
  if (v < -5) return "#16a34a";
  return C.warning;
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ titulo, valor, cor, sub }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
      <div style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        {titulo}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: cor || C.red }}>{valor}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Badge status ─────────────────────────────────────────────────────────────
function StatusBadge({ v }) {
  if (v === null) return <span style={{ color: C.muted, fontSize: 12 }}>—</span>;
  const abs = Math.abs(v);
  const label = abs > 10 ? (v > 0 ? "🔴 Alta" : "🟢 Baixa") : abs > 3 ? "🟡 Variação" : "✅ Estável";
  const cor   = abs > 10 ? (v > 0 ? "#dc2626" : "#16a34a") : abs > 3 ? "#b97a00" : "#2e9e5b";
  const bg    = cor + "18";
  return (
    <span style={{ background: bg, color: cor, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
      {label}
    </span>
  );
}

// ─── Formulário de novo item ──────────────────────────────────────────────────
const FORM_VAZIO = { nome_produto: "", url: "", loja: "", insumo_ref: "", alerta_pct: "10" };

export default function MonitorPrecos() {
  const empresaId = useAppStore((s) => s.empresaId);
  const { toast, mostrarToast } = useToast();

  const [itens,    setItens]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [scraping, setScraping] = useState(null); // id do item sendo atualizado
  const [busca,    setBusca]    = useState("");
  const [filtro,   setFiltro]   = useState("Todos"); // Todos | Alta | Baixa | Estável | Erro

  useEffect(() => { if (empresaId) carregar(); }, [empresaId]);

  async function carregar() {
    setLoading(true);
    try {
      const data = await listarMonitorados();
      setItens(data || []);
    } catch (e) {
      mostrarToast("❌ Erro ao carregar: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    if (!form.nome_produto.trim()) return;
    setSalvando(true);
    try {
      await adicionarMonitor({
        nome_produto: form.nome_produto.trim(),
        url:          form.url.trim() || null,
        loja:         form.loja.trim() || null,
        insumo_ref:   form.insumo_ref.trim() || null,
        alerta_pct:   Number(form.alerta_pct) || 10,
      });
      mostrarToast("✅ Item adicionado!");
      setModal(false);
      setForm(FORM_VAZIO);
      carregar();
    } catch (e) {
      mostrarToast("❌ " + e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function atualizar(item) {
    if (!item.url) { mostrarToast("⚠️ Sem URL configurada para scraping."); return; }
    setScraping(item.id);
    try {
      const res = await scrapePreco(item.url);
      if (res?.preco) {
        await atualizarPrecoMonitor(item.id, {
          preco_atual:    res.preco,
          preco_anterior: item.preco_atual || res.preco,
          data_captura:   new Date().toISOString(),
          status:         "Ativo",
          erro_msg:       null,
        });
        mostrarToast("✅ Preço atualizado!");
        carregar();
      } else {
        await atualizarPrecoMonitor(item.id, { status: "Erro", erro_msg: res?.error || "Sem preço" });
        mostrarToast("⚠️ Não foi possível capturar o preço.");
        carregar();
      }
    } catch (e) {
      mostrarToast("❌ Erro no scraping: " + e.message);
    } finally {
      setScraping(null);
    }
  }

  async function remover(id) {
    try {
      await removerMonitor(id);
      mostrarToast("🗑️ Removido.");
      setItens((p) => p.filter((i) => i.id !== id));
    } catch (e) {
      mostrarToast("❌ " + e.message);
    }
  }

  // ─── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const comPreco = itens.filter((i) => i.preco_atual && i.preco_anterior);
    const vars     = comPreco.map((i) => variacao(i.preco_atual, i.preco_anterior));
    const media    = vars.length ? vars.reduce((a, v) => a + v, 0) / vars.length : null;
    const altas    = vars.filter((v) => v > 5).length;
    const baixas   = vars.filter((v) => v < -5).length;
    const erros    = itens.filter((i) => i.status === "Erro").length;
    return { media, altas, baixas, erros, total: itens.length };
  }, [itens]);

  // ─── Filtro + busca ──────────────────────────────────────────────────────────
  const lista = useMemo(() => {
    let r = itens;
    if (busca.trim()) r = r.filter((i) => i.nome_produto.toLowerCase().includes(busca.toLowerCase()) || (i.loja || "").toLowerCase().includes(busca.toLowerCase()));
    if (filtro === "Alta")    r = r.filter((i) => variacao(i.preco_atual, i.preco_anterior) > 5);
    if (filtro === "Baixa")   r = r.filter((i) => variacao(i.preco_atual, i.preco_anterior) < -5);
    if (filtro === "Estável") r = r.filter((i) => { const v = variacao(i.preco_atual, i.preco_anterior); return v !== null && Math.abs(v) <= 5; });
    if (filtro === "Erro")    r = r.filter((i) => i.status === "Erro");
    return r;
  }, [itens, busca, filtro]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ padding: 24, background: C.dark, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.text }}>Monitor de Preços</h1>
          <p style={{ marginTop: 6, color: C.muted, fontSize: 14 }}>Acompanhe a evolução dos materiais utilizados nas obras.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={carregar}>↺ Atualizar</Btn>
          <Btn onClick={() => setModal(true)}>+ Adicionar item</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard titulo="Itens Monitorados" valor={kpis.total} cor={C.text} />
        <KpiCard titulo="Variação Média" valor={fmtPct(kpis.media)} cor={kpis.media === null ? C.muted : corVariacao(kpis.media)} />
        <KpiCard titulo="Em Alta (>5%)" valor={kpis.altas} cor="#dc2626" sub="requerem atenção" />
        <KpiCard titulo="Em Baixa (<-5%)" valor={kpis.baixas} cor="#16a34a" sub="oportunidade de compra" />
        {kpis.erros > 0 && <KpiCard titulo="Erros de Captura" valor={kpis.erros} cor="#b97a00" />}
      </div>

      {/* Filtros */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar material ou loja..."
            style={{ flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, outline: "none", background: C.dark }}
          />
          {["Todos","Alta","Baixa","Estável","Erro"].map((f) => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: filtro === f ? C.red : C.dark,
              color: filtro === f ? "#fff" : C.muted,
              transition: "all .15s",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,.05)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: C.muted }}>Carregando...</div>
        ) : lista.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center", color: C.muted }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              {itens.length === 0 ? "Nenhum item monitorado" : "Nenhum item encontrado"}
            </div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>
              {itens.length === 0 ? "Adicione materiais para acompanhar variações de preço." : "Tente outro filtro ou termo de busca."}
            </div>
            {itens.length === 0 && <Btn onClick={() => setModal(true)}>+ Adicionar primeiro item</Btn>}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Material / Loja", "Preço Atual", "30 dias", "Variação", "Status", "Atualizado", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, background: "#fafafa", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((item) => {
                const vr = variacao(item.preco_atual, item.preco_anterior);
                const isErr = item.status === "Erro";
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}`, background: isErr ? "#fff7ed" : "transparent" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{item.nome_produto}</div>
                      {item.loja && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.loja}</div>}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#4a9eff", textDecoration: "none" }}>
                          🔗 ver site
                        </a>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 15, fontWeight: 800, color: isErr ? C.muted : C.text }}>
                      {isErr ? <span style={{ color: "#b97a00", fontSize: 12 }}>⚠️ Erro na captura</span> : fmtR(item.preco_atual)}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: C.muted }}>{fmtR(item.preco_anterior)}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: corVariacao(vr), fontSize: 14 }}>{fmtPct(vr)}</td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge v={vr} /></td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: C.muted }}>{fmtData(item.data_captura)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {item.url && (
                          <button
                            onClick={() => atualizar(item)}
                            disabled={scraping === item.id}
                            title="Atualizar preço via scraping"
                            style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 13, color: C.muted }}
                          >
                            {scraping === item.id ? "..." : "↺"}
                          </button>
                        )}
                        <button
                          onClick={() => remover(item.id)}
                          title="Remover"
                          style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 13, color: C.danger }}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#fff", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,.2)" }}>
          {toast}
        </div>
      )}

      {/* Modal novo item */}
      {modal && (
        <Modal title="Adicionar item monitorado" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nome do material *</label>
              <Input value={form.nome_produto} onChange={set("nome_produto")} placeholder="Ex: Montante 90mm, OSB 11mm..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Loja</label>
                <Input value={form.loja} onChange={set("loja")} placeholder="Ex: Leroy Merlin" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Alerta (% variação)</label>
                <Input value={form.alerta_pct} onChange={set("alerta_pct")} type="number" min="1" max="100" placeholder="10" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>URL do produto (para scraping automático)</label>
              <Input value={form.url} onChange={set("url")} placeholder="https://..." />
            </div>
            <div style={{ fontSize: 12, color: C.muted, background: C.dark, borderRadius: 8, padding: "10px 14px" }}>
              💡 Se informar a URL, o sistema tentará capturar o preço automaticamente ao clicar em "↺ Atualizar".
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn disabled={!form.nome_produto.trim() || salvando} onClick={salvar}>
                {salvando ? "Salvando..." : "Adicionar"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
