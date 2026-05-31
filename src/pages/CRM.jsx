import { useState, useMemo, memo } from "react";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import { enviarWhatsApp, msgCliente } from "../services/whatsappService";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { useToast } from "../hooks/useToast";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

// ─── Status e Origens ────────────────────────────────────────────────────────
const STATUS_OPTS = ["Lead", "Em negociação", "Proposta enviada", "Fechado", "Em execução"];
const ORIGEM_OPTS = ["Indicação", "Instagram", "Google", "Site", "Outros"];

const STATUS_COR = {
  "Lead":             "#4a9eff",
  "Em negociação":    "#c88a00",
  "Proposta enviada": "#981915",
  "Fechado":          "#2e9e5b",
  "Em execução":      "#2e9e5b",
};
function statusColor(s) { return STATUS_COR[s] || C.muted; }

// ─── Score de lead ────────────────────────────────────────────────────────────
function calcularScore(c) {
  const hoje = new Date().toISOString().split("T")[0];
  let pts = 0;

  // Status (40pts)
  if (c.status === "Fechado" || c.status === "Em execução") pts += 40;
  else if (c.status === "Em negociação")                    pts += 25;
  else if (c.status === "Proposta enviada")                 pts += 20;
  else                                                       pts += 5;

  // Valor estimado (25pts)
  const v = c.valor || 0;
  if (v > 500000)      pts += 25;
  else if (v > 200000) pts += 20;
  else if (v > 100000) pts += 15;
  else if (v > 0)      pts += 8;

  // Follow-up recente (20pts)
  if (c.proximo_contato) {
    if (c.proximo_contato >= hoje)               pts += 20;
    else {
      const diasPassados = Math.round((new Date(hoje) - new Date(c.proximo_contato)) / 86400000);
      if (diasPassados <= 7)  pts += 10;
      else if (diasPassados <= 30) pts += 4;
    }
  }

  // Dados de contato (15pts)
  if (c.contato) pts += 10;
  if (c.email)   pts += 5;

  const score = Math.min(pts, 100);
  if (score >= 70) return { score, label: "🔥 Quente", cor: "#c0392b", bg: "#fdecea" };
  if (score >= 40) return { score, label: "🟡 Morno",  cor: "#c88a00", bg: "#fff8e1" };
  return               { score, label: "❄️ Frio",   cor: "#4a9eff", bg: "#e8f4ff" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtTel(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2)  return d;
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}
function fmtMoeda(v) {
  const n = v.replace(/\D/g, "");
  if (!n) return "";
  return (parseInt(n, 10) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function parseMoeda(v) {
  const n = parseFloat(v.replace(/\D/g, "")) / 100;
  return isNaN(n) ? 0 : n;
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Label auxiliar ──────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>
      {children.toUpperCase()}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

// ─── Textarea ────────────────────────────────────────────────────────────────
function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", background: "transparent",
        border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "9px 13px", color: C.text, fontSize: 13,
        outline: "none", fontFamily: "inherit", resize: "vertical",
        boxSizing: "border-box",
      }}
    />
  );
}

// ─── Seção do formulário ─────────────────────────────────────────────────────
function Secao({ titulo }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
      color: C.muted, borderBottom: `1px solid ${C.border}`,
      paddingBottom: 6, marginTop: 6,
    }}>
      {titulo}
    </div>
  );
}

