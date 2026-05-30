import { useState, useEffect } from "react";
import { C, FASES } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const ICONE_TIPO = { pdf: "📄", imagem: "🖼️", outro: "📎" };
const CATS       = ["Projeto", "Foto", "Documento", "Outro"];
const STATUS_OBRA = ["Planejamento", "Em andamento", "Pausada", "Concluída"];
const STATUS_COR  = {
  "Em andamento": "#2e9e5b",
  "Planejamento": "#4a9eff",
  "Pausada":      "#c88a00",
  "Concluída":    C.muted,
};
const statusColor = (s) => STATUS_COR[s] || "#888";

// ─── Label ───────────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6 }}>
      {String(children).toUpperCase()}
      {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

// ─── Formulário de obra ───────────────────────────────────────────────────────
function FormObra({ form, setForm, clientes, onSave, onCancel, btnLabel }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const clienteOpts = [
    { value: "", label: "— Sem cliente vinculado —" },
    ...clientes.map((c) => ({ value: c.id, label: c.nome })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Nome */}
      <div>
        <Label required>Nome da obra</Label>
        <Input
          value={form.nome}
          onChange={set("nome")}
          placeholder="Ex: Residência Silva — Bofete/SP"
        />
      </div>

      {/* Cliente + Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Cliente</Label>
          <Select value={form.cliente_id} onChange={(v) => {
            const c = clientes.find((x) => x.id === v);
            setForm((f) => ({ ...f, cliente_id: v, cliente: c?.nome || "", email_cliente: c?.email || f.email_cliente }));
          }} options={clienteOpts} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={set("status")}
            options={STATUS_OBRA.map((s) => ({ value: s, label: s }))} />
        </div>
      </div>

      {/* Prazo + Contrato */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Prazo previsto</Label>
          <Input value={form.prazo} onChange={set("prazo")} placeholder="Ex: Dez/2025" />
        </div>
        <div>
          <Label>Valor do contrato (R$)</Label>
          <Input value={form.contrato} onChange={set("contrato")} type="number" min="0" placeholder="0" />
        </div>
      </div>

      {/* Email do cliente */}
      <div>
        <Label>Email do cliente <span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>(para notificações automáticas)</span></Label>
        <Input value={form.email_cliente} onChange={set("email_cliente")} placeholder="cliente@email.com" type="email" />
      </div>

      {/* Fase inicial */}
      <div>
        <Label>Fase inicial</Label>
        <Select value={form.fase} onChange={set("fase")}
          options={FASES.map((f) => ({ value: f, label: f }))} />
      </div>

      {/* Ações */}
      <div style={{
        display: "flex", gap: 10, justifyContent: "flex-end",
        paddingTop: 12, borderTop: `1px solid ${C.border}`,
      }}>
        <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn disabled={!form.nome.trim()} onClick={onSave}>{btnLabel}</Btn>
      </div>
    </div>
  );
}

// ─── Gestão de Obras ──────────────────────────────────────────────────────────
const FORM_VAZIO = {
  nome: "", cliente_id: "", cliente: "", email_cliente: "",
  status: "Planejamento", fase: "Projeto executivo",
  prazo: "—", contrato: 0, progresso: 0,
};

export default function GestaoObras() {
  useModuleLoad("obras");
  useModuleLoad("clientes");
  useModuleLoad("financeiro");

  const obras       = useAppStore((s) => s.obras);
  const clientes    = useAppStore((s) => s.clientes);
  const arquivos    = useAppStore((s) => s.arquivos);
  const addObra     = useAppStore((s) => s.addObra);
  const updateObra  = useAppStore((s) => s.updateObra);
  const deleteObra  = useAppStore((s) => s.deleteObra);
  const avancarFase = useAppStore((s) => s.avancarFase);
  const addArquivos = useAppStore((s) => s.addArquivos);
  const deleteArquivo = useAppStore((s) => s.deleteArquivo);

  useModuleLoad("arquivos", obras[0]?.id);

  const [obraId,      setObraId]      = useState(null);
  const [modal,       setModal]       = useState(null); // "nova" | "editar"
  const [confirm,     setConfirm]     = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [abaAtiva,    setAbaAtiva]    = useState("fases");
  const [catFiltro,   setCatFiltro]   = useState("Todos");
  const [toast,       setToast]       = useState(null);
  const [form,        setForm]        = useState(FORM_VAZIO);
  const [busca,       setBusca]       = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");

  // Inicializa obraId quando obras carregarem
  useEffect(() => {
    if (!obraId && obras.length > 0) setObraId(obras[0].id);
  }, [obras, obraId]);

  async function gerarTokenPortal() {
    const base = (obra.nome || "obra")
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20);
    const token = `${base}-${new Date().getFullYear()}`;
    await updateObra(obraId, { token_portal: token });
    mostrarToast("🔗 Token gerado!");
  }

  async function copiarLinkPortal() {
    const token = obra.token_portal;
    if (!token) { await gerarTokenPortal(); return; }
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    mostrarToast("🔗 Link do portal copiado!");
  }

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const obra      = obras.find((o) => o.id === obraId) || null;
  const arqObra   = arquivos[obraId] || [];
  const arqFiltro = catFiltro === "Todos" ? arqObra : arqObra.filter((a) => a.categoria === catFiltro);

  const obrasFiltradas = obras.filter((o) => {
    const matchBusca  = !busca || o.nome?.toLowerCase().includes(busca.toLowerCase()) || o.cliente?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFiltro === "Todos" || o.status === statusFiltro;
    return matchBusca && matchStatus;
  });

  function abrirNova() {
    setForm(FORM_VAZIO);
    setModal("nova");
  }

  function abrirEditar() {
    if (!obra) return;
    setForm({
      nome:          obra.nome || "",
      cliente_id:    obra.cliente_id || "",
      cliente:       obra.cliente || "",
      email_cliente: obra.email_cliente || "",
      status:        obra.status || "Planejamento",
      fase:          obra.fase || "Projeto executivo",
      prazo:         obra.prazo || "—",
      contrato:      obra.contrato || 0,
      progresso:     obra.progresso || 0,
    });
    setModal("editar");
  }

  async function salvarNova() {
    const data = await addObra({
      ...form,
      contrato:  Number(form.contrato) || 0,
      progresso: 0,
    });
    setModal(null);
    setObraId(data.id);
    mostrarToast("✅ Obra cadastrada com sucesso!");
  }

  async function salvarEdicao() {
    await updateObra(obraId, {
      ...form,
      contrato: Number(form.contrato) || 0,
    });
    setModal(null);
    mostrarToast("✅ Obra atualizada!");
  }

  async function executarDelete() {
    await deleteObra(obraId);
    setObraId(obras.find((o) => o.id !== obraId)?.id || null);
    setConfirm(false);
    mostrarToast("🗑 Obra removida.");
  }

  function avancar() {
    if (!obra) return;
    const i = FASES.indexOf(obra.fase);
    if (i >= FASES.length - 1) return;
    const novaFase  = FASES[i + 1];
    const progresso = Math.round(((i + 2) / FASES.length) * 100);
    avancarFase(obra.id, novaFase, progresso);
    mostrarToast(`📋 Avançou para: ${novaFase}`);
  }

  function handleFiles(files) {
    const novos = Array.from(files).map((f) => ({
      id:        Date.now() + Math.random(),
      nome:      f.name,
      tipo:      f.type.startsWith("image/") ? "imagem" : f.name.endsWith(".pdf") ? "pdf" : "outro",
      tamanho:   (f.size / 1024 / 1024).toFixed(1) + " MB",
      data:      new Date().toLocaleDateString("pt-BR"),
      categoria: f.name.endsWith(".pdf") ? "Documento" : "Foto",
    }));
    addArquivos(obraId, novos);
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

      {/* Modal nova / editar obra */}
      {(modal === "nova" || modal === "editar") && (
        <Modal
          title={modal === "nova" ? "Nova obra" : "Editar obra"}
          onClose={() => setModal(null)}
        >
          <FormObra
            form={form} setForm={setForm} clientes={clientes}
            onSave={modal === "nova" ? salvarNova : salvarEdicao}
            onCancel={() => setModal(null)}
            btnLabel={modal === "nova" ? "Cadastrar obra" : "Salvar alterações"}
          />
        </Modal>
      )}

      {/* Confirmação de exclusão */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, width: 360, textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🗑</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Deletar obra?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
              <strong style={{ color: C.text }}>{obra?.nome}</strong> e todos seus dados serão removidos.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(false)}>Cancelar</Btn>
              <button onClick={executarDelete} style={{
                padding: "10px 24px", background: C.danger, border: "none",
                borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
              }}>Deletar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Gestão de Obras</h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{obras.length} projeto{obras.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn onClick={abrirNova}>+ Nova obra</Btn>
      </div>

      {/* Filtros */}
      {obras.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar obra ou cliente..."
            style={{
              flex: "1 1 200px", padding: "8px 14px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.surface,
              color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit",
            }}
          />
          {["Todos", ...STATUS_OBRA].map((s) => (
            <button key={s} onClick={() => setStatusFiltro(s)} style={{
              padding: "7px 14px", borderRadius: 7, fontSize: 11, cursor: "pointer",
              fontFamily: "inherit", fontWeight: statusFiltro === s ? 700 : 400,
              border: `1px solid ${statusFiltro === s ? (STATUS_COR[s] || C.red) : C.border}`,
              background: statusFiltro === s ? (STATUS_COR[s] || C.red) + "18" : "transparent",
              color: statusFiltro === s ? (STATUS_COR[s] || C.text) : C.muted,
            }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {obras.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>◆</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhuma obra cadastrada</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Crie sua primeira obra para gerenciar fases, arquivos e lançamentos financeiros.</div>
          <Btn onClick={abrirNova}>+ Criar primeira obra</Btn>
        </div>
      ) : (
        <>
          {/* Seletor de obra */}
          <div style={{ display: "flex", gap: 8, margin: "8px 0 16px", flexWrap: "wrap" }}>
            {obrasFiltradas.length === 0 && (
              <div style={{ fontSize: 13, color: C.muted, padding: "8px 0" }}>Nenhuma obra encontrada para os filtros selecionados.</div>
            )}
            {obrasFiltradas.map((o) => (
              <button key={o.id} onClick={() => setObraId(o.id)} style={{
                padding: "8px 16px", borderRadius: 8,
                border: `1px solid ${obraId === o.id ? C.red : C.border}`,
                background: obraId === o.id ? C.red + "18" : "transparent",
                color: obraId === o.id ? C.text : C.muted,
                fontSize: 12, fontWeight: obraId === o.id ? 700 : 400,
                cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
              }}>
                {o.nome?.split("—")[0]?.trim()}
              </button>
            ))}
          </div>

          {obra && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 18 }}>

              {/* Coluna principal */}
              <div>
                {/* Abas */}
                <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
                  {[["fases", "📋 Fases da obra"], ["arquivos", "📁 Arquivos"]].map(([k, l]) => (
                    <button key={k} onClick={() => setAbaAtiva(k)} style={{
                      padding: "10px 20px", background: "transparent", border: "none",
                      borderBottom: `2px solid ${abaAtiva === k ? C.red : "transparent"}`,
                      color: abaAtiva === k ? C.text : C.muted,
                      fontSize: 13, fontWeight: abaAtiva === k ? 700 : 400,
                      cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                    }}>{l}</button>
                  ))}
                </div>

                {/* ABA FASES */}
                {abaAtiva === "fases" && (
                  <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{obra.nome}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {obra.cliente || "Sem cliente"} · Prazo: {obra.prazo}
                        </div>
                      </div>
                      <Badge label={obra.status} color={statusColor(obra.status)} />
                    </div>

                    {/* Barra de progresso */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 5 }}>
                        <span>Progresso</span>
                        <span style={{ color: C.text, fontWeight: 700 }}>{obra.progresso}%</span>
                      </div>
                      <div style={{ height: 8, background: C.dark, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          height: 8, width: `${obra.progresso}%`,
                          background: `linear-gradient(90deg,${C.red},#6e1210)`,
                          borderRadius: 4, transition: "width .5s",
                        }} />
                      </div>
                    </div>

                    {/* Timeline de fases */}
                    {FASES.map((f, i) => {
                      const idx  = FASES.indexOf(obra.fase);
                      const done = f === obra.fase;
                      const past = idx > i;
                      return (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            background: past ? C.success : done ? C.red : C.dark,
                            border: `2px solid ${past ? C.success : done ? C.red : C.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, color: "#fff", fontWeight: 700,
                          }}>{past ? "✓" : i + 1}</div>
                          <span style={{ fontSize: 13, color: done || past ? C.text : C.muted, fontWeight: done ? 700 : 400 }}>{f}</span>
                          {done && <Badge label="Atual" color={C.red} />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ABA ARQUIVOS */}
                {abaAtiva === "arquivos" && (
                  <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                    <label style={{
                      display: "block",
                      border: `2px dashed ${dragOver ? C.red : C.border}`,
                      borderRadius: 10, padding: "24px 20px", textAlign: "center",
                      cursor: "pointer", marginBottom: 18,
                      background: dragOver ? C.red + "0a" : C.darker,
                      transition: "all .2s",
                    }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    >
                      <input type="file" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: dragOver ? C.red : C.text, marginBottom: 4 }}>
                        {dragOver ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para enviar"}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>PDF, imagens, planilhas — qualquer formato</div>
                    </label>

                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      {["Todos", ...CATS].map((c) => (
                        <button key={c} onClick={() => setCatFiltro(c)} style={{
                          padding: "5px 12px", borderRadius: 6, fontSize: 11,
                          fontWeight: catFiltro === c ? 700 : 400,
                          border: `1px solid ${catFiltro === c ? C.red : C.border}`,
                          background: catFiltro === c ? C.red + "18" : "transparent",
                          color: catFiltro === c ? C.text : C.muted,
                          cursor: "pointer", fontFamily: "inherit",
                        }}>{c}</button>
                      ))}
                      <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted, alignSelf: "center" }}>{arqFiltro.length} arquivo(s)</span>
                    </div>

                    {arqFiltro.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>
                        {arqObra.length === 0 ? "Nenhum arquivo enviado ainda." : "Nenhum arquivo nesta categoria."}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {arqFiltro.map((a) => (
                          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.darker, borderRadius: 8, border: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: 22, flexShrink: 0 }}>{ICONE_TIPO[a.tipo] || "📎"}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.categoria} · {a.tamanho} · {a.data}</div>
                            </div>
                            <button onClick={() => deleteArquivo(obraId, a.id)} style={{
                              background: C.danger + "22", border: `1px solid ${C.danger}44`,
                              borderRadius: 6, color: C.danger, fontSize: 11, fontWeight: 700,
                              cursor: "pointer", padding: "4px 10px", fontFamily: "inherit", flexShrink: 0,
                            }}>🗑</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Coluna lateral */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Ações rápidas */}
                <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 12 }}>AÇÃO RÁPIDA</div>
                  <Btn onClick={avancar} disabled={obra.fase === "Entrega"} fullWidth>
                    {obra.fase === "Entrega" ? "✓ Fase concluída" : "Avançar fase →"}
                  </Btn>
                  {obra.fase !== "Entrega" && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                      Próxima: {FASES[FASES.indexOf(obra.fase) + 1]}
                    </div>
                  )}
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    <Btn variant="ghost" size="sm" fullWidth onClick={abrirEditar}>✏️ Editar obra</Btn>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <button onClick={copiarLinkPortal} style={{
                        width: "100%", padding: "8px 0",
                        background: "#4a9eff22", border: "1px solid #4a9eff44",
                        borderRadius: 6, color: "#4a9eff", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {obra.token_portal ? "🔗 Copiar link do portal" : "🔗 Gerar link do portal"}
                      </button>
                      {obra.token_portal && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ fontSize: 10, color: "#4a9eff", background: "#4a9eff11", borderRadius: 4, padding: "3px 8px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            /portal/{obra.token_portal}
                          </div>
                          <button onClick={gerarTokenPortal} title="Gerar novo token" style={{ background: "none", border: "none", cursor: "pointer", color: "#4a9eff66", fontSize: 12, padding: 2 }}>↺</button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setConfirm(true)} style={{
                      width: "100%", padding: "8px 0",
                      background: C.danger + "22", border: `1px solid ${C.danger}44`,
                      borderRadius: 6, color: C.danger, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>🗑 Deletar obra</button>
                  </div>
                </div>

                {/* Resumo */}
                <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 14 }}>RESUMO</div>
                  {[
                    ["Status",    obra.status],
                    ["Fase",      obra.fase],
                    ["Prazo",     obra.prazo],
                    ["Concluído", `${obra.progresso}%`],
                    ["Arquivos",  `${arqObra.length} arquivo(s)`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, paddingBottom: 9, marginBottom: 9 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
