import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { useToast } from "../hooks/useToast";
import { useDebounce } from "../hooks/useDebounce";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import IndicePrecos from "../components/fornecedores/IndicePrecos";
import Concorrencias from "./Concorrencias";
import { printHtml } from "../utils/printHtml";
import { enviarWhatsApp } from "../services/whatsappService";

/*  Inline SVG icons (Lucide style)  */
const ICONS = {
  truck:     <g><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></g>,
  compete:   <g><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></g>,
  chart:     <g><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></g>,
  trend:     <g><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></g>,
  search:    <g><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></g>,
  plus:      <path d="M12 5v14M5 12h14"/>,
  building:  <g><rect x="3" y="7" width="18" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></g>,
  mappin:    <g><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></g>,
  phone:     <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>,
  mail:      <g><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></g>,
  pencil:    <g><path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></g>,
  trash:     <g><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></g>,
  cart:      <g><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2.5 3h2l2.7 13.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L23 6H6"/></g>,
  hardhat:   <g><path d="M2 18a10 10 0 0 1 20 0M4 18v2h16v-2M10 4h4v4a2 2 0 0 1-4 0z"/></g>,
  doc:       <g><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4M9 13h6M9 17h6"/></g>,
  check:     <path d="M20 6 9 17l-5-5"/>,
  alert:     <g><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></g>,
  listview:  <g><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></g>,
  gridview:  <g><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g>,
  trendUp:   <g><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></g>,
  trendDn:   <g><path d="M3 7l6 6 4-4 8 8"/><path d="M17 17h4v-4"/></g>,
  arrow:     <path d="m9 18 6-6-6-6"/>,
  box:       <g><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z"/><path d="M12 22V9.5"/><path d="M22 8.5l-10 5.5L2 8.5"/></g>,
  layers:    <g><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></g>,
  thermo:    <g><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></g>,
  wrench:    <g><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></g>,
};

function Ic({ n, w = 15, c, style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: w, height: w, flexShrink: 0, ...style }}>
      {ICONS[n]}
    </svg>
  );
}

const ESPECIALIDADES = [
  "Aço / Steel Frame", "Concreto / Fundação", "Elétrica", "Hidráulica",
  "Gesso / Drywall", "OSB / Madeira", "Cimentícia / Fachada", "Ferragens",
  "Tintas / Impermeabilização", "Vidros / Esquadrias", "Transporte", "Outros",
];

const STATUS_COR     = { Ativo: C.success, Inativo: C.muted, "Lista negra": C.danger };
const COT_STATUS_COR = { Pendente: C.warning, Aprovada: C.success, Recusada: C.danger, Expirada: C.muted };

const FORM_FORN = { nome: "", cnpj: "", email: "", telefone: "", especialidade: "Aço / Steel Frame", cidade: "", estado: "", status: "Ativo", observacoes: "" };
const FORM_COT  = { descricao: "", valor: "", data_validade: "", status: "Pendente", obra_id: "", observacoes: "" };

function Label({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{children}</div>;
}

function StatusPill({ status }) {
  const ativo = status === "Ativo";
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 5, letterSpacing: 0.3,
      background: ativo ? "#e8f3eb" : "#fdf0ef", color: ativo ? C.success : C.danger,
    }}>{status}</span>
  );
}

