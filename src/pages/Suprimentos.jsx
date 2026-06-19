import { useState, useEffect, useCallback } from "react";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import { C } from "../utils/constants";
import {
  listarPedidos, criarPedido, atualizarPedido, deletarPedido,
  listarEstoque, criarItemEstoque, atualizarItemEstoque, deletarItemEstoque,
} from "../services/repositories/suprimentosRepository";
import { sb, getEmpresaId } from "../services/supabase";
import { exportarPedidosExcel, exportarEstoqueExcel } from "../utils/exportExcel";

const URGENCIAS     = ["Normal", "Urgente", "Crítico"];
const STATUS_PED    = ["Pendente", "Aprovado", "Em trânsito", "Entregue", "Cancelado"];
const UNIDADES      = ["un", "m", "m²", "m³", "kg", "t", "L", "cx", "pç", "sc", "gl", "vb"];

const corUrgencia   = { Normal: C.success, Urgente: C.warning, Crítico: C.danger };
const corStatus     = { Pendente: C.muted, Aprovado: C.steel, "Em trânsito": C.warning, Entregue: C.success, Cancelado: C.danger };

const PILL_ST = { fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 5, letterSpacing: .3, display: "inline-block" };

function StatusPill({ label, cor }) {
  return <span style={{ ...PILL_ST, background: cor + "1a", color: cor, border: `1px solid ${cor}33` }}>{label}</span>;
}

