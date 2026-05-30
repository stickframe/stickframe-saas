import { useState } from "react";
import { C, PRECOS } from "../utils/constants";
import { fmt } from "../utils/format";
import { enviarWhatsApp, msgOrcamento } from "../services/whatsappService";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

// ─── Status ──────────────────────────────────────────────────────────────────
const STATUS_OPTS = ["Aguardando resposta", "Em revisão", "Aprovado", "Recusado"];
const STATUS_COR  = {
  "Aguardando resposta": "#c88a00",
  "Em revisão":          "#4a9eff",
  "Aprovado":            "#2e9e5b",
  "Recusado":            "#c0392b",
};
const statusColor = (s) => STATUS_COR[s] || C.muted;

// ─── Cálculo ─────────────────────────────────────────────────────────────────
function calcOrcamento({ area, unidades, padrao }) {
  const preco       = PRECOS[padrao] || PRECOS["Padrão"];
  const valor_m2    = preco.m2;
  const valor_uh    = valor_m2 * Number(area);
  const valor_total = valor_uh * Number(unidades);
  return { valor_m2, valor_uh, valor_total };
}

// ─── Label auxiliar ──────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>
      {String(children).toUpperCase()}
      {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

// ─── Formulário (fora do componente) ─────────────────────────────────────────
function FormOrc({ form, setForm, clientes, onSave, onCancel, btnLabel }) {
  const set  = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const calc = calcOrcamento({ area: form.area, unidades: form.unidades, padrao: form.padrao });

  const clienteOpts = clientes.map((c) => ({ value: c.id, label: c.nome }));
  if (!clienteOpts.length) clienteOpts.push({ value: "", label: "— Nenhum cliente cadastrado —" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Cliente */}
      <div>
        <Label required>Cliente</Label>
        <Select value={form.cliente_id} onChange={set("cliente_id")} options={clienteOpts} />
        {!clientes.length && (
          <div style={{ fontSize: 11, color: C.warning, marginTop: 4 }}>
            ⚠️ Cadastre um cliente no CRM antes de gerar um orçamento.
          </div>
        )}
      </div>

      {/* Unidades + Área */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label required>Unidades (UH)</Label>
          <Input
            type="number" min="1"
            value={form.unidades}
            onChange={(v) => set("unidades")(Math.max(1, parseInt(v) || 1))}
          />
        </div>
        <div>
          <Label required>Área / UH (m²)</Label>
          <Input
            type="number" min="1"
            value={form.area}
            onChange={(v) => set("area")(Math.max(1, parseFloat(v) || 1))}
          />
        </div>
      </div>

      {/* Padrão + Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label required>Padrão construtivo</Label>
          <Select
            value={form.padrao}
            onChange={set("padrao")}
            options={Object.entries(PRECOS).map(([k, v]) => ({ value: k, label: `${v.label} — ${fmt(v.m2)}/m²` }))}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onChange={set("status")}
            options={STATUS_OPTS.map((v) => ({ value: v, label: v }))}
          />
        </div>
      </div>

      {/* Prévia de valores */}
      <div style={{ background: C.darker, borderRadius: 10, border: `1px solid ${C.red}33`, padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: C.red, marginBottom: 12 }}>
          PRÉVIA DO ORÇAMENTO
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            ["Valor / m²",  fmt(calc.valor_m2),    false],
            ["Valor / UH",  fmt(calc.valor_uh),    false],
            ["TOTAL",       fmt(calc.valor_total),  true ],
          ].map(([k, v, destaque]) => (
            <div key={k} style={{
              background: C.surface, borderRadius: 8, padding: "10px 12px",
              border: destaque ? `1px solid ${C.red}44` : `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: destaque ? 15 : 13, fontWeight: 700, color: destaque ? C.red : C.text }}>
                {v}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
          {form.unidades} UH × {form.area} m² × {fmt(calc.valor_m2)}/m²
        </div>
      </div>

      {/* Ações */}
      <div style={{
        display: "flex", gap: 10, justifyContent: "flex-end",
        paddingTop: 12, borderTop: `1px solid ${C.border}`,
      }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn
          disabled={!form.cliente_id || !clientes.length}
          onClick={onSave}
        >
          {btnLabel}
        </Btn>
      </div>
    </div>
  );
}

// ─── Gerador de PDF ───────────────────────────────────────────────────────────
function gerarPDF(o) {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Orçamento ${o.ref}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #981915; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: 3px; }
    .logo span { color: #981915; }
    .ref { font-size: 13px; color: #6b7280; margin-top: 4px; }
    h2 { font-size: 18px; margin-bottom: 20px; color: #981915; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e4e4ea; font-size: 14px; }
    .row .label { color: #6b7280; }
    .row .value { font-weight: 700; }
    .total-box { background: #f0f0f3; border-radius: 10px; padding: 20px 24px; margin-top: 28px; display: flex; justify-content: space-between; align-items: center; }
    .total-box .label { font-size: 13px; color: #6b7280; }
    .total-box .value { font-size: 28px; font-weight: 900; color: #981915; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #6b7280; }
    @media print { body { padding: 20px; } }
  </style></head><body>
  <div class="header">
    <div>
      <div class="logo">STICK<span>FRAME</span></div>
      <div class="ref">SISTEMAS CONSTRUTIVOS</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:800">${o.ref}</div>
      <div class="ref">${o.criado || new Date().toLocaleDateString("pt-BR")}</div>
    </div>
  </div>
  <h2>Proposta de Orçamento</h2>
  <div class="row"><span class="label">Cliente</span><span class="value">${o.cliente}</span></div>
  <div class="row"><span class="label">Padrão construtivo</span><span class="value">${o.padrao}</span></div>
  <div class="row"><span class="label">Unidades habitacionais</span><span class="value">${o.unidades} UH</span></div>
  <div class="row"><span class="label">Área por unidade</span><span class="value">${o.area} m²</span></div>
  <div class="row"><span class="label">Área total</span><span class="value">${o.unidades * o.area} m²</span></div>
  <div class="row"><span class="label">Valor por m²</span><span class="value">R$ ${(o.valor / (o.unidades * o.area)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
  <div class="row"><span class="label">Valor por UH</span><span class="value">R$ ${(o.valor / o.unidades).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
  <div class="total-box">
    <div class="label">VALOR TOTAL DA PROPOSTA</div>
    <div class="value">R$ ${o.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
  </div>
  <div class="footer">
    <p>Stick Frame Sistemas Construtivos · stickframe.com.br</p>
    <p>Este orçamento é válido por 30 dias a partir da data de emissão.</p>
  </div>
  </body></html>`;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

// ─── Orçamentos principal ─────────────────────────────────────────────────────
const FORM_VAZIO = {
  cliente_id: "",
  unidades:   1,
  area:       48,
  padrao:     "Padrão",
  status:     "Aguardando resposta",
};

export default function Orcamentos() {
  useModuleLoad("orcamentos");
  useModuleLoad("clientes");

  const clientes        = useAppStore((s) => s.clientes);
  const orcamentos      = useAppStore((s) => s.orcamentos);
  const addOrcamento    = useAppStore((s) => s.addOrcamento);
  const updateOrcamento = useAppStore((s) => s.updateOrcamento);
  const deleteOrcamento = useAppStore((s) => s.deleteOrcamento);

  const [modal,   setModal]   = useState(false);
  const [editId,  setEditId]  = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState({ ...FORM_VAZIO, cliente_id: clientes[0]?.id || "" });

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function abrirNovo() {
    setForm({ ...FORM_VAZIO, cliente_id: clientes[0]?.id || "" });
    setModal("novo");
  }

  function abrirEditar(o) {
    setEditId(o.id);
    setForm({
      cliente_id: o.cliente_id || clientes[0]?.id || "",
      unidades:   o.unidades   || 1,
      area:       o.area       || 48,
      padrao:     o.padrao     || "Padrão",
      status:     o.status     || "Aguardando resposta",
    });
    setModal("editar");
  }

  function gerarRef() {
    const ano = new Date().getFullYear();
    const num = String(orcamentos.length + 1).padStart(3, "0");
    return `ORC-${ano}-${num}`;
  }

  function salvarNovo() {
    const clienteSel = clientes.find((c) => c.id === form.cliente_id);
    const calc       = calcOrcamento(form);
    addOrcamento({
      ref:        gerarRef(),
      cliente:    clienteSel?.nome || "—",
      cliente_id: form.cliente_id,         // UUID string — sem Number()!
      valor:      calc.valor_total,
      unidades:   Number(form.unidades),
      area:       Number(form.area),
      padrao:     form.padrao,
      status:     form.status,
      criado:     new Date().toLocaleDateString("pt-BR"),
    });
    setModal(false);
    mostrarToast("✅ Orçamento gerado com sucesso!");
  }

  function salvarEdicao() {
    const clienteSel = clientes.find((c) => c.id === form.cliente_id);
    const calc       = calcOrcamento(form);
    updateOrcamento(editId, {
      cliente:    clienteSel?.nome || "—",
      cliente_id: form.cliente_id,         // UUID string — sem Number()!
      unidades:   Number(form.unidades),
      area:       Number(form.area),
      padrao:     form.padrao,
      valor:      calc.valor_total,
      status:     form.status,
    });
    setModal(false);
    mostrarToast("✅ Orçamento atualizado!");
  }

  function confirmarDelete(id) { setConfirm(id); }
  function executarDelete() {
    deleteOrcamento(confirm);
    setConfirm(null);
    mostrarToast("🗑 Orçamento removido.");
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006",
        }}>
          {toast}
        </div>
      )}

      {/* Modais */}
      {modal === "novo" && (
        <Modal title="Novo orçamento" onClose={() => setModal(false)}>
          <FormOrc
            form={form} setForm={setForm} clientes={clientes}
            onSave={salvarNovo} onCancel={() => setModal(false)}
            btnLabel="Gerar orçamento"
          />
        </Modal>
      )}
      {modal === "editar" && (
        <Modal title="Editar orçamento" onClose={() => setModal(false)}>
          <FormOrc
            form={form} setForm={setForm} clientes={clientes}
            onSave={salvarEdicao} onCancel={() => setModal(false)}
            btnLabel="Salvar alterações"
          />
        </Modal>
      )}

      {/* Confirmação de exclusão */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: 360, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🗑</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Deletar orçamento?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Essa ação não pode ser desfeita.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
              <button onClick={executarDelete} style={{
                padding: "10px 24px", background: C.danger, border: "none",
                borderRadius: 6, color: "#fff", fontWeight: 700,
                fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout */}
      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Orçamentos</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              {orcamentos.length} proposta{orcamentos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Btn onClick={abrirNovo}>+ Novo orçamento</Btn>
        </div>

        {/* Lista */}
        {orcamentos.length === 0 ? (
          <div style={{
            background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
            padding: 48, textAlign: "center", color: C.muted,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◻</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhum orçamento ainda</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Clique em "+ Novo orçamento" para começar</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orcamentos.map((o) => {
              const clienteOrc = clientes.find((c) => c.id === o.cliente_id);
              return (
                <div key={o.id} style={{
                  background: C.surface, borderRadius: 12,
                  border: `1px solid ${C.border}`, padding: "16px 20px",
                  transition: "border-color .15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: 1 }}>
                          {o.ref}
                        </span>
                        <Badge label={o.status} color={statusColor(o.status)} />
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{o.cliente}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                        {o.unidades} UH · {o.area} m²/und · {PRECOS[o.padrao]?.label || o.padrao} · {o.criado}
                      </div>
                    </div>

                    {/* Valor */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(o.valor)}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        {o.unidades > 1 ? `${fmt(o.valor / o.unidades)} / UH` : `${fmt(o.valor / o.area)}/m²`}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    <Btn variant="ghost" size="sm" onClick={() => abrirEditar(o)}>✏️ Editar</Btn>
                    <button
                      onClick={() => gerarPDF(o)}
                      style={{
                        padding: "6px 14px", background: "#4a9eff22",
                        border: "1px solid #4a9eff44", borderRadius: 6,
                        color: "#4a9eff", fontSize: 11, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      📄 PDF
                    </button>

                    <Select
                      value={o.status}
                      onChange={(v) => updateOrcamento(o.id, { status: v })}
                      options={STATUS_OPTS.map((s) => ({ value: s, label: s }))}
                    />

                    {clienteOrc?.contato && (
                      <button
                        onClick={() => enviarWhatsApp(clienteOrc.contato, msgOrcamento(o))}
                        style={{
                          padding: "6px 14px", background: "#25D36622",
                          border: "1px solid #25D36644", borderRadius: 6,
                          color: "#25D366", fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        📲 WhatsApp
                      </button>
                    )}

                    <button
                      onClick={() => confirmarDelete(o.id)}
                      style={{
                        padding: "6px 12px", background: C.danger + "22",
                        border: `1px solid ${C.danger}44`, borderRadius: 6,
                        color: C.danger, fontSize: 11, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
