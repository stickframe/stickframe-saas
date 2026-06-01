import { useState } from "react";
import { Trash2, Pencil } from "../components/ui/Icon";
import { useToast } from "../hooks/useToast";
import { buscarEmpresa } from "../services/repositories/empresaRepository";
import { C, PRECOS } from "../utils/constants";
import { fmt } from "../utils/format";
import { enviarWhatsApp, msgContrato } from "../services/whatsappService";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

// ─── Geração de PDF ──────────────────────────────────────────────────────────
function gerarPDFContrato(c, emp) {
  const fases = [
    { nome: "Projeto executivo",                   pct: 8  },
    { nome: "Fundação",                            pct: 12 },
    { nome: "Estrutura Steel Frame",               pct: 35 },
    { nome: "Fechamentos e painéis",               pct: 20 },
    { nome: "Instalações elétricas e hidráulicas", pct: 12 },
    { nome: "Acabamento e entrega",                pct: 13 },
  ];
  const hoje = new Date().toLocaleDateString("pt-BR");
  const fmtV = (v) => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const linhasFase = fases.map((f, i) => `
    <tr>
      <td style="padding:9px 8px;color:#888;font-size:12px">${i + 1}</td>
      <td style="padding:9px 8px;font-size:12px">${f.nome}</td>
      <td style="padding:9px 8px;text-align:right;color:#981915;font-weight:700;font-size:12px">${f.pct}%</td>
      <td style="padding:9px 8px;text-align:right;font-size:12px">${fmtV(c.valor * f.pct / 100)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:13px}
    .header{background:#1a1a1a;padding:18px 32px;display:flex;justify-content:space-between;align-items:center}
    .hero{background:linear-gradient(135deg,#981915,#6e1210);padding:24px 32px;color:#fff}
    .body{padding:24px 32px}
    .card{background:#fff;border:1px solid #e8e8e8;border-radius:10px;padding:20px;margin-bottom:14px}
    .label{font-size:10px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;margin-bottom:10px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:6px 8px;font-size:10px;font-weight:700;color:#888;letter-spacing:.5px;border-bottom:2px solid #f0f0f0}
    th.r{text-align:right} td{border-bottom:1px solid #f5f5f5}
    .footer{background:#f9f9f9;border-top:1px solid #eee;padding:16px 32px;font-size:10px;color:#888;text-align:center}
    .assinatura{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
    .assbox{border-top:2px solid #1a1a1a;padding-top:8px}
    @media print{@page{margin:0;size:A4}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div class="header">
    <div style="font-size:16px;font-weight:800;letter-spacing:2px">
      <span style="color:#555">STICK</span><span style="color:#981915">FRAME</span>
      <div style="font-size:8px;color:#444;letter-spacing:1.5px;margin-top:2px">SISTEMAS CONSTRUTIVOS</div>
    </div>
    <div style="text-align:right;color:#555;font-size:11px">
      <div style="font-weight:700;color:#fff">${c.ref}</div>
      <div>Emitido em ${c.data || hoje}</div>
    </div>
  </div>
  <div class="hero">
    <div style="font-size:9px;letter-spacing:2px;opacity:.7;margin-bottom:6px">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:4px">Construção em Steel Frame</div>
    <div style="font-size:13px;opacity:.85">Cliente: <strong>${c.cliente}</strong></div>
    <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
      ${[["Padrão", c.padrao], ["Unidades", c.unidades], ["Área", c.area + " m²"], ["Prazo", c.prazo || "—"]].map(([l, v]) =>
        `<div style="background:rgba(255,255,255,.15);border-radius:8px;padding:10px 14px;border:1px solid rgba(255,255,255,.2)">
          <div style="font-size:9px;opacity:.7;margin-bottom:3px">${l.toUpperCase()}</div>
          <div style="font-size:14px;font-weight:800">${v}</div>
        </div>`).join("")}
    </div>
  </div>
  <div class="body">
    <div style="text-align:center;border:2px solid #981915;border-radius:10px;padding:18px;margin-bottom:16px">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#888;margin-bottom:6px">VALOR TOTAL DO CONTRATO</div>
      <div style="font-size:36px;font-weight:800;color:#981915">${fmtV(c.valor)}</div>
      <div style="font-size:12px;color:#888;margin-top:4px">${c.unidades > 1 ? `${fmtV(c.valor / c.unidades)}/unid.` : `${fmtV(c.valor / (c.area || 1))}/m²`}</div>
    </div>
    <div class="card">
      <div class="label">Objeto do Contrato</div>
      <p style="color:#444;line-height:1.8;margin-bottom:10px">
        Prestação de serviços de construção em sistema <strong>Steel Frame</strong>
        para a obra <strong>${c.obra || "especificada nas plantas executivas"}</strong>,
        pelo valor global de <strong style="color:#981915">${fmtV(c.valor)}</strong>.
      </p>
    </div>
    <div class="card">
      <div class="label">Cronograma Físico-Financeiro</div>
      <table><thead><tr><th style="width:32px">#</th><th>Fase</th><th class="r">%</th><th class="r">Valor</th></tr></thead>
      <tbody>${linhasFase}
        <tr style="background:#f9fafb">
          <td colspan="2" style="padding:12px 8px;font-weight:700">Total</td>
          <td style="padding:12px 8px;text-align:right;font-weight:700">100%</td>
          <td style="padding:12px 8px;text-align:right;font-weight:800;color:#981915;font-size:14px">${fmtV(c.valor)}</td>
        </tr>
      </tbody></table>
    </div>
    <div class="card">
      <div class="label">Condições Gerais</div>
      ${[["Garantia","5 anos para estrutura e 1 ano para acabamentos (NBR 17170)."],
         ["Responsabilidade","ART registrada no CREA/CAU pelo responsável técnico."],
         ["Reajuste","Valores fixos, salvo aditivos formalizados por escrito."],
         ["Foro","${emp?.cidade || 'local do contrato'}"]]
        .map(([t,d]) => `<div style="margin-bottom:10px"><strong style="font-size:12px">${t}:</strong> <span style="color:#666">${d}</span></div>`).join("")}
    </div>
    <div class="assinatura">
      <div class="assbox"><div style="font-size:11px;color:#888;margin-top:6px">Contratante — ${c.cliente}</div></div>
      <div class="assbox"><div style="font-size:11px;color:#888;margin-top:6px">${emp?.nome || "Stick Frame Sistemas Construtivos"}</div></div>
    </div>
    <div style="margin-top:16px;font-size:10px;color:#aaa;text-align:center">Local e data: ________________________, ____/____/______</div>
  </div>
  <div class="footer">${emp?.nome || "Stick Frame"} · ${emp?.email || ""} · Contrato ${c.ref} · ${hoje}</div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`;

  printHtml(html, `contrato-${c.ref || "contrato"}`);
}

// ─── Status ──────────────────────────────────────────────────────────────────
const STATUS_OPTS = ["Aguardando", "Assinado", "Em execução", "Encerrado", "Cancelado"];
const statusColor = (s) => {
  if (s === "Assinado" || s === "Em execução") return "#2e9e5b";
  if (s === "Aguardando") return "#c88a00";
  if (s === "Cancelado")  return "#c0392b";
  return "#888";
};

// ─── Label ───────────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>
      {String(children).toUpperCase()}
      {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

// ─── Formulário (fora do componente) ─────────────────────────────────────────
function FormContrato({ form, setForm, clientes, obras, onSave, onCancel, btnLabel }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const clienteOpts = [
    { value: "", label: "— Selecione o cliente —" },
    ...clientes.map((c) => ({ value: c.id, label: c.nome })),
  ];

  // Filtra obras pelo cliente selecionado
  const obrasCliente = obras.filter((o) => !form.cliente_id || o.cliente_id === form.cliente_id);
  const obraOpts = [
    { value: "", label: "— Sem obra vinculada —" },
    ...obrasCliente.map((o) => ({ value: o.id, label: o.nome })),
  ];

  function handleClienteChange(v) {
    const c = clientes.find((x) => x.id === v);
    setForm((f) => ({ ...f, cliente_id: v, cliente: c?.nome || "", obra_id: "", obra: "" }));
  }

  function handleObraChange(v) {
    const o = obras.find((x) => x.id === v);
    setForm((f) => ({ ...f, obra_id: v, obra: o?.nome || "" }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Cliente */}
      <div>
        <Label required>Cliente</Label>
        <Select value={form.cliente_id} onChange={handleClienteChange} options={clienteOpts} />
      </div>

      {/* Obra vinculada */}
      <div>
        <Label>Obra vinculada</Label>
        <Select value={form.obra_id} onChange={handleObraChange} options={obraOpts} />
      </div>

      {/* Descrição da obra (se não selecionou obra) */}
      {!form.obra_id && (
        <div>
          <Label>Descrição da obra</Label>
          <Input value={form.obra} onChange={set("obra")} placeholder="Ex: Residencial Vista Verde — 10 UH" />
        </div>
      )}

      {/* Valor + Prazo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label required>Valor total (R$)</Label>
          <input
            inputMode="numeric"
            value={form.valor
              ? "R$ " + Number(String(form.valor).replace(/\D/g, "") || 0).toLocaleString("pt-BR")
              : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              set("valor")(raw ? String(Number(raw)) : "");
            }}
            placeholder="R$ 0"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.bg,
              color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none",
            }}
          />
        </div>
        <div>
          <Label>Prazo de entrega</Label>
          <Input value={form.prazo} onChange={set("prazo")} placeholder="Ex: Dez/2025" />
        </div>
      </div>

      {/* Unidades + Área */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <Label>Unidades</Label>
          <Input type="number" min="1" value={form.unidades} onChange={set("unidades")} />
        </div>
        <div>
          <Label>Área (m²)</Label>
          <Input type="number" min="1" value={form.area} onChange={set("area")} />
        </div>
        <div>
          <Label>Padrão</Label>
          <Select value={form.padrao} onChange={set("padrao")}
            options={Object.keys(PRECOS).map((k) => ({ value: k, label: k }))} />
        </div>
      </div>

      {/* Status */}
      <div>
        <Label>Status</Label>
        <Select value={form.status} onChange={set("status")}
          options={STATUS_OPTS.map((s) => ({ value: s, label: s }))} />
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn disabled={!form.cliente_id || !form.valor} onClick={onSave}>{btnLabel}</Btn>
      </div>
    </div>
  );
}

// ─── Contratos ───────────────────────────────────────────────────────────────
const FORM_VAZIO = {
  cliente_id: "", cliente: "",
  obra_id:    "", obra: "",
  valor: "", unidades: 1, area: 48, padrao: "Padrão",
  prazo: "—", status: "Aguardando",
};

export default function Contratos() {
  useModuleLoad("contratos");
  useModuleLoad("clientes");
  useModuleLoad("obras");

  const clientes       = useAppStore((s) => s.clientes);
  const obras          = useAppStore((s) => s.obras);
  const contratos      = useAppStore((s) => s.contratos);
  const perfil         = useAppStore((s) => s.user?.perfil);
  const addContrato    = useAppStore((s) => s.addContrato);
  const updateContrato = useAppStore((s) => s.updateContrato);
  const deleteContrato = useAppStore((s) => s.deleteContrato);

  const [modal,   setModal]   = useState(null); // "novo" | "editar"
  const [editId,  setEditId]  = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { toast, mostrarToast } = useToast();
  const [form,    setForm]    = useState(FORM_VAZIO);


  function abrirNovo() {
    setForm({ ...FORM_VAZIO, cliente_id: clientes[0]?.id || "", cliente: clientes[0]?.nome || "" });
    setModal("novo");
  }

  function abrirEditar(c) {
    setEditId(c.id);
    setForm({
      cliente_id: c.cliente_id || "",
      cliente:    c.cliente    || "",
      obra_id:    c.obra_id    || "",
      obra:       c.obra       || "",
      valor:      c.valor      || "",
      unidades:   c.unidades   || 1,
      area:       c.area       || 48,
      padrao:     c.padrao     || "Padrão",
      prazo:      c.prazo      || "—",
      status:     c.status     || "Aguardando",
    });
    setModal("editar");
  }

  function gerarRef() {
    const ano = new Date().getFullYear();
    const num = String(contratos.length + 1).padStart(3, "0");
    return `CTR-${ano}-${num}`;
  }

  function salvarNovo() {
    addContrato({
      ref:      gerarRef(),
      cliente:  form.cliente,
      cliente_id: form.cliente_id,
      obra:     form.obra,
      obra_id:  form.obra_id || null,
      valor:    Number(form.valor),
      unidades: Number(form.unidades),
      area:     Number(form.area),
      padrao:   form.padrao,
      prazo:    form.prazo || "—",
      status:   form.status,
      data:     new Date().toLocaleDateString("pt-BR"),
    });
    setModal(null);
    mostrarToast("✅ Contrato criado com sucesso!");
  }

  function salvarEdicao() {
    updateContrato(editId, {
      cliente:    form.cliente,
      cliente_id: form.cliente_id,
      obra:       form.obra,
      obra_id:    form.obra_id || null,
      valor:      Number(form.valor),
      unidades:   Number(form.unidades),
      area:       Number(form.area),
      padrao:     form.padrao,
      prazo:      form.prazo,
      status:     form.status,
    });
    setModal(null);
    mostrarToast("✅ Contrato atualizado!");
  }

  function executarDelete() {
    deleteContrato(confirm);
    setConfirm(null);
    mostrarToast("🗑 Contrato removido.");
  }

  const contratoParaDelete = contratos.find((c) => c.id === confirm);

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
        <Modal title="Novo contrato" onClose={() => setModal(null)}>
          <FormContrato
            form={form} setForm={setForm} clientes={clientes} obras={obras}
            onSave={salvarNovo} onCancel={() => setModal(null)}
            btnLabel="Criar contrato"
          />
        </Modal>
      )}
      {modal === "editar" && (
        <Modal title="Editar contrato" onClose={() => setModal(null)}>
          <FormContrato
            form={form} setForm={setForm} clientes={clientes} obras={obras}
            onSave={salvarEdicao} onCancel={() => setModal(null)}
            btnLabel="Salvar alterações"
          />
        </Modal>
      )}

      {/* Confirmação de exclusão */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: 360, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}><Trash2 size={13} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Deletar contrato?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
              <strong style={{ color: C.text }}>{contratoParaDelete?.ref}</strong> será removido permanentemente.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
              <button onClick={executarDelete} style={{
                padding: "10px 24px", background: C.danger, border: "none",
                borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
              }}>Deletar</button>
            </div>
          </div>
        </div>
      )}

      {/* Layout */}
      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Contratos</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              {contratos.length} contrato{contratos.length !== 1 ? "s" : ""} cadastrado{contratos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Btn onClick={abrirNovo}>+ Novo contrato</Btn>
        </div>

        {/* Resumo financeiro — visível para perfil financeiro */}
        {perfil === "financeiro" && contratos.length > 0 && (() => {
          const porStatus = STATUS_OPTS.map((s) => {
            const lista = contratos.filter((c) => c.status === s);
            return { status: s, qtd: lista.length, valor: lista.reduce((sum, c) => sum + (c.valor || 0), 0) };
          }).filter((s) => s.qtd > 0);
          const totalCarteira = contratos.reduce((sum, c) => sum + (c.valor || 0), 0);
          return (
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                {porStatus.map((s) => (
                  <div key={s.status} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${statusColor(s.status)}`, borderRadius: 10, padding: "12px 16px", minWidth: 140, flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.status}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: statusColor(s.status) }}>{fmt(s.valor)}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{s.qtd} contrato{s.qtd !== 1 ? "s" : ""}</div>
                  </div>
                ))}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.text}`, borderRadius: 10, padding: "12px 16px", minWidth: 140, flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Total carteira</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(totalCarteira)}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{contratos.length} contratos</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Empty state */}
        {contratos.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>◑</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Nenhum contrato cadastrado</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Crie um contrato vinculando cliente e obra para formalizar o projeto.</div>
            <Btn onClick={abrirNovo}>+ Criar primeiro contrato</Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {contratos.map((c) => {
              const cl = clientes.find((x) => x.id === c.cliente_id);
              return (
                <div key={c.id} style={{
                  background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: `1px solid ${C.border}`, padding: "18px 22px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: 1 }}>{c.ref}</span>
                        <Badge label={c.status} color={statusColor(c.status)} />
                        <span style={{ fontSize: 11, color: C.muted }}>· {c.data}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{c.cliente}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{c.obra || "Obra não especificada"}</div>

                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        {[
                          ["Unidades", `${c.unidades}`],
                          ["Área",     `${c.area} m²`],
                          ["Padrão",   c.padrao],
                          ["Prazo",    c.prazo],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{k}</div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Alterar status inline */}
                      <div style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: C.muted }}>Status:</span>
                        <Select
                          value={c.status}
                          onChange={(v) => updateContrato(c.id, { status: v })}
                          options={STATUS_OPTS.map((s) => ({ value: s, label: s }))}
                        />
                      </div>
                    </div>

                    {/* Valor + Ações */}
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 160 }}>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(c.valor)}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2, marginBottom: 16 }}>
                        {c.unidades > 1 ? `${fmt(c.valor / c.unidades)}/UH` : `${fmt(c.area ? c.valor / c.area : 0)}/m²`}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <Btn variant="ghost" size="sm" fullWidth onClick={() => abrirEditar(c)}><Pencil size={13} /> Editar</Btn>
                        <button onClick={async () => {
                          let emp = null;
                          try { emp = await buscarEmpresa(); } catch (_) {}
                          gerarPDFContrato(c, emp);
                        }} style={{
                          padding: "8px 0", background: C.red + "22",
                          border: `1px solid ${C.red}44`, borderRadius: 6,
                          color: C.red, fontSize: 12, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", width: "100%",
                        }}>📄 Gerar PDF</button>
                        {cl?.contato && (
                          <button onClick={() => enviarWhatsApp(cl.contato, msgContrato(c))} style={{
                            padding: "8px 0", background: "#25D36622",
                            border: "1px solid #25D36644", borderRadius: 6,
                            color: "#25D366", fontSize: 12, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit", width: "100%",
                          }}>📲 WhatsApp</button>
                        )}
                        <button onClick={() => setConfirm(c.id)} style={{
                          padding: "7px 0", background: C.danger + "22",
                          border: `1px solid ${C.danger}44`, borderRadius: 6,
                          color: C.danger, fontSize: 12, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", width: "100%",
                        }}>🗑 Deletar</button>
                      </div>
                    </div>
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
