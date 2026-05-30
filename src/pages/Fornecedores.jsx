import { useState } from "react";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

const ESPECIALIDADES = [
  "Aço / Steel Frame", "Concreto / Fundação", "Elétrica", "Hidráulica",
  "Gesso / Drywall", "OSB / Madeira", "Cimentícia / Fachada", "Ferragens",
  "Tintas / Impermeabilização", "Vidros / Esquadrias", "Transporte", "Outros",
];

const STATUS_COR = { Ativo: C.success, Inativo: C.muted, "Lista negra": C.danger };
const COT_STATUS_COR = { Pendente: C.warning, Aprovada: C.success, Recusada: C.danger, Expirada: C.muted };

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>{String(children).toUpperCase()}</div>;
}

const FORM_FORN = { nome: "", cnpj: "", email: "", telefone: "", especialidade: "Aço / Steel Frame", cidade: "", estado: "", status: "Ativo", observacoes: "" };
const FORM_COT  = { descricao: "", valor: "", data_validade: "", status: "Pendente", obra_id: "", observacoes: "" };

export default function Fornecedores() {
  useModuleLoad("fornecedores");
  useModuleLoad("obras");

  const fornecedores    = useAppStore((s) => s.fornecedores);
  const cotacoes        = useAppStore((s) => s.cotacoes);
  const obras           = useAppStore((s) => s.obras);
  const addFornecedor   = useAppStore((s) => s.addFornecedor);
  const updateFornecedor= useAppStore((s) => s.updateFornecedor);
  const deleteFornecedor= useAppStore((s) => s.deleteFornecedor);
  const loadCotacoes    = useAppStore((s) => s.loadCotacoes);
  const addCotacao      = useAppStore((s) => s.addCotacao);
  const updateCotacao   = useAppStore((s) => s.updateCotacao);
  const deleteCotacao   = useAppStore((s) => s.deleteCotacao);

  const [busca,      setBusca]      = useState("");
  const [filtroEsp,  setFiltroEsp]  = useState("Todos");
  const [sel,        setSel]        = useState(null);
  const [tab,        setTab]        = useState("cotacoes");
  const [modal,      setModal]      = useState(null); // "novo-forn" | "editar-forn" | "nova-cot" | "editar-cot"
  const [form,       setForm]       = useState(FORM_FORN);
  const [formCot,    setFormCot]    = useState(FORM_COT);
  const [cotSel,     setCotSel]     = useState(null);
  const [toast,      setToast]      = useState(null);

  const set  = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setC = (k) => (v) => setFormCot((f) => ({ ...f, [k]: v }));

  function mostrarToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  function abrirFornecedor(f) {
    setSel(f);
    setTab("cotacoes");
    loadCotacoes(f.id);
  }

  async function salvarFornecedor() {
    try {
      if (modal === "novo-forn") {
        const data = await addFornecedor(form);
        setSel(data);
        mostrarToast("✅ Fornecedor cadastrado!");
      } else {
        await updateFornecedor(sel.id, form);
        setSel((s) => ({ ...s, ...form }));
        mostrarToast("✅ Fornecedor atualizado!");
      }
      setModal(null);
    } catch (e) {
      mostrarToast("❌ " + e.message);
    }
  }

  async function excluirFornecedor(id) {
    if (!confirm("Excluir este fornecedor e suas cotações?")) return;
    await deleteFornecedor(id);
    if (sel?.id === id) setSel(null);
    mostrarToast("Fornecedor removido.");
  }

  async function salvarCotacao() {
    try {
      const payload = {
        ...formCot,
        valor:    parseFloat(String(formCot.valor).replace(",", ".")) || null,
        obra_id:  formCot.obra_id || null,
        data_validade: formCot.data_validade || null,
      };
      if (modal === "nova-cot") {
        await addCotacao(sel.id, payload);
        mostrarToast("✅ Cotação registrada!");
      } else {
        await updateCotacao(sel.id, cotSel.id, payload);
        mostrarToast("✅ Cotação atualizada!");
      }
      setModal(null);
    } catch (e) {
      mostrarToast("❌ " + e.message);
    }
  }

  const listaFiltrada = fornecedores.filter((f) => {
    const ok = f.nome?.toLowerCase().includes(busca.toLowerCase()) ||
               f.especialidade?.toLowerCase().includes(busca.toLowerCase());
    const okEsp = filtroEsp === "Todos" || f.especialidade === filtroEsp;
    return ok && okEsp;
  });

  const cotsSel = sel ? (cotacoes[sel.id] || []) : [];

  return (
    <div style={{ display: "flex", height: "100%", gap: 0, position: "relative" }}>

      {/* ── Painel esquerdo ─────────────────────────────────────────────────── */}
      <div style={{
        width: 300, flexShrink: 0, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", height: "100%",
      }}>
        {/* Header */}
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
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <select
            value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)}
            style={{
              width: "100%", marginTop: 8, padding: "7px 10px", borderRadius: 8,
              border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit",
              background: "#fff", outline: "none",
            }}
          >
            <option value="Todos">Todas as especialidades</option>
            {ESPECIALIDADES.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {listaFiltrada.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: C.muted, fontSize: 13 }}>
              Nenhum fornecedor encontrado.
            </div>
          )}
          {listaFiltrada.map((f) => (
            <div
              key={f.id}
              onClick={() => abrirFornecedor(f)}
              style={{
                padding: "14px 16px", cursor: "pointer",
                borderBottom: `1px solid ${C.border}`,
                background: sel?.id === f.id ? C.dark : "#fff",
                transition: "background .15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{f.nome}</div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                  background: (STATUS_COR[f.status] || C.muted) + "22",
                  color: STATUS_COR[f.status] || C.muted,
                }}>{f.status}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{f.especialidade}</div>
              {f.cidade && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{f.cidade}{f.estado ? ` — ${f.estado}` : ""}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Painel direito ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!sel ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}>
            Selecione um fornecedor para ver os detalhes
          </div>
        ) : (
          <>
            {/* Header do fornecedor */}
            <div style={{ padding: "20px 24px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>{sel.nome}</h3>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    {sel.especialidade} {sel.cidade ? `· ${sel.cidade}${sel.estado ? `/${sel.estado}` : ""}` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: C.muted }}>
                    {sel.telefone && <span>📞 {sel.telefone}</span>}
                    {sel.email    && <span>✉️ {sel.email}</span>}
                    {sel.cnpj     && <span>🏢 {sel.cnpj}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setForm({ ...FORM_FORN, ...sel }); setModal("editar-forn"); }}
                    style={{ padding: "7px 14px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    ✏️ Editar
                  </button>
                  <button onClick={() => excluirFornecedor(sel.id)}
                    style={{ padding: "7px 14px", background: C.danger + "15", border: `1px solid ${C.danger}44`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}>
                    🗑 Excluir
                  </button>
                </div>
              </div>

              {/* Tabs */}
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

            {/* Conteúdo das tabs */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {tab === "cotacoes" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {cotsSel.length} cotação{cotsSel.length !== 1 ? "ões" : ""}
                    </div>
                    <Btn size="sm" onClick={() => { setFormCot(FORM_COT); setModal("nova-cot"); }}>+ Nova cotação</Btn>
                  </div>
                  {cotsSel.length === 0 && (
                    <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: "32px 0" }}>
                      Nenhuma cotação registrada para este fornecedor.
                    </div>
                  )}
                  {cotsSel.map((c) => (
                    <div key={c.id} style={{
                      background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10,
                      padding: "16px 18px", marginBottom: 12,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.descricao}</div>
                          {c.obras?.nome && (
                            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>🏗 {c.obras.nome}</div>
                          )}
                          {c.data_validade && (
                            <div style={{ fontSize: 11, color: C.muted }}>Válida até {new Date(c.data_validade).toLocaleDateString("pt-BR")}</div>
                          )}
                          {c.observacoes && (
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontStyle: "italic" }}>{c.observacoes}</div>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {c.valor != null && (
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.red, marginBottom: 6 }}>
                              R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          )}
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
                            background: (COT_STATUS_COR[c.status] || C.muted) + "22",
                            color: COT_STATUS_COR[c.status] || C.muted,
                          }}>{c.status}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                        <button onClick={() => { setFormCot({ ...FORM_COT, ...c, obra_id: c.obra_id || "" }); setCotSel(c); setModal("editar-cot"); }}
                          style={{ padding: "5px 12px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          ✏️ Editar
                        </button>
                        <button onClick={async () => { await deleteCotacao(sel.id, c.id); mostrarToast("Cotação removida."); }}
                          style={{ padding: "5px 12px", background: C.danger + "15", border: `1px solid ${C.danger}33`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {tab === "historico" && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Resumo de cotações</div>
                  {(["Aprovada","Pendente","Recusada","Expirada"]).map((st) => {
                    const items = cotsSel.filter((c) => c.status === st);
                    const total = items.reduce((a, c) => a + (Number(c.valor) || 0), 0);
                    return (
                      <div key={st} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 16px", background: "#fff", border: `1px solid ${C.border}`,
                        borderRadius: 8, marginBottom: 8,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: COT_STATUS_COR[st] || C.muted,
                            display: "inline-block",
                          }} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{st}</span>
                          <span style={{ fontSize: 12, color: C.muted }}>({items.length})</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                          {total > 0 ? `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                        </span>
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

      {/* ── Modal Fornecedor ────────────────────────────────────────────────── */}
      {(modal === "novo-forn" || modal === "editar-forn") && (
        <Modal title={modal === "novo-forn" ? "Novo fornecedor" : "Editar fornecedor"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><Label>Nome *</Label><Input value={form.nome} onChange={set("nome")} placeholder="Razão social ou nome fantasia" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><Label>CNPJ / CPF</Label><Input value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={set("telefone")} placeholder="(11) 99999-9999" /></div>
            </div>
            <div><Label>Email</Label><Input value={form.email} onChange={set("email")} type="email" /></div>
            <div><Label>Especialidade</Label><Select value={form.especialidade} onChange={set("especialidade")} options={ESPECIALIDADES.map((e) => ({ value: e, label: e }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={set("cidade")} /></div>
              <div><Label>Estado</Label><Input value={form.estado} onChange={set("estado")} placeholder="SP" /></div>
            </div>
            <div><Label>Status</Label><Select value={form.status} onChange={set("status")} options={["Ativo","Inativo","Lista negra"].map((v) => ({ value: v, label: v }))} /></div>
            <div><Label>Observações</Label><Input value={form.observacoes} onChange={set("observacoes")} placeholder="Notas internas" /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn disabled={!form.nome} onClick={salvarFornecedor}>
                {modal === "novo-forn" ? "Cadastrar" : "Salvar"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal Cotação ───────────────────────────────────────────────────── */}
      {(modal === "nova-cot" || modal === "editar-cot") && (
        <Modal title={modal === "nova-cot" ? "Nova cotação" : "Editar cotação"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><Label>Descrição *</Label><Input value={formCot.descricao} onChange={setC("descricao")} placeholder="Ex: Perfis C 90mm — 500 pçs" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><Label>Valor (R$)</Label><Input value={formCot.valor} onChange={setC("valor")} type="number" min="0" /></div>
              <div><Label>Válida até</Label><Input value={formCot.data_validade} onChange={setC("data_validade")} type="date" /></div>
            </div>
            <div>
              <Label>Obra vinculada</Label>
              <Select
                value={formCot.obra_id}
                onChange={setC("obra_id")}
                options={[{ value: "", label: "Nenhuma" }, ...obras.map((o) => ({ value: o.id, label: o.nome }))]}
              />
            </div>
            <div><Label>Status</Label><Select value={formCot.status} onChange={setC("status")} options={["Pendente","Aprovada","Recusada","Expirada"].map((v) => ({ value: v, label: v }))} /></div>
            <div><Label>Observações</Label><Input value={formCot.observacoes} onChange={setC("observacoes")} /></div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn disabled={!formCot.descricao} onClick={salvarCotacao}>
                {modal === "nova-cot" ? "Registrar" : "Salvar"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "#1a1a1a", color: "#fff", padding: "12px 20px",
          borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>{toast}</div>
      )}
    </div>
  );
}