function VirtualFornList({ lista, sel, onSelect }) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({ count: lista.length, getScrollElement: () => parentRef.current, estimateSize: () => 78, overscan: 5 });

  return (
    <div ref={parentRef} style={{ flex: 1, overflowY: "auto", padding: "4px 14px 14px" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const f = lista[vItem.index];
          const isSelected = sel?.id === f.id;
          return (
            <div key={f.id} onClick={() => onSelect(f)} style={{
              position: "absolute", top: vItem.start, width: "100%",
              boxSizing: "border-box", cursor: "pointer", padding: "1px 0",
            }}>
              <div style={{
                background: isSelected ? C.brickSoft : C.surface,
                border: `1.5px solid ${isSelected ? C.red : C.border}`,
                borderRadius: 10, padding: "12px 13px",
                boxShadow: isSelected ? "0 2px 8px rgba(152,25,21,.08)" : "none",
                transition: ".12s",
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.nome}</div>
                <div style={{ fontSize: 11.5, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.especialidade}</span>
                  {f.cidade && <><span>·</span><span style={{ whiteSpace: "nowrap" }}>{f.cidade}</span></>}
                  <span style={{ marginLeft: "auto" }}><StatusPill status={f.status} /></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/*  Monitor de Mercado — Lista / Cards + variação colorida  */
const CAT_ICON = {
  "Estrutura de Aço": { icon: "layers", bg: "#eef3f9", ic: C.steel },
  "Estrutura":        { icon: "layers", bg: "#eef3f9", ic: C.steel },
  "Fechamento":       { icon: "box",    bg: "#f3f0f8", ic: C.plum },
  "Isolamento":       { icon: "thermo", bg: "#eef5ef", ic: C.sage },
  "Fixação":          { icon: "wrench", bg: "#f5f0ec", ic: C.clay },
};
function catStyle(cat) { return CAT_ICON[cat] || { icon: "box", bg: C.surface2, ic: C.muted }; }

function fmtBRL(v) { return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

function gerarHistorico(precoAntigo, precoNovo) {
  const diff = precoNovo - precoAntigo;
  const step = diff / 5;
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const noise = (Math.random() - 0.5) * (diff * 0.2);
    let p = precoAntigo + step * i;
    if (i > 0 && i < 5) p += noise;
    return Number(p.toFixed(2));
  });
}

function mockMonitorados() {
  return [
    { id: 1, nome_produto: "Montante LSF C 90x40x15x1,25mm", categoria: "Estrutura de Aço", loja: "Distribuidor Nacional", preco_atual: 18.50, preco_anterior: 15.53, unidade: "pç" },
    { id: 2, nome_produto: "Placa OSB 11,1mm (1,22x2,44)", categoria: "Fechamento", loja: "LP Brasil", preco_atual: 52.00, preco_anterior: 55.00, unidade: "chp" },
    { id: 3, nome_produto: "Placa Cimentícia 10mm", categoria: "Fechamento", loja: "Brasilit", preco_atual: 65.00, preco_anterior: 63.80, unidade: "chp" },
    { id: 4, nome_produto: "Lã de Vidro 50mm", categoria: "Isolamento", loja: "Isover", preco_atual: 16.00, preco_anterior: 16.00, unidade: "m²" },
    { id: 5, nome_produto: "Parafuso TEX 4,2×16mm", categoria: "Fixação", loja: "Atacadão dos Parafusos", preco_atual: 48.00, preco_anterior: 42.00, unidade: "cx" },
  ];
}

function VarBadge({ pct, inline }) {
  const up = pct > 0, dn = pct < 0;
  const color = up ? C.danger : dn ? C.success : C.muted;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color, fontSize: inline ? 12 : 12.5 }}>
      {pct !== 0 && <Ic n={up ? "trendUp" : "trendDn"} w={12} c={color} />}
      {pct === 0 ? (inline ? "—" : "Estável") : (up ? "+" : "") + pct.toFixed(1) + "%"}
    </span>
  );
}

function Sparkline({ hist, color }) {
  const bars = (hist && hist.length ? hist : [40, 35, 45, 38, 50, 45]);
  const min = Math.min(...bars), max = Math.max(...bars), span = max - min || 1;
  return (
    <div style={{ width: 60, height: 24, display: "flex", alignItems: "flex-end", gap: 2 }}>
      {bars.map((v, i) => (
        <div key={i} style={{
          flex: 1, height: (20 + ((v - min) / span) * 80) + "%", borderRadius: "2px 2px 0 0",
          background: i === bars.length - 1 ? color : "#efeae2",
        }} />
      ))}
    </div>
  );
}

function MonitorDeMercado() {
  const [modo, setModo] = useState("lista");
  const [q, setQ] = useState("");
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("../services/repositories/precosRepository")
      .then((m) => (m.listarMonitorados ? m.listarMonitorados() : mockMonitorados()))
      .then((data) => setItens(data && data.length > 0 ? data : mockMonitorados()))
      .catch(() => setItens(mockMonitorados()))
      .finally(() => setLoading(false));
  }, []);

  const linhas = useMemo(() => itens.map((it) => {
    const ant = it.preco_anterior || it.preco_atual;
    const pct = ant ? ((it.preco_atual - ant) / ant) * 100 : 0;
    const cs = catStyle(it.categoria);
    return {
      ...it, pct,
      hist: it.historico?.map?.((h) => (typeof h === "number" ? h : h.preco)) || gerarHistorico(ant, it.preco_atual),
      ...cs,
    };
  }), [itens]);

  const filtradas = linhas.filter((m) =>
    m.nome_produto?.toLowerCase().includes(q.toLowerCase()) ||
    (m.categoria || "").toLowerCase().includes(q.toLowerCase()));

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando monitor de preços…</div>;

  const emAlta = linhas.filter((m) => m.pct > 0).length;
  const emBaixa = linhas.filter((m) => m.pct < 0).length;
  const estaveis = linhas.filter((m) => m.pct === 0).length;
  const alerta = [...linhas].filter((m) => m.pct > 10).sort((a, b) => b.pct - a.pct)[0];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--cond)", fontWeight: 700, fontSize: 26, color: C.text }}>Monitor de Mercado</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Variação de preços de insumos Steel Frame — referência atual</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative", width: 220 }}>
            <Ic n="search" w={13} c={C.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar material…"
              style={{ width: "100%", boxSizing: "border-box", background: C.surface2, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 10px 8px 30px", fontSize: 13, fontFamily: "inherit", color: C.text, outline: "none" }} />
          </div>
          <div style={{ display: "flex", border: `1.5px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            {[{ id: "lista", ic: "listview" }, { id: "cards", ic: "gridview" }].map((m) => (
              <button key={m.id} onClick={() => setModo(m.id)} title={m.id === "lista" ? "Lista" : "Cards"}
                style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "none", cursor: "pointer", background: modo === m.id ? C.red : C.surface, transition: ".12s" }}>
                <Ic n={m.ic} w={14} c={modo === m.id ? "#fff" : C.muted} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {alerta && (
        <div style={{ background: C.danger + "0d", border: `1px solid ${C.danger}44`, borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
          <Ic n="alert" w={20} c={C.danger} style={{ marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.danger, marginBottom: 3 }}>Alerta de Margem: alta expressiva em {alerta.categoria || "Insumos"}</div>
            <div style={{ fontSize: 12.5, color: C.danger, lineHeight: 1.5 }}>
              O item <strong>{alerta.nome_produto}</strong> registrou alta de <strong>+{alerta.pct.toFixed(1)}%</strong>. Reveja os orçamentos abertos que dependem dele.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[{ l: "Em alta", v: emAlta, c: C.danger }, { l: "Em baixa", v: emBaixa, c: C.success }, { l: "Estáveis", v: estaveis, c: C.text }].map((k) => (
          <div key={k.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 5 }}>{k.l}</div>
            <div className="num" style={{ fontSize: 30, fontWeight: 700, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {modo === "lista" ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["Material", "Categoria", "Unidade", "Preço ref.", "Variação 30d", "Tendência"].map((h) => (
                <th key={h} style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", padding: "10px 12px", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtradas.map((m) => (
                <tr key={m.id}>
                  <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 600, color: C.text, borderBottom: `1px solid #efeae2` }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 6, background: m.bg, display: "grid", placeItems: "center", flexShrink: 0 }}><Ic n={m.icon} w={13} c={m.ic} /></span>
                      {m.nome_produto}
                    </span>
                  </td>
                  <td style={{ padding: "11px 12px", fontSize: 13, color: C.muted, borderBottom: `1px solid #efeae2` }}>{m.categoria || "—"}</td>
                  <td style={{ padding: "11px 12px", fontSize: 13, color: C.muted, borderBottom: `1px solid #efeae2` }}>{m.unidade}</td>
                  <td className="num" style={{ padding: "11px 12px", fontSize: 15, fontWeight: 700, color: C.text, borderBottom: `1px solid #efeae2` }}>{fmtBRL(m.preco_atual)}</td>
                  <td style={{ padding: "11px 12px", borderBottom: `1px solid #efeae2` }}><VarBadge pct={m.pct} inline /></td>
                  <td style={{ padding: "11px 12px", borderBottom: `1px solid #efeae2` }}><Sparkline hist={m.hist} color={m.pct > 0 ? C.danger : m.pct < 0 ? C.success : C.border} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {filtradas.map((m) => (
            <div key={m.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: m.bg, display: "grid", placeItems: "center", marginBottom: 10 }}><Ic n={m.icon} w={15} c={m.ic} /></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{m.nome_produto}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{m.categoria || "Material"} · {m.unidade}</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>{fmtBRL(m.preco_atual)}</div>
              <VarBadge pct={m.pct} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Fornecedores() {
  useModuleLoad("fornecedores");
  useModuleLoad("obras");

  const fornecedores    = useAppStore((s) => s.fornecedores);
  const cotacoes        = useAppStore((s) => s.cotacoes);
  const obras           = useAppStore((s) => s.obras);
  const user            = useAppStore((s) => s.user);
  const addFornecedor   = useAppStore((s) => s.addFornecedor);
  const updateFornecedor= useAppStore((s) => s.updateFornecedor);
  const deleteFornecedor= useAppStore((s) => s.deleteFornecedor);
  const loadCotacoes    = useAppStore((s) => s.loadCotacoes);
  const addCotacao      = useAppStore((s) => s.addCotacao);
  const updateCotacao   = useAppStore((s) => s.updateCotacao);
  const deleteCotacao   = useAppStore((s) => s.deleteCotacao);
  const addLancamento   = useAppStore((s) => s.addLancamento);

  const [busca,     setBusca]     = useState("");
  const [filtroEsp, setFiltroEsp] = useState("Todos");
  const [sel,       setSel]       = useState(null);
  const [tab,       setTab]       = useState("cotacoes");
  const [viewMode,  setViewMode]  = useState("fornecedores");
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState(FORM_FORN);
  const [formCot,   setFormCot]   = useState(FORM_COT);
  const [cotSel,    setCotSel]    = useState(null);
  const [isSaving,  setIsSaving]  = useState(false);
  const [poModal,   setPoModal]   = useState(null); // cotação selecionada para gerar PO
  const [poForm,    setPoForm]    = useState({ local_entrega: "", condicao_pagamento: "30 dias", observacoes_po: "" });
  const { toast, mostrarToast }   = useToast();

  const buscaDebounced = useDebounce(busca, 300);

  const set  = useCallback((k) => (v) => setForm((f) => ({ ...f, [k]: v })), []);
  const setC = useCallback((k) => (v) => setFormCot((f) => ({ ...f, [k]: v })), []);

  function abrirFornecedor(f) { setSel(f); setTab("cotacoes"); loadCotacoes(f.id); }

  async function salvarFornecedor() {
    setIsSaving(true);
    try {
      if (modal === "novo-forn") {
        const data = await addFornecedor(form); setSel(data); mostrarToast("Fornecedor cadastrado!");
      } else {
        await updateFornecedor(sel.id, form); setSel((s) => ({ ...s, ...form })); mostrarToast("Fornecedor atualizado!");
      }
      setModal(null);
    } catch (e) { mostrarToast(e.message); }
    finally { setIsSaving(false); }
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
      const payload = { ...formCot, valor: parseFloat(String(formCot.valor).replace(",", ".")) || null, obra_id: formCot.obra_id || null, data_validade: formCot.data_validade || null };
      if (modal === "nova-cot") { await addCotacao(sel.id, payload); mostrarToast("Cotação registrada!"); }
      else { await updateCotacao(sel.id, cotSel.id, payload); mostrarToast("Cotação atualizada!"); }
      setModal(null);
    } catch (e) { mostrarToast(e.message); }
    finally { setIsSaving(false); }
  }

  async function gerarPedidoCompra() {
    const c = poModal;
    const forn = sel;
    const obra = obras.find((o) => o.id === c.obra_id);
    const empresa = user?.empresa || user?.nome || "Construtora";
    const poNum = `PO-${Date.now().toString().slice(-6)}`;
    const dataEmissao = new Date().toLocaleDateString("pt-BR");
    const valorFmt = c.valor != null ? `R$ ${Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "A definir";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${poNum}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a1a; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #c0392b; padding-bottom: 20px; margin-bottom: 28px; }
  .logo-area h1 { margin: 0; font-size: 24px; color: #c0392b; font-weight: 900; letter-spacing: -0.5px; }
  .logo-area p { margin: 4px 0 0; font-size: 12px; color: #666; }
  .po-badge { background: #c0392b; color: #fff; padding: 10px 20px; border-radius: 8px; text-align: center; }
  .po-badge .num { font-size: 18px; font-weight: 900; }
  .po-badge .label { font-size: 11px; letter-spacing: 1px; opacity: 0.85; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #c0392b; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 3px; }
  .field span { font-size: 13px; font-weight: 600; }
  .item-table { width: 100%; border-collapse: collapse; }
  .item-table th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; text-align: left; border-bottom: 2px solid #ddd; }
  .item-table td { padding: 14px; border-bottom: 1px solid #eee; font-size: 13px; }
  .item-table .valor { font-size: 18px; font-weight: 900; color: #c0392b; text-align: right; }
  .footer { margin-top: 48px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; }
  .assinatura { border-top: 1px solid #333; width: 200px; padding-top: 8px; font-size: 11px; color: #666; text-align: center; }
  .obs { background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #555; }
</style></head><body>
<div class="header">
  <div class="logo-area">
    <h1>${empresa}</h1>
    <p>Pedido de Compra Oficial · ${dataEmissao}</p>
  </div>
  <div class="po-badge">
    <div class="label">PEDIDO DE COMPRA</div>
    <div class="num">${poNum}</div>
    <div style="font-size:10px;margin-top:3px;opacity:.8">${dataEmissao}</div>
  </div>
</div>

<div class="grid-2">
  <div class="section">
    <div class="section-title">Fornecedor</div>
    <div class="field" style="margin-bottom:8px"><label>Razão Social</label><span>${forn.nome}</span></div>
    ${forn.cnpj ? `<div class="field" style="margin-bottom:8px"><label>CNPJ</label><span>${forn.cnpj}</span></div>` : ""}
    ${forn.telefone ? `<div class="field" style="margin-bottom:8px"><label>Telefone</label><span>${forn.telefone}</span></div>` : ""}
    ${forn.email ? `<div class="field" style="margin-bottom:8px"><label>E-mail</label><span>${forn.email}</span></div>` : ""}
  </div>
  <div class="section">
    <div class="section-title">Dados da Entrega</div>
    ${obra ? `<div class="field" style="margin-bottom:8px"><label>Obra</label><span>${obra.nome}</span></div>` : ""}
    ${poForm.local_entrega ? `<div class="field" style="margin-bottom:8px"><label>Local de Entrega</label><span>${poForm.local_entrega}</span></div>` : ""}
    <div class="field" style="margin-bottom:8px"><label>Condição de Pagamento</label><span>${poForm.condicao_pagamento}</span></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Item do Pedido</div>
  <table class="item-table">
    <thead><tr><th>#</th><th>Descrição</th><th>Valor Total</th></tr></thead>
    <tbody>
      <tr>
        <td>01</td>
        <td>${c.descricao}</td>
        <td class="valor">${valorFmt}</td>
      </tr>
    </tbody>
  </table>
</div>

${(c.observacoes || poForm.observacoes_po) ? `
<div class="section">
  <div class="section-title">Observações</div>
  <div class="obs">${[c.observacoes, poForm.observacoes_po].filter(Boolean).join(" · ")}</div>
</div>` : ""}

<div class="footer">
  <div class="assinatura">${empresa}<br>Responsável pela Compra</div>
  <div style="font-size:11px;color:#999;text-align:right">Emitido em ${dataEmissao}<br>Pedido Nº ${poNum}</div>
</div>
</body></html>`;

    // 1. Gerar PDF
    printHtml(html, `pedido-compra-${poNum}`);

    // 2. Criar despesa Pendente no Financeiro
    if (c.obra_id && c.valor) {
      try {
        await addLancamento(c.obra_id, {
          tipo: "despesa",
          categoria: "Materiais",
          descricao: `${poNum} · ${c.descricao} — ${forn.nome}`,
          valor: Number(c.valor),
          data: new Date().toISOString().slice(0, 10),
          data_vencimento: c.data_validade || null,
        });
      } catch (e) { /* despesa opcional */ }
    }

    // 3. WhatsApp ao fornecedor
    if (forn.telefone) {
      const msg = `Olá ${forn.nome.split(" ")[0]}! Segue nosso Pedido de Compra ${poNum}:\n\n*${c.descricao}*\n*${valorFmt}*\nEmissão: ${dataEmissao}${obra ? `\nObra: ${obra.nome}` : ""}\n\nCondição de pagamento: ${poForm.condicao_pagamento}\n\nAguardamos confirmação do recebimento. Obrigado!`;
      enviarWhatsApp(forn.telefone, msg);
    }

    setPoModal(null);
    mostrarToast(`PO ${poNum} gerado!${forn.telefone ? " WhatsApp aberto." : ""}`);
  }

  const listaFiltrada = useMemo(() => fornecedores.filter((f) => {
    const q = buscaDebounced.toLowerCase();
    const ok = f.nome?.toLowerCase().includes(q) || f.especialidade?.toLowerCase().includes(q);
    return ok && (filtroEsp === "Todos" || f.especialidade === filtroEsp);
  }), [fornecedores, buscaDebounced, filtroEsp]);

  const cotsSel = sel ? (cotacoes[sel.id] || []) : [];
  const totalAprovadas = cotsSel.filter((c) => c.status === "Aprovada").length;
  const mediaGeral = (() => {
    const vals = cotsSel.map((c) => Number(c.valor)).filter((v) => v > 0);
    if (!vals.length) return "—";
    return "R$ " + (vals.reduce((a, b) => a + b, 0) / vals.length).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  })();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const TABS = [
    { k: "fornecedores", l: "Fornecedores", ic: "truck" },
    { k: "concorrencias", l: "Concorrências", ic: "compete" },
    { k: "indice", l: "Índice de Preços", ic: "chart" },
    { k: "monitor", l: "Monitor de Mercado", ic: "trend" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative", background: C.bg }}>

      {/*  Tab bar  */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.surface, padding: "0 24px", flexShrink: 0 }}>
        {TABS.map((t) => {
          const on = viewMode === t.k;
          return (
            <button key={t.k} onClick={() => setViewMode(t.k)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "14px 18px 13px", border: "none", background: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: on ? C.red : C.muted,
              borderBottom: on ? `2.5px solid ${C.red}` : "2.5px solid transparent", marginBottom: -1, whiteSpace: "nowrap",
            }}>
              <Ic n={t.ic} w={14} c={on ? C.red : C.muted} />{t.l}
            </button>
          );
        })}
      </div>

      {viewMode === "concorrencias" && <div style={{ flex: 1, overflow: "hidden" }}><Concorrencias /></div>}
      {viewMode === "indice"        && <div style={{ flex: 1, overflowY: "auto" }}><IndicePrecos /></div>}
      {viewMode === "monitor"       && <div style={{ flex: 1, overflowY: "auto" }}><MonitorDeMercado /></div>}

      {viewMode === "fornecedores" && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

          {/*  Painel esquerdo  */}
          <div style={{ width: isMobile ? "100%" : 340, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: isMobile && sel ? "none" : "flex", flexDirection: "column", height: "100%", background: C.surface }}>
            <div style={{ padding: "20px 16px 8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "var(--cond)", fontWeight: 700, fontSize: 22, color: C.text, lineHeight: 1 }}>Fornecedores</div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{fornecedores.length} cadastrados</div>
                </div>
                <Btn size="sm" onClick={() => { setForm(FORM_FORN); setModal("novo-forn"); }}><Ic n="plus" w={13} c="#fff" /> Novo</Btn>
              </div>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <Ic n="search" w={13} c={C.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou especialidade…"
                  style={{ width: "100%", boxSizing: "border-box", background: C.surface2, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 10px 8px 30px", fontSize: 13, fontFamily: "inherit", color: C.text, outline: "none" }} />
              </div>
              <select value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", color: C.muted, outline: "none", cursor: "pointer" }}>
                <option value="Todos">Todas as especialidades</option>
                {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            {listaFiltrada.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>Nenhum fornecedor encontrado.</div>
            ) : (
              <VirtualFornList lista={listaFiltrada} sel={sel} onSelect={abrirFornecedor} />
            )}
          </div>

          {/*  Painel direito  */}
          <div style={{ flex: 1, display: isMobile && !sel ? "none" : "flex", flexDirection: "column", overflow: "hidden" }}>
            {!sel ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: C.surface2, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", marginBottom: 18 }}>
                  <Ic n="building" w={26} c={C.muted} />
                </div>
                <div style={{ fontFamily: "var(--cond)", fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 7 }}>Selecione um fornecedor</div>
                <div style={{ fontSize: 13, color: C.muted, maxWidth: 280, lineHeight: 1.6 }}>Clique em um fornecedor da lista para ver os dados de contato, histórico de cotações e avaliações.</div>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                {isMobile && (
                  <button onClick={() => setSel(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.red, padding: "0 0 12px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                    <Ic n="arrow" w={13} c={C.red} style={{ transform: "rotate(180deg)" }} /> Voltar
                  </button>
                )}

                {/* hero */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: C.red, display: "grid", placeItems: "center", fontFamily: "var(--cond)", fontWeight: 700, fontSize: 18, color: "#fff", flexShrink: 0 }}>{(sel.nome || "?")[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--cond)", fontWeight: 700, fontSize: 22, color: C.text, lineHeight: 1.1 }}>{sel.nome}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span>{sel.especialidade}</span>
                      {sel.cidade && <><span>·</span><span style={{ display: "flex", alignItems: "center", gap: 4 }}><Ic n="mappin" w={11} c={C.muted} />{sel.cidade}{sel.estado ? `, ${sel.estado}` : ""}</span></>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <StatusPill status={sel.status} />
                    <button onClick={() => { setForm({ ...FORM_FORN, ...sel }); setModal("editar-forn"); }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>
                      <Ic n="pencil" w={13} /> Editar
                    </button>
                    <button onClick={() => excluirFornecedor(sel.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", background: C.danger + "15", border: `1px solid ${C.danger}44`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}>
                      <Ic n="trash" w={13} c={C.danger} />
                    </button>
                  </div>
                </div>

                {/* info grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>CNPJ / CPF</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{sel.cnpj || "—"}</div>
                  </div>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Ic n="phone" w={13} c={C.muted} />
                    <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Telefone</div><div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{sel.telefone || "—"}</div></div>
                  </div>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Ic n="mail" w={13} c={C.muted} />
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>E-mail</div><div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis" }}>{sel.email || "—"}</div></div>
                  </div>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Especialidade</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{sel.especialidade || "—"}</div>
                  </div>
                </div>

                {/* sub-tabs */}
                <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
                  {[["cotacoes", "Cotações", "cart"], ["historico", "Histórico", "doc"]].map(([k, l, ic]) => {
                    const on = tab === k;
                    return (
                      <button key={k} onClick={() => setTab(k)} style={{
                        display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
                        fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: on ? C.red : C.muted,
                        borderBottom: on ? `2.5px solid ${C.red}` : "2.5px solid transparent", marginBottom: -1,
                      }}><Ic n={ic} w={13} c={on ? C.red : C.muted} />{l}</button>
                    );
                  })}
                </div>

                {tab === "cotacoes" && (
                  <>
                    {/* mini stats */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.1, color: C.muted, textTransform: "uppercase" }}>Histórico de cotações</div>
                        <Btn size="sm" onClick={() => { setFormCot(FORM_COT); setModal("nova-cot"); }}><Ic n="plus" w={13} c="#fff" /> Nova cotação</Btn>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                        {[{ l: "Total", v: cotsSel.length }, { l: "Aprovadas", v: totalAprovadas }, { l: "Média geral", v: mediaGeral }].map((k) => (
                          <div key={k.l}>
                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>{k.l}</div>
                            <div className="num" style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{k.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {cotsSel.length === 0 && (
                      <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: "32px 0" }}>Nenhuma cotação registrada para este fornecedor.</div>
                    )}
                    {cotsSel.map((c) => (
                      <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 5 }}>{c.descricao}</div>
                            {c.obras?.nome   && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}><Ic n="hardhat" w={13} c={C.muted} /> {c.obras.nome}</div>}
                            {c.data_validade && <div style={{ fontSize: 11, color: C.muted }}>Válida até {new Date(c.data_validade).toLocaleDateString("pt-BR")}</div>}
                            {c.observacoes   && <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontStyle: "italic" }}>{c.observacoes}</div>}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            {c.valor != null && <div className="num" style={{ fontSize: 20, fontWeight: 700, color: C.red, marginBottom: 6 }}>R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>}
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 5, background: (COT_STATUS_COR[c.status] || C.muted) + "22", color: COT_STATUS_COR[c.status] || C.muted }}>{c.status}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                          {c.status === "Aprovada" && (
                            <button onClick={() => { setPoModal(c); setPoForm({ local_entrega: obras.find((o) => o.id === c.obra_id)?.endereco || "", condicao_pagamento: "30 dias", observacoes_po: "" }); }}
                              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#166534" + "22", border: "1px solid #16653444", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#166534", cursor: "pointer", fontFamily: "inherit" }}>
                              <Ic n="cart" w={13} c="#166534" /> Gerar PO
                            </button>
                          )}
                          <button onClick={() => { setFormCot({ ...FORM_COT, ...c, obra_id: c.obra_id || "" }); setCotSel(c); setModal("editar-cot"); }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}><Ic n="pencil" w={13} /> Editar</button>
                          <button onClick={async () => { await deleteCotacao(sel.id, c.id); mostrarToast("Cotação removida."); }}
                            style={{ display: "inline-flex", alignItems: "center", padding: "5px 11px", background: C.danger + "15", border: `1px solid ${C.danger}33`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}><Ic n="trash" w={13} c={C.danger} /></button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {tab === "historico" && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.1, color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>Resumo de cotações</div>
                    {["Aprovada", "Pendente", "Recusada", "Expirada"].map((st) => {
                      const items = cotsSel.filter((c) => c.status === st);
                      const total = items.reduce((a, c) => a + (Number(c.valor) || 0), 0);
                      return (
                        <div key={st} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: COT_STATUS_COR[st] || C.muted, display: "inline-block" }} />
                            <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{st}</span>
                            <span style={{ fontSize: 12, color: C.muted }}>({items.length})</span>
                          </div>
                          <span className="num" style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{total > 0 ? `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span>
                        </div>
                      );
                    })}
                    {sel.observacoes && (
                      <div style={{ marginTop: 20, padding: "14px 16px", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, color: C.text }}>
                        <strong>Observações:</strong> {sel.observacoes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/*  Modal Fornecedor  */}
      {(modal === "novo-forn" || modal === "editar-forn") && (
        <Modal title={modal === "novo-forn" ? "Novo fornecedor" : "Editar fornecedor"} onClose={() => setModal(null)}>
          <div className="sf-col">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={set("nome")} placeholder="Razão social ou nome fantasia" /></div>
            <div className="sf-grid-2">
              <div><Label>CNPJ / CPF</Label><Input value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={set("telefone")} placeholder="(11) 99999-9999" /></div>
            </div>
            <div><Label>Email</Label><Input value={form.email} onChange={set("email")} type="email" /></div>
            <div><Label>Especialidade</Label><Select value={form.especialidade} onChange={set("especialidade")} options={ESPECIALIDADES.map((e) => ({ value: e, label: e }))} /></div>
            <div className="sf-grid-2">
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={set("cidade")} /></div>
              <div><Label>Estado</Label><Input value={form.estado} onChange={set("estado")} placeholder="SP" /></div>
            </div>
            <div><Label>Status</Label><Select value={form.status} onChange={set("status")} options={["Ativo","Inativo","Lista negra"].map((v) => ({ value: v, label: v }))} /></div>
            <div><Label>Observações</Label><Input value={form.observacoes} onChange={set("observacoes")} placeholder="Notas internas" /></div>
            <div className="sf-actions">
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn disabled={!form.nome || isSaving} onClick={salvarFornecedor}>{isSaving ? "Salvando…" : modal === "novo-forn" ? "Cadastrar" : "Salvar"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/*  Modal Cotação  */}
      {(modal === "nova-cot" || modal === "editar-cot") && (
        <Modal title={modal === "nova-cot" ? "Nova cotação" : "Editar cotação"} onClose={() => setModal(null)}>
          <div className="sf-col">
            <div><Label>Descrição *</Label><Input value={formCot.descricao} onChange={setC("descricao")} placeholder="Ex: Perfis C 90mm — 500 pçs" /></div>
            <div className="sf-grid-2">
              <div><Label>Valor (R$)</Label><Input value={formCot.valor} onChange={setC("valor")} type="number" min="0" /></div>
              <div><Label>Válida até</Label><Input value={formCot.data_validade} onChange={setC("data_validade")} type="date" /></div>
            </div>
            <div>
              <Label>Obra vinculada</Label>
              <Select value={formCot.obra_id} onChange={setC("obra_id")} options={[{ value: "", label: "Nenhuma" }, ...obras.map((o) => ({ value: o.id, label: o.nome }))]} />
            </div>
            <div><Label>Status</Label><Select value={formCot.status} onChange={setC("status")} options={["Pendente","Aprovada","Recusada","Expirada"].map((v) => ({ value: v, label: v }))} /></div>
            <div><Label>Observações</Label><Input value={formCot.observacoes} onChange={setC("observacoes")} /></div>
            <div className="sf-actions">
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn disabled={!formCot.descricao || isSaving} onClick={salvarCotacao}>{isSaving ? "Salvando…" : modal === "nova-cot" ? "Registrar" : "Salvar"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/*  Modal Pedido de Compra  */}
      {poModal && (
        <Modal title="Gerar Pedido de Compra" onClose={() => setPoModal(null)}>
          <div className="sf-col">
            <div style={{ background: C.surface2, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Resumo da cotação</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{poModal.descricao}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.muted }}>{sel?.nome}</span>
                {poModal.valor != null && <span className="num" style={{ fontSize: 18, fontWeight: 700, color: C.red }}>R$ {Number(poModal.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}
              </div>
              {obras.find((o) => o.id === poModal.obra_id) && (
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}><Ic n="hardhat" w={13} c={C.muted} /> {obras.find((o) => o.id === poModal.obra_id).nome}</div>
              )}
            </div>
            <div>
              <Label>Local de Entrega</Label>
              <Input value={poForm.local_entrega} onChange={(v) => setPoForm((f) => ({ ...f, local_entrega: v }))} placeholder="Endereço da obra ou depósito" />
            </div>
            <div>
              <Label>Condição de Pagamento</Label>
              <Select value={poForm.condicao_pagamento} onChange={(v) => setPoForm((f) => ({ ...f, condicao_pagamento: v }))}
                options={["À vista","7 dias","14 dias","21 dias","30 dias","30/60 dias","45 dias","60 dias"].map((v) => ({ value: v, label: v }))} />
            </div>
            <div>
              <Label>Observações adicionais</Label>
              <Input value={poForm.observacoes_po} onChange={(v) => setPoForm((f) => ({ ...f, observacoes_po: v }))} placeholder="Ex: Entregar das 8h às 17h" />
            </div>
            <div style={{ background: "#166534" + "10", border: "1px solid #16653433", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#166534", fontWeight: 600, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Ic n="check" w={14} c="#166534" style={{ marginTop: 1 }} />
              <span>Ao confirmar: PDF do pedido será gerado · Despesa criada no Financeiro como Pendente{sel?.telefone ? " · WhatsApp aberto para o fornecedor" : ""}</span>
            </div>
            <div className="sf-actions">
              <Btn variant="ghost" onClick={() => setPoModal(null)}>Cancelar</Btn>
              <Btn onClick={gerarPedidoCompra}><Ic n="cart" w={14} c="#fff" /> Confirmar e Gerar PO</Btn>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: C.graphite, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
