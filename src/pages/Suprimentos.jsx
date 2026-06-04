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

const URGENCIAS     = ["Normal", "Urgente", "Crítico"];
const STATUS_PED    = ["Pendente", "Aprovado", "Em trânsito", "Entregue", "Cancelado"];
const UNIDADES      = ["un", "m", "m²", "m³", "kg", "t", "L", "cx", "pç", "sc", "gl", "vb"];

const corUrgencia   = { Normal: C.success, Urgente: C.warning, Crítico: C.danger };
const corStatus     = { Pendente: C.muted, Aprovado: "#4a9eff", "Em trânsito": C.warning, Entregue: C.success, Cancelado: C.danger };

function kpiStyle(cor) {
  return { background: cor + "18", borderLeft: `4px solid ${cor}`, borderRadius: 10, padding: "14px 18px" };
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
  const [movModal, setMovModal]       = useState(null); // item do estoque
  const [movForm, setMovForm]         = useState({ tipo: "entrada", quantidade: 1, obs: "" });

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

  useEffect(() => { loadObras(); }, [loadObras]);
  useEffect(() => {
    if (aba === "pedidos") loadPedidos();
    if (aba === "estoque") loadEstoque();
  }, [aba, loadPedidos, loadEstoque]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const pedPendentes  = pedidos.filter(p => p.status === "Pendente").length;
  const pedTransito   = pedidos.filter(p => p.status === "Em trânsito").length;
  const pedUrgentes   = pedidos.filter(p => p.urgencia === "Crítico" && p.status !== "Entregue" && p.status !== "Cancelado").length;
  const abaixoMinimo  = estoque.filter(e => e.estoque_minimo > 0 && e.quantidade <= e.estoque_minimo).length;

  // ── Pedido handlers ───────────────────────────────────────────────────────
  function abrirNovoPed() {
    setPedEdit(null);
    setPedForm({ item: "", unidade: "un", quantidade: 1, urgencia: "Normal", status: "Pendente", obra_id: "", solicitante: "", data_pedido: hoje, data_entrega: "", valor_unitario: "", obs: "" });
    setPedModal(true);
  }
  function abrirEditPed(p) { setPedEdit(p.id); setPedForm({ ...p, obra_id: p.obra_id || "", valor_unitario: p.valor_unitario || "" }); setPedModal(true); }
  async function salvarPed() {
    const payload = {
      ...pedForm,
      obra_id: pedForm.obra_id || null,
      data_entrega: pedForm.data_entrega || null,
      quantidade: Number(pedForm.quantidade),
      valor_unitario: pedForm.valor_unitario ? Number(pedForm.valor_unitario) : null,
    };
    if (pedEdit) await atualizarPedido(pedEdit, payload); else await criarPedido(payload);
    setPedModal(false); loadPedidos();
  }

  // ── Estoque handlers ──────────────────────────────────────────────────────
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

  const tabStyle = (k) => ({
    padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14,
    background: aba === k ? C.red : "transparent",
    color: aba === k ? "#fff" : C.muted,
    border: "none",
  });

  const fmt   = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";
  const fmtR$ = (v) => v != null ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

  const selectStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 };

  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Suprimentos</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Pedidos de material e controle de estoque</p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid-4" style={{ marginBottom: 24 }}>
        <div style={kpiStyle(pedPendentes > 0 ? C.warning : C.success)}>
          <div style={{ fontSize: 26, fontWeight: 900, color: pedPendentes > 0 ? C.warning : C.success }}>{pedPendentes}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Pedidos pendentes</div>
        </div>
        <div style={kpiStyle("#4a9eff")}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#4a9eff" }}>{pedTransito}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Em trânsito</div>
        </div>
        <div style={kpiStyle(pedUrgentes > 0 ? C.danger : C.success)}>
          <div style={{ fontSize: 26, fontWeight: 900, color: pedUrgentes > 0 ? C.danger : C.success }}>{pedUrgentes}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Pedidos críticos</div>
        </div>
        <div style={kpiStyle(abaixoMinimo > 0 ? C.danger : C.success)}>
          <div style={{ fontSize: 26, fontWeight: 900, color: abaixoMinimo > 0 ? C.danger : C.success }}>{abaixoMinimo}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Itens abaixo do mínimo</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-row" style={{ display: "flex", gap: 6, marginBottom: 20, background: C.dark, borderRadius: 10, padding: 4 }}>
        {[["pedidos","Pedidos"],["estoque","Estoque"]].map(([k,l]) => (
          <button key={k} style={tabStyle(k)} onClick={() => setAba(k)}>{l}</button>
        ))}
      </div>

      {/* ── Pedidos ── */}
      {aba === "pedidos" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Pedidos de Material</h3>
            <Btn onClick={abrirNovoPed}>+ Novo Pedido</Btn>
          </div>
          {pedLoading ? <p style={{ color: C.muted }}>Carregando...</p> : pedidos.length === 0 ? (
            <p style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum pedido registrado.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Item","Qtd","Urgência","Obra","Pedido","Entrega","Status",""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: C.muted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 10px", fontWeight: 600 }}>{p.item}</td>
                    <td style={{ padding: "10px 10px", color: C.muted }}>{p.quantidade} {p.unidade}</td>
                    <td style={{ padding: "10px 10px" }}>
                      <span style={{ background: (corUrgencia[p.urgencia] || C.muted) + "20", color: corUrgencia[p.urgencia] || C.muted, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>{p.urgencia}</span>
                    </td>
                    <td style={{ padding: "10px 10px", color: C.muted }}>{p.obra?.nome || "—"}</td>
                    <td style={{ padding: "10px 10px", color: C.muted }}>{fmt(p.data_pedido)}</td>
                    <td style={{ padding: "10px 10px", color: C.muted }}>{fmt(p.data_entrega)}</td>
                    <td style={{ padding: "10px 10px" }}>
                      <span style={{ background: (corStatus[p.status] || C.muted) + "20", color: corStatus[p.status] || C.muted, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>{p.status}</span>
                    </td>
                    <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                      <Btn variant="ghost" size="sm" onClick={() => abrirEditPed(p)}>Editar</Btn>
                      <Btn variant="ghost" size="sm" style={{ color: C.danger }} onClick={() => setConfirm({ id: p.id, tipo: "pedido", label: p.item })}>Excluir</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Estoque ── */}
      {aba === "estoque" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Estoque / Almoxarifado</h3>
            <Btn onClick={abrirNovoEst}>+ Novo Item</Btn>
          </div>
          {estLoading ? <p style={{ color: C.muted }}>Carregando...</p> : estoque.length === 0 ? (
            <p style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum item cadastrado no estoque.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Item","Saldo","Mínimo","Localização","Vlr unitário","",""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: C.muted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estoque.map(e => {
                  const abaixo = e.estoque_minimo > 0 && e.quantidade <= e.estoque_minimo;
                  return (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}`, background: abaixo ? C.danger + "08" : "transparent" }}>
                      <td style={{ padding: "10px 10px", fontWeight: 600 }}>{e.item}</td>
                      <td style={{ padding: "10px 10px", color: abaixo ? C.danger : C.text, fontWeight: abaixo ? 700 : 400 }}>{e.quantidade} {e.unidade}</td>
                      <td style={{ padding: "10px 10px", color: C.muted }}>{e.estoque_minimo > 0 ? `${e.estoque_minimo} ${e.unidade}` : "—"}</td>
                      <td style={{ padding: "10px 10px", color: C.muted }}>{e.localizacao || "—"}</td>
                      <td style={{ padding: "10px 10px", color: C.muted }}>{fmtR$(e.valor_unitario)}</td>
                      <td style={{ padding: "10px 10px" }}>
                        <Btn variant="ghost" size="sm" onClick={() => { setMovModal(e); setMovForm({ tipo: "entrada", quantidade: 1, obs: "" }); }}>Movimentar</Btn>
                      </td>
                      <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>
                        <Btn variant="ghost" size="sm" onClick={() => abrirEditEst(e)}>Editar</Btn>
                        <Btn variant="ghost" size="sm" style={{ color: C.danger }} onClick={() => setConfirm({ id: e.id, tipo: "estoque", label: e.item })}>Excluir</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Modal Pedido ── */}
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

      {/* ── Modal Estoque ── */}
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

      {/* ── Modal Movimentação ── */}
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

      {/* ── Confirm delete ── */}
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
