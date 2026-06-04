import ObraMembros from "../components/obras/ObraMembros";
import ChangeOrders from "../components/obras/ChangeOrders";
import { ArquivoVersoes } from "../components/obras/ArquivoVersoes";
import { useObraPermission, useObrasVisiveis } from "../hooks/useObraPermission";
import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, BarChart2, ClipboardList, DollarSign, HardHat, Pencil, Ruler, Search, Trash2, TrendingUp } from "../components/ui/Icon";
import { useToast } from "../hooks/useToast";
import { C, FASES } from "../utils/constants";
import { exportarObrasExcel } from "../utils/exportExcel";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { listarQuantitativos } from "../services/repositories/quantitativoRepository";

const ICONE_TIPO  = { pdf: "📄", imagem: "🖼️", outro: "📎" };
const CATS        = ["Projeto", "Foto", "Documento", "Outro"];
const DISCIPLINAS = ["Arquitetônico","Estrutural","Steel Frame","Elétrico","Hidráulico","AVAC","Fundação","Administrativo","Outro"];
const STATUS_DOC  = ["Ativo","Em revisão","Aprovado","Obsoleto"];
const STATUS_DOC_COR = { "Ativo": "#4a9eff", "Em revisão": "#b97a00", "Aprovado": "#2e9e5b", "Obsoleto": C.muted };
const STATUS_OBRA = ["Planejamento", "Em andamento", "Pausada", "Concluída"];

