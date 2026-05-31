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
  scraperCategoria,
  importarMonitores,
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

const CATEGORIAS_RAPIDAS = [
  { label: "Perfis Steel Frame",    url: "https://www.espacosmart.com.br/steel-framing/perfil-de-steel-framing?category-1=steel-framing&fuzzy=0&operator=and&category-2=perfil-de-steel-framing&facets=category-1%2Cfuzzy%2Coperator%2Ccategory-2&sort=score_desc&page=0" },
  { label: "Acessórios SF",         url: "https://www.espacosmart.com.br/steel-framing/perfil-de-steel-framing?category-1=steel-framing&fuzzy=0&operator=and&category-2=acessorios-de-steel-frame&facets=category-1%2Cfuzzy%2Coperator%2Ccategory-2&sort=score_desc&page=0" },
  { label: "Acessórios Drywall",    url: "https://www.espacosmart.com.br/steel-framing/perfil-de-steel-framing?category-1=steel-framing&fuzzy=0&operator=and&category-2=acessorios-para-drywall&facets=category-1%2Cfuzzy%2Coperator%2Ccategory-2&sort=score_desc&page=0" },
  { label: "Glasroc X",             url: "https://www.espacosmart.com.br/steel-framing/perfil-de-steel-framing?category-1=steel-framing&fuzzy=0&operator=and&category-2=glasroc-x&facets=category-1%2Cfuzzy%2Coperator%2Ccategory-2&sort=score_desc&page=0" },
  { label: "Membrana",              url: "https://www.espacosmart.com.br/steel-framing/perfil-de-steel-framing?category-1=steel-framing&fuzzy=0&operator=and&category-2=membrana&facets=category-1%2Cfuzzy%2Coperator%2Ccategory-2&sort=score_desc&page=0" },
  { label: "Siding Vinílico",       url: "https://www.espacosmart.com.br/steel-framing/perfil-de-steel-framing?category-1=steel-framing&fuzzy=0&operator=and&category-2=siding-vinilico&facets=category-1%2Cfuzzy%2Coperator%2Ccategory-2&sort=score_desc&page=0" },
  { label: "Smart Side",            url: "https://www.espacosmart.com.br/steel-framing/perfil-de-steel-framing?category-1=steel-framing&fuzzy=0&operator=and&category-2=smart-side&facets=category-1%2Cfuzzy%2Coperator%2Ccategory-2&sort=score_desc&page=0" },
  { label: "Todos SF",              url: "https://www.espacosmart.com.br/steel-framing/perfil-de-steel-framing?category-1=steel-framing&fuzzy=0&operator=and&category-2=acessorios&category-2=acessorios-de-steel-frame&category-2=acessorios-para-drywall&category-2=glasroc-x&category-2=membrana&category-2=perfil-de-steel-framing&category-2=siding-vinilico&category-2=smart-side&category-2=steel-frame-modular&facets=category-1%2Cfuzzy%2Coperator%2Ccategory-2&sort=score_desc&page=0" },
];