// ─── Formulário (fora do componente para não re-montar a cada render) ─────────
const FormCliente = memo(function FormCliente({ form, setForm, onSave, onCancel, btnLabel, disabled }) {
  const [erros, setErros] = useState({});
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  function validar() {
    const e = {};
    if (!form.nome.trim())                        e.nome    = "Nome é obrigatório";
    if (form.email && !EMAIL_RE.test(form.email)) e.email   = "E-mail inválido";
    if (form.unidades && isNaN(Number(form.unidades))) e.unidades = "Número inválido";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (validar()) onSave();
  }

  function campo(label, key, placeholder, required, extra = {}) {
    return (
      <div key={key}>
        <Label required={required}>{label}</Label>
        <Input
          value={form[key]}
          onChange={set(key)}
          placeholder={placeholder}
          hasError={!!erros[key]}
          {...extra}
        />
        {erros[key] && (
          <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>{erros[key]}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* IDENTIFICAÇÃO */}
      <Secao titulo="Identificação" />
      {campo("Nome", "nome", "Ex: João Silva / Construtora ABC", true)}

      {/* CONTATO */}
      <Secao titulo="Contato" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Telefone / WhatsApp</Label>
          <Input
            value={form.contato}
            onChange={(v) => set("contato")(fmtTel(v))}
            placeholder="(11) 9xxxx-xxxx"
          />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input
            value={form.email}
            onChange={set("email")}
            placeholder="joao@email.com"
            type="email"
          />
          {erros.email && <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>{erros.email}</div>}
        </div>
      </div>

      {/* LOCALIZAÇÃO E ORIGEM */}
      <Secao titulo="Localização e Origem" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Cidade / UF</Label>
          <Input value={form.cidade} onChange={set("cidade")} placeholder="Ex: Bofete / SP" />
        </div>
        <div>
          <Label>Origem</Label>
          <Select
            value={form.origem}
            onChange={set("origem")}
            options={ORIGEM_OPTS.map((v) => ({ value: v, label: v }))}
          />
        </div>
      </div>

      {/* OPORTUNIDADE */}
      <Secao titulo="Oportunidade" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onChange={set("status")}
            options={STATUS_OPTS.map((v) => ({ value: v, label: v }))}
          />
        </div>
        <div>
          <Label>Unidades</Label>
          <Input
            value={form.unidades}
            onChange={(v) => set("unidades")(v.replace(/\D/g, ""))}
            placeholder="0"
            type="number"
            min="0"
          />
          {erros.unidades && <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>{erros.unidades}</div>}
        </div>
        <div>
          <Label>Valor estimado</Label>
          <Input
            value={form.valorDisplay}
            onChange={(v) => {
              const display = fmtMoeda(v.replace(/\D/g, "") || "");
              setForm((f) => ({ ...f, valorDisplay: display, valor: parseMoeda(display) }));
            }}
            placeholder="R$ 0,00"
          />
        </div>
      </div>

      {/* FOLLOW-UP */}
      <Secao titulo="Follow-up" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Próximo contato</Label>
          <Input type="date" value={form.proximo_contato || ""} onChange={set("proximo_contato")} />
        </div>
        <div>
          <Label>Responsável</Label>
          <Input value={form.responsavel || ""} onChange={set("responsavel")} placeholder="Nome do vendedor" />
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      <Secao titulo="Observações" />
      <div>
        <Label>Notas / Anotações</Label>
        <Textarea
          value={form.observacoes}
          onChange={set("observacoes")}
          placeholder="Preferências do cliente, indicação, contexto da oportunidade..."
        />
      </div>

      {/* AÇÕES */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn disabled={!form.nome.trim() || disabled} onClick={handleSave}>{btnLabel}</Btn>
      </div>
    </div>
  );
});

// ─── CRM principal ───────────────────────────────────────────────────────────
const FORM_VAZIO = {
  nome: "", cidade: "", contato: "", email: "", origem: "Indicação",
  status: "Lead", unidades: "", valor: 0, valorDisplay: "", observacoes: "",
  proximo_contato: "", responsavel: "",
};

export default function CRM() {
  useModuleLoad("clientes");
  const clientes       = useAppStore((s) => s.clientes);
  const addCliente     = useAppStore((s) => s.addCliente);
  const updateCliente  = useAppStore((s) => s.updateCliente);
  const deleteCliente  = useAppStore((s) => s.deleteCliente);
  const importClientes = useAppStore((s) => s.importClientes);

  const [view,       setView]       = useState("funnel"); // "funnel" | "list"
  const [modal,      setModal]      = useState(false);
  const [sel,        setSel]        = useState(null);
  const [confirm,    setConfirm]    = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [form,       setForm]       = useState(FORM_VAZIO);
  const [csvModal,   setCsvModal]   = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvErro,    setCsvErro]    = useState("");

  const cliente = useMemo(() => clientes.find((c) => c.id === sel), [clientes, sel]);
  const { toast, mostrarToast } = useToast();
  const hojeStr = new Date().toISOString().split("T")[0];

  const stats = useMemo(() => {
    let convertidos = 0;
    let total = 0;
    const porOrigem = {};
    let followUpsPendentes = 0;
    clientes.forEach(c => {
      total++;
      const isConvertido = c.status === "Fechado" || c.status === "Em execução";
      if (isConvertido) convertidos++;
      const orig = c.origem || "Outros";
      if (!porOrigem[orig]) porOrigem[orig] = { total: 0, convertidos: 0 };
      porOrigem[orig].total++;
      if (isConvertido) porOrigem[orig].convertidos++;
      if (c.proximo_contato && !isConvertido && c.proximo_contato <= hojeStr) followUpsPendentes++;
    });
    const taxa = total === 0 ? 0 : Math.round((convertidos / total) * 100);
    return { total, convertidos, taxa, porOrigem, followUpsPendentes };
  }, [clientes, hojeStr]);

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setModal("novo");
  }

  function abrirEditar(c) {
    setForm({
      nome:            c.nome || "",
      cidade:          c.cidade || "",
      contato:         c.contato || "",
      email:           c.email || "",
      origem:          c.origem || "Indicação",
      status:          c.status || "Lead",
      unidades:        c.unidades ? String(c.unidades) : "",
      valor:           c.valor || 0,
      valorDisplay:    c.valor ? fmtMoeda(String(Math.round(c.valor * 100))) : "",
      observacoes:     c.observacoes || "",
      proximo_contato: c.proximo_contato || "",
      responsavel:     c.responsavel || "",
    });
    setModal("editar");
  }

  async function salvarNovo() {
    setIsSaving(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { valorDisplay, ...payload } = form;
      await addCliente({
        ...payload,
        unidades: parseInt(form.unidades) || 0,
        valor:    form.valor || 0,
      });
      setModal(false);
      mostrarToast("✅ Cliente cadastrado com sucesso!");
    } catch (e) {
      mostrarToast("❌ " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function salvarEdicao() {
    setIsSaving(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { valorDisplay, ...payload } = form;
      await updateCliente(sel, {
        ...payload,
        unidades: parseInt(form.unidades) || 0,
        valor:    form.valor || 0,
      });
      setModal(false);
      mostrarToast("✅ Cliente atualizado!");
    } catch (e) {
      mostrarToast("❌ " + e.message);
    } finally {
      setIsSaving(false);
    }
  }

  function deletar() {
    deleteCliente(sel);
    setSel(null);
    setConfirm(false);
    mostrarToast("🗑 Cliente removido.");
  }

  function sanitizar(s) {
    return String(s ?? "").replace(/[<>"'&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "&": "&amp;" }[c]));
  }

  function parsearCSV(texto) {
    const linhas = texto.trim().split("\n").map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
    const header = linhas[0].map((h) => h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
    const col = (nomes) => header.findIndex((h) => nomes.some((n) => h.includes(n)));
    const iNome    = col(["nome"]);
    const iEmail   = col(["email"]);
    const iContato = col(["contato", "telefone", "fone", "whatsapp"]);
    const iCidade  = col(["cidade", "city"]);
    const iStatus  = col(["status"]);
    const iOrigem  = col(["origem"]);
    
    if (iNome === -1) { setCsvErro("Coluna 'nome' não encontrada no CSV."); return; }
    
    const dados = linhas.slice(1).filter((l) => l[iNome]?.trim()).map((l) => ({
      nome:    sanitizar(l[iNome]    || ""),
      email:   sanitizar(iEmail   >= 0 ? l[iEmail]   || "" : ""),
      contato: sanitizar(iContato >= 0 ? l[iContato] || "" : ""),
      cidade:  sanitizar(iCidade  >= 0 ? l[iCidade]  || "" : ""),
      origem:  iOrigem  >= 0 ? sanitizar(l[iOrigem] || "Outros") : "Outros",
      status:  STATUS_OPTS.includes(l[iStatus]) ? l[iStatus] : "Lead",
      valor: 0, unidades: 0, observacoes: "",
    }));
    if (dados.length === 0) { setCsvErro("Nenhum dado válido encontrado."); return; }
    setCsvErro("");
    setCsvPreview(dados);
  }

  function handleCSVFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => parsearCSV(e.target.result);
    reader.readAsText(file, "UTF-8");
  }

  async function confirmarImportacao() {
    try {
      const data = await importClientes(csvPreview);
      setCsvModal(false);
      setCsvPreview([]);
      mostrarToast(`✅ ${data.length} clientes importados!`);
    } catch (e) {
      setCsvErro("Erro ao importar: " + e.message);
    }
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
          animation: "fadeIn .2s ease",
        }}>
          {toast}
        </div>
      )}

      {/* Modais */}
      {modal === "novo" && (
        <Modal title="Novo cliente" onClose={() => setModal(false)}>
          <FormCliente
            form={form} setForm={setForm}
            onSave={salvarNovo} onCancel={() => setModal(false)}
            btnLabel={isSaving ? "Salvando…" : "Salvar cliente"}
            disabled={isSaving}
          />
        </Modal>
      )}
      {modal === "editar" && (
        <Modal title="Editar cliente" onClose={() => setModal(false)}>
          <FormCliente
            form={form} setForm={setForm}
            onSave={salvarEdicao} onCancel={() => setModal(false)}
            btnLabel={isSaving ? "Salvando…" : "Salvar alterações"}
            disabled={isSaving}
          />
        </Modal>
      )}

      {/* Confirmação de exclusão */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: 360, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🗑</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Deletar cliente?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
              <strong style={{ color: C.text }}>{cliente?.nome}</strong> será removido permanentemente.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(false)}>Cancelar</Btn>
              <button onClick={deletar} style={{
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

      {/* Modal Importar CSV */}
      {csvModal && (
        <Modal title="Importar clientes via CSV" onClose={() => setCsvModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {csvPreview.length === 0 ? (
              <>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  O arquivo CSV deve ter uma linha de cabeçalho com as colunas:<br />
                  <code style={{ background: C.darker, padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                    nome, email, contato, cidade, status, origem
                  </code>
                  <br /><br />
                  Apenas <strong>nome</strong> é obrigatório. As demais colunas são opcionais.
                </div>
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "28px 20px", border: `2px dashed ${C.border}`, borderRadius: 10,
                  cursor: "pointer", color: C.muted, fontSize: 13,
                }}>
                  <span style={{ fontSize: 28 }}>📂</span>
                  Clique para selecionar o arquivo CSV
                  <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => handleCSVFile(e.target.files[0])} />
                </label>
                {csvErro && <div style={{ fontSize: 12, color: C.danger }}>{csvErro}</div>}
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: C.muted }}>{csvPreview.length} clientes encontrados — confira antes de importar:</div>
                <div style={{ maxHeight: 280, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: C.darker }}>
                        {["Nome", "Email", "Contato", "Cidade", "Status"].map((h) => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: C.muted, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((r, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.nome}</td>
                          <td style={{ padding: "8px 12px", color: C.muted }}>{r.email || "—"}</td>
                          <td style={{ padding: "8px 12px", color: C.muted }}>{r.contato || "—"}</td>
                          <td style={{ padding: "8px 12px", color: C.muted }}>{r.cidade || "—"}</td>
                          <td style={{ padding: "8px 12px" }}><span style={{ background: C.red + "22", color: C.red, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvErro && <div style={{ fontSize: 12, color: C.danger }}>{csvErro}</div>}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <Btn variant="ghost" onClick={() => setCsvPreview([])}>← Voltar</Btn>
                  <Btn onClick={confirmarImportacao}>Importar {csvPreview.length} clientes</Btn>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Header da Página */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>CRM / Comercial</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Gerencie seu funil de vendas e contatos</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={() => { setCsvPreview([]); setCsvErro(""); setCsvModal(true); }}>⬆ Importar</Btn>
          <Btn onClick={abrirNovo}>+ Nova oportunidade</Btn>
        </div>
      </div>

      {/* Dashboard de Métricas */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>TAXA DE CONVERSÃO</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: stats.taxa > 20 ? C.green : C.text, marginTop: 4 }}>{stats.taxa}%</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{stats.convertidos} convertidos de {stats.total} leads</div>
        </div>

        <div style={{ flex: "2 1 300px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1 }}>CONVERSÃO POR ORIGEM</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {Object.entries(stats.porOrigem).length === 0 ? (
              <span style={{ fontSize: 12, color: C.muted }}>Nenhum dado</span>
            ) : (
              Object.entries(stats.porOrigem).map(([orig, dados]) => (
                <div key={orig} style={{ background: C.darker, padding: "6px 10px", borderRadius: 6, fontSize: 12 }}>
                  <span style={{ color: C.muted, marginRight: 6 }}>{orig}</span>
                  <strong style={{ color: C.text }}>{Math.round((dados.convertidos / dados.total) * 100)}%</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ flex: "1 1 200px", background: stats.followUpsPendentes > 0 ? C.danger + "11" : C.surface, borderRadius: 12, border: `1px solid ${stats.followUpsPendentes > 0 ? C.danger + "44" : C.border}`, padding: 16 }}>
          <div style={{ fontSize: 11, color: stats.followUpsPendentes > 0 ? C.danger : C.muted, fontWeight: 700, letterSpacing: 1 }}>FOLLOW-UPS PENDENTES</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: stats.followUpsPendentes > 0 ? C.danger : C.text, marginTop: 4 }}>{stats.followUpsPendentes}</div>
          <div style={{ fontSize: 12, color: stats.followUpsPendentes > 0 ? C.danger : C.muted, marginTop: 2 }}>
            {stats.followUpsPendentes === 1 ? "contato atrasado ou p/ hoje" : "contatos atrasados ou p/ hoje"}
          </div>
        </div>
      </div>

      {/* Toggle View */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4, background: C.darker, padding: 4, borderRadius: 8 }}>
          <button 
            onClick={() => setView("funnel")}
            style={{ 
              padding: "6px 16px", borderRadius: 6, border: "none", 
              background: view === "funnel" ? C.surface : "transparent", 
              color: view === "funnel" ? C.text : C.muted, 
              fontWeight: 600, cursor: "pointer", fontSize: 13,
              boxShadow: view === "funnel" ? "0 2px 8px #0004" : "none",
              transition: "all 0.2s"
            }}>
            ≡ Funil Kanban
          </button>
          <button 
            onClick={() => setView("list")}
            style={{ 
              padding: "6px 16px", borderRadius: 6, border: "none", 
              background: view === "list" ? C.surface : "transparent", 
              color: view === "list" ? C.text : C.muted, 
              fontWeight: 600, cursor: "pointer", fontSize: 13,
              boxShadow: view === "list" ? "0 2px 8px #0004" : "none",
              transition: "all 0.2s"
            }}>
            ☰ Lista
          </button>
        </div>
      </div>

      {/* Layout principal */}
      <div style={{ display: "grid", gridTemplateColumns: sel && view === "list" ? "1fr min(320px,100%)" : "1fr", gap: 18 }}>

        {/* View Content */}
        <div>
          {view === "funnel" ? (
            <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, minHeight: 600 }}>
              {STATUS_OPTS.map(status => {
                const clientesColuna = clientes.filter(c => c.status === status);
                return (
                  <div 
                    key={status}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      const id = e.dataTransfer.getData("text/plain");
                      if (id) {
                        updateCliente(id, { status });
                        mostrarToast(`✅ Movido para ${status}`);
                      }
                    }}
                    style={{ 
                      minWidth: 260, flex: 1, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
                      display: "flex", flexDirection: "column"
                    }}
                  >
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.darker, borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 5, background: statusColor(status) }} />
                        {status}
                      </div>
                      <Badge label={clientesColuna.length.toString()} color={C.muted} />
                    </div>
                    
                    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 350px)" }}>
                      {clientesColuna.map(c => {
                        const atrasado = c.proximo_contato && c.proximo_contato <= hojeStr && status !== "Fechado" && status !== "Em execução";
                        return (
                          <div 
                            key={c.id}
                            draggable
                            onDragStart={e => e.dataTransfer.setData("text/plain", c.id)}
                            onClick={() => abrirEditar(c)}
                            style={{ 
                              background: C.surface, borderRadius: 8, padding: 14, cursor: "grab", 
                              border: atrasado ? `1px solid ${C.danger}` : `1px solid ${C.border}`,
                              boxShadow: sel === c.id ? `0 0 0 2px ${C.red}` : "0 2px 4px #0001",
                              transition: "all 0.2s",
                              position: "relative"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, paddingRight: 8, flex: 1 }}>{c.nome}</div>
                              {(() => { const s = calcularScore(c); return (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: s.bg, color: s.cor, whiteSpace: "nowrap" }}>
                                  {s.label}
                                </span>
                              ); })()}
                            </div>
                            {c.valor > 0 && <div style={{ fontSize: 12, color: C.success, fontWeight: 700 }}>{fmt(c.valor)}</div>}
                            
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px dashed ${C.border}` }}>
                              <span style={{ background: C.darker, padding: "2px 6px", borderRadius: 4 }}>{c.origem || "Indicação"}</span>
                              {atrasado && <span style={{ color: C.danger, fontWeight: 700, fontSize: 10, background: C.danger+"22", padding: "2px 6px", borderRadius: 4 }}>⚠️ FOLLOW-UP</span>}
                            </div>
                          </div>
                        );
                      })}
                      {clientesColuna.length === 0 && (
                        <div style={{ textAlign: "center", padding: 20, color: C.muted, fontSize: 12, fontStyle: "italic" }}>
                          Nenhum card
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {clientes.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: C.muted }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhum cliente ainda</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Clique em "+ Nova oportunidade" para começar</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${C.red}22` }}>
                        {["Cliente", "Cidade", "Contato", "Origem", "Valor", "Score", "Status", ""].map((h) => (
                          <th key={h} style={{ padding: "11px 15px", textAlign: "left", fontSize: 10, letterSpacing: 1.2, color: C.muted, fontWeight: 700 }}>
                            {h.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((c) => {
                        const atrasado = c.proximo_contato && c.proximo_contato <= hojeStr && c.status !== "Fechado" && c.status !== "Em execução";
                        return (
                          <tr
                            key={c.id}
                            onClick={() => setSel(sel === c.id ? null : c.id)}
                            style={{
                              borderBottom: `1px solid ${C.border}`,
                              background: sel === c.id ? C.red + "0e" : "transparent",
                              cursor: "pointer",
                              transition: "background .15s",
                            }}
                          >
                            <td style={{ padding: "12px 15px", fontSize: 13, fontWeight: 600 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {atrasado && <span style={{ color: C.danger, fontSize: 14 }} title="Follow-up pendente">⚠️</span>}
                                {c.nome}
                              </div>
                            </td>
                            <td style={{ padding: "12px 15px", fontSize: 13, color: C.muted }}>{c.cidade || "—"}</td>
                            <td style={{ padding: "12px 15px", fontSize: 12, color: C.muted }}>{c.contato || c.email || "—"}</td>
                            <td style={{ padding: "12px 15px", fontSize: 12, color: C.muted }}>{c.origem || "—"}</td>
                            <td style={{ padding: "12px 15px", fontSize: 13, fontWeight: 600 }}>{c.valor ? fmt(c.valor) : "—"}</td>
                            <td style={{ padding: "12px 15px" }}>
                              {(() => { const s = calcularScore(c); return (
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10, background: s.bg, color: s.cor }}>
                                  {s.label}
                                </span>
                              ); })()}
                            </td>
                            <td style={{ padding: "12px 15px" }}><Badge label={c.status} color={statusColor(c.status)} /></td>
                            <td style={{ padding: "12px 15px", color: C.muted, fontSize: 18 }}>›</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Painel lateral (Detalhes do Cliente) só aparece na Lista */}
        {cliente && view === "list" && (
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 22, height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{cliente.nome}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{cliente.cidade || "Cidade não informada"}</div>
              </div>
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            <Badge label={cliente.status} color={statusColor(cliente.status)} />

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["Telefone",   cliente.contato    || "—"],
                ["E-mail",     cliente.email       || "—"],
                ["Origem",     cliente.origem      || "—"],
                ["Próx. Contato", cliente.proximo_contato ? new Date(cliente.proximo_contato + "T12:00:00").toLocaleDateString("pt-BR") : "—"],
                ["Unidades",   cliente.unidades   ? `${cliente.unidades} UH` : "—"],
                ["Valor est.", cliente.valor      ? fmt(cliente.valor) : "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 9 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              {cliente.observacoes && (
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontStyle: "italic", lineHeight: 1.5 }}>
                  "{cliente.observacoes}"
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <Btn variant="ghost" size="sm" onClick={() => abrirEditar(cliente)} fullWidth>✏️ Editar</Btn>
              <button onClick={() => setConfirm(true)} style={{
                flex: 1, padding: "7px 0",
                background: C.danger + "22", border: `1px solid ${C.danger}44`,
                borderRadius: 6, color: C.danger, fontSize: 12,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                🗑 Deletar
              </button>
            </div>

            {cliente.contato && (
              <button
                onClick={() => enviarWhatsApp(cliente.contato, msgCliente(cliente))}
                style={{
                  marginTop: 8, width: "100%", padding: "9px 0",
                  background: "#25D36622", border: "1px solid #25D36644",
                  borderRadius: 6, color: "#25D366", fontSize: 12,
                  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                📲 Enviar WhatsApp
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