const CHECKLIST_FASES = {
  "Projeto executivo":    ["Projeto arquitetônico aprovado", "ART emitida e assinada", "Memorial descritivo entregue"],
  "Fundação":             ["Sondagem do terreno realizada", "Locação executada", "Radier/sapatas concluídos e curados"],
  "Estrutura Steel Frame":["Perfis montados conforme projeto", "Contraventamentos instalados", "Vistoria estrutural realizada"],
  "Fechamentos":          ["Placas OSB/gesso instaladas", "Esquadrias fixadas e niveladas", "Impermeabilização de fachada aplicada"],
  "Instalações":          ["Instalação elétrica aprovada", "Instalação hidráulica aprovada", "Passagens de dutos concluídas"],
  "Acabamento":           ["Pintura interna e externa concluída", "Pisos e revestimentos assentados", "Louças e metais instalados"],
  "Entrega":              ["Vistoria final realizada e aprovada", "Manual do proprietário entregue", "Documentação técnica enviada"],
};
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
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}
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

      {/* Datas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Início da obra</Label>
          <Input value={form.prazo_inicio} onChange={set("prazo_inicio")} type="date" />
        </div>
        <div>
          <Label>Entrega prevista</Label>
          <Input value={form.prazo_fim} onChange={set("prazo_fim")} type="date" />
        </div>
      </div>

      {/* Contrato */}
      <div>
        <Label>Valor do contrato (R$)</Label>
        <Input value={form.contrato} onChange={set("contrato")} type="number" min="0" placeholder="0" />
      </div>

      {/* Retenção de garantia */}
      <div>
        <Label>Retenção de garantia (%)</Label>
        <Input value={form.retencao_pct ?? 5} onChange={set("retencao_pct")} type="number" min="0" max="20" placeholder="5" />
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
          % do contrato retido até a entrega (padrão 5%)
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
// ─── Diário com foto ──────────────────────────────────────────────────────────
function DiarioAba({ obraId, obra, diario, addDiario }) {
  const hoje = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ data: hoje, turno: "Manhã", clima: "Ensolarado", atividades: "", ocorrencias: "" });
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const { mostrarToast } = useToast();

  const handleFoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFotoFile(f);
    setFotoPreview(URL.createObjectURL(f));
  };

  const salvar = async () => {
    if (!form.atividades.trim()) { mostrarToast("⚠️ Informe as atividades do dia."); return; }
    setSaving(true);
    try {
      let foto_url = null;
      if (fotoFile) {
        const ext = fotoFile.name.split(".").pop();
        const path = `diario/${obraId}/${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from("arquivos").upload(path, fotoFile, { upsert: false });
        if (!upErr) {
          const { data } = sb.storage.from("arquivos").getPublicUrl(path);
          foto_url = data.publicUrl;
        }
      }
      await addDiario(obraId, { ...form, foto_url });
      setForm({ data: hoje, turno: "Manhã", clima: "Ensolarado", atividades: "", ocorrencias: "" });
      setFotoFile(null);
      setFotoPreview(null);
      mostrarToast("✅ Registro salvo no diário!");
    } catch (e) {
      mostrarToast("❌ Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
      {/* Formulário */}
      <div style={{ background: C.dark, borderRadius: 10, padding: 18, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: C.text }}>📝 Novo registro</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <Label>Data</Label>
            <Input type="date" value={form.data} onChange={(v) => setForm((f) => ({ ...f, data: v }))} />
          </div>
          <div>
            <Label>Turno</Label>
            <Select value={form.turno} onChange={(v) => setForm((f) => ({ ...f, turno: v }))}
              options={["Manhã", "Tarde", "Integral"].map((t) => ({ value: t, label: t }))} />
          </div>
          <div>
            <Label>Clima</Label>
            <Select value={form.clima} onChange={(v) => setForm((f) => ({ ...f, clima: v }))}
              options={["Ensolarado", "Nublado", "Chuvoso", "Parcialmente nublado"].map((c) => ({ value: c, label: c }))} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label required>Atividades realizadas</Label>
          <textarea value={form.atividades} onChange={(e) => setForm((f) => ({ ...f, atividades: e.target.value }))}
            placeholder="Descreva o que foi feito hoje na obra..."
            style={{ width: "100%", minHeight: 80, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label>Ocorrências / Observações</Label>
          <textarea value={form.ocorrencias} onChange={(e) => setForm((f) => ({ ...f, ocorrencias: e.target.value }))}
            placeholder="Problemas, atrasos, visitas, etc..."
            style={{ width: "100%", minHeight: 60, padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
        </div>
        {/* Upload foto */}
        <div style={{ marginBottom: 16 }}>
          <Label>Foto da obra (opcional)</Label>
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "10px 18px", fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
              📷 {fotoFile ? fotoFile.name : "Tirar foto ou escolher arquivo"}
            </div>
            <input type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: "none" }} />
          </label>
          {fotoPreview && (
            <img src={fotoPreview} alt="preview" onClick={() => setFotoAmpliada(fotoPreview)}
              style={{ marginTop: 10, maxWidth: 200, maxHeight: 150, borderRadius: 8, border: `1px solid ${C.border}`, cursor: "zoom-in", objectFit: "cover" }} />
          )}
        </div>
        <Btn onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "💾 Salvar registro"}</Btn>
      </div>

      {/* Lista de registros */}
      {diario.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>Nenhum registro no diário ainda.</div>
      ) : diario.map((r, i) => (
        <div key={r.id || i} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{r.data ? new Date(r.data + "T00:00").toLocaleDateString("pt-BR") : "—"}</span>
              <span style={{ fontSize: 11, color: C.muted, background: C.dark, padding: "2px 8px", borderRadius: 6 }}>{r.turno}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{r.clima}</span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.text, marginBottom: r.ocorrencias ? 8 : 0, lineHeight: 1.5 }}>{r.atividades}</div>
          {r.ocorrencias && (
            <div style={{ background: "#fff5f5", borderLeft: `3px solid ${C.red}`, padding: "6px 12px", borderRadius: "0 6px 6px 0", fontSize: 12, color: "#555", marginBottom: 8 }}>
              ⚠️ {r.ocorrencias}
            </div>
          )}
          {r.foto_url && (
            <img src={r.foto_url} alt="foto" onClick={() => setFotoAmpliada(r.foto_url)}
              style={{ maxWidth: 180, maxHeight: 130, borderRadius: 8, border: `1px solid ${C.border}`, cursor: "zoom-in", objectFit: "cover", marginTop: 8 }} />
          )}
        </div>
      ))}

      {/* Lightbox */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={fotoAmpliada} alt="ampliada" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 10 }} />
        </div>
      )}
    </div>
  );
}

const FORM_VAZIO = {
  nome: "", cliente_id: "", cliente: "", email_cliente: "",
  status: "Planejamento", fase: "Projeto executivo",
  prazo_inicio: "", prazo_fim: "", contrato: 0, progresso: 0, retencao_pct: 5,
};

export default function GestaoObras() {
  const { toast, mostrarToast } = useToast();
  useModuleLoad("obras");
  useModuleLoad("clientes");
  useModuleLoad("financeiro");

  const _obras      = useAppStore((s) => s.obras);
  const obras       = useObrasVisiveis(_obras);
  const clientes    = useAppStore((s) => s.clientes);
  const arquivos    = useAppStore((s) => s.arquivos);
  const addObra           = useAppStore((s) => s.addObra);
  const updateObra        = useAppStore((s) => s.updateObra);
  const deleteObra        = useAppStore((s) => s.deleteObra);
  const avancarFase       = useAppStore((s) => s.avancarFase);
  const addArquivos       = useAppStore((s) => s.addArquivos);
  const deleteArquivo     = useAppStore((s) => s.deleteArquivo);
  const loadHistoricoObra = useAppStore((s) => s.loadHistoricoObra);
  const financeiro        = useAppStore((s) => s.financeiro);
  const perfil            = useAppStore((s) => s.user?.perfil);
  const userId            = useAppStore((s) => s.user?.uid);
  const empresaId         = useAppStore((s) => s.empresaId);
  const marcarCiente      = useAppStore((s) => s.marcarCiente);
  const medicoes          = useAppStore((s) => s.medicoes);
  const diario            = useAppStore((s) => s.diario);
  const loadMedicoes      = useAppStore((s) => s.loadMedicoes);
  const loadDiario        = useAppStore((s) => s.loadDiario);
  const vistorias         = useAppStore((s) => s.vistorias);
  const loadVistorias     = useAppStore((s) => s.loadVistorias);

  useModuleLoad("arquivos", obras[0]?.id);

  const [obraId,      setObraId]      = useState(null);
  const { podeEditar, podeGerenciar, temAcesso } = useObraPermission(obraId);
  const [modal,       setModal]       = useState(null); // "nova" | "editar"
  const [confirm,     setConfirm]     = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [abaAtiva,    setAbaAtiva]    = useState("fases");
  const [catFiltro,   setCatFiltro]   = useState("Todos");
  const [discFiltro,  setDiscFiltro]  = useState("Todos");
  const [statusDocFiltro, setStatusDocFiltro] = useState("Todos");
  const [faseFiltro,  setFaseFiltro]  = useState("Todos");
  const [uploadMeta,  setUploadMeta]  = useState(null); // { files, disciplina, status_doc }
  const [form,        setForm]        = useState(FORM_VAZIO);
  const [busca,       setBusca]       = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [histObra,    setHistObra]    = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [checklistModal,   setChecklistModal]   = useState(false);
  const [checklistMarcados, setChecklistMarcados] = useState({});
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [qrModal,      setQrModal]      = useState(false);
  const [checkinsHoje, setCheckinsHoje] = useState([]);
  const [relMensalModal, setRelMensalModal] = useState(false);
  const [relMensalMes,   setRelMensalMes]   = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [checkinsVis,  setCheckinsVis]  = useState(false);
  const [gedTravaModal, setGedTravaModal] = useState(false);
  // Rastreio
  const [paineis,     setPaineis]     = useState([]);
  const [ambientes,   setAmbientes]   = useState([]);
  const [painelForm,  setPainelForm]  = useState({ codigo: "", descricao: "", local_instalacao: "", ifc_element_id: "" });
  const [ambForm,     setAmbForm]     = useState({ nome: "", andar: "" });
  const [rastreioTab, setRastreioTab] = useState("paineis");
  const [portalMsgs,   setPortalMsgs]   = useState([]);
  const [portalReply,  setPortalReply]  = useState("");
  const [portalSending, setPortalSending] = useState(false);

  // Garantia
  const chamados      = useAppStore((s) => s.chamados);
  const loadChamados  = useAppStore((s) => s.loadChamados);
  const addChamado    = useAppStore((s) => s.addChamado);
  const updateChamado = useAppStore((s) => s.updateChamado);
  const deleteChamado = useAppStore((s) => s.deleteChamado);
  const [chamadoModal,  setChamadoModal]  = useState(false);
  const [chamadoForm,   setChamadoForm]   = useState({ titulo: "", descricao: "", categoria: "Outro", prioridade: "Média" });
  const [chamadoEd,     setChamadoEd]     = useState(null);
  const [chamadoSaving, setChamadoSaving] = useState(false);
  const [versaoModal,   setVersaoModal]   = useState(null);

  useEffect(() => {
    if (!obraId && obras.length > 0) setObraId(obras[0].id);
  }, [obras, obraId]);

  // Chat do portal: carrega + Realtime
  useEffect(() => {
    if (!obraId) return;
    sb.from("portal_mensagens").select("*").eq("obra_id", obraId).order("created_at").then(({ data }) => setPortalMsgs(data || []));
    const ch = sb.channel(`obra-msgs-${obraId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "portal_mensagens", filter: `obra_id=eq.${obraId}` },
        (p) => setPortalMsgs((prev) => prev.find((m) => m.id === p.new.id) ? prev : [...prev, p.new]))
      .subscribe();
    return () => ch.unsubscribe();
  }, [obraId]);

  useEffect(() => {
    if (abaAtiva === "diario" && obraId) loadDiario(obraId);
    if (abaAtiva === "garantia" && obraId) loadChamados(obraId);
    if (abaAtiva === "rastreio" && obraId) {
      sb.from("paineis").select("*").eq("obra_id", obraId).order("created_at").then(({ data }) => setPaineis(data || []));
      sb.from("ambientes_qr").select("*").eq("obra_id", obraId).order("created_at").then(({ data }) => setAmbientes(data || []));
    }
    if (abaAtiva === "historico" && obraId) {
      setHistLoading(true);
      loadHistoricoObra(obraId).then((d) => { setHistObra(d); setHistLoading(false); });
    }
  }, [abaAtiva, obraId]);

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

  const obra      = obras.find((o) => o.id === obraId) || null;
  const arqObra   = arquivos[obraId] || [];
  const arqFiltro = arqObra.filter((a) =>
    (catFiltro      === "Todos" || a.categoria  === catFiltro) &&
    (discFiltro     === "Todos" || a.disciplina === discFiltro) &&
    (statusDocFiltro=== "Todos" || a.status_doc === statusDocFiltro) &&
    (faseFiltro     === "Todos" || a.fase       === faseFiltro)
  );

  const obrasFiltradas = useMemo(() => obras.filter((o) => {
    const matchBusca  = !busca || o.nome?.toLowerCase().includes(busca.toLowerCase()) || o.cliente?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFiltro === "Todos" || o.status === statusFiltro;
    return matchBusca && matchStatus;
  }), [obras, busca, statusFiltro]);

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
      prazo_inicio:  obra.prazo_inicio || "",
      prazo_fim:     obra.prazo_fim    || "",
      contrato:      obra.contrato || 0,
      progresso:     obra.progresso || 0,
      retencao_pct:  obra.retencao_pct ?? 5,
    });
    setModal("editar");
  }

  async function salvarNova() {
    try {
      const data = await addObra({
        ...form,
        cliente_id: form.cliente_id || null,
        contrato:   Number(form.contrato) || 0,
        progresso:  0,
      });
      setModal(null);
      setObraId(data.id);
      mostrarToast("✅ Obra cadastrada com sucesso!");
    } catch (e) {
      mostrarToast("❌ Erro ao cadastrar obra. Verifique os dados.");
    }
  }

  async function salvarEdicao() {
    try {
      const faseIdx   = FASES.indexOf(form.fase);
      const progresso = faseIdx >= 0 ? Math.round(((faseIdx + 1) / FASES.length) * 100) : (form.progresso || 0);
      await updateObra(obraId, {
        nome:          form.nome,
        cliente_id:    form.cliente_id || null,
        email_cliente: form.email_cliente,
        status:        form.status,
        fase:          form.fase,
        prazo_inicio:  form.prazo_inicio || null,
        prazo_fim:     form.prazo_fim    || null,
        contrato:      Number(form.contrato) || 0,
        progresso:     form.progresso || 0,
      });
      setModal(null);
      mostrarToast("✅ Obra atualizada!");
    } catch (e) {
      mostrarToast(`❌ Erro ao salvar: ${e?.message || "verifique os dados."}`);
    }
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
    setChecklistMarcados({});
    setChecklistModal(true);
  }

  function retornar() {
    if (!obra) return;
    const i = FASES.indexOf(obra.fase);
    if (i <= 0) return;
    const novaFase  = FASES[i - 1];
    const progresso = Math.round((i / FASES.length) * 100);
    avancarFase(obra.id, novaFase, progresso);
    mostrarToast(`↩ Retornou para: ${novaFase}`);
  }

  function confirmarAvancar() {
    const i = FASES.indexOf(obra.fase);
    if (i >= FASES.length - 1) return;
    const novaFase  = FASES[i + 1];
    const progresso = Math.round(((i + 2) / FASES.length) * 100);
    avancarFase(obra.id, novaFase, progresso);
    setChecklistModal(false);
    mostrarToast(`<ClipboardList size={13} /> Avançou para: ${novaFase}`);
  }

  async function gerarDossie() {
    if (!obra) return;
    mostrarToast("⏳ Gerando dossiê...");
    const win = window.open("", "_blank");
    if (!win) { mostrarToast("❌ Popup bloqueado. Permita popups para este site."); return; }
    win.document.write("<html><body style='font-family:sans-serif;padding:40px;color:#555'>⏳ Carregando dossiê...</body></html>");
    await Promise.all([loadMedicoes(obraId), loadDiario(obraId), loadVistorias(obraId)]);
    const quants = await listarQuantitativos(obraId).catch(() => []);

    const fin        = (financeiro[obraId]?.lancamentos || []);
    const meds       = medicoes[obraId] || [];
    const diarioObra = (diario[obraId] || []);
    const vists      = vistorias[obraId] || [];
    const arqs       = arqObra;

    const fmtR = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const receitas  = fin.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
    const despesas  = fin.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
    const resultado = receitas - despesas;
    const hoje      = new Date().toLocaleDateString("pt-BR");
    const faseIdx   = FASES.indexOf(obra.fase);
    const progresso = obra.progresso || 0;
    const totalQuant = quants.reduce((a, q) => a + (Number(q.quantidade) * Number(q.custo_unitario)), 0);

    // ── Barra de progresso SVG ────────────────────────────────────────────────
    const barraProgresso = (pct, cor = "#981915") =>
      `<div style="background:#eee;border-radius:4px;height:8px;margin-top:4px">
        <div style="width:${Math.min(pct,100)}%;height:8px;background:${cor};border-radius:4px"></div>
      </div>`;

    // ── Fases ─────────────────────────────────────────────────────────────────
    const fasesHtml = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px">
      ${FASES.map((f, i) => {
        const done = i < faseIdx, curr = i === faseIdx;
        const bg = done ? "#2e9e5b" : curr ? "#981915" : "#e5e7eb";
        const tc = done || curr ? "#fff" : "#9ca3af";
        return `<div style="background:${bg};border-radius:8px;padding:8px 10px;text-align:center">
          <div style="font-size:9px;font-weight:700;color:${tc};letter-spacing:.5px">${done ? "✓ " : curr ? "▶ " : ""}${f}</div>
        </div>`;
      }).join("")}
    </div>`;

    // ── KPIs capa ─────────────────────────────────────────────────────────────
    const kpi = (label, value, cor = "#1a1a1a") =>
      `<div style="background:#f9fafb;border-radius:10px;padding:14px 18px;border:1px solid #e5e7eb">
        <div style="font-size:10px;color:#9ca3af;letter-spacing:1px;margin-bottom:6px">${label}</div>
        <div style="font-size:20px;font-weight:900;color:${cor}">${value}</div>
      </div>`;

    // ── Medições ──────────────────────────────────────────────────────────────
    const medsHtml = meds.length === 0
      ? "<p style='color:#9ca3af;font-size:13px;padding:12px 0'>Nenhuma medição registrada.</p>"
      : `<table><thead><tr><th>Nº</th><th>Descrição</th><th>Valor</th><th>Status</th></tr></thead><tbody>
          ${meds.map((m) => `<tr>
            <td>${m.numero || "—"}</td>
            <td>${m.descricao || "—"}</td>
            <td>${fmtR(m.valor)}</td>
            <td><span style="color:${m.status === "Aprovada" ? "#2e9e5b" : "#b97a00"};font-weight:700">${m.status}</span></td>
          </tr>`).join("")}
        </tbody></table>`;

    // ── Financeiro ────────────────────────────────────────────────────────────
    const finHtml = fin.length === 0
      ? "<p style='color:#9ca3af;font-size:13px;padding:12px 0'>Nenhum lançamento registrado.</p>"
      : `<table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>
          ${fin.map((l) => `<tr>
            <td>${l.data || "—"}</td>
            <td>${l.descricao || "—"}</td>
            <td>${l.categoria || "—"}</td>
            <td style="color:${l.tipo === "receita" ? "#2e9e5b" : "#c0392b"};font-weight:600">${l.tipo === "receita" ? "+" : "−"}${fmtR(l.valor)}</td>
          </tr>`).join("")}
        </tbody></table>`;

    // ── Vistorias ─────────────────────────────────────────────────────────────
    const vistsHtml = vists.length === 0
      ? "<p style='color:#9ca3af;font-size:13px;padding:12px 0'>Nenhuma vistoria registrada.</p>"
      : `<table><thead><tr><th>Tipo</th><th>Fase</th><th>Data</th><th>Responsável</th><th>Resultado</th><th>Conformidade</th></tr></thead><tbody>
          ${vists.map((v) => {
            const cor = v.resultado === "Aprovado" ? "#2e9e5b" : v.resultado === "Reprovado" ? "#c0392b" : "#b97a00";
            return `<tr>
              <td>${v.tipo || "—"}</td>
              <td>${v.fase || "—"}</td>
              <td>${v.data || "—"}</td>
              <td>${v.responsavel || "—"}</td>
              <td><span style="color:${cor};font-weight:700">${v.resultado || "—"}</span></td>
              <td>${v.conformidade != null ? `${v.conformidade}%` : "—"}</td>
            </tr>`;
          }).join("")}
        </tbody></table>`;

    // ── Quantitativos ─────────────────────────────────────────────────────────
    const quantsHtml = quants.length === 0
      ? "<p style='color:#9ca3af;font-size:13px;padding:12px 0'>Nenhum item no quantitativo.</p>"
      : `<table><thead><tr><th>Fase</th><th>Descrição</th><th>Qtd</th><th>Un</th><th>Custo Unit.</th><th>Total</th></tr></thead><tbody>
          ${quants.map((q) => `<tr>
            <td style="font-size:11px;color:#6b7280">${q.fase || "—"}</td>
            <td>${q.descricao || "—"}</td>
            <td>${Number(q.quantidade).toFixed(2)}</td>
            <td>${q.unidade || "—"}</td>
            <td>${fmtR(q.custo_unitario)}</td>
            <td style="font-weight:700">${fmtR(Number(q.quantidade) * Number(q.custo_unitario))}</td>
          </tr>`).join("")}
          <tr style="background:#f9fafb">
            <td colspan="5" style="font-weight:700;text-align:right;padding-right:12px">TOTAL MATERIAIS</td>
            <td style="font-weight:900;color:#981915">${fmtR(totalQuant)}</td>
          </tr>
        </tbody></table>`;

    // ── Diário ────────────────────────────────────────────────────────────────
    const diarioHtml = diarioObra.length === 0
      ? "<p style='color:#9ca3af;font-size:13px;padding:12px 0'>Nenhum registro no diário.</p>"
      : diarioObra.map((r) => `
          <div style="padding:10px 0;border-bottom:1px solid #e5e7eb">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">${r.data || "—"} · ${r.clima || ""} · ${r.turno || ""}</div>
            <div style="font-size:13px">${r.atividades || ""}</div>
            ${r.ocorrencias ? `<div style="background:#fff5f5;border-left:3px solid #981915;padding:6px 12px;margin-top:6px;font-size:12px;color:#555">⚠ ${r.ocorrencias}</div>` : ""}
          </div>`).join("");

    // ── Arquivos ──────────────────────────────────────────────────────────────
    const arqHtml = arqs.length === 0
      ? "<p style='color:#9ca3af;font-size:13px;padding:12px 0'>Nenhum arquivo.</p>"
      : arqs.map((a) => `<div style="font-size:12px;padding:5px 0;border-bottom:1px solid #e5e7eb">${a.nome} <span style="color:#9ca3af">· ${a.categoria} · ${a.tamanho}</span></div>`).join("");

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
    <title>Dossiê — ${obra.nome}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;background:#fff}
      .page{padding:40px;max-width:960px;margin:0 auto}
      h2{font-size:13px;font-weight:800;letter-spacing:1.5px;color:#981915;margin:32px 0 14px;text-transform:uppercase;border-bottom:2px solid #981915;padding-bottom:8px;display:flex;align-items:center;gap:8px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px}
      th{text-align:left;padding:9px 10px;background:#f3f4f6;font-size:10px;letter-spacing:.8px;color:#6b7280;font-weight:700}
      td{padding:9px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top}
      .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:8px}
      .capa{background:linear-gradient(135deg,#0d1117 0%,#1a0505 100%);color:#fff;padding:48px 40px;border-radius:0}
      .badge{display:inline-block;border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700}
      @media print{
        body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .page{padding:20px}
        h2{margin:20px 0 10px}
        .no-break{page-break-inside:avoid}
      }
    </style></head><body>

    <!-- CAPA -->
    <div class="capa">
      <div style="font-size:10px;letter-spacing:3px;color:#981915;margin-bottom:16px;font-weight:700">STICKFRAME · DOSSIÊ DE OBRA</div>
      <div style="font-size:32px;font-weight:900;line-height:1.1;margin-bottom:12px">${obra.nome}</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:32px">
        Cliente: <strong style="color:#fff">${obra.cliente || "—"}</strong>
        &nbsp;·&nbsp; Status: <strong style="color:#fff">${obra.status}</strong>
        ${obra.prazo_fim ? `&nbsp;·&nbsp; Entrega: <strong style="color:#fff">${new Date(obra.prazo_fim + "T00:00").toLocaleDateString("pt-BR")}</strong>` : ""}
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        ${[
          ["PROGRESSO", `${progresso}%`, progresso >= 80 ? "#2e9e5b" : "#981915"],
          ["CONTRATO", fmtR(obra.contrato), "#fff"],
          ["MEDIÇÕES", String(meds.length), "#fff"],
          ["VISTORIAS", String(vists.length), "#fff"],
        ].map(([l, v, c]) => `<div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:14px 16px">
          <div style="font-size:9px;color:rgba(255,255,255,0.45);letter-spacing:1.5px;margin-bottom:6px">${l}</div>
          <div style="font-size:22px;font-weight:900;color:${c}">${v}</div>
        </div>`).join("")}
      </div>
      <div style="margin-top:20px;font-size:11px;color:rgba(255,255,255,0.3)">Gerado em ${hoje} · Stick Frame Sistemas Construtivos · Santo André/SP</div>
    </div>

    <div class="page">

      <!-- RESUMO EXECUTIVO -->
      <h2>📊 Resumo Executivo</h2>
      <div class="kpi-grid">
        ${kpi("VALOR DO CONTRATO", fmtR(obra.contrato))}
        ${kpi("RECEITAS", fmtR(receitas), "#2e9e5b")}
        ${kpi("DESPESAS", fmtR(despesas), "#c0392b")}
        ${kpi("RESULTADO", fmtR(resultado), resultado >= 0 ? "#2e9e5b" : "#c0392b")}
      </div>
      <div style="margin-top:10px">
        <div style="font-size:11px;color:#6b7280;margin-bottom:4px">Progresso físico — ${progresso}%</div>
        ${barraProgresso(progresso)}
      </div>

      <!-- FASES -->
      <h2>🏗 Fases da Obra</h2>
      ${fasesHtml}
      <div style="font-size:12px;color:#6b7280;margin-top:6px">Fase atual: <strong style="color:#981915">${obra.fase || FASES[0]}</strong></div>

      <!-- VISTORIAS -->
      <h2>🔍 Vistorias & FVS (${vists.length})</h2>
      ${vistsHtml}

      <!-- MEDIÇÕES -->
      <h2>📐 Medições (${meds.length})</h2>
      ${medsHtml}

      <!-- QUANTITATIVOS -->
      <h2>📋 Quantitativos de Materiais (${quants.length} itens)</h2>
      ${quantsHtml}

      <!-- FINANCEIRO -->
      <h2>💰 Lançamentos Financeiros (${fin.length})</h2>
      ${finHtml}

      <!-- DIÁRIO -->
      <h2>📓 Diário de Obra (${diarioObra.length} registros)</h2>
      ${diarioHtml}

      <!-- ARQUIVOS -->
      <h2>📁 Documentos & Arquivos (${arqs.length})</h2>
      ${arqHtml}

      <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
        Stick Frame Sistemas Construtivos · Santo André/SP · Documento gerado em ${hoje}
      </div>
    </div>
    </body></html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  }

  function handleFiles(files) {
    const lista = Array.from(files);
    if (!lista.length) return;
    setUploadMeta({ files: lista, disciplina: "Outro", status_doc: "Ativo" });
  }

  async function confirmarUpload() {
    if (!uploadMeta) return;
    const { files, disciplina, status_doc, revisao = "Rev. 01" } = uploadMeta;
    const novos = files.map((f) => ({
      file:       f,
      nome:       f.name,
      tipo:       f.type.startsWith("image/") ? "imagem" : f.name.endsWith(".pdf") ? "pdf" : "outro",
      tamanho:    (f.size / 1024 / 1024).toFixed(2) + " MB",
      data:       new Date().toLocaleDateString("pt-BR"),
      categoria:  f.type.startsWith("image/") ? "Foto" : f.name.endsWith(".pdf") ? "Documento" : "Outro",
      fase:       obra?.fase || null,
      disciplina,
      status_doc,
      revisao,
    }));
    setUploadMeta(null);
    try {
      await addArquivos(obraId, novos);
      mostrarToast(`✅ ${novos.length} arquivo(s) enviado(s)!`);
    } catch (e) {
      mostrarToast("❌ Erro ao enviar arquivo. Tente novamente.");
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
        }}>
          {toast}
        </div>
      )}

      {/* Modal metadados de upload */}
      {uploadMeta && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 400 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Classificar arquivos</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
              {uploadMeta.files.length} arquivo(s) · Fase atual: <strong>{obra?.fase}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>DISCIPLINA</div>
                <Select
                  value={uploadMeta.disciplina}
                  onChange={(v) => setUploadMeta((m) => ({ ...m, disciplina: v }))}
                  options={DISCIPLINAS.map((d) => ({ value: d, label: d }))}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>STATUS DO DOCUMENTO</div>
                <Select
                  value={uploadMeta.status_doc}
                  onChange={(v) => setUploadMeta((m) => ({ ...m, status_doc: v }))}
                  options={STATUS_DOC.map((s) => ({ value: s, label: s }))}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>NÚMERO DE REVISÃO</div>
                <Select
                  value={uploadMeta.revisao || "Rev. 01"}
                  onChange={(v) => setUploadMeta((m) => ({ ...m, revisao: v }))}
                  options={["Rev. 00","Rev. 01","Rev. 02","Rev. 03","Rev. 04","Rev. 05","Rev. A","Rev. B","Rev. C"].map((v) => ({ value: v, label: v }))}
                />
                <div style={{ fontSize: 11, color: C.warning, marginTop: 5 }}>⚡ Ao enviar, revisões anteriores desta disciplina serão marcadas como Desatualizado.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setUploadMeta(null)} style={{ padding: "9px 18px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={confirmarUpload} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Enviar arquivos</button>
            </div>
          </div>
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
            <div style={{ fontSize: 22, marginBottom: 8 }}><Trash2 size={13} /></div>
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
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportarObrasExcel(obras)} style={{
            padding: "8px 14px", background: "#2e9e5b22",
            border: "1px solid #2e9e5b44", borderRadius: 8,
            color: "#2e9e5b", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}><BarChart2 size={13} /> Exportar Excel</button>
          <Btn onClick={abrirNova}>+ Nova obra</Btn>
        </div>
      </div>

      {/* Dashboard de métricas */}
      {obras.length > 0 && (() => {
        const fmtC = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        const ativas    = obras.filter((o) => o.status === "Em andamento");
        const concluidas = obras.filter((o) => o.status === "Concluída");
        const valorTotal = obras.filter((o) => o.status !== "Concluída").reduce((s, o) => s + (Number(o.contrato) || 0), 0);
        const progMedio = ativas.length > 0 ? Math.round(ativas.reduce((s, o) => s + (o.progresso || 0), 0) / ativas.length) : 0;
        const totalDespesas = obras.reduce((s, o) => {
          const lans = financeiro[o.id]?.lancamentos || [];
          return s + lans.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
        }, 0);
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Em andamento", value: ativas.length, sub: `${concluidas.length} concluída(s)`, color: "#2e9e5b" },
              { label: "Carteira ativa", value: fmtC(valorTotal), sub: "valor dos contratos ativos", color: C.red },
              { label: "Progresso médio", value: `${progMedio}%`, sub: "obras em andamento", color: "#4a9eff" },
              { label: "Custo lançado", value: fmtC(totalDespesas), sub: "despesas registradas", color: "#b97a00" },
            ].map((m) => (
              <div key={m.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${m.color}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Painel de Atrasos */}
      {(() => {
        const hojeStr = new Date().toISOString().split("T")[0];
        const seteDias = new Date();
        seteDias.setDate(seteDias.getDate() + 7);
        const seteDiasStr = seteDias.toISOString().split("T")[0];

        const atrasadas = obras.filter(o => o.prazo_fim && o.prazo_fim < hojeStr && o.status !== "Concluída" && o.status !== "Pausada");
        const emRisco = obras.filter(o => o.prazo_fim && o.prazo_fim >= hojeStr && o.prazo_fim <= seteDiasStr && o.status !== "Concluída" && o.status !== "Pausada");

        if (atrasadas.length === 0 && emRisco.length === 0) return null;

        return (
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            {atrasadas.length > 0 && (
              <div style={{ flex: 1, background: C.danger + "18", border: `1px solid ${C.danger}44`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.danger, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}><AlertTriangle size={14} /></span> OBRAS ATRASADAS ({atrasadas.length})
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {atrasadas.map(o => (
                    <div key={o.id} onClick={() => setObraId(o.id)} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: C.surface, border: `1px solid ${C.border}` }}>
                      <span style={{ fontWeight: 600 }}>{o.nome.split("—")[0].trim()}</span>
                      <span style={{ color: C.danger, fontWeight: 700 }}>Prazo: {new Date(o.prazo_fim + "T00:00").toLocaleDateString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    const empresa = useAppStore.getState().empresa;
                    const emailDest = empresa?.email || "";
                    if (!emailDest) { mostrarToast("Configure o e-mail da empresa nas configurações.", true); return; }
                    for (const o of atrasadas) {
                      const diasAtraso = Math.ceil((new Date() - new Date(o.prazo_fim + "T00:00")) / 86400000);
                      await emailAlertaObraAtrasada({ nomeObra: o.nome, prazoFim: o.prazo_fim, diasAtraso, email: o.email_cliente || emailDest });
                    }
                    mostrarToast(`📧 ${atrasadas.length} alerta(s) enviado(s)`);
                  }}
                  style={{ marginTop: 10, width: "100%", padding: "7px 0", background: C.danger + "22", border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.danger, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  📧 Enviar alertas
                </button>
              </div>
            )}
            {emRisco.length > 0 && (
              <div style={{ flex: 1, background: "#b97a0018", border: `1px solid #b97a0044`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#b97a00", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⏱️</span> CRONOGRAMA EM RISCO ({emRisco.length})
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {emRisco.map(o => (
                    <div key={o.id} onClick={() => setObraId(o.id)} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: C.surface, border: `1px solid ${C.border}` }}>
                      <span style={{ fontWeight: 600 }}>{o.nome.split("—")[0].trim()}</span>
                      <span style={{ color: "#b97a00", fontWeight: 700 }}>Prazo: {new Date(o.prazo_fim + "T00:00").toLocaleDateString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
                  {[["fases", "📋 Fases"], ["financeiro", "💰 Financeiro"], ["fluxo", "📈 Fluxo"], ["cronograma", "📅 Cronograma"], ["diario", "📓 Diário"], ["fotos", "📷 Fotos"], ["arquivos", "📁 Arquivos"], ["rastreio", "🏷️ Rastreio"], ["historico", "🕑 Histórico"], ...(obra.status === "Concluída" ? [["garantia", "🛠️ Garantia"]] : []), ...(perfil === "diretor" ? [["membros", "👥 Membros"]] : [])].map(([k, l]) => (
                    <button key={k} onClick={() => {
                      if (k === "diario" && userId) {
                        const pendentes = arqObra.filter((a) => a.disciplina && a.status_doc !== "Desatualizado" && !(a.cientes_uids || []).includes(userId));
                        if (pendentes.length > 0) { setGedTravaModal(true); return; }
                      }
                      setAbaAtiva(k);
                    }} style={{
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

                {/* ABA FINANCEIRO */}
                {abaAtiva === "financeiro" && (() => {
                  const fmtC = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                  const lans = financeiro[obraId]?.lancamentos || [];
                  const meds = medicoes[obraId] || [];
                  const contrato = Number(obra.contrato) || 0;
                  const receitas = lans.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
                  const despesas = lans.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
                  const medAprov = meds.filter((m) => m.status === "Aprovada").reduce((a, m) => a + (m.valor || 0), 0);
                  const saldo = receitas - despesas;
                  const margem = contrato > 0 ? ((contrato - despesas) / contrato) * 100 : null;
                  const executado = contrato > 0 ? (despesas / contrato) * 100 : 0;
                  return (
                    <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                      {/* KPIs */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 24 }}>
                        {[
                          { label: "Valor contratado", value: fmtC(contrato), color: C.text },
                          { label: "Receitas lançadas", value: fmtC(receitas), color: "#2e9e5b" },
                          { label: "Despesas lançadas", value: fmtC(despesas), color: C.danger },
                          { label: "Saldo", value: fmtC(saldo), color: saldo >= 0 ? "#2e9e5b" : C.danger },
                          ...(margem !== null ? [{ label: "Margem estimada", value: `${margem.toFixed(1)}%`, color: margem > 20 ? "#2e9e5b" : margem > 0 ? "#b97a00" : C.danger }] : []),
                          ...(medAprov > 0 ? [{ label: "Medições aprovadas", value: fmtC(medAprov), color: "#4a9eff" }] : []),
                        ].map((k) => (
                          <div key={k.label} style={{ background: C.darker, borderRadius: 8, padding: "12px 14px", borderTop: `3px solid ${k.color}` }}>
                            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: k.color }}>{k.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Retenção de garantia */}
                      {obra.retencao_pct > 0 && contrato > 0 && (() => {
                        const retencao = contrato * (Number(obra.retencao_pct) / 100);
                        const retLiberada = obra.status === "Concluída";
                        return (
                          <div style={{ background: retLiberada ? "#2e9e5b11" : "#b97a0011", border: `1px solid ${retLiberada ? "#2e9e5b44" : "#b97a0044"}`, borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: retLiberada ? "#2e9e5b" : "#b97a00", letterSpacing: 1, marginBottom: 3 }}>
                                  {retLiberada ? "✓ RETENÇÃO LIBERADA" : "🔒 RETENÇÃO DE GARANTIA"}
                                </div>
                                <div style={{ fontSize: 12, color: C.muted }}>{obra.retencao_pct}% do contrato · {retLiberada ? "Obra concluída" : "Liberado na entrega"}</div>
                              </div>
                              <div style={{ fontSize: 20, fontWeight: 900, color: retLiberada ? "#2e9e5b" : "#b97a00" }}>{fmtC(retencao)}</div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Barra de execução orçamentária */}
                      {contrato > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 6 }}>
                            <span>Execução orçamentária</span>
                            <span style={{ fontWeight: 700, color: executado > 100 ? C.danger : C.text }}>{executado.toFixed(1)}% do contrato</span>
                          </div>
                          <div style={{ height: 10, background: C.dark, borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ height: 10, width: `${Math.min(executado, 100)}%`, background: executado > 90 ? C.danger : executado > 70 ? "#b97a00" : "#2e9e5b", borderRadius: 6, transition: "width .5s" }} />
                          </div>
                        </div>
                      )}

                      {/* Lista de lançamentos */}
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                        Lançamentos da obra ({lans.length})
                      </div>
                      {lans.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>
                          Nenhum lançamento financeiro registrado para esta obra.<br />
                          <span style={{ fontSize: 11 }}>Acesse o módulo Financeiro para lançar receitas e despesas.</span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {[...lans].sort((a, b) => (b.data || "").localeCompare(a.data || "")).map((l) => (
                            <div key={l.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 10, alignItems: "center", padding: "9px 12px", background: C.darker, borderRadius: 8, borderLeft: `3px solid ${l.tipo === "receita" ? "#2e9e5b" : C.danger}` }}>
                              <span style={{ fontSize: 18 }}>{l.tipo === "receita" ? "📥" : "📤"}</span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{l.descricao || "—"}</div>
                                <div style={{ fontSize: 11, color: C.muted }}>
                                  {l.categoria || l.tipo} · {l.data ? new Date(l.data + "T00:00").toLocaleDateString("pt-BR") : "—"}
                                  {l.data_vencimento && (
                                    <span style={{ marginLeft: 6, color: new Date(l.data_vencimento + "T00:00") < new Date() && l.status !== "Pago" && l.status !== "Recebido" ? C.danger : C.muted }}>
                                      · venc. {new Date(l.data_vencimento + "T00:00").toLocaleDateString("pt-BR")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: l.tipo === "receita" ? "#2e9e5b" : C.danger }}>
                                {l.tipo === "receita" ? "+" : "−"}{fmtC(l.valor)}
                              </span>
                              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: l.status === "Pago" || l.status === "Recebido" ? "#2e9e5b22" : "#b97a0022", color: l.status === "Pago" || l.status === "Recebido" ? "#2e9e5b" : "#b97a00" }}>
                                {l.status || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    {/* Aditivos de contrato */}
                      <div style={{ marginTop: 24 }}>
                        <ChangeOrders obraId={obraId} />
                      </div>
                    </div>
                  );
                })()}

                {/* ABA FLUXO */}
                {abaAtiva === "fluxo" && (() => {
                  const fmtC = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                  const lans = financeiro[obraId]?.lancamentos || [];

                  // Group by YYYY-MM
                  const byMonth = {};
                  lans.forEach((l) => {
                    const key = (l.data || "").slice(0, 7);
                    if (!key) return;
                    if (!byMonth[key]) byMonth[key] = { rec: 0, desp: 0 };
                    if (l.tipo === "receita") byMonth[key].rec += l.valor || 0;
                    else byMonth[key].desp += l.valor || 0;
                  });

                  const meses = Object.keys(byMonth).sort().slice(-12);
                  let saldoAcc = 0;
                  const rows = meses.map((m) => {
                    const { rec, desp } = byMonth[m];
                    saldoAcc += rec - desp;
                    const [ano, mes] = m.split("-");
                    const label = `${["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][Number(mes)-1]}/${ano.slice(2)}`;
                    return { key: m, label, rec, desp, saldo: saldoAcc };
                  });

                  const maxVal = Math.max(...rows.map((r) => Math.max(r.rec, r.desp)), 1);
                  const chartH = 140;
                  const barW = rows.length > 0 ? Math.floor(480 / rows.length / 2) - 2 : 20;

                  return (
                    <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}><TrendingUp size={13} /> Fluxo de Caixa Mensal</div>

                      {rows.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>Nenhum lançamento registrado.</div>
                      ) : (
                        <>
                          {/* SVG bar chart */}
                          <div style={{ overflowX: "auto", marginBottom: 20 }}>
                            <svg viewBox={`0 0 ${Math.max(rows.length * (barW * 2 + 6) + 20, 400)} ${chartH + 30}`}
                              style={{ width: "100%", minWidth: 360, height: chartH + 30 }}>
                              {rows.map((r, i) => {
                                const x = i * (barW * 2 + 6) + 10;
                                const recH = (r.rec / maxVal) * (chartH - 20);
                                const despH = (r.desp / maxVal) * (chartH - 20);
                                return (
                                  <g key={r.key}>
                                    <rect x={x} y={chartH - recH} width={barW} height={recH} fill="#2e9e5b" rx="2" opacity="0.85" />
                                    <rect x={x + barW + 2} y={chartH - despH} width={barW} height={despH} fill={C.red} rx="2" opacity="0.85" />
                                    <text x={x + barW} y={chartH + 14} textAnchor="middle" fontSize="8" fill={C.muted}>{r.label}</text>
                                  </g>
                                );
                              })}
                              <line x1="8" y1={chartH} x2="100%" y2={chartH} stroke={C.border} strokeWidth="1" />
                            </svg>
                          </div>
                          <div style={{ display: "flex", gap: 16, fontSize: 11, marginBottom: 16 }}>
                            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#2e9e5b", borderRadius: 2, marginRight: 4 }} />Receita</span>
                            <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.red, borderRadius: 2, marginRight: 4 }} />Despesa</span>
                          </div>

                          {/* Table */}
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                              <thead>
                                <tr style={{ background: C.darker }}>
                                  {["Mês", "Receitas", "Despesas", "Resultado", "Saldo Acum."].map((h) => (
                                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Mês" ? "left" : "right", fontWeight: 700, fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((r, i) => {
                                  const res = r.rec - r.desp;
                                  return (
                                    <tr key={r.key} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? C.darker : "transparent" }}>
                                      <td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.label}</td>
                                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#2e9e5b" }}>{fmtC(r.rec)}</td>
                                      <td style={{ padding: "8px 12px", textAlign: "right", color: C.danger }}>{fmtC(r.desp)}</td>
                                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: res >= 0 ? "#2e9e5b" : C.danger }}>{fmtC(res)}</td>
                                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: r.saldo >= 0 ? "#2e9e5b" : C.danger }}>{fmtC(r.saldo)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* ABA CRONOGRAMA */}
                {abaAtiva === "cronograma" && (() => {
                  const inicio = obra.prazo_inicio ? new Date(obra.prazo_inicio) : new Date();
                  const fim    = obra.prazo_fim    ? new Date(obra.prazo_fim)    : new Date(inicio.getTime() + 180 * 86400000);
                  const totalDias = Math.ceil((fim - inicio) / 86400000) || 1;
                  const diasPorFase = Math.floor(totalDias / FASES.length) || 1;
                  const faseIdx = FASES.indexOf(obra.fase);
                  const hoje = new Date();

                  return (
                    <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 16 }}>
                        {obra.prazo_inicio ? new Date(obra.prazo_inicio + "T00:00").toLocaleDateString("pt-BR") : "—"} → {obra.prazo_fim ? new Date(obra.prazo_fim + "T00:00").toLocaleDateString("pt-BR") : "—"} · {totalDias} dias
                      </div>

                      {FASES.map((fase, i) => {
                        const faseInicio = new Date(inicio.getTime() + i * diasPorFase * 86400000);
                        const faseFim    = new Date(inicio.getTime() + (i + 1) * diasPorFase * 86400000);
                        const done = i < faseIdx;
                        const curr = i === faseIdx;
                        const pctStart = (i * diasPorFase / totalDias) * 100;
                        const pctWidth = (diasPorFase / totalDias) * 100;
                        let phasePct = done ? 100 : curr ? Math.min(100, Math.max(0, Math.round(((hoje - faseInicio) / (faseFim - faseInicio)) * 100))) : 0;

                        return (
                          <div key={fase} style={{ marginBottom: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                              <span style={{ color: done ? C.success : curr ? C.text : C.muted, fontWeight: curr ? 700 : 400 }}>
                                {done ? "✓ " : curr ? "▶ " : ""}{fase}
                              </span>
                              <span style={{ color: C.muted, fontSize: 10 }}>
                                {faseInicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} – {faseFim.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                              </span>
                            </div>
                            <div style={{ height: 20, background: C.dark, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                              <div style={{
                                position: "absolute", left: `${pctStart}%`, width: `${pctWidth}%`, height: "100%",
                                background: done ? "#2e9e5b33" : curr ? "#98191533" : C.darker,
                                border: `1px solid ${done ? "#2e9e5b" : curr ? C.red : C.border}`, borderRadius: 4,
                              }}>
                                <div style={{ height: "100%", width: `${phasePct}%`, background: done ? "#2e9e5b" : C.red, borderRadius: "4px 0 0 4px" }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {obra.prazo_inicio && (() => {
                        const pctHoje = Math.min(100, Math.max(0, ((hoje - inicio) / (fim - inicio)) * 100));
                        return (
                          <div style={{ position: "relative", height: 20, marginTop: 8 }}>
                            <div style={{ position: "absolute", left: `${pctHoje}%`, top: 0, bottom: 0, width: 2, background: "#ffd700" }} />
                            <div style={{ position: "absolute", left: `${pctHoje}%`, top: 0, fontSize: 9, color: "#ffd700", whiteSpace: "nowrap", transform: "translateX(-50%)" }}>
                              ◆ Hoje
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* ABA FOTOS */}
                {abaAtiva === "fotos" && (
                  <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                    <label style={{
                      display: "block", border: `2px dashed ${dragOver ? C.red : C.border}`,
                      borderRadius: 10, padding: "18px 20px", textAlign: "center",
                      cursor: "pointer", marginBottom: 18, background: dragOver ? C.red + "0a" : C.darker, transition: "all .2s",
                    }}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    >
                      <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
                      <div style={{ fontSize: 11, color: C.muted }}>📷 Arraste fotos ou clique para enviar — as fotos ficam vinculadas à fase atual ({obra.fase})</div>
                    </label>

                    {(() => {
                      const todasFotos = arqObra.filter((a) => a.tipo === "imagem");
                      if (todasFotos.length === 0) return (
                        <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>Nenhuma foto enviada ainda.</div>
                      );
                      const grupos = [
                        ...FASES.map((fase) => ({ fase, fotos: todasFotos.filter((f) => f.fase === fase) })).filter((g) => g.fotos.length > 0),
                        { fase: null, fotos: todasFotos.filter((f) => !f.fase) },
                      ].filter((g) => g.fotos.length > 0);
                      return grupos.map(({ fase, fotos }) => (
                        <div key={fase || "sem-fase"} style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 10, textTransform: "uppercase" }}>
                            {fase || "Sem fase"} · {fotos.length} foto(s)
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                            {fotos.map((f) => (
                              <div key={f.id} onClick={() => setFotoAmpliada(f)} style={{
                                cursor: "pointer", borderRadius: 8, overflow: "hidden",
                                aspectRatio: "4/3", background: C.darker, position: "relative",
                              }}>
                                {f.url
                                  ? <img src={f.url} alt={f.nome} width="320" height="240" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 28 }}>🖼️</div>
                                }
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
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

                    {/* Filtros por categoria, disciplina, status_doc e fase */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                      {[
                        { label: "Categoria", opts: CATS, val: catFiltro, set: setCatFiltro },
                        { label: "Disciplina", opts: DISCIPLINAS, val: discFiltro, set: setDiscFiltro },
                        { label: "Status", opts: STATUS_DOC, val: statusDocFiltro, set: setStatusDocFiltro },
                        { label: "Fase", opts: FASES, val: faseFiltro, set: setFaseFiltro },
                      ].map(({ label, opts, val, set }) => (
                        <div key={label} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .5, minWidth: 62 }}>{label.toUpperCase()}</span>
                          {["Todos", ...opts].map((o) => (
                            <button key={o} onClick={() => set(o)} style={{
                              padding: "3px 10px", borderRadius: 5, fontSize: 11,
                              fontWeight: val === o ? 700 : 400,
                              border: `1px solid ${val === o ? C.red : C.border}`,
                              background: val === o ? C.red + "18" : "transparent",
                              color: val === o ? C.text : C.muted,
                              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                            }}>{o}</button>
                          ))}
                        </div>
                      ))}
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{arqFiltro.length} arquivo(s) encontrado(s)</div>
                    </div>

                    {arqFiltro.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 13 }}>
                        {arqObra.length === 0 ? "Nenhum arquivo enviado ainda." : "Nenhum arquivo nesta categoria."}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {arqFiltro.map((a) => {
                          const desatualizado = a.status_doc === "Desatualizado";
                          const jaCiente = (a.cientes_uids || []).includes(userId);
                          const precisaCiencia = !desatualizado && a.disciplina && !jaCiente;
                          return (
                          <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: desatualizado ? "#fff8f0" : C.darker, borderRadius: 8, border: `1px solid ${desatualizado ? "#f59e0b55" : C.border}`, position: "relative", opacity: desatualizado ? 0.75 : 1 }}>
                            {desatualizado && (
                              <div style={{ position: "absolute", top: 8, right: 8, background: "#f59e0b", color: "#fff", fontSize: 9, fontWeight: 900, letterSpacing: 1.5, padding: "2px 8px", borderRadius: 4, transform: "rotate(-1deg)", textTransform: "uppercase" }}>DESATUALIZADO</div>
                            )}
                            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{ICONE_TIPO[a.tipo] || "📎"}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: desatualizado ? "line-through" : "none", color: desatualizado ? C.muted : C.text }}>{a.nome}</div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.tamanho} · {a.data}{a.revisao ? ` · ${a.revisao}` : ""}</div>
                              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                                {a.disciplina && <span style={{ background: "#4a9eff18", color: "#4a9eff", border: "1px solid #4a9eff33", borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{a.disciplina}</span>}
                                {a.fase && <span style={{ background: "#98191518", color: "#981915", border: "1px solid #98191533", borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{a.fase}</span>}
                                {a.status_doc && <span style={{ background: (STATUS_DOC_COR[a.status_doc] || C.muted) + "18", color: STATUS_DOC_COR[a.status_doc] || C.muted, border: `1px solid ${(STATUS_DOC_COR[a.status_doc] || C.muted)}33`, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{a.status_doc}</span>}
                                {jaCiente && !desatualizado && <span style={{ background: C.success + "18", color: C.success, border: `1px solid ${C.success}33`, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>✓ Ciente</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                              {precisaCiencia && (
                                <button onClick={async () => { await marcarCiente(obraId, a.id, userId); mostrarToast("✅ Ciência registrada!"); }} style={{ background: C.success + "22", border: `1px solid ${C.success}44`, borderRadius: 6, color: C.success, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 10px", fontFamily: "inherit", whiteSpace: "nowrap" }}>✓ Ciente</button>
                              )}
                              {a.url && (
                                <a href={a.url} target="_blank" rel="noreferrer" style={{ background: "#4a9eff22", border: "1px solid #4a9eff44", borderRadius: 6, color: "#4a9eff", fontSize: 11, fontWeight: 700, padding: "4px 10px", textDecoration: "none", textAlign: "center" }}>↓</a>
                              )}
                              <button onClick={() => setVersaoModal({ id: a.id, nome: a.nome })} style={{ background: "#4a9eff22", border: "1px solid #4a9eff44", borderRadius: 6, color: "#4a9eff", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 10px", fontFamily: "inherit", whiteSpace: "nowrap" }}>📋 Versões</button>
                              <button onClick={() => deleteArquivo(obraId, a.id, a.path)} style={{ background: C.danger + "22", border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.danger, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 10px", fontFamily: "inherit" }}><Trash2 size={13} /></button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {/* ABA DIÁRIO */}
                {abaAtiva === "diario" && (
                  <DiarioAba
                    obraId={obraId}
                    obra={obra}
                    diario={diario[obraId] || []}
                    addDiario={addDiario}
                  />
                )}

                {/* ABA HISTÓRICO */}
                {abaAtiva === "historico" && (
                  <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                    {histLoading ? (
                      <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>Carregando...</div>
                    ) : histObra.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>Nenhuma alteração registrada nesta obra.</div>
                    ) : histObra.map((h, i) => {
                      const ACAO_COR = { criado: "#2e9e5b", editado: "#b97a00", deletado: "#c0392b", fase: "#4a9eff" };
                      const cor = ACAO_COR[h.acao] || C.muted;
                      return (
                        <div key={h.id} style={{ display: "flex", gap: 14, paddingBottom: 16, marginBottom: 16, borderBottom: i < histObra.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: cor + "22", border: `2px solid ${cor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                            {h.acao === "criado" ? "+" : h.acao === "fase" ? "▶" : h.acao === "deletado" ? "✕" : "✎"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{h.descricao}</div>
                            <div style={{ fontSize: 11, color: C.muted, marginBottom: h.detalhes?.campos?.length ? 8 : 0 }}>
                              {h.usuario} · {h.data} às {h.hora}
                            </div>
                            {h.detalhes?.campos?.map((c, j) => (
                              <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, marginTop: 4 }}>
                                <span style={{ color: C.muted, minWidth: 80 }}>{c.campo}</span>
                                <span style={{ background: "#f5e6e6", color: "#c0392b", borderRadius: 4, padding: "1px 8px", fontFamily: "monospace", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.de}</span>
                                <span style={{ color: C.muted }}>→</span>
                                <span style={{ background: "#e6f5ec", color: "#2e9e5b", borderRadius: 4, padding: "1px 8px", fontFamily: "monospace", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.para}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* ABA RASTREIO */}
                {abaAtiva === "rastreio" && (() => {
                  const BASE = window.location.origin;
                  const montados = paineis.filter((p) => p.status === "Montado").length;
                  const progPaineis = paineis.length > 0 ? Math.round((montados / paineis.length) * 100) : 0;

                  async function addPainel() {
                    if (!painelForm.codigo.trim()) return;
                    const payload = { ...painelForm, obra_id: obraId, empresa_id: empresaId };
                    if (!payload.ifc_element_id) delete payload.ifc_element_id;
                    else payload.ifc_element_id = parseInt(payload.ifc_element_id);
                    const { data, error } = await sb.from("paineis").insert(payload).select().single();
                    if (!error) { setPaineis((p) => [...p, data]); setPainelForm({ codigo: "", descricao: "", local_instalacao: "", ifc_element_id: "" }); mostrarToast("✅ Painel adicionado!"); }
                  }
                  async function addAmbiente() {
                    if (!ambForm.nome.trim()) return;
                    const { data, error } = await sb.from("ambientes_qr").insert({ ...ambForm, obra_id: obraId, empresa_id: empresaId }).select().single();
                    if (!error) { setAmbientes((a) => [...a, data]); setAmbForm({ nome: "", andar: "" }); mostrarToast("✅ Ambiente adicionado!"); }
                  }
                  function gerarPlacaAmbiente(amb) {
                    const link = `${BASE}/ambiente/${amb.token}`;
                    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}&bgcolor=ffffff&color=981915&margin=10`;
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tag ${amb.nome}</title>
<style>@page{size:A5;margin:0}body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}
.card{width:148mm;height:105mm;border:3px solid #981915;border-radius:12px;display:flex;overflow:hidden}
.lado-esq{background:#981915;padding:16px 14px;display:flex;flex-direction:column;justify-content:space-between;width:100px;flex-shrink:0}
.lado-dir{padding:16px 18px;flex:1;display:flex;flex-direction:column;justify-content:center}
.titulo{color:#fff;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:.8}
.amb-nome{color:#fff;font-size:18px;font-weight:900;line-height:1.2;margin-top:6px}
.andar{color:rgba(255,255,255,.7);font-size:11px;margin-top:4px}
.obra{color:rgba(255,255,255,.5);font-size:9px;margin-top:auto}
.instrucao{font-size:12px;font-weight:700;color:#374151;margin-bottom:8px}
.sub{font-size:10px;color:#6b7280;margin-top:8px}
</style></head><body>
<div class="card">
<div class="lado-esq"><div><div class="titulo">Stick Frame</div><div class="amb-nome">${amb.nome}</div>${amb.andar ? `<div class="andar">${amb.andar}</div>` : ""}</div><div class="obra">${obra.nome}</div></div>
<div class="lado-dir"><div class="instrucao">🚨 Encontrou um problema?</div><img src="${qrSrc}" width="130" height="130"/><div class="sub">Escaneie para reportar uma ocorrência neste ambiente</div></div>
</div></body></html>`;
                    printHtml(html, `tag-${amb.nome.replace(/\s+/g,"-").toLowerCase()}`);
                  }
                  function gerarEtiquetaPainel(p) {
                    const link = `${BASE}/painel/${p.token}`;
                    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}&bgcolor=ffffff&color=981915&margin=8`;
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Etiqueta ${p.codigo}</title>
<style>@page{size:100mm 70mm;margin:0}body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}
.card{width:96mm;height:66mm;border:2px solid #981915;border-radius:8px;display:flex;align-items:stretch;overflow:hidden}
.lado-esq{background:#981915;padding:10px;display:flex;flex-direction:column;justify-content:center;align-items:center;width:72px;flex-shrink:0}
.codigo{color:#fff;font-size:14px;font-weight:900;text-align:center;word-break:break-all}
.label{color:rgba(255,255,255,.7);font-size:7px;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
.lado-dir{padding:10px 12px;flex:1;display:flex;flex-direction:column;justify-content:center}
.desc{font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:4px}
.local{font-size:9px;color:#6b7280;margin-bottom:8px}
.sub{font-size:8px;color:#9ca3af;margin-top:6px}
</style></head><body>
<div class="card">
<div class="lado-esq"><div class="label">Painel</div><div class="codigo">${p.codigo}</div></div>
<div class="lado-dir"><div class="desc">${p.descricao || p.codigo}</div>${p.local_instalacao ? `<div class="local">📍 ${p.local_instalacao}</div>` : ""}<img src="${qrSrc}" width="100" height="100"/><div class="sub">Escaneie para confirmar montagem</div></div>
</div></body></html>`;
                    printHtml(html, `etiqueta-${p.codigo}`);
                  }

                  return (
                    <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                      {/* Sub-tabs */}
                      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
                        {[["paineis","🏷️ Painéis"],["ambientes","🚪 Ambientes"]].map(([k, l]) => (
                          <button key={k} onClick={() => setRastreioTab(k)} style={{ padding: "8px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: rastreioTab === k ? 700 : 400, color: rastreioTab === k ? C.red : C.muted, borderBottom: `2px solid ${rastreioTab === k ? C.red : "transparent"}` }}>{l}</button>
                        ))}
                      </div>

                      {rastreioTab === "paineis" && (
                        <>
                          {/* KPIs painéis */}
                          {paineis.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                              {[["Total", paineis.length, C.muted],["Montados", montados, C.success],["Progresso", `${progPaineis}%`, C.red]].map(([l,v,cor]) => (
                                <div key={l} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}`, borderTop: `3px solid ${cor}` }}>
                                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                                  <div style={{ fontSize: 20, fontWeight: 900, color: cor }}>{v}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Formulário add */}
                          <div style={{ background: C.darker, borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                            <div style={{ flex: "1 1 80px", minWidth: 80 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>CÓDIGO *</div>
                              <input value={painelForm.codigo} onChange={(e) => setPainelForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="P-01" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ flex: "2 1 140px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>DESCRIÇÃO</div>
                              <input value={painelForm.descricao} onChange={(e) => setPainelForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Parede Norte" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ flex: "2 1 140px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>LOCAL</div>
                              <input value={painelForm.local_instalacao} onChange={(e) => setPainelForm((f) => ({ ...f, local_instalacao: e.target.value }))} placeholder="Eixo A-B / Pavto 1" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ flex: "1 1 90px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>IFC ID</div>
                              <input value={painelForm.ifc_element_id} onChange={(e) => setPainelForm((f) => ({ ...f, ifc_element_id: e.target.value }))} placeholder="Ex: 12345" type="number" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <button onClick={addPainel} style={{ padding: "8px 16px", background: C.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>+ Adicionar</button>
                          </div>
                          {/* Lista */}
                          {paineis.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>Nenhum painel cadastrado.</div>
                          ) : paineis.map((p) => (
                            <div key={p.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderLeft: `4px solid ${p.status === "Montado" ? C.success : C.warning}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.codigo}</div>
                                {p.descricao && <div style={{ fontSize: 12, color: C.muted }}>{p.descricao}</div>}
                                {p.local_instalacao && <div style={{ fontSize: 11, color: C.muted }}>📍 {p.local_instalacao}</div>}
                                {p.ifc_element_id && <div style={{ fontSize: 11, color: "#4a9eff" }}>🧊 IFC #{p.ifc_element_id}</div>}
                                {p.montado_por && <div style={{ fontSize: 11, color: C.success, marginTop: 3 }}>✓ {p.montado_por} · {p.montado_em ? new Date(p.montado_em).toLocaleDateString("pt-BR") : ""}</div>}
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: (p.status === "Montado" ? C.success : C.warning) + "20", color: p.status === "Montado" ? C.success : C.warning, flexShrink: 0 }}>{p.status}</span>
                              <button onClick={() => gerarEtiquetaPainel(p)} title="Gerar etiqueta" style={{ padding: "5px 10px", background: "#7c3aed22", border: "1px solid #7c3aed44", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#7c3aed", fontWeight: 700, flexShrink: 0 }}>🖨️</button>
                            </div>
                          ))}
                        </>
                      )}

                      {rastreioTab === "ambientes" && (
                        <>
                          <div style={{ background: C.darker, borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                            <div style={{ flex: "2 1 160px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>AMBIENTE *</div>
                              <input value={ambForm.nome} onChange={(e) => setAmbForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Suíte Master" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ flex: "1 1 100px" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>ANDAR / BLOCO</div>
                              <input value={ambForm.andar} onChange={(e) => setAmbForm((f) => ({ ...f, andar: e.target.value }))} placeholder="1º andar" style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <button onClick={addAmbiente} style={{ padding: "8px 16px", background: C.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>+ Adicionar</button>
                          </div>
                          {ambientes.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>Nenhum ambiente cadastrado.</div>
                          ) : ambientes.map((a) => (
                            <div key={a.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontSize: 22 }}>🚪</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.nome}</div>
                                {a.andar && <div style={{ fontSize: 12, color: C.muted }}>{a.andar}</div>}
                              </div>
                              <button onClick={() => { navigator.clipboard?.writeText(`${BASE}/ambiente/${a.token}`); mostrarToast("📋 Link copiado!"); }} style={{ padding: "5px 10px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>📋</button>
                              <button onClick={() => gerarPlacaAmbiente(a)} style={{ padding: "5px 10px", background: "#7c3aed22", border: "1px solid #7c3aed44", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#7c3aed", fontWeight: 700 }}>🖨️</button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* ABA GARANTIA */}
                {abaAtiva === "garantia" && (() => {
                  const CATS_CHAMADO = ["Elétrica","Hidráulica","Estrutural","Acabamento / Gesso","Esquadrias","Cobertura","Outro"];
                  const PRIORIDADE_COR = { "Alta": C.danger, "Média": C.warning, "Baixa": C.success };
                  const STATUS_CHAMADO_COR = { "Aberto": "#4a9eff", "Em andamento": C.warning, "Resolvido": C.success, "Cancelado": C.muted };
                  const listaChamados = chamados[obraId] || [];
                  const abertos = listaChamados.filter((c) => c.status === "Aberto" || c.status === "Em andamento");
                  const custoTotal = listaChamados.filter((c) => c.status === "Resolvido").reduce((a, c) => a + (Number(c.custo_reparo) || 0), 0);

                  async function salvarChamado() {
                    setChamadoSaving(true);
                    try {
                      if (chamadoEd) {
                        await updateChamado(obraId, chamadoEd.id, chamadoForm);
                        mostrarToast("✅ Chamado atualizado!");
                      } else {
                        await addChamado(obraId, chamadoForm);
                        mostrarToast("✅ Chamado aberto!");
                      }
                      setChamadoModal(false); setChamadoEd(null);
                    } catch (e) { mostrarToast("❌ " + e.message); }
                    finally { setChamadoSaving(false); }
                  }

                  return (
                    <div style={{ background: C.surface, borderRadius: "0 0 12px 12px", border: `1px solid ${C.border}`, borderTop: "none", padding: 22 }}>
                      {/* KPIs */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                        {[
                          { label: "Chamados abertos", value: abertos.length, cor: abertos.length > 0 ? "#4a9eff" : C.success },
                          { label: "Total de chamados", value: listaChamados.length, cor: C.muted },
                          { label: "Custo de garantia", value: `R$ ${custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, cor: custoTotal > 0 ? C.danger : C.success },
                        ].map((kpi) => (
                          <div key={kpi.label} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}`, borderTop: `3px solid ${kpi.cor}` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{kpi.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{kpi.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{listaChamados.length} chamado{listaChamados.length !== 1 ? "s" : ""}</div>
                        <button onClick={() => { setChamadoForm({ titulo: "", descricao: "", categoria: "Outro", prioridade: "Média" }); setChamadoEd(null); setChamadoModal(true); }} style={{
                          padding: "7px 14px", background: C.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}>+ Abrir chamado</button>
                      </div>

                      {listaChamados.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>🛠️</div>
                          Nenhum chamado de garantia registrado.
                        </div>
                      ) : listaChamados.map((ch) => (
                        <div key={ch.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10, borderLeft: `4px solid ${STATUS_CHAMADO_COR[ch.status] || C.muted}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{ch.titulo}</div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 10 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: (PRIORIDADE_COR[ch.prioridade] || C.muted) + "20", color: PRIORIDADE_COR[ch.prioridade] || C.muted }}>{ch.prioridade}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: (STATUS_CHAMADO_COR[ch.status] || C.muted) + "20", color: STATUS_CHAMADO_COR[ch.status] || C.muted }}>{ch.status}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginBottom: ch.descricao ? 6 : 0 }}>{ch.categoria} · {new Date(ch.created_at).toLocaleDateString("pt-BR")}{ch.criado_pelo_cliente ? " · 👤 Cliente" : ""}</div>
                          {ch.descricao && <div style={{ fontSize: 12, color: C.graphite, lineHeight: 1.5, marginBottom: 6 }}>{ch.descricao}</div>}
                          {ch.resolucao && <div style={{ fontSize: 12, background: C.success + "12", border: `1px solid ${C.success}33`, borderRadius: 6, padding: "6px 10px", color: C.success, marginBottom: 6 }}>✓ {ch.resolucao}</div>}
                          {ch.custo_reparo > 0 && <div style={{ fontSize: 12, color: C.danger, fontWeight: 700 }}>Custo: R$ {Number(ch.custo_reparo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>}
                          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => { setChamadoForm({ titulo: ch.titulo, descricao: ch.descricao || "", categoria: ch.categoria, prioridade: ch.prioridade, status: ch.status, resolucao: ch.resolucao || "", custo_reparo: ch.custo_reparo || "", agendado_para: ch.agendado_para || "" }); setChamadoEd(ch); setChamadoModal(true); }} style={{ padding: "5px 12px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>✎ Editar</button>
                            <button onClick={async () => { if (!confirm("Excluir chamado?")) return; await deleteChamado(obraId, ch.id); mostrarToast("Chamado removido."); }} style={{ padding: "5px 12px", background: C.danger + "15", border: `1px solid ${C.danger}33`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                          </div>
                        </div>
                      ))}

                      {/* Modal chamado */}
                      {chamadoModal && (
                        <Modal title={chamadoEd ? "Editar chamado" : "🛠️ Abrir chamado de garantia"} onClose={() => { setChamadoModal(false); setChamadoEd(null); }}>
                          <div className="sf-col">
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>TÍTULO *</div>
                              <Input value={chamadoForm.titulo} onChange={(v) => setChamadoForm((f) => ({ ...f, titulo: v }))} placeholder="Ex: Trinca no gesso da sala" />
                            </div>
                            <div className="sf-grid-2">
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>CATEGORIA</div>
                                <Select value={chamadoForm.categoria} onChange={(v) => setChamadoForm((f) => ({ ...f, categoria: v }))} options={CATS_CHAMADO.map((c) => ({ value: c, label: c }))} />
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PRIORIDADE</div>
                                <Select value={chamadoForm.prioridade} onChange={(v) => setChamadoForm((f) => ({ ...f, prioridade: v }))} options={["Baixa","Média","Alta"].map((v) => ({ value: v, label: v }))} />
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>DESCRIÇÃO</div>
                              <textarea value={chamadoForm.descricao} onChange={(e) => setChamadoForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descreva o problema em detalhes..." rows={3} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            {chamadoEd && (
                              <>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>STATUS</div>
                                  <Select value={chamadoForm.status || "Aberto"} onChange={(v) => setChamadoForm((f) => ({ ...f, status: v }))} options={["Aberto","Em andamento","Resolvido","Cancelado"].map((v) => ({ value: v, label: v }))} />
                                </div>
                                <div className="sf-grid-2">
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>CUSTO DO REPARO (R$)</div>
                                    <Input value={chamadoForm.custo_reparo} onChange={(v) => setChamadoForm((f) => ({ ...f, custo_reparo: v }))} type="number" min="0" placeholder="0,00" />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>AGENDADO PARA</div>
                                    <Input value={chamadoForm.agendado_para} onChange={(v) => setChamadoForm((f) => ({ ...f, agendado_para: v }))} type="date" />
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>RESOLUÇÃO</div>
                                  <Input value={chamadoForm.resolucao} onChange={(v) => setChamadoForm((f) => ({ ...f, resolucao: v }))} placeholder="Descreva como foi resolvido" />
                                </div>
                              </>
                            )}
                            <div className="sf-actions">
                              <Btn variant="ghost" onClick={() => { setChamadoModal(false); setChamadoEd(null); }}>Cancelar</Btn>
                              <Btn disabled={!chamadoForm.titulo || chamadoSaving} onClick={salvarChamado}>{chamadoSaving ? "Salvando…" : chamadoEd ? "Salvar" : "Abrir chamado"}</Btn>
                            </div>
                          </div>
                        </Modal>
                      )}
                    </div>
                  );
                })()}

                {abaAtiva === "membros" && (
                  <div style={{ padding: "20px 0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                      Controle de Acesso por Obra
                    </div>
                    <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                      Defina quem pode ver e editar esta obra. Obras sem membros são visíveis para toda a equipe.
                    </p>
                    <ObraMembros obraId={obraId} />
                  </div>
                )}

              </div>

              {/* Coluna lateral */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Ações rápidas */}
                <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 12 }}>AÇÃO RÁPIDA</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={retornar} disabled={FASES.indexOf(obra.fase) <= 0} variant="ghost" size="sm" style={{ flex: 1 }}>← Retornar</Btn>
                    <Btn onClick={avancar} disabled={obra.fase === "Entrega"} size="sm" style={{ flex: 1 }}>
                      {obra.fase === "Entrega" ? "✓ Concluída" : "Avançar →"}
                    </Btn>
                  </div>
                  {obra.fase !== "Entrega" && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                      Próxima: {FASES[FASES.indexOf(obra.fase) + 1]}
                    </div>
                  )}
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    <Btn variant="ghost" size="sm" fullWidth onClick={abrirEditar} disabled={!podeEditar()}>✏️ Editar obra</Btn>
                    <button onClick={gerarDossie} style={{
                      width: "100%", padding: "8px 0",
                      background: "#2e9e5b22", border: "1px solid #2e9e5b44",
                      borderRadius: 6, color: "#2e9e5b", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>📄 Dossiê de Obra</button>
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
                    {/* Chat do Portal */}
                    {obra?.token_portal && (
                      <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 10 }}>💬 CHAT COM CLIENTE</div>
                        <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                          {portalMsgs.length === 0 && <div style={{ fontSize: 11, color: C.muted, textAlign: "center", padding: 8 }}>Nenhuma mensagem ainda.</div>}
                          {portalMsgs.map((m, i) => {
                            const isCliente = m.autor === "cliente";
                            return (
                              <div key={m.id || i} style={{ display: "flex", justifyContent: isCliente ? "flex-start" : "flex-end" }}>
                                <div style={{
                                  maxWidth: "85%", padding: "6px 10px", fontSize: 11, lineHeight: 1.5,
                                  borderRadius: isCliente ? "10px 10px 10px 2px" : "10px 10px 2px 10px",
                                  background: isCliente ? C.darker : C.red,
                                  color: isCliente ? C.text : "#fff",
                                  border: `1px solid ${isCliente ? C.border : C.red}`,
                                }}>
                                  {isCliente && <div style={{ fontSize: 9, fontWeight: 700, color: C.red, marginBottom: 2 }}>👤 {m.nome || "Cliente"}</div>}
                                  <div>{m.mensagem}</div>
                                  <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2, textAlign: "right" }}>
                                    {m.created_at ? new Date(m.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <textarea
                          value={portalReply}
                          onChange={(e) => setPortalReply(e.target.value)}
                          placeholder="Responder ao cliente..."
                          rows={2}
                          style={{ width: "100%", background: C.darker, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: C.text, resize: "none", outline: "none", fontFamily: "inherit" }}
                        />
                        <button
                          disabled={portalSending || !portalReply.trim()}
                          onClick={async () => {
                            if (!portalReply.trim()) return;
                            setPortalSending(true);
                            const { error } = await sb.rpc("portal_responder_mensagem", { p_obra_id: obraId, p_empresa_id: empresaId, p_mensagem: portalReply.trim() });
                            if (!error) {
                              setPortalMsgs((prev) => [...prev, { autor: "empresa", nome: "Equipe Stick Frame", mensagem: portalReply.trim(), created_at: new Date().toISOString() }]);
                              setPortalReply("");
                            } else {
                              mostrarToast("❌ Erro ao enviar: " + error.message);
                            }
                            setPortalSending(false);
                          }}
                          style={{ marginTop: 6, width: "100%", padding: "7px 0", background: portalSending || !portalReply.trim() ? C.muted : C.red, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {portalSending ? "Enviando..." : "↩ Responder"}
                        </button>
                      </div>
                    )}

                    <button onClick={() => setConfirm(true)} style={{
                      width: "100%", padding: "8px 0",
                      background: C.danger + "22", border: `1px solid ${C.danger}44`,
                      borderRadius: 6, color: C.danger, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>🗑 Deletar obra</button>
                  </div>
                </div>

                {/* Resumo */}
                <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 14 }}>RESUMO</div>
                  {[
                    ["Status",    obra.status],
                    ["Fase",      obra.fase],
                    ["Início",    obra.prazo_inicio ? new Date(obra.prazo_inicio + "T00:00").toLocaleDateString("pt-BR") : "—"],
                    ["Entrega",   obra.prazo_fim    ? new Date(obra.prazo_fim    + "T00:00").toLocaleDateString("pt-BR") : "—"],
                    ["Concluído", `${obra.progresso}%`],
                    ["Retenção",  obra.retencao_pct ? `${obra.retencao_pct}%` : "—"],
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
      {/* Modal checklist avançar fase */}
      {checklistModal && obra && (() => {
        const itens    = CHECKLIST_FASES[obra.fase] || [];
        const proxima  = FASES[FASES.indexOf(obra.fase) + 1];
        const todosMarcados = itens.every((_, i) => checklistMarcados[i]);
        return (
          <Modal onClose={() => setChecklistModal(false)}>
            <div style={{ minWidth: 360 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Checklist — {obra.fase}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
                Confirme os itens antes de avançar para <strong>{proxima}</strong>
              </div>
              {itens.map((item, i) => (
                <div key={i} onClick={() => setChecklistMarcados((p) => ({ ...p, [i]: !p[i] }))} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${checklistMarcados[i] ? "#2e9e5b" : C.border}`,
                    background: checklistMarcados[i] ? "#2e9e5b" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {checklistMarcados[i] && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: checklistMarcados[i] ? C.muted : C.text, textDecoration: checklistMarcados[i] ? "line-through" : "none" }}>
                    {item}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn variant="ghost" onClick={() => setChecklistModal(false)}>Cancelar</Btn>
                <Btn disabled={!todosMarcados} onClick={confirmarAvancar}>
                  Avançar para {proxima} →
                </Btn>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Modal QR Code check-in */}
      {qrModal && obra && (() => {
        const url = `${window.location.origin}/qr/obra/${obra.id}`;
        const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=981915&margin=10`;
        return (
          <Modal title="QR Code — Check-in de Obra" onClose={() => setQrModal(false)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text, textAlign: "center" }}>{obra.nome}</div>
              <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
                Operários escaneiam este QR para registrar presença no canteiro
              </div>
              <img src={qrSrc} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 12, border: `1px solid ${C.border}` }} />
              <div style={{
                background: C.dark, borderRadius: 8, padding: "8px 14px",
                fontSize: 11, color: C.muted, wordBreak: "break-all", textAlign: "center",
              }}>
                {url}
              </div>
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <Btn variant="ghost" fullWidth onClick={() => { navigator.clipboard.writeText(url); mostrarToast("📋 Link copiado!"); }}>
                  Copiar link
                </Btn>
                <Btn fullWidth onClick={() => window.open(url, "_blank")}>
                  Abrir página
                </Btn>
              </div>
              <button onClick={() => {
                const qrBig = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=981915&margin=16`;
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Placa QR — ${obra.nome}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .placa { width: 210mm; min-height: 297mm; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; background: #fff; }
  .header { background: #981915; width: 100%; border-radius: 16px 16px 0 0; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; }
  .header h1 { color: #fff; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
  .header span { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .body { border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; width: 100%; padding: 40px 32px; text-align: center; }
  .obra-nome { font-size: 26px; font-weight: 900; color: #1a1a1a; margin-bottom: 8px; }
  .obra-sub { font-size: 14px; color: #6b7280; margin-bottom: 40px; }
  .qr-wrap { background: #fff; border: 3px solid #981915; border-radius: 20px; padding: 20px; display: inline-block; margin-bottom: 32px; }
  .instrucao { background: #f5f5f7; border-radius: 12px; padding: 18px 24px; margin-bottom: 28px; }
  .instrucao p { font-size: 16px; color: #374151; font-weight: 600; line-height: 1.6; }
  .instrucao .destaque { color: #981915; font-weight: 900; font-size: 18px; }
  .bullets { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; }
  .bullet { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .bullet .icone { font-size: 28px; }
  .bullet .texto { font-size: 12px; color: #6b7280; font-weight: 600; text-align: center; max-width: 80px; }
  .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; letter-spacing: 1px; text-transform: uppercase; }
</style></head><body>
<div class="placa">
  <div style="width:100%">
    <div class="header">
      <div>
        <div style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:2px;font-weight:700;margin-bottom:4px">STICKFRAME CONSTRUTORA</div>
        <h1>${obra.nome}</h1>
      </div>
      <div style="text-align:right">
        <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 14px;color:#fff;font-size:13px;font-weight:700">${obra.status || "Em andamento"}</div>
        ${obra.fase ? `<div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:6px;font-weight:600">${obra.fase}</div>` : ""}
      </div>
    </div>
    <div class="body">
      <div class="instrucao">
        <p>📱 <span class="destaque">Escaneie o QR Code</span> para acessar<br>os projetos, modelos 3D e status da obra</p>
      </div>
      <div class="qr-wrap">
        <img src="${qrBig}" width="300" height="300" alt="QR Code" />
      </div>
      <div class="bullets">
        <div class="bullet"><div class="icone">📄</div><div class="texto">Projetos em PDF</div></div>
        <div class="bullet"><div class="icone">🧊</div><div class="texto">Modelo BIM 3D</div></div>
        <div class="bullet"><div class="icone">📊</div><div class="texto">Status da obra</div></div>
        <div class="bullet"><div class="icone">✅</div><div class="texto">Check-in de equipe</div></div>
      </div>
      <div class="footer">Powered by Stickframe · stickframe.com.br</div>
    </div>
  </div>
</div>
</body></html>`;
                printHtml(html, `placa-qr-${obra.nome.replace(/\s+/g,"-").toLowerCase()}`);
              }} style={{
                width: "100%", padding: "10px 0",
                background: "#7c3aed22", border: "1px solid #7c3aed44",
                borderRadius: 8, color: "#7c3aed", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>🖨️ Gerar Placa para Impressão</button>
            </div>
          </Modal>
        );
      })()}

      {/* Modal GED — trava de ciência antes do Diário */}
      {gedTravaModal && (() => {
        const pendentes = arqObra.filter((a) => a.disciplina && a.status_doc !== "Desatualizado" && !(a.cientes_uids || []).includes(userId));
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Novas revisões de projeto</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
                Você precisa confirmar ciência das seguintes revisões antes de acessar o Diário de Obras:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {pendentes.map((a) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff8f0", border: "1px solid #f59e0b44", borderRadius: 8, padding: "10px 14px" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{a.nome}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{a.disciplina}{a.revisao ? ` · ${a.revisao}` : ""}</div>
                    </div>
                    <button onClick={async () => { await marcarCiente(obraId, a.id, userId); mostrarToast("✅ Ciência registrada!"); }} style={{ padding: "6px 14px", background: C.success, border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                      ✓ Ciente
                    </button>
                  </div>
                ))}
              </div>
              {pendentes.every((a) => (a.cientes_uids || []).includes(userId)) ? (
                <button onClick={() => { setGedTravaModal(false); setAbaAtiva("diario"); }} style={{ width: "100%", padding: "12px", background: C.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  📓 Abrir Diário de Obras
                </button>
              ) : (
                <button onClick={() => setGedTravaModal(false)} style={{ width: "100%", padding: "12px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal Relatório Mensal */}
      {relMensalModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>📅 Relatório Mensal</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>Selecione o mês para gerar o relatório gerencial.</div>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Mês de referência</label>
            <input
              type="month"
              value={relMensalMes}
              onChange={(e) => setRelMensalMes(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", marginBottom: 20 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRelMensalModal(false)} style={{ flex: 1, padding: "9px 0", background: C.darker, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={() => gerarRelatorioMensal(relMensalMes)} style={{ flex: 1, padding: "9px 0", background: "#4a9eff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>📄 Gerar PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal versões de arquivo */}
      {versaoModal && (
        <ArquivoVersoes
          arquivoId={versaoModal.id}
          arquivoNome={versaoModal.nome}
          obraId={obraId}
          onClose={() => setVersaoModal(null)}
        />
      )}

      {/* Lightbox fotos */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, cursor: "pointer",
        }}>
          <img src={fotoAmpliada.url} alt={fotoAmpliada.nome} width="1200" height="900" style={{
            maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 8,
          }} />
          <div style={{ position: "absolute", top: 18, right: 22, color: "#fff", fontSize: 24, fontWeight: 700 }}>✕</div>
          <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            {fotoAmpliada.nome}{fotoAmpliada.fase ? ` · ${fotoAmpliada.fase}` : ""}
          </div>
        </div>
      )}
    </>
  );
}
