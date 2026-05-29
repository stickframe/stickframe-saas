import { useState } from "react";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import { enviarWhatsApp, msgCliente } from "../services/whatsappService";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

// ─── Status ──────────────────────────────────────────────────────────────────
const STATUS_OPTS = ["Lead", "Em negociação", "Proposta enviada", "Fechado", "Em execução"];
const STATUS_COR = {
  "Lead":             "#4a9eff",
  "Em negociação":    "#c88a00",
  "Proposta enviada": "#981915",
  "Fechado":          "#2e9e5b",
  "Em execução":      "#2e9e5b",
};
function statusColor(s) { return STATUS_COR[s] || C.muted; }

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
function FormCliente({ form, setForm, onSave, onCancel, btnLabel }) {
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

      {/* LOCALIZAÇÃO */}
      <Secao titulo="Localização" />
      {campo("Cidade / UF", "cidade", "Ex: Bofete / SP", false)}

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
          <Label>Unidades (UH)</Label>
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
        <Btn disabled={!form.nome.trim()} onClick={handleSave}>{btnLabel}</Btn>
      </div>
    </div>
  );
}

// ─── CRM principal ───────────────────────────────────────────────────────────
const FORM_VAZIO = {
  nome: "", cidade: "", contato: "", email: "",
  status: "Lead", unidades: "", valor: 0, valorDisplay: "", observacoes: "",
};

export default function CRM() {
  useModuleLoad("clientes");
  const clientes       = useAppStore((s) => s.clientes);
  const addCliente     = useAppStore((s) => s.addCliente);
  const updateCliente  = useAppStore((s) => s.updateCliente);
  const deleteCliente  = useAppStore((s) => s.deleteCliente);
  const importClientes = useAppStore((s) => s.importClientes);

  const [modal,      setModal]      = useState(false);
  const [sel,        setSel]        = useState(null);
  const [confirm,    setConfirm]    = useState(false);
  const [toast,      setToast]      = useState(null);
  const [form,       setForm]       = useState(FORM_VAZIO);
  const [csvModal,   setCsvModal]   = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvErro,    setCsvErro]    = useState("");

  const cliente = clientes.find((c) => c.id === sel);

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setModal("novo");
  }

  function abrirEditar(c) {
    setForm({
      nome:         c.nome || "",
      cidade:       c.cidade || "",
      contato:      c.contato || "",
      email:        c.email || "",
      status:       c.status || "Lead",
      unidades:     c.unidades ? String(c.unidades) : "",
      valor:        c.valor || 0,
      valorDisplay: c.valor ? fmtMoeda(String(Math.round(c.valor * 100))) : "",
      observacoes:  c.observacoes || "",
    });
    setModal("editar");
  }

  function salvarNovo() {
    // eslint-disable-next-line no-unused-vars
    const { valorDisplay, ...payload } = form;
    addCliente({
      ...payload,
      unidades: parseInt(form.unidades) || 0,
      valor:    form.valor || 0,
    });
    setModal(false);
    mostrarToast("✅ Cliente cadastrado com sucesso!");
  }

  function salvarEdicao() {
    // eslint-disable-next-line no-unused-vars
    const { valorDisplay, ...payload } = form;
    updateCliente(sel, {
      ...payload,
      unidades: parseInt(form.unidades) || 0,
      valor:    form.valor || 0,
    });
    setModal(false);
    mostrarToast("✅ Cliente atualizado!");
  }

  function deletar() {
    deleteCliente(sel);
    setSel(null);
    setConfirm(false);
    mostrarToast("🗑 Cliente removido.");
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
    if (iNome === -1) { setCsvErro("Coluna 'nome' não encontrada no CSV."); return; }
    const dados = linhas.slice(1).filter((l) => l[iNome]?.trim()).map((l) => ({
      nome:    l[iNome]    || "",
      email:   iEmail   >= 0 ? l[iEmail]   || "" : "",
      contato: iContato >= 0 ? l[iContato] || "" : "",
      cidade:  iCidade  >= 0 ? l[iCidade]  || "" : "",
      status:  iStatus  >= 0 ? l[iStatus]  || "Lead" : "Lead",
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
            btnLabel="Salvar cliente"
          />
        </Modal>
      )}
      {modal === "editar" && (
        <Modal title="Editar cliente" onClose={() => setModal(false)}>
          <FormCliente
            form={form} setForm={setForm}
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
                    nome, email, contato, cidade, status
                  </code>
                  <br /><br />
                  Apenas <strong>nome</strong> é obrigatório. As demais colunas são opcionais.
                </div>
                <a
                  href="data:text/csv;charset=utf-8,nome,email,contato,cidade,status%0AJoão Silva,joao@email.com,(11) 99999-0000,São Paulo,Lead%0AMaria Souza,maria@email.com,(11) 88888-0000,Campinas,Proposta"
                  download="modelo_clientes.csv"
                  style={{ fontSize: 12, color: C.red, textDecoration: "none" }}
                >
                  ⬇ Baixar modelo CSV
                </a>
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

      {/* Layout principal */}
      <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr min(320px,100%)" : "1fr", gap: 18 }}>

        {/* Lista */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>CRM / Clientes</h2>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{clientes.length} contato{clientes.length !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => { setCsvPreview([]); setCsvErro(""); setCsvModal(true); }}>⬆ Importar CSV</Btn>
              <Btn onClick={abrirNovo}>+ Novo cliente</Btn>
            </div>
          </div>

          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {clientes.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: C.muted }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhum cliente ainda</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Clique em "+ Novo cliente" para começar</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.red}22` }}>
                    {["Cliente", "Cidade", "Contato", "UH", "Valor", "Status", ""].map((h) => (
                      <th key={h} style={{ padding: "11px 15px", textAlign: "left", fontSize: 10, letterSpacing: 1.2, color: C.muted, fontWeight: 700 }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
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
                      <td style={{ padding: "12px 15px", fontSize: 13, fontWeight: 600 }}>{c.nome}</td>
                      <td style={{ padding: "12px 15px", fontSize: 13, color: C.muted }}>{c.cidade || "—"}</td>
                      <td style={{ padding: "12px 15px", fontSize: 12, color: C.muted }}>{c.contato || c.email || "—"}</td>
                      <td style={{ padding: "12px 15px", fontSize: 13 }}>{c.unidades || "—"}</td>
                      <td style={{ padding: "12px 15px", fontSize: 13, fontWeight: 600 }}>{c.valor ? fmt(c.valor) : "—"}</td>
                      <td style={{ padding: "12px 15px" }}><Badge label={c.status} color={statusColor(c.status)} /></td>
                      <td style={{ padding: "12px 15px", color: C.muted, fontSize: 18 }}>›</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Painel lateral */}
        {cliente && (
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