export default function MonitorPrecos() {
  const empresaId = useAppStore((s) => s.empresaId);
  const { toast, mostrarToast } = useToast();

  const [itens,    setItens]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [scraping, setScraping] = useState(null);
  const [busca,    setBusca]    = useState("");
  const [filtro,   setFiltro]   = useState("Todos");

  const [importModal,        setImportModal]        = useState(false);
  const [importUrl,          setImportUrl]          = useState("");
  const [importLoading,      setImportLoading]      = useState(false);
  const [importProdutos,     setImportProdutos]     = useState([]);
  const [importSelecionados, setImportSelecionados] = useState({});
  const [importando,         setImportando]         = useState(false);

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

  // ─── Comparação entre lojas (mesmo insumo_ref) ───────────────────────────────
  const comparacaoLojas = useMemo(() => {
    // Agrupa por insumo_ref os itens que têm preço
    const grupos = {};
    itens.forEach((i) => {
      if (!i.insumo_ref || !i.preco_atual) return;
      if (!grupos[i.insumo_ref]) grupos[i.insumo_ref] = [];
      grupos[i.insumo_ref].push(i);
    });
    // Para grupos com 2+ lojas, marca o mais barato e calcula diferença
    const info = {}; // id -> { melhor: bool, pct: number }
    Object.values(grupos).forEach((grupo) => {
      if (grupo.length < 2) return;
      const sorted = [...grupo].sort((a, b) => a.preco_atual - b.preco_atual);
      const minPreco = sorted[0].preco_atual;
      sorted.forEach((item, idx) => {
        const pct = ((item.preco_atual - minPreco) / minPreco) * 100;
        info[item.id] = { melhor: idx === 0, pct };
      });
    });
    return info;
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

  // ─── Import categoria ─────────────────────────────────────────────────────
  async function buscarCategoria() {
    if (!importUrl.trim()) return;
    setImportLoading(true);
    setImportProdutos([]);
    setImportSelecionados({});
    try {
      const res = await scraperCategoria(importUrl.trim());
      if (res?.status === "ok" && res.produtos?.length > 0) {
        setImportProdutos(res.produtos);
        const sel = {};
        res.produtos.forEach((_, i) => { sel[i] = true; });
        setImportSelecionados(sel);
        mostrarToast(`✅ ${res.produtos.length} produtos encontrados!`);
      } else {
        mostrarToast("⚠️ Nenhum produto encontrado. Verifique a URL.");
      }
    } catch (e) {
      mostrarToast("❌ Erro: " + e.message);
    } finally {
      setImportLoading(false);
    }
  }

  async function confirmarImport() {
    const selecionados = importProdutos.filter((_, i) => importSelecionados[i]);
    if (!selecionados.length) return;
    setImportando(true);
    try {
      await importarMonitores(selecionados);
      mostrarToast(`✅ ${selecionados.length} itens importados!`);
      setImportModal(false);
      setImportProdutos([]);
      setImportUrl("");
      carregar();
    } catch (e) {
      mostrarToast("❌ " + e.message);
    } finally {
      setImportando(false);
    }
  }

  const totalSelecionado = Object.values(importSelecionados).filter(Boolean).length;

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
          <button onClick={() => { setImportModal(true); setImportProdutos([]); setImportUrl(""); }} style={{
            padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: "#fff", color: C.text, fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>📦 Importar categoria</button>
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
                const vr     = variacao(item.preco_atual, item.preco_anterior);
                const isErr  = item.status === "Erro";
                const cmp    = comparacaoLojas[item.id];
                const rowBg  = isErr ? "#fff7ed" : cmp?.melhor ? "#f0fdf4" : "transparent";
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}`, background: rowBg }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{item.nome_produto}</span>
                        {cmp?.melhor && (
                          <span style={{ background: "#16a34a18", color: "#16a34a", border: "1px solid #16a34a33", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            💡 Melhor preço
                          </span>
                        )}
                        {cmp && !cmp.melhor && (
                          <span style={{ background: "#dc262618", color: "#dc2626", border: "1px solid #dc262633", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            +{cmp.pct.toFixed(0)}% mais caro
                          </span>
                        )}
                      </div>
                      {item.loja && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.loja}</div>}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#4a9eff", textDecoration: "none" }}>
                          🔗 ver site
                        </a>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 15, fontWeight: 800, color: isErr ? C.muted : cmp?.melhor ? "#16a34a" : C.text }}>
                      {isErr ? <span style={{ color: "#b97a00", fontSize: 12 }}>⚠️ Erro na captura</span> : fmtR(item.preco_atual)}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: C.muted }}>{fmtR(item.preco_anterior)}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: corVariacao(vr), fontSize: 14 }}>{fmtPct(vr)}</td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge v={vr} /></td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: C.muted }}>{fmtData(item.data_captura)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {item.url && (
                          <button onClick={() => atualizar(item)} disabled={scraping === item.id} title="Atualizar preço via scraping"
                            style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 13, color: C.muted }}>
                            {scraping === item.id ? "..." : "↺"}
                          </button>
                        )}
                        <button onClick={() => remover(item.id)} title="Remover"
                          style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 13, color: C.danger }}>
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

      {/* Modal importar categoria */}
      {importModal && (
        <Modal title="📦 Importar categoria" onClose={() => setImportModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 540 }}>

            {/* Categorias rápidas */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Categorias Espaço Smart</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIAS_RAPIDAS.map((c) => (
                  <button key={c.url} onClick={() => setImportUrl(c.url)} style={{
                    padding: "6px 14px", borderRadius: 20, border: `1px solid ${importUrl === c.url ? C.red : C.border}`,
                    background: importUrl === c.url ? C.red + "18" : "transparent",
                    color: importUrl === c.url ? C.red : C.muted,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>{c.label}</button>
                ))}
              </div>
            </div>

            {/* URL manual */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>URL da categoria</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://www.espacosmart.com.br/..."
                  style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", fontFamily: "inherit", background: C.dark }}
                />
                <button onClick={buscarCategoria} disabled={importLoading || !importUrl.trim()} style={{
                  padding: "9px 18px", borderRadius: 8, border: "none",
                  background: C.red, color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: importLoading ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                }}>
                  {importLoading ? "Buscando..." : "🔍 Buscar"}
                </button>
              </div>
            </div>

            {/* Lista de produtos encontrados */}
            {importProdutos.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                    {importProdutos.length} produtos encontrados
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => { const s = {}; importProdutos.forEach((_, i) => { s[i] = true; }); setImportSelecionados(s); }}
                      style={{ fontSize: 11, color: C.red, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Todos</button>
                    <button onClick={() => setImportSelecionados({})}
                      style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Nenhum</button>
                  </div>
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {importProdutos.map((p, i) => (
                    <label key={i} onClick={() => setImportSelecionados((prev) => ({ ...prev, [i]: !prev[i] }))} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                      borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${importSelecionados[i] ? C.red + "44" : C.border}`,
                      background: importSelecionados[i] ? C.red + "06" : "transparent",
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${importSelecionados[i] ? C.red : C.border}`,
                        background: importSelecionados[i] ? C.red : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {importSelecionados[i] && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome_produto}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{p.loja}{p.preco_atual ? ` · ${fmtR(p.preco_atual)}` : ""}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setImportModal(false)}>Cancelar</Btn>
              {importProdutos.length > 0 && (
                <Btn disabled={totalSelecionado === 0 || importando} onClick={confirmarImport}>
                  {importando ? "Importando..." : `✅ Importar ${totalSelecionado} itens`}
                </Btn>
              )}
            </div>
          </div>
        </Modal>
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
