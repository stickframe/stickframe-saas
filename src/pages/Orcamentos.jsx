import { useState } from "react";
import { C, PRECOS } from "../utils/constants";
import { fmt } from "../utils/format";
import { enviarWhatsApp, msgOrcamento } from "../services/whatsappService";
import useAppStore from "../store/useAppStore";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const STATUS_COR = {
  "Aguardando resposta": "#c88a00",
  "Em revisão":          "#4a9eff",
  "Aprovado":            "#2e9e5b",
  "Recusado":            "#c0392b",
};
const statusColor = (s) => STATUS_COR[s] || C.muted;

function calcOrcamento({ area, unidades, padrao }) {
  const preco      = PRECOS[padrao] || PRECOS["Padrão"];
  const valor_m2   = preco.m2;
  const valor_uh   = valor_m2 * area;
  const valor_total= valor_uh * unidades;
  return { valor_m2, valor_uh, valor_total };
}

export default function Orcamentos() {
  const clientes        = useAppStore((s) => s.clientes);
  const orcamentos      = useAppStore((s) => s.orcamentos);
  const addOrcamento    = useAppStore((s) => s.addOrcamento);
  const updateOrcamento = useAppStore((s) => s.updateOrcamento);
  const deleteOrcamento = useAppStore((s) => s.deleteOrcamento);

  const [modal,   setModal]   = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [confirm, setConfirm] = useState(null);

  const FORM_VAZIO = { cliente_id: clientes[0]?.id || "", unidades: 1, area: 48, padrao: "Padrão" };
  const [form, setForm] = useState(FORM_VAZIO);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const calc       = calcOrcamento({ area: Number(form.area), unidades: Number(form.unidades), padrao: form.padrao });
  const clienteSel = clientes.find((c) => c.id === Number(form.cliente_id));

  const abrirNovo   = () => { setForm(FORM_VAZIO); setModal("novo"); };
  const abrirEditar = (o) => {
    setEditId(o.id);
    setForm({ cliente_id: o.cliente_id || clientes[0]?.id || "", unidades: o.unidades, area: o.area, padrao: o.padrao || "Padrão" });
    setModal("editar");
  };

  const salvarNovo = () => {
    addOrcamento({
      ref:      `ORC-2025-${String(orcamentos.length + 32).padStart(3, "0")}`,
      cliente:  clienteSel?.nome || "—",
      cliente_id: Number(form.cliente_id),
      valor:    calc.valor_total,
      unidades: Number(form.unidades),
      area:     Number(form.area),
      padrao:   form.padrao,
      status:   "Aguardando resposta",
      criado:   new Date().toLocaleDateString("pt-BR"),
    });
    setModal(false);
  };

  const salvarEdicao = () => {
    updateOrcamento(editId, {
      cliente:    clienteSel?.nome,
      cliente_id: Number(form.cliente_id),
      unidades:   Number(form.unidades),
      area:       Number(form.area),
      padrao:     form.padrao,
      valor:      calc.valor_total,
    });
    setModal(false);
  };

  const FormOrc = ({ onSave, btnLabel }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>CLIENTE</div>
        <Select value={form.cliente_id} onChange={set("cliente_id")} options={clientes.map((c) => ({ value: c.id, label: c.nome }))} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>UNIDADES</div>
          <Input type="number" value={form.unidades} onChange={set("unidades")} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>ÁREA/UH (m²)</div>
          <Input type="number" value={form.area} onChange={set("area")} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>PADRÃO</div>
        <Select value={form.padrao} onChange={set("padrao")} options={Object.entries(PRECOS).map(([k, v]) => ({ value: k, label: v.label }))} />
      </div>
      <div style={{ background: C.darker, borderRadius: 8, border: `1px solid ${C.red}33`, padding: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.red, marginBottom: 10 }}>PRÉVIA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[["Valor/m²", fmt(calc.valor_m2)], ["Valor/UH", fmt(calc.valor_uh)], ["Total", fmt(calc.valor_total)]].map(([k, v]) => (
            <div key={k} style={{ background: C.surface, borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: k === "Total" ? C.red : C.text }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
        <Btn onClick={onSave}>{btnLabel}</Btn>
      </div>
    </div>
  );

  return (
    <>
      {modal === "novo"   && <Modal title="Novo orçamento"   onClose={() => setModal(false)}><FormOrc onSave={salvarNovo}   btnLabel="Gerar orçamento" /></Modal>}
      {modal === "editar" && <Modal title="Editar orçamento" onClose={() => setModal(false)}><FormOrc onSave={salvarEdicao} btnLabel="Salvar alterações" /></Modal>}

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: 360, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Deletar orçamento?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Essa ação não pode ser desfeita.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
              <button onClick={() => { deleteOrcamento(confirm); setConfirm(null); }} style={{ padding: "10px 20px", background: C.danger, border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Deletar</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Orçamentos</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{orcamentos.length} propostas</p>
          </div>
          <Btn onClick={abrirNovo}>+ Novo orçamento</Btn>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orcamentos.map((o) => {
            const clienteOrc = clientes.find((c) => c.nome === o.cliente);
            return (
              <div key={o.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "15px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: 1 }}>{o.ref}</span>
                      <Badge label={o.status} color={statusColor(o.status)} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{o.cliente}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {o.unidades} UH · {o.area} m²/und · {PRECOS[o.padrao]?.label || "Padrão"} · {o.criado}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{fmt(o.valor)}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{fmt(o.valor / o.unidades)}/UH</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <Btn variant="ghost" size="sm" onClick={() => abrirEditar(o)}>✏️ Editar</Btn>
                  <Btn variant="ghost" size="sm">Ver PDF</Btn>
                  <button onClick={() => enviarWhatsApp(clienteOrc?.contato || "", msgOrcamento(o))} style={{ padding: "6px 14px", background: "#25D36622", border: "1px solid #25D36644", borderRadius: 6, color: "#25D366", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📲 Zap</button>
                  <button onClick={() => setConfirm(o.id)} style={{ padding: "6px 12px", background: C.danger + "22", border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.danger, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
