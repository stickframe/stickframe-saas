import { useState } from "react";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import { gerarContratoPDF } from "../services/pdfService";
import { enviarWhatsApp, msgContrato } from "../services/whatsappService";
import useAppStore from "../store/useAppStore";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const statusColor = (s) => {
  if (s === "Assinado" || s === "Em execução") return "#2e9e5b";
  if (s === "Aguardando") return "#c88a00";
  return "#888";
};

export default function Contratos() {
  const clientes    = useAppStore((s) => s.clientes);
  const contratos   = useAppStore((s) => s.contratos);
  const addContrato = useAppStore((s) => s.addContrato);

  const [modal, setModal] = useState(false);
  const FORM_VAZIO = { cliente_id: clientes[0]?.id || "", obra: "", valor: "", unidades: 1, area: 48, padrao: "Padrão", prazo: "" };
  const [form, setForm] = useState(FORM_VAZIO);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const clienteSel = clientes.find((c) => c.id === Number(form.cliente_id));

  const salvar = () => {
    addContrato({
      ref:      `CTR-2025-${String(contratos.length + 4).padStart(3, "0")}`,
      cliente:  clienteSel?.nome || "—",
      obra:     form.obra || clienteSel?.nome || "—",
      valor:    Number(form.valor),
      unidades: Number(form.unidades),
      area:     Number(form.area),
      padrao:   form.padrao,
      prazo:    form.prazo || "—",
      status:   "Aguardando",
      data:     new Date().toLocaleDateString("pt-BR"),
    });
    setModal(false);
    setForm(FORM_VAZIO);
  };

  return (
    <>
      {modal && (
        <Modal title="Novo contrato" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>CLIENTE</div>
              <Select value={form.cliente_id} onChange={set("cliente_id")} options={clientes.map((c) => ({ value: c.id, label: c.nome }))} />
            </div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>NOME DA OBRA</div>
              <Input value={form.obra} onChange={set("obra")} placeholder="Ex: Residencial Vista Verde — 10 UH" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>VALOR TOTAL (R$)</div><Input type="number" value={form.valor} onChange={set("valor")} /></div>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>UNIDADES</div><Input type="number" value={form.unidades} onChange={set("unidades")} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>ÁREA/UH (m²)</div><Input type="number" value={form.area} onChange={set("area")} /></div>
              <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>PRAZO</div><Input value={form.prazo} onChange={set("prazo")} placeholder="Ex: Dez/2025" /></div>
            </div>
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>PADRÃO</div>
              <Select value={form.padrao} onChange={set("padrao")} options={["Econômico", "Padrão", "Alto Padrão"].map((v) => ({ value: v, label: v }))} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn disabled={!form.valor || !clienteSel} onClick={salvar}>Criar contrato</Btn>
            </div>
          </div>
        </Modal>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Contratos</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{contratos.length} contratos cadastrados</p>
          </div>
          <Btn onClick={() => setModal(true)}>+ Novo contrato</Btn>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {contratos.map((c) => {
            const cl = clientes.find((x) => x.nome === c.cliente);
            return (
              <div key={c.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: 1 }}>{c.ref}</span>
                      <Badge label={c.status} color={statusColor(c.status)} />
                      <span style={{ fontSize: 11, color: C.muted }}>· {c.data}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{c.cliente}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{c.obra}</div>
                    <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
                      {[["Unidades", `${c.unidades} UH`], ["Área/UH", `${c.area} m²`], ["Padrão", c.padrao], ["Prazo", c.prazo]].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{k}</div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(c.valor)}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2, marginBottom: 16 }}>{fmt(c.valor / c.unidades)}/UH</div>
                    <button onClick={() => gerarContratoPDF(c)} style={{ padding: "9px 16px", background: C.red, border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "block", width: "100%", marginBottom: 8 }}>📄 Gerar Contrato</button>
                    <button onClick={() => enviarWhatsApp(cl?.contato || "", msgContrato(c))} style={{ padding: "8px 0", background: "#25D36622", border: "1px solid #25D36644", borderRadius: 6, color: "#25D366", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "block", width: "100%", marginBottom: 8 }}>📲 Enviar pelo Zap</button>
                    <Btn variant="ghost" size="sm" fullWidth>✏️ Editar</Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
