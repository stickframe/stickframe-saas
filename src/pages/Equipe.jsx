import { useState } from "react";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const ESPECIALIDADES = ["Steel Frame","Fundação","Elétrica","Hidráulica","Acabamento","Projeto","Administração","Outro"];
const STATUS_OPTS    = ["Ativo","Férias","Afastado","Inativo"];
const STATUS_COR     = { Ativo: "#2e9e5b", Férias: "#4a9eff", Afastado: "#c88a00", Inativo: C.muted };

function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>
      {String(children).toUpperCase()}
      {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

const FORM_VAZIO = {
  nome: "", cargo: "", email: "", telefone: "",
  especialidade: "Steel Frame", status: "Ativo", salario: "", observacoes: "",
};

function FormColaborador({ form, setForm, onSave, onCancel, btnLabel }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <Label required>Nome</Label>
        <Input value={form.nome} onChange={set("nome")} placeholder="Nome completo" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Cargo</Label>
          <Input value={form.cargo} onChange={set("cargo")} placeholder="Ex: Mestre de obra" />
        </div>
        <div>
          <Label>Especialidade</Label>
          <Select value={form.especialidade} onChange={set("especialidade")}
            options={ESPECIALIDADES.map((e) => ({ value: e, label: e }))} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>E-mail</Label>
          <Input value={form.email} onChange={set("email")} type="email" placeholder="email@exemplo.com" />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input value={form.telefone} onChange={set("telefone")} placeholder="(11) 99999-9999" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Salário / valor diária</Label>
          <Input value={form.salario} onChange={set("salario")} type="number" min="0" placeholder="0,00" />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={set("status")}
            options={STATUS_OPTS.map((s) => ({ value: s, label: s }))} />
        </div>
      </div>
      <div>
        <Label>Observações</Label>
        <textarea
          value={form.observacoes}
          onChange={(e) => set("observacoes")(e.target.value)}
          placeholder="Informações adicionais..."
          rows={3}
          style={{
            width: "100%", background: "transparent",
            border: `1px solid ${C.border}`, borderRadius: 6,
            padding: "10px 13px", color: C.text, fontSize: 13,
            outline: "none", fontFamily: "inherit", resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn disabled={!form.nome} onClick={onSave}>{btnLabel}</Btn>
      </div>
    </div>
  );
}

export default function Equipe() {
  useModuleLoad("colaboradores");

  const colaboradores    = useAppStore((s) => s.colaboradores);
  const addColaborador   = useAppStore((s) => s.addColaborador);
  const updateColaborador = useAppStore((s) => s.updateColaborador);
  const deleteColaborador = useAppStore((s) => s.deleteColaborador);

  const [modal,   setModal]   = useState(null);
  const [editId,  setEditId]  = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [form,    setForm]    = useState(FORM_VAZIO);
  const [busca,   setBusca]   = useState("");
  const [statusF, setStatusF] = useState("Todos");

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setModal("novo");
  }

  function abrirEditar(c) {
    setEditId(c.id);
    setForm({
      nome: c.nome || "", cargo: c.cargo || "", email: c.email || "",
      telefone: c.telefone || "", especialidade: c.especialidade || "Steel Frame",
      status: c.status || "Ativo", salario: c.salario || "", observacoes: c.observacoes || "",
    });
    setModal("editar");
  }

  async function salvarNovo() {
    await addColaborador({ ...form, salario: form.salario ? Number(form.salario) : null });
    setModal(null);
    mostrarToast("✅ Colaborador cadastrado!");
  }

  async function salvarEdicao() {
    await updateColaborador(editId, { ...form, salario: form.salario ? Number(form.salario) : null });
    setModal(null);
    mostrarToast("✅ Dados atualizados!");
  }

  async function executarDelete() {
    await deleteColaborador(confirm);
    setConfirm(null);
    mostrarToast("🗑 Colaborador removido.");
  }

  const lista = colaboradores.filter((c) => {
    const matchBusca  = !busca || c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.cargo?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusF === "Todos" || c.status === statusF;
    return matchBusca && matchStatus;
  });

  const ativos  = colaboradores.filter((c) => c.status === "Ativo").length;
  const folha   = colaboradores.filter((c) => c.status === "Ativo" && c.salario).reduce((a, c) => a + (c.salario || 0), 0);

  return (
    <>
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px #0006",
        }}>{toast}</div>
      )}

      {(modal === "novo" || modal === "editar") && (
        <Modal title={modal === "novo" ? "Novo colaborador" : "Editar colaborador"} onClose={() => setModal(null)}>
          <FormColaborador
            form={form} setForm={setForm}
            onSave={modal === "novo" ? salvarNovo : salvarEdicao}
            onCancel={() => setModal(null)}
            btnLabel={modal === "novo" ? "Cadastrar" : "Salvar alterações"}
          />
        </Modal>
      )}

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: 360, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🗑</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Remover colaborador?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Essa ação não pode ser desfeita.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
              <button onClick={executarDelete} style={{
                padding: "10px 24px", background: C.danger, border: "none",
                borderRadius: 6, color: "#fff", fontWeight: 700,
                fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>Remover</button>
            </div>
          </div>
        </div>
      )}

      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Equipe</h2>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              {ativos} ativo{ativos !== 1 ? "s" : ""}
              {folha > 0 && <span style={{ marginLeft: 10, color: C.success, fontWeight: 600 }}>· Folha: {fmt(folha)}</span>}
            </p>
          </div>
          <Btn onClick={abrirNovo}>+ Novo colaborador</Btn>
        </div>

        {/* Filtros */}
        {colaboradores.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou cargo..."
              style={{
                flex: "1 1 200px", padding: "8px 14px", borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit",
              }}
            />
            {["Todos", ...STATUS_OPTS].map((s) => (
              <button key={s} onClick={() => setStatusF(s)} style={{
                padding: "7px 14px", borderRadius: 7, fontSize: 11, cursor: "pointer",
                fontFamily: "inherit", fontWeight: statusF === s ? 700 : 400,
                border: `1px solid ${statusF === s ? (STATUS_COR[s] || C.red) : C.border}`,
                background: statusF === s ? (STATUS_COR[s] || C.red) + "18" : "transparent",
                color: statusF === s ? (STATUS_COR[s] || C.text) : C.muted,
              }}>{s}</button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {colaboradores.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "60px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👷</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nenhum colaborador cadastrado</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Cadastre sua equipe para controlar disponibilidade e custos.</div>
            <Btn onClick={abrirNovo}>+ Cadastrar primeiro colaborador</Btn>
          </div>
        ) : lista.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}>Nenhum resultado para os filtros aplicados.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {lista.map((c) => (
              <div key={c.id} style={{
                background: C.surface, borderRadius: 12, padding: "18px 20px",
                border: `1px solid ${C.border}`, borderTop: `3px solid ${STATUS_COR[c.status] || C.muted}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{c.nome}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.cargo || "—"} · {c.especialidade}</div>
                  </div>
                  <Badge label={c.status} color={STATUS_COR[c.status] || C.muted} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                  {c.email && (
                    <div style={{ fontSize: 12, color: C.muted }}>✉ {c.email}</div>
                  )}
                  {c.telefone && (
                    <div style={{ fontSize: 12, color: C.muted }}>📞 {c.telefone}</div>
                  )}
                  {c.salario && (
                    <div style={{ fontSize: 12, color: C.success, fontWeight: 700 }}>💰 {fmt(c.salario)}</div>
                  )}
                </div>

                {c.observacoes && (
                  <div style={{ fontSize: 11, color: C.muted, background: C.darker, borderRadius: 6, padding: "8px 10px", marginBottom: 12, lineHeight: 1.5 }}>
                    {c.observacoes}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" size="sm" onClick={() => abrirEditar(c)}>✏️ Editar</Btn>
                  <button onClick={() => setConfirm(c.id)} style={{
                    padding: "6px 12px", background: C.danger + "22",
                    border: `1px solid ${C.danger}44`, borderRadius: 6,
                    color: C.danger, fontSize: 11, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
