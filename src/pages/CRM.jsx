import { useState } from "react";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import { enviarWhatsApp, msgCliente } from "../services/whatsappService";
import useAppStore from "../store/useAppStore";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const STATUS_COR = {
  "Lead":              "#4a9eff",
  "Em negociação":     "#c88a00",
  "Proposta enviada":  "#981915",
  "Fechado":           "#2e9e5b",
  "Em execução":       "#2e9e5b",
};

function statusColor(s) { return STATUS_COR[s] || C.muted; }

export default function CRM() {
  const clientes      = useAppStore((s) => s.clientes);
  const addCliente    = useAppStore((s) => s.addCliente);
  const updateCliente = useAppStore((s) => s.updateCliente);
  const deleteCliente = useAppStore((s) => s.deleteCliente);
  const [modal,   setModal]   = useState(false);
  const [sel,     setSel]     = useState(null);
  const [confirm, setConfirm] = useState(false);
  const FORM_VAZIO = { nome: "", cidade: "", contato: "", status: "Lead" };
  const [form, setForm] = useState(FORM_VAZIO);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const cliente = clientes.find((c) => c.id === sel);

  const abrirNovo   = () => { setForm(FORM_VAZIO); setModal("novo"); };
  const abrirEditar = (c) => { setForm({ nome: c.nome, cidade: c.cidade, contato: c.contato || "", status: c.status }); setModal("editar"); };

  const salvarNovo  = () => { addCliente({ ...form, valor: 0, unidades: 0 }); setModal(false); };
  const salvarEdicao= () => { updateCliente(sel, form); setModal(false); };
  const deletar     = () => { deleteCliente(sel); setSel(null); setConfirm(false); };

  const FormCliente = ({ onSave, btnLabel }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[["Nome", "nome", "Ex: João Silva"], ["Cidade/UF", "cidade", "Ex: Bofete/SP"], ["Contato", "contato", "(11) 9xxxx-xxxx"]].map(([l, k, ph]) => (
        <div key={k}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>{l.toUpperCase()}</div>
          <Input value={form[k]} onChange={set(k)} placeholder={ph} />
        </div>
      ))}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>STATUS</div>
        <Select value={form.status} onChange={set("status")} options={["Lead", "Em negociação", "Proposta enviada", "Fechado"].map((v) => ({ value: v, label: v }))} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
        <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
        <Btn disabled={!form.nome || !form.cidade} onClick={onSave}>{btnLabel}</Btn>
      </div>
    </div>
  );

  return (
    <>
      {modal === "novo"   && <Modal title="Novo cliente"   onClose={() => setModal(false)}><FormCliente onSave={salvarNovo}   btnLabel="Salvar cliente" /></Modal>}
      {modal === "editar" && <Modal title="Editar cliente" onClose={() => setModal(false)}><FormCliente onSave={salvarEdicao} btnLabel="Salvar alterações" /></Modal>}

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: 360, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Deletar cliente?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Essa ação não pode ser desfeita.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(false)}>Cancelar</Btn>
              <button onClick={deletar} style={{ padding: "10px 20px", background: C.danger, border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Deletar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr min(300px,100%)" : "1fr", gap: 18 }}>
        {/* Lista */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>CRM / Clientes</h2>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{clientes.length} contatos</p>
            </div>
            <Btn onClick={abrirNovo}>+ Novo cliente</Btn>
          </div>

          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.red}22` }}>
                  {["Cliente", "Cidade", "UH", "Valor", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "11px 15px", textAlign: "left", fontSize: 10, letterSpacing: 1.2, color: C.muted, fontWeight: 700 }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} onClick={() => setSel(sel === c.id ? null : c.id)}
                    style={{ borderBottom: `1px solid ${C.border}`, background: sel === c.id ? C.red + "0e" : "transparent", cursor: "pointer" }}>
                    <td style={{ padding: "12px 15px", fontSize: 13, fontWeight: 600 }}>{c.nome}</td>
                    <td style={{ padding: "12px 15px", fontSize: 13, color: C.muted }}>{c.cidade}</td>
                    <td style={{ padding: "12px 15px", fontSize: 13 }}>{c.unidades || "—"}</td>
                    <td style={{ padding: "12px 15px", fontSize: 13, fontWeight: 600 }}>{c.valor ? fmt(c.valor) : "—"}</td>
                    <td style={{ padding: "12px 15px" }}><Badge label={c.status} color={statusColor(c.status)} /></td>
                    <td style={{ padding: "12px 15px", color: C.muted, fontSize: 18 }}>›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel lateral */}
        {cliente && (
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 22, height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{cliente.nome}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{cliente.cidade}</div>
              </div>
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <Badge label={cliente.status} color={statusColor(cliente.status)} />
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {[["Contato", cliente.contato || "—"], ["Unidades", cliente.unidades ? `${cliente.unidades} UH` : "—"], ["Valor", cliente.valor ? fmt(cliente.valor) : "—"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 9 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Btn variant="ghost" size="sm" onClick={() => abrirEditar(cliente)} fullWidth>✏️ Editar</Btn>
              <button onClick={() => setConfirm(true)} style={{ flex: 1, padding: "7px 0", background: C.danger + "22", border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.danger, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🗑 Deletar</button>
            </div>
            <button onClick={() => enviarWhatsApp(cliente.contato || "", msgCliente(cliente))} style={{ marginTop: 8, width: "100%", padding: "9px 0", background: "#25D36622", border: "1px solid #25D36644", borderRadius: 6, color: "#25D366", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              📲 Enviar WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
}
