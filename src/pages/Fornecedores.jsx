import { useState, useMemo, useCallback, useRef } from "react";
import { Building2, HardHat, Mail, Pencil, Phone, Trash2 } from "../components/ui/Icon";
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
import MonitorPrecos from "../components/fornecedores/MonitorPrecos";
import IndicePrecos from "../components/fornecedores/IndicePrecos";
import Concorrencias from "./Concorrencias";
import { printHtml } from "../utils/printHtml";
import { enviarWhatsApp } from "../services/whatsappService";

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
  return <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{String(children).toUpperCase()}</div>;
}

function VirtualFornList({ lista, sel, onSelect }) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({ count: lista.length, getScrollElement: () => parentRef.current, estimateSize: () => 72, overscan: 5 });

  return (
    <div ref={parentRef} style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((vItem) => {
          const f = lista[vItem.index];
          const isSelected = sel?.id === f.id;
          return (
            <div key={f.id} onClick={() => onSelect(f)} style={{
              position: "absolute", top: vItem.start, width: "100%",
              padding: "12px 16px", cursor: "pointer", boxSizing: "border-box",
              borderBottom: `1px solid ${C.border}`,
              background: isSelected ? C.red + "10" : "#fff",
              borderLeft: isSelected ? `3px solid ${C.red}` : "3px solid transparent",
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{f.nome}</div>
              <div style={{ fontSize: 11, color: C.muted, display: "flex", gap: 8 }}>
                <span>{f.especialidade}</span>
                {f.cidade && <span>· {f.cidade}</span>}
                <span style={{ marginLeft: "auto", color: STATUS_COR[f.status] || C.muted, fontWeight: 700 }}>{f.status}</span>
              </div>
            </div>
          );
        })}
      </div>
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
        const data = await addFornecedor(form); setSel(data); mostrarToast("✅ Fornecedor cadastrado!");
      } else {
        await updateFornecedor(sel.id, form); setSel((s) => ({ ...s, ...form })); mostrarToast("✅ Fornecedor atualizado!");
      }
      setModal(null);
    } catch (e) { mostrarToast("❌ " + e.message); }
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
      if (modal === "nova-cot") { await addCotacao(sel.id, payload); mostrarToast("✅ Cotação registrada!"); }
      else { await updateCotacao(sel.id, cotSel.id, payload); mostrarToast("✅ Cotação atualizada!"); }
      setModal(null);
    } catch (e) { mostrarToast("❌ " + e.message); }
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
      const msg = `Olá ${forn.nome.split(" ")[0]}! Segue nosso Pedido de Compra ${poNum}:\n\n📦 *${c.descricao}*\n💰 *${valorFmt}*\n📅 Emissão: ${dataEmissao}${obra ? `\n🏗️ Obra: ${obra.nome}` : ""}\n\nCondição de pagamento: ${poForm.condicao_pagamento}\n\nAguardamos confirmação do recebimento. Obrigado!`;
      enviarWhatsApp(forn.telefone, msg);
    }

    setPoModal(null);
    mostrarToast(`✅ PO ${poNum} gerado!${forn.telefone ? " WhatsApp aberto." : ""}`);
  }

  const listaFiltrada = useMemo(() => fornecedores.filter((f) => {
    const q = buscaDebounced.toLowerCase();
    const ok = f.nome?.toLowerCase().includes(q) || f.especialidade?.toLowerCase().includes(q);
    return ok && (filtroEsp === "Todos" || f.especialidade === filtroEsp);
  }), [fornecedores, buscaDebounced, filtroEsp]);

  const cotsSel = sel ? (cotacoes[sel.id] || []) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: "#fff", padding: "0 20px", flexShrink: 0 }}>
        {[["fornecedores","🏭 Fornecedores"],["concorrencias","🤝 Concorrências"],["indice","📈 Índice de Preços"],["monitor","🔍 Monitor de Mercado"]].map(([k, l]) => (
          <button key={k} onClick={() => setViewMode(k)} style={{
            padding: "14px 20px", border: "none", background: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 13, fontWeight: viewMode === k ? 700 : 400,
            color: viewMode === k ? C.red : C.muted,
            borderBottom: viewMode === k ? `3px solid ${C.red}` : "3px solid transparent", marginBottom: -1,
          }}>{l}</button>
        ))}
      </div>

      {viewMode === "concorrencias" && <div style={{ flex: 1, overflow: "hidden" }}><Concorrencias /></div>}
      {viewMode === "indice"        && <div style={{ flex: 1, overflowY: "auto" }}><IndicePrecos /></div>}
      {viewMode === "monitor"       && <div style={{ flex: 1, overflowY: "auto" }}><MonitorPrecos /></div>}

      {viewMode === "fornecedores" && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

          {/* ── Painel esquerdo ── */}
          <div style={{ width: window.innerWidth < 768 ? "100%" : 300, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: window.innerWidth < 768 && sel ? "none" : "flex", flexDirection: "column", height: "100%" }}>
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
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
              <select value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)}
                style={{ width: "100%", marginTop: 8, padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit", background: "#fff", outline: "none" }}>
                <option value="Todos">Todas as especialidades</option>
                {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <VirtualFornList lista={listaFiltrada} sel={sel} onSelect={abrirFornecedor} />
          </div>

          {/* ── Painel direito ── */}
          <div style={{ flex: 1, display: window.innerWidth < 768 && !sel ? "none" : "flex", flexDirection: "column", overflow: "hidden" }}>
            {!sel ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}>
                Selecione um fornecedor para ver os detalhes
              </div>
            ) : (
              <>
                <div style={{ padding: "16px 16px 0", borderBottom: `1px solid ${C.border}` }}>
                  {window.innerWidth < 768 && (
                    <button onClick={() => setSel(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.red, padding: "0 0 12px", fontFamily: "inherit" }}>← Voltar</button>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 800 }}>{sel.nome}</h3>
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                        {sel.especialidade}{sel.cidade ? ` · ${sel.cidade}${sel.estado ? `/${sel.estado}` : ""}` : ""}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: C.muted }}>
                        {sel.telefone && <span><Phone size={12} /> {sel.telefone}</span>}
                        {sel.email    && <span><Mail size={12} /> {sel.email}</span>}
                        {sel.cnpj     && <span><Building2 size={12} /> {sel.cnpj}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setForm({ ...FORM_FORN, ...sel }); setModal("editar-forn"); }}
                        style={{ padding: "7px 14px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        <Pencil size={13} /> Editar
                      </button>
                      <button onClick={() => excluirFornecedor(sel.id)}
                        style={{ padding: "7px 14px", background: C.danger + "15", border: `1px solid ${C.danger}44`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}>
                        <Trash2 size={13} /> Excluir
                      </button>
                    </div>
                  </div>
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

                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  {tab === "cotacoes" && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{cotsSel.length} cotação{cotsSel.length !== 1 ? "ões" : ""}</div>
                        <Btn size="sm" onClick={() => { setFormCot(FORM_COT); setModal("nova-cot"); }}>+ Nova cotação</Btn>
                      </div>
                      {cotsSel.length === 0 && (
                        <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: "32px 0" }}>Nenhuma cotação registrada para este fornecedor.</div>
                      )}
                      {cotsSel.map((c) => (
                        <div key={c.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.descricao}</div>
                              {c.obras?.nome     && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}><HardHat size={13} /> {c.obras.nome}</div>}
                              {c.data_validade   && <div style={{ fontSize: 11, color: C.muted }}>Válida até {new Date(c.data_validade).toLocaleDateString("pt-BR")}</div>}
                              {c.observacoes     && <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontStyle: "italic" }}>{c.observacoes}</div>}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              {c.valor != null && <div style={{ fontSize: 18, fontWeight: 800, color: C.red, marginBottom: 6 }}>R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>}
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: (COT_STATUS_COR[c.status] || C.muted) + "22", color: COT_STATUS_COR[c.status] || C.muted }}>{c.status}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                            {c.status === "Aprovada" && (
                              <button onClick={() => { setPoModal(c); setPoForm({ local_entrega: obras.find((o) => o.id === c.obra_id)?.endereco || "", condicao_pagamento: "30 dias", observacoes_po: "" }); }}
                                style={{ padding: "5px 12px", background: "#166534" + "22", border: "1px solid #16653444", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#166534", cursor: "pointer", fontFamily: "inherit" }}>
                                🛒 Gerar PO
                              </button>
                            )}
                            <button onClick={() => { setFormCot({ ...FORM_COT, ...c, obra_id: c.obra_id || "" }); setCotSel(c); setModal("editar-cot"); }}
                              style={{ padding: "5px 12px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}><Pencil size={13} /> Editar</button>
                            <button onClick={async () => { await deleteCotacao(sel.id, c.id); mostrarToast("Cotação removida."); }}
                              style={{ padding: "5px 12px", background: C.danger + "15", border: `1px solid ${C.danger}33`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {tab === "historico" && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Resumo de cotações</div>
                      {["Aprovada","Pendente","Recusada","Expirada"].map((st) => {
                        const items = cotsSel.filter((c) => c.status === st);
                        const total = items.reduce((a, c) => a + (Number(c.valor) || 0), 0);
                        return (
                          <div key={st} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: COT_STATUS_COR[st] || C.muted, display: "inline-block" }} />
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{st}</span>
                              <span style={{ fontSize: 12, color: C.muted }}>({items.length})</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{total > 0 ? `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</span>
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

      {/* ── Modal Fornecedor ── */}
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

      {/* ── Modal Cotação ── */}
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

      {/* ── Modal Pedido de Compra ── */}
      {poModal && (
        <Modal title="🛒 Gerar Pedido de Compra" onClose={() => setPoModal(null)}>
          <div className="sf-col">
            <div style={{ background: C.darker, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Resumo da cotação</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{poModal.descricao}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.muted }}>{sel?.nome}</span>
                {poModal.valor != null && <span style={{ fontSize: 18, fontWeight: 900, color: C.red }}>R$ {Number(poModal.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}
              </div>
              {obras.find((o) => o.id === poModal.obra_id) && (
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>🏗️ {obras.find((o) => o.id === poModal.obra_id).nome}</div>
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
            <div style={{ background: "#166534" + "10", border: "1px solid #16653433", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#166534", fontWeight: 600 }}>
              ✅ Ao confirmar: PDF do pedido será gerado · Despesa criada no Financeiro como Pendente{sel?.telefone ? " · WhatsApp aberto para o fornecedor" : ""}
            </div>
            <div className="sf-actions">
              <Btn variant="ghost" onClick={() => setPoModal(null)}>Cancelar</Btn>
              <Btn onClick={gerarPedidoCompra}>🛒 Confirmar e Gerar PO</Btn>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#1a1a1a", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
