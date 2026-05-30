import { useState } from "react";
import { C, PRECOS, FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { enviarWhatsApp, msgOrcamento } from "../services/whatsappService";
import { sb } from "../services/supabase";
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

// ─── Índices técnicos StickFrame (baseados em obras reais) ───────────────────
const INDICES = {
  residencial: {
    label: "Residencial",
    itens: [
      { grupo: "Estrutura",   item: "Aço LSF (lista de corte LE230 / Z275)",      un: "kg",  coef: 31.25, precoUnit: 15.00 },
      { grupo: "Estrutura",   item: "Acessórios estrutura (parafusos, conectores)", un: "vb",  coef: 0.15,  precoUnit: 15.00, sobreAco: true },
      { grupo: "Vedação ext", item: "Placa Glasroc X 12,5mm (cimentícia ext.)",    un: "m²",  coef: 2.58,  precoUnit: 86.80 },
      { grupo: "Vedação ext", item: "Membrana Typar (WRB)",                        un: "m²",  coef: 3.48,  precoUnit: 16.17 },
      { grupo: "Vedação ext", item: "Massa Base Coat 20kg",                        un: "sc",  coef: 0.79,  precoUnit: 88.00 },
      { grupo: "Vedação ext", item: "Tela fibra de vidro",                         un: "m²",  coef: 1.04,  precoUnit: 14.00 },
      { grupo: "Isolamento",  item: "Lã de vidro 50mm (15m²/rl)",                 un: "m²",  coef: 3.75,  precoUnit: 16.00 },
      { grupo: "Vedação int", item: "Placa Gesso ST 12,5mm (drywall interno)",     un: "m²",  coef: 3.28,  precoUnit: 17.13 },
      { grupo: "Vedação int", item: "Placa Gesso RU 12,5mm (área molhada)",        un: "m²",  coef: 0.63,  precoUnit: 25.46, areaUmida: true },
      { grupo: "Vedação int", item: "Massa junta drywall 25kg",                    un: "bd",  coef: 0.17,  precoUnit: 80.00 },
      { grupo: "Vedação int", item: "Fita papel perfurada junta",                  un: "pc",  coef: 0.06,  precoUnit: 60.00 },
      { grupo: "Forro",       item: "Perfil forro F530 3000mm",                    un: "pc",  coef: 0.63,  precoUnit: 15.00 },
      { grupo: "Forro",       item: "Pendural REG F530",                           un: "pc",  coef: 1.38,  precoUnit: 1.60  },
    ],
  },
  galpao: {
    label: "Galpão / Comercial",
    itens: [
      { grupo: "Estrutura",   item: "Aço LSF + acessórios Smart Frame Z275",       un: "vb",  coef: 441.31, precoUnit: 1.00 },
      { grupo: "Vedação ext", item: "Vedação externa Smart Glasroc",               un: "vb",  coef: 353.55, precoUnit: 1.00 },
      { grupo: "Vedação int", item: "Vedação interna Performa",                    un: "vb",  coef: 59.83,  precoUnit: 1.00 },
      { grupo: "Vedação int", item: "Vedação interna Performa RU (área molhada)",  un: "vb",  coef: 21.76,  precoUnit: 1.00, areaUmida: true },
      { grupo: "Cobertura",   item: "Telha metálica sanduíche",                    un: "vb",  coef: 119.11, precoUnit: 1.00, opcional: true },
    ],
  },
};

function CalculadoraEstimativa({ onAplicar, onClose }) {
  const [tipo,      setTipo]      = useState("residencial");
  const [area,      setArea]      = useState(48);
  const [areaUmida, setAreaUmida] = useState(8);
  const [cobertura, setCobertura] = useState(false);
  const [itens,     setItens]     = useState(null);

  function calcular() {
    const template = INDICES[tipo];
    const resultado = template.itens
      .filter((i) => !i.opcional || (i.opcional && cobertura))
      .map((i) => {
        let qtd;
        if (i.sobreAco) {
          const aco = template.itens.find((x) => x.grupo === "Estrutura" && !x.sobreAco);
          const pesoAco = (aco?.coef || 31.25) * area;
          qtd = pesoAco * i.coef;
        } else if (i.areaUmida) {
          qtd = i.un === "vb" ? areaUmida * i.coef : areaUmida * i.coef;
        } else {
          qtd = i.un === "vb" ? area * i.coef : area * i.coef;
        }
        qtd = Math.ceil(qtd * 100) / 100;
        const total = qtd * i.precoUnit;
        return { ...i, qtd, total };
      });
    setItens(resultado);
  }

  const totalGeral = itens ? itens.reduce((s, i) => s + i.total, 0) : 0;
  const grupos = itens ? [...new Set(itens.map((i) => i.grupo))] : [];

  const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Parâmetros */}
      <div style={{ background: C.darker, borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.red }}>PARÂMETROS DA OBRA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label required>Tipo de obra</Label>
            <Select value={tipo} onChange={(v) => { setTipo(v); setItens(null); }}
              options={Object.entries(INDICES).map(([k, v]) => ({ value: k, label: v.label }))} />
          </div>
          <div>
            <Label required>Área total (m²)</Label>
            <Input type="number" min="1" value={area} onChange={(v) => { setArea(parseFloat(v) || 0); setItens(null); }} />
          </div>
          <div>
            <Label>Área molhada — banheiros/coz. (m²)</Label>
            <Input type="number" min="0" value={areaUmida} onChange={(v) => { setAreaUmida(parseFloat(v) || 0); setItens(null); }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={cobertura} onChange={(e) => { setCobertura(e.target.checked); setItens(null); }} />
              Incluir cobertura
            </label>
          </div>
        </div>
        <button onClick={calcular} style={{
          background: C.red, color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          ⚡ Calcular estimativo
        </button>
      </div>

      {/* Resultado */}
      {itens && (
        <>
          <div style={{ maxHeight: 340, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.darker }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: 11 }}>Item</th>
                  <th style={{ padding: "8px 8px", textAlign: "center", fontWeight: 700, fontSize: 11 }}>UN</th>
                  <th style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700, fontSize: 11 }}>Qtd</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontSize: 11 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <>
                    <tr key={`g-${grupo}`} style={{ background: C.red + "11" }}>
                      <td colSpan={4} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 800, color: C.red, letterSpacing: 1, textTransform: "uppercase" }}>{grupo}</td>
                    </tr>
                    {itens.filter((i) => i.grupo === grupo).map((i, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "7px 12px", color: C.text }}>{i.item}</td>
                        <td style={{ padding: "7px 8px", textAlign: "center", color: C.muted }}>{i.un}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: C.text }}>{i.qtd % 1 === 0 ? i.qtd : i.qtd.toFixed(2)}</td>
                        <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 600, color: C.text }}>{fmt(i.total)}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total + ações */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.darker, borderRadius: 10, padding: "14px 16px" }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>Estimativo de materiais — {area} m²</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.red }}>{fmt(totalGeral)}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{fmt(totalGeral / area)}/m²</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: C.muted }}>
                Cancelar
              </button>
              <button onClick={() => onAplicar(itens, totalGeral, area, tipo)} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Aplicar ao orçamento →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
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
  useModuleLoad("obras");

  const clientes        = useAppStore((s) => s.clientes);
  const orcamentos      = useAppStore((s) => s.orcamentos);
  const addOrcamento    = useAppStore((s) => s.addOrcamento);
  const updateOrcamento = useAppStore((s) => s.updateOrcamento);
  const deleteOrcamento = useAppStore((s) => s.deleteOrcamento);
  const addObra         = useAppStore((s) => s.addObra);
  const setActivePage   = useAppStore((s) => s.setActivePage);

  const [modal,        setModal]        = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [confirm,      setConfirm]      = useState(null);
  const [toast,        setToast]        = useState(null);
  const [form,         setForm]         = useState({ ...FORM_VAZIO, cliente_id: clientes[0]?.id || "" });
  const [converterOrc, setConverterOrc] = useState(null);
  const [calculadora,  setCalculadora]  = useState(false);
  const [estimativo,   setEstimativo]   = useState(null); // resultado da calculadora
  const [obraForm,   setObraForm]   = useState({ nome: "", prazo_inicio: "", prazo_fim: "" });

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function abrirNovo() {
    setForm({ ...FORM_VAZIO, cliente_id: clientes[0]?.id || "" });
    setModal("novo");
  }

  function aplicarEstimativo(itens, totalGeral, area, tipo) {
    setEstimativo({ itens, totalGeral, area, tipo });
    setCalculadora(false);
    // Pré-preenche o formulário de novo orçamento com a área calculada
    setForm((f) => ({ ...f, area, cliente_id: clientes[0]?.id || "" }));
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

  function abrirConverter(o) {
    const clienteSel = clientes.find((c) => c.id === o.cliente_id);
    const nomeSugerido = `${o.cliente} — ${new Date().getFullYear()}`;
    setObraForm({ nome: nomeSugerido, prazo_inicio: "", prazo_fim: "" });
    setConverterOrc(o);
  }

  async function confirmarConverter() {
    const o = converterOrc;
    const clienteSel = clientes.find((c) => c.id === o.cliente_id);
    await addObra({
      nome:          obraForm.nome,
      cliente_id:    o.cliente_id,
      cliente:       o.cliente,
      email_cliente: clienteSel?.email || "",
      status:        "Planejamento",
      fase:          FASES[0],
      progresso:     0,
      contrato:      o.valor,
      prazo:         obraForm.prazo_fim || "—",
      prazo_inicio:  obraForm.prazo_inicio || null,
      prazo_fim:     obraForm.prazo_fim || null,
    });
    updateOrcamento(o.id, { status: "Aprovado" });
    setConverterOrc(null);
    mostrarToast("✅ Obra criada! Redirecionando...");
    setTimeout(() => setActivePage("obras"), 1200);
  }
  async function gerarLinkProposta(o) {
    try {
      let token = o.proposta_token;
      if (!token) {
        token = crypto.randomUUID();
        await updateOrcamento(o.id, { proposta_token: token });
      }
      const url = `${window.location.origin}/proposta/${token}`;
      await navigator.clipboard.writeText(url);
      mostrarToast("🔗 Link da proposta copiado!");
    } catch {
      mostrarToast("❌ Erro ao gerar link.");
    }
  }

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

      {/* Modal Calculadora */}
      {calculadora && (
        <Modal title="⚡ Calculadora Estimativa Steel Frame" onClose={() => setCalculadora(false)}>
          <CalculadoraEstimativa onAplicar={aplicarEstimativo} onClose={() => setCalculadora(false)} />
        </Modal>
      )}

      {/* Modais */}
      {modal === "novo" && (
        <Modal title="Novo orçamento" onClose={() => setModal(false)}>
          {estimativo && (
            <div style={{ background: C.red + "0d", border: `1px solid ${C.red}33`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 4 }}>⚡ Estimativo — {INDICES[estimativo.tipo]?.label} · {estimativo.area}m²</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {estimativo.itens.length} itens · Custo materiais: <strong style={{ color: C.text }}>{estimativo.totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                <span style={{ marginLeft: 8 }}>· {(estimativo.totalGeral / estimativo.area).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/m²</span>
              </div>
            </div>
          )}
          <FormOrc
            form={form} setForm={setForm} clientes={clientes}
            onSave={salvarNovo} onCancel={() => { setModal(false); setEstimativo(null); }}
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

      {/* Modal converter em obra */}
      {converterOrc && (
        <Modal title="Converter em Obra" onClose={() => setConverterOrc(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Resumo do orçamento */}
            <div style={{ background: C.darker, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.red}33` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: C.red, marginBottom: 10 }}>ORÇAMENTO ORIGEM</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.muted }}>Cliente</span>
                <span style={{ fontWeight: 700 }}>{converterOrc.cliente}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6 }}>
                <span style={{ color: C.muted }}>Padrão · Área total</span>
                <span style={{ fontWeight: 700 }}>{converterOrc.padrao} · {converterOrc.unidades * converterOrc.area} m²</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 6 }}>
                <span style={{ color: C.muted }}>Valor do contrato</span>
                <span style={{ fontWeight: 800, color: C.success }}>{fmt(converterOrc.valor)}</span>
              </div>
            </div>

            {/* Campos da obra */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>NOME DA OBRA</div>
              <Input
                value={obraForm.nome}
                onChange={(v) => setObraForm((f) => ({ ...f, nome: v }))}
                placeholder="Ex: Residência João — Bofete/SP"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>INÍCIO PREVISTO</div>
                <Input type="date" value={obraForm.prazo_inicio} onChange={(v) => setObraForm((f) => ({ ...f, prazo_inicio: v }))} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>ENTREGA PREVISTA</div>
                <Input type="date" value={obraForm.prazo_fim} onChange={(v) => setObraForm((f) => ({ ...f, prazo_fim: v }))} />
              </div>
            </div>

            <div style={{ background: "#4a9eff11", border: "1px solid #4a9eff33", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#4a9eff" }}>
              ✔ O valor do contrato ({fmt(converterOrc.valor)}) será preenchido automaticamente no financeiro da obra.
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setConverterOrc(null)}>Cancelar</Btn>
              <Btn disabled={!obraForm.nome} onClick={confirmarConverter}>◆ Criar Obra</Btn>
            </div>
          </div>
        </Modal>
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
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setCalculadora(true)} style={{
              background: "none", border: `1px solid ${C.red}`, color: C.red,
              borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              ⚡ Calculadora estimativa
            </button>
            <Btn onClick={abrirNovo}>+ Novo orçamento</Btn>
          </div>
        </div>

        {/* Estimativo aplicado */}
        {estimativo && (
          <div style={{ background: C.red + "0d", border: `1px solid ${C.red}33`, borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 2 }}>⚡ Estimativo calculado — {INDICES[estimativo.tipo]?.label} · {estimativo.area}m²</div>
              <div style={{ fontSize: 11, color: C.muted }}>{estimativo.itens.length} itens · Total materiais: <strong>{estimativo.totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div>
            </div>
            <button onClick={() => setEstimativo(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
        )}

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
                    <button
                      onClick={() => gerarLinkProposta(o)}
                      style={{
                        padding: "6px 14px", background: "#9b59b622",
                        border: "1px solid #9b59b644", borderRadius: 6,
                        color: "#9b59b6", fontSize: 11, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {o.proposta_token ? "🔗 Copiar link" : "🔗 Gerar proposta"}
                    </button>
                    {o.status !== "Recusado" && (
                      <button
                        onClick={() => abrirConverter(o)}
                        style={{
                          padding: "6px 14px", background: C.success + "22",
                          border: `1px solid ${C.success}44`, borderRadius: 6,
                          color: C.success, fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        ◆ Converter em Obra
                      </button>
                    )}

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