export default function Suprimentos() {
  useModuleLoad("suprimentos");

  const [aba, setAba]     = useState("pedidos");
  const [obras, setObras] = useState([]);

  // Pedidos
  const [pedidos, setPedidos]         = useState([]);
  const [pedLoading, setPedLoading]   = useState(false);
  const [pedModal, setPedModal]       = useState(false);
  const [pedEdit, setPedEdit]         = useState(null);
  const hoje = new Date().toISOString().slice(0, 10);
  const [pedForm, setPedForm]         = useState({ item: "", unidade: "un", quantidade: 1, urgencia: "Normal", status: "Pendente", obra_id: "", solicitante: "", data_pedido: hoje, data_entrega: "", valor_unitario: "", obs: "" });

  // Estoque
  const [estoque, setEstoque]         = useState([]);
  const [estLoading, setEstLoading]   = useState(false);
  const [estModal, setEstModal]       = useState(false);
  const [estEdit, setEstEdit]         = useState(null);
  const [estForm, setEstForm]         = useState({ item: "", unidade: "un", quantidade: 0, estoque_minimo: 0, localizacao: "", valor_unitario: "" });
  const [movModal, setMovModal]       = useState(null);
  const [movForm, setMovForm]         = useState({ tipo: "entrada", quantidade: 1, obs: "" });

  // Dar entrada (pedido → estoque)
  const [entradaModal, setEntradaModal] = useState(null); // pedido
  const [entradaEstoqueId, setEntradaEstoqueId] = useState("");

  // Relatório de movimentações
  const [movimentos, setMovimentos]   = useState([]);
  const [movLoading, setMovLoading]   = useState(false);
  const [relFiltro, setRelFiltro]     = useState({ tipo: "", item: "", de: "", ate: "" });

  const [confirm, setConfirm]         = useState(null);

  const loadObras = useCallback(async () => {
    const { data } = await sb.from("obras").select("id,nome").eq("empresa_id", getEmpresaId()).order("nome");
    setObras(data || []);
  }, []);

  const loadPedidos = useCallback(async () => {
    setPedLoading(true);
    try { setPedidos(await listarPedidos()); } finally { setPedLoading(false); }
  }, []);

  const loadEstoque = useCallback(async () => {
    setEstLoading(true);
    try { setEstoque(await listarEstoque()); } finally { setEstLoading(false); }
  }, []);

  const loadMovimentos = useCallback(async () => {
    setMovLoading(true);
    try {
      const { data } = await sb
        .from("suprimentos_movimentos")
        .select("*, estoque:suprimentos_estoque(item, unidade)")
        .eq("empresa_id", getEmpresaId())
        .order("created_at", { ascending: false })
        .limit(500);
      setMovimentos(data || []);
    } finally { setMovLoading(false); }
  }, []);

  useEffect(() => { loadObras(); }, [loadObras]);
  useEffect(() => {
    if (aba === "pedidos") loadPedidos();
    if (aba === "estoque") loadEstoque();
    if (aba === "relatorio") { loadMovimentos(); loadEstoque(); }
  }, [aba, loadPedidos, loadEstoque, loadMovimentos]);

  //  KPIs 
  const pedPendentes  = pedidos.filter(p => p.status === "Pendente").length;
  const pedTransito   = pedidos.filter(p => p.status === "Em trânsito").length;
  const pedUrgentes   = pedidos.filter(p => p.urgencia === "Crítico" && p.status !== "Entregue" && p.status !== "Cancelado").length;
  const abaixoMinimo  = estoque.filter(e => e.estoque_minimo > 0 && e.quantidade <= e.estoque_minimo).length;

  //  Pedido handlers 
  function abrirNovoPed() {
    setPedEdit(null);
    setPedForm({ item: "", unidade: "un", quantidade: 1, urgencia: "Normal", status: "Pendente", obra_id: "", solicitante: "", data_pedido: hoje, data_entrega: "", valor_unitario: "", obs: "" });
    setPedModal(true);
  }
  function abrirEditPed(p) { setPedEdit(p.id); setPedForm({ ...p, obra_id: p.obra_id || "", valor_unitario: p.valor_unitario || "" }); setPedModal(true); }
  async function salvarPed() {
    const { obra, ...rest } = pedForm;
    const payload = {
      ...rest,
      obra_id: pedForm.obra_id || null,
      data_entrega: pedForm.data_entrega || null,
      quantidade: Number(pedForm.quantidade),
      valor_unitario: pedForm.valor_unitario ? Number(pedForm.valor_unitario) : null,
    };
    if (pedEdit) await atualizarPedido(pedEdit, payload); else await criarPedido(payload);
    setPedModal(false); loadPedidos();
  }

  //  Dar entrada no estoque 
  async function darEntrada() {
    if (!entradaModal || !entradaEstoqueId) return;
    const ped = entradaModal;
    const item = estoque.find(e => e.id === entradaEstoqueId);
    if (!item) return;
    const qtd = Number(ped.quantidade);
    await sb.from("suprimentos_movimentos").insert({
      empresa_id: getEmpresaId(),
      estoque_id: item.id,
      tipo: "entrada",
      quantidade: qtd,
      obs: `Entrada via pedido: ${ped.item}${ped.obra?.nome ? ` — ${ped.obra.nome}` : ""}`,
    });
    await sb.from("suprimentos_estoque").update({ quantidade: item.quantidade + qtd }).eq("id", item.id);
    setEntradaModal(null);
    setEntradaEstoqueId("");
    loadPedidos();
    loadEstoque();
  }

  //  Estoque handlers 
  function abrirNovoEst() {
    setEstEdit(null);
    setEstForm({ item: "", unidade: "un", quantidade: 0, estoque_minimo: 0, localizacao: "", valor_unitario: "" });
    setEstModal(true);
  }
  function abrirEditEst(e) { setEstEdit(e.id); setEstForm({ ...e, valor_unitario: e.valor_unitario || "" }); setEstModal(true); }
  async function salvarEst() {
    const payload = { ...estForm, quantidade: Number(estForm.quantidade), estoque_minimo: Number(estForm.estoque_minimo), valor_unitario: estForm.valor_unitario ? Number(estForm.valor_unitario) : null };
    if (estEdit) await atualizarItemEstoque(estEdit, payload); else await criarItemEstoque(payload);
    setEstModal(false); loadEstoque();
  }

  async function registrarMov() {
    if (!movModal) return;
    const delta = movForm.tipo === "entrada" ? Number(movForm.quantidade) : -Number(movForm.quantidade);
    await sb.from("suprimentos_movimentos").insert({ empresa_id: getEmpresaId(), estoque_id: movModal.id, tipo: movForm.tipo, quantidade: Number(movForm.quantidade), obs: movForm.obs });
    await sb.from("suprimentos_estoque").update({ quantidade: movModal.quantidade + delta }).eq("id", movModal.id);
    setMovModal(null);
    loadEstoque();
  }

  async function confirmarDelete() {
    if (!confirm) return;
    if (confirm.tipo === "pedido")  await deletarPedido(confirm.id);
    if (confirm.tipo === "estoque") await deletarItemEstoque(confirm.id);
    setConfirm(null);
    if (confirm.tipo === "pedido")  loadPedidos();
    if (confirm.tipo === "estoque") loadEstoque();
  }

  //  Relatório filtrado 
  const movFiltrados = movimentos.filter(m => {
    if (relFiltro.tipo && m.tipo !== relFiltro.tipo) return false;
    if (relFiltro.item && !(m.estoque?.item || "").toLowerCase().includes(relFiltro.item.toLowerCase())) return false;
    if (relFiltro.de && m.created_at < relFiltro.de) return false;
    if (relFiltro.ate && m.created_at > relFiltro.ate + "T23:59:59") return false;
    return true;
  });

  const totalEntradas = movFiltrados.filter(m => m.tipo === "entrada").reduce((s, m) => s + m.quantidade, 0);
  const totalSaidas   = movFiltrados.filter(m => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0);

  const fmt   = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";
  const fmtDT = (d) => d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
  const fmtR$ = (v) => v != null ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

  const selectStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, background: C.dark, color: C.text };

  const kpiDefs = [
    { label: "Pedidos pendentes",    value: pedPendentes,  bg: pedPendentes > 0 ? "#fef5e7" : "var(--surface-2)", ic: pedPendentes > 0 ? C.warning : C.muted },
    { label: "Em trânsito",          value: pedTransito,   bg: "#eef3f9",  ic: C.steel },
    { label: "Pedidos críticos",     value: pedUrgentes,   bg: pedUrgentes > 0 ? "#fdf0ef" : "var(--surface-2)", ic: pedUrgentes > 0 ? C.danger : C.muted },
    { label: "Itens abaixo do mín.", value: abaixoMinimo,  bg: abaixoMinimo > 0 ? "#fdf0ef" : "var(--surface-2)", ic: abaixoMinimo > 0 ? C.danger : C.muted },
  ];

  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
        <div style={{ width: 4, height: 42, borderRadius: 3, background: "var(--brick)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1 }}>Almoxarifado</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Pedidos de material e controle de estoque</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {kpiDefs.map(k => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: k.bg, display: "grid", placeItems: "center", marginBottom: 10 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={k.ic} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                {k.label.includes("trânsito") ? <g><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3m-9 12h10l4-4V11a2 2 0 0 0-2-2H11a2 2 0 0 0-2 2v10z"/></g>
                  : k.label.includes("pendentes") ? <g><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></g>
                  : k.label.includes("críticos") ? <g><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></g>
                  : <g><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z"/><path d="M2 7.5l10 5.5 10-5.5"/><path d="M12 22V13"/></g>}
              </svg>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 700, lineHeight: 1, color: k.ic, marginBottom: 3 }}>{k.value}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 9, padding: 3, marginBottom: 18, width: "fit-content" }}>
        {[["pedidos","Pedidos"],["estoque","Estoque"],["relatorio","Relatório"]].map(([k,l]) => (
          <button key={k} onClick={() => setAba(k)} style={{ padding: "6px 18px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit", transition: ".12s", background: aba === k ? "var(--surface)" : "transparent", color: aba === k ? "var(--ink)" : "var(--muted)", boxShadow: aba === k ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>{l}</button>
        ))}
      </div>

      {/*  Pedidos  */}
      {aba === "pedidos" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>Pedidos de Material</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => exportarPedidosExcel(pedidos)}>Exportar Excel</Btn>
              <Btn onClick={abrirNovoPed}>+ Novo Pedido</Btn>
            </div>
          </div>
          {pedLoading ? <p style={{ color: "var(--muted)", padding: "24px 18px" }}>Carregando...</p> : pedidos.length === 0 ? (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Nenhum pedido registrado.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Item","Qtd","Urgência","Obra","Pedido","Entrega","Status","Ações"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted)", fontWeight: 800, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--line-2)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{p.item}</td>
                      <td style={{ padding: "12px 14px", color: "var(--ink-2)", fontSize: 13 }}>{p.quantidade} {p.unidade}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <StatusPill label={p.urgencia} cor={corUrgencia[p.urgencia] || C.muted} />
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--muted)", fontSize: 13 }}>{p.obra?.nome || "—"}</td>
                      <td style={{ padding: "12px 14px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13.5 }}>{fmt(p.data_pedido)}</td>
                      <td style={{ padding: "12px 14px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13.5 }}>{fmt(p.data_entrega)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <StatusPill label={p.status} cor={corStatus[p.status] || C.muted} />
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {p.status === "Entregue" && (
                            <Btn variant="ghost" size="sm" style={{ color: C.success }} onClick={() => { setEntradaModal(p); setEntradaEstoqueId(""); loadEstoque(); }}>Dar entrada</Btn>
                          )}
                          <Btn variant="ghost" size="sm" onClick={() => abrirEditPed(p)}>Editar</Btn>
                          <Btn variant="ghost" size="sm" style={{ color: C.danger }} onClick={() => setConfirm({ id: p.id, tipo: "pedido", label: p.item })}>Excluir</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/*  Estoque  */}
      {aba === "estoque" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>Estoque / Almoxarifado</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => exportarEstoqueExcel(estoque, movimentos)}>Exportar Excel</Btn>
              <Btn onClick={abrirNovoEst}>+ Novo Item</Btn>
            </div>
          </div>
          {estLoading ? <p style={{ color: "var(--muted)", padding: "24px 18px" }}>Carregando...</p> : estoque.length === 0 ? (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Nenhum item cadastrado no estoque.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Item","Saldo","Mínimo","Localização","Vlr unitário","Status","Ações"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted)", fontWeight: 800, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {estoque.map(e => {
                    const abaixo = e.estoque_minimo > 0 && e.quantidade <= e.estoque_minimo;
                    const statusLabel = abaixo ? "Crítico" : e.estoque_minimo > 0 && e.quantidade <= e.estoque_minimo * 1.5 ? "Atenção" : "Adequado";
                    const statusCor   = abaixo ? C.danger : C.success;
                    return (
                      <tr key={e.id} style={{ borderBottom: "1px solid var(--line-2)", background: abaixo ? C.danger + "06" : "" }} onMouseEnter={e2 => e2.currentTarget.style.background = abaixo ? C.danger + "0c" : "var(--surface-2)"} onMouseLeave={e2 => e2.currentTarget.style.background = abaixo ? C.danger + "06" : ""}>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{e.item}</td>
                        <td style={{ padding: "12px 14px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: abaixo ? C.danger : "var(--ink)" }}>{e.quantidade} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--muted)" }}>{e.unidade}</span></td>
                        <td style={{ padding: "12px 14px", color: "var(--muted)", fontSize: 13 }}>{e.estoque_minimo > 0 ? `${e.estoque_minimo} ${e.unidade}` : "—"}</td>
                        <td style={{ padding: "12px 14px", color: "var(--ink-2)", fontSize: 13 }}>{e.localizacao || "—"}</td>
                        <td style={{ padding: "12px 14px", color: "var(--muted)", fontSize: 13 }}>{fmtR$(e.valor_unitario)}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <StatusPill label={statusLabel} cor={statusCor} />
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Btn variant="ghost" size="sm" onClick={() => { setMovModal(e); setMovForm({ tipo: "entrada", quantidade: 1, obs: "" }); }}>Movimentar</Btn>
                            <Btn variant="ghost" size="sm" onClick={() => abrirEditEst(e)}>Editar</Btn>
                            <Btn variant="ghost" size="sm" style={{ color: C.danger }} onClick={() => setConfirm({ id: e.id, tipo: "estoque", label: e.item })}>Excluir</Btn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/*  Relatório de Movimentações  */}
      {aba === "relatorio" && (
        <div>
          {/* Filtros */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Tipo</label>
                <select value={relFiltro.tipo} onChange={e => setRelFiltro(f => ({ ...f, tipo: e.target.value }))} style={selectStyle}>
                  <option value="">Todos</option>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
              <Input label="Item" value={relFiltro.item} onChange={v => setRelFiltro(f => ({ ...f, item: v }))} placeholder="Filtrar por item..." />
              <Input label="De" type="date" value={relFiltro.de} onChange={v => setRelFiltro(f => ({ ...f, de: v }))} />
              <Input label="Até" type="date" value={relFiltro.ate} onChange={v => setRelFiltro(f => ({ ...f, ate: v }))} />
            </div>
          </div>

          {/* KPIs do relatório */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Movimentações", value: movFiltrados.length, ic: "var(--muted)" },
              { label: "Total entradas (un)", value: totalEntradas.toLocaleString("pt-BR"), ic: C.success },
              { label: "Total saídas (un)", value: totalSaidas.toLocaleString("pt-BR"), ic: C.danger },
            ].map(k => (
              <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: k.ic, lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Tabela */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-2)", fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>Histórico de Movimentações</div>
            {movLoading ? <p style={{ color: "var(--muted)", padding: "24px 18px" }}>Carregando...</p> : movFiltrados.length === 0 ? (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Nenhuma movimentação registrada.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Data/Hora","Item","Tipo","Quantidade","Observação"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "var(--muted)", fontWeight: 800, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid var(--line)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movFiltrados.map(m => (
                      <tr key={m.id} style={{ borderBottom: "1px solid var(--line-2)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={{ padding: "12px 14px", color: "var(--muted)", whiteSpace: "nowrap", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13.5 }}>{fmtDT(m.created_at)}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{m.estoque?.item || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <StatusPill label={m.tipo === "entrada" ? "Entrada" : "Saída"} cor={m.tipo === "entrada" ? C.success : C.danger} />
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: m.tipo === "entrada" ? C.success : C.danger, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15 }}>
                          {m.tipo === "entrada" ? "+" : "−"}{m.quantidade} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--muted)" }}>{m.estoque?.unidade || ""}</span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "var(--muted)", fontSize: 13 }}>{m.obs || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/*  Modal Pedido  */}
      {pedModal && (
        <Modal onClose={() => setPedModal(false)} title={pedEdit ? "Editar Pedido" : "Novo Pedido de Material"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Item *" value={pedForm.item} onChange={v => setPedForm(f => ({ ...f, item: v }))} placeholder="Ex: Perfil U 90mm" />
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Input label="Quantidade *" type="number" min="0" step="0.001" value={pedForm.quantidade} onChange={v => setPedForm(f => ({ ...f, quantidade: v }))} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Unidade</label>
                <select value={pedForm.unidade} onChange={e => setPedForm(f => ({ ...f, unidade: e.target.value }))} style={selectStyle}>
                  {UNIDADES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Urgência</label>
                <select value={pedForm.urgencia} onChange={e => setPedForm(f => ({ ...f, urgencia: e.target.value }))} style={selectStyle}>
                  {URGENCIAS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Status</label>
                <select value={pedForm.status} onChange={e => setPedForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
                  {STATUS_PED.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Obra</label>
              <select value={pedForm.obra_id} onChange={e => setPedForm(f => ({ ...f, obra_id: e.target.value }))} style={selectStyle}>
                <option value="">— Sem obra vinculada —</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Data do pedido" type="date" value={pedForm.data_pedido} onChange={v => setPedForm(f => ({ ...f, data_pedido: v }))} />
              <Input label="Previsão entrega" type="date" value={pedForm.data_entrega} onChange={v => setPedForm(f => ({ ...f, data_entrega: v }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Solicitante" value={pedForm.solicitante} onChange={v => setPedForm(f => ({ ...f, solicitante: v }))} placeholder="Nome" />
              <Input label="Valor unitário (R$)" type="number" min="0" step="0.01" value={pedForm.valor_unitario} onChange={v => setPedForm(f => ({ ...f, valor_unitario: v }))} />
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Observações</label><textarea value={pedForm.obs} onChange={e => setPedForm(f => ({ ...f, obs: e.target.value }))} rows={2} style={{ width: "100%", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <Btn variant="ghost" onClick={() => setPedModal(false)}>Cancelar</Btn>
              <Btn onClick={salvarPed} disabled={!pedForm.item || !pedForm.quantidade}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/*  Modal Dar Entrada no Estoque  */}
      {entradaModal && (
        <Modal onClose={() => setEntradaModal(null)} title="Dar Entrada no Estoque">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.dark, borderRadius: 8, padding: 14, fontSize: 14 }}>
              <div><strong>{entradaModal.item}</strong></div>
              <div style={{ color: C.muted, marginTop: 4 }}>Quantidade: <strong>{entradaModal.quantidade} {entradaModal.unidade}</strong></div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Vincular ao item de estoque *</label>
              <select value={entradaEstoqueId} onChange={e => setEntradaEstoqueId(e.target.value)} style={selectStyle}>
                <option value="">— Selecione o item do estoque —</option>
                {estoque.map(e => (
                  <option key={e.id} value={e.id}>{e.item} (saldo: {e.quantidade} {e.unidade})</option>
                ))}
              </select>
            </div>
            <p style={{ fontSize: 12, color: C.muted }}>A entrada será registrada automaticamente no histórico de movimentações.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setEntradaModal(null)}>Cancelar</Btn>
              <Btn onClick={darEntrada} disabled={!entradaEstoqueId}> Confirmar entrada</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/*  Modal Estoque  */}
      {estModal && (
        <Modal onClose={() => setEstModal(false)} title={estEdit ? "Editar Item" : "Novo Item de Estoque"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Item *" value={estForm.item} onChange={v => setEstForm(f => ({ ...f, item: v }))} placeholder="Ex: Parafuso autobrocante 4.2" />
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <Input label="Quantidade inicial" type="number" min="0" step="0.001" value={estForm.quantidade} onChange={v => setEstForm(f => ({ ...f, quantidade: v }))} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Unidade</label>
                <select value={estForm.unidade} onChange={e => setEstForm(f => ({ ...f, unidade: e.target.value }))} style={selectStyle}>
                  {UNIDADES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Estoque mínimo" type="number" min="0" step="0.001" value={estForm.estoque_minimo} onChange={v => setEstForm(f => ({ ...f, estoque_minimo: v }))} />
              <Input label="Valor unitário (R$)" type="number" min="0" step="0.01" value={estForm.valor_unitario} onChange={v => setEstForm(f => ({ ...f, valor_unitario: v }))} />
            </div>
            <Input label="Localização (almoxarifado)" value={estForm.localizacao} onChange={v => setEstForm(f => ({ ...f, localizacao: v }))} placeholder="Ex: Prateleira A3" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <Btn variant="ghost" onClick={() => setEstModal(false)}>Cancelar</Btn>
              <Btn onClick={salvarEst} disabled={!estForm.item}>Salvar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/*  Modal Movimentação  */}
      {movModal && (
        <Modal onClose={() => setMovModal(null)} title={`Movimentar: ${movModal.item}`}>
          <p style={{ color: C.muted, marginBottom: 16, fontSize: 14 }}>Saldo atual: <strong>{movModal.quantidade} {movModal.unidade}</strong></p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Tipo</label>
                <select value={movForm.tipo} onChange={e => setMovForm(f => ({ ...f, tipo: e.target.value }))} style={selectStyle}>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
              <Input label="Quantidade" type="number" min="0.001" step="0.001" value={movForm.quantidade} onChange={v => setMovForm(f => ({ ...f, quantidade: v }))} />
            </div>
            <div><label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>Observação</label><textarea value={movForm.obs} onChange={e => setMovForm(f => ({ ...f, obs: e.target.value }))} rows={2} placeholder="Ex: Retirado para obra Res. São Paulo" style={{ width: "100%", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <Btn variant="ghost" onClick={() => setMovModal(null)}>Cancelar</Btn>
              <Btn onClick={registrarMov}>Registrar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/*  Confirm delete  */}
      {confirm && (
        <Modal onClose={() => setConfirm(null)} title="Confirmar exclusão">
          <p style={{ marginBottom: 20 }}>Excluir <strong>{confirm.label}</strong>? Esta ação não pode ser desfeita.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
            <Btn style={{ background: C.danger }} onClick={confirmarDelete}>Excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
