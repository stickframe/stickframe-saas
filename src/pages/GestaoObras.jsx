import { useState, useEffect } from "react";
import { C, FASES } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

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
  prazo_inicio: "", prazo_fim: "", contrato: 0, progresso: 0,
};

export default function GestaoObras() {
  useModuleLoad("obras");
  useModuleLoad("clientes");
  useModuleLoad("financeiro");

  const obras       = useAppStore((s) => s.obras);
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
  const medicoes          = useAppStore((s) => s.medicoes);
  const diario            = useAppStore((s) => s.diario);
  const loadMedicoes      = useAppStore((s) => s.loadMedicoes);
  const loadDiario        = useAppStore((s) => s.loadDiario);

  useModuleLoad("arquivos", obras[0]?.id);

  const [obraId,      setObraId]      = useState(null);
  const [modal,       setModal]       = useState(null); // "nova" | "editar"
  const [confirm,     setConfirm]     = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const [abaAtiva,    setAbaAtiva]    = useState("fases");
  const [catFiltro,   setCatFiltro]   = useState("Todos");
  const [discFiltro,  setDiscFiltro]  = useState("Todos");
  const [statusDocFiltro, setStatusDocFiltro] = useState("Todos");
  const [faseFiltro,  setFaseFiltro]  = useState("Todos");
  const [uploadMeta,  setUploadMeta]  = useState(null); // { files, disciplina, status_doc }
  const [toast,       setToast]       = useState(null);
  const [form,        setForm]        = useState(FORM_VAZIO);
  const [busca,       setBusca]       = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [histObra,    setHistObra]    = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [checklistModal,   setChecklistModal]   = useState(false);
  const [checklistMarcados, setChecklistMarcados] = useState({});
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  useEffect(() => {
    if (!obraId && obras.length > 0) setObraId(obras[0].id);
  }, [obras, obraId]);

  useEffect(() => {
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

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const obra      = obras.find((o) => o.id === obraId) || null;
  const arqObra   = arquivos[obraId] || [];
  const arqFiltro = arqObra.filter((a) =>
    (catFiltro      === "Todos" || a.categoria  === catFiltro) &&
    (discFiltro     === "Todos" || a.disciplina === discFiltro) &&
    (statusDocFiltro=== "Todos" || a.status_doc === statusDocFiltro) &&
    (faseFiltro     === "Todos" || a.fase       === faseFiltro)
  );

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
      prazo_inicio:  obra.prazo_inicio || "",
      prazo_fim:     obra.prazo_fim    || "",
      contrato:      obra.contrato || 0,
      progresso:     obra.progresso || 0,
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
        progresso,
      });
      setModal(null);
      mostrarToast("✅ Obra atualizada!");
    } catch (e) {
      console.error("updateObra error:", e);
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

  function confirmarAvancar() {
    const i = FASES.indexOf(obra.fase);
    if (i >= FASES.length - 1) return;
    const novaFase  = FASES[i + 1];
    const progresso = Math.round(((i + 2) / FASES.length) * 100);
    avancarFase(obra.id, novaFase, progresso);
    setChecklistModal(false);
    mostrarToast(`📋 Avançou para: ${novaFase}`);
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

  async function gerarRelatorio() {
    if (!obra) return;
    mostrarToast("⏳ Gerando relatório...");
    const win = window.open("", "_blank");
    if (!win) { mostrarToast("❌ Popup bloqueado. Permita popups para este site."); return; }
    win.document.write("<html><body style='font-family:sans-serif;padding:40px;color:#555'>⏳ Carregando...</body></html>");
    await Promise.all([loadMedicoes(obraId), loadDiario(obraId)]);
    const fin  = financeiro[obraId]?.lancamentos || [];
    const meds = medicoes[obraId] || [];
    const diarioObra = (diario[obraId] || []).slice(0, 10);
    const arqs = arqObra;
    const fmt  = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const receitas  = fin.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
    const despesas  = fin.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
    const resultado = receitas - despesas;
    const hoje = new Date().toLocaleDateString("pt-BR");

    const faseIdx = FASES.indexOf(obra.fase);
    const fasesHtml = FASES.map((f, i) => {
      const done = i < faseIdx, curr = i === faseIdx;
      return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #eee">
        <div style="width:20px;height:20px;border-radius:50%;background:${done ? "#2e9e5b" : curr ? "#981915" : "#ddd"};display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700;flex-shrink:0">${done ? "✓" : i + 1}</div>
        <span style="font-size:13px;color:${done ? "#2e9e5b" : curr ? "#1a1a1a" : "#aaa"};font-weight:${curr ? 700 : 400}">${f}${curr ? ' <span style="background:#981915;color:#fff;border-radius:8px;padding:1px 8px;font-size:9px;margin-left:6px">ATUAL</span>' : ""}</span>
      </div>`;
    }).join("");

    const medsHtml = meds.length === 0 ? "<p style='color:#888;font-size:13px'>Nenhuma medição registrada.</p>"
      : meds.map((m) => `<tr><td>${m.numero}</td><td>${m.descricao || "—"}</td><td>${fmt(m.valor)}</td><td><span style="color:${m.status === "Aprovada" ? "#2e9e5b" : "#b97a00"}">${m.status}</span></td></tr>`).join("");

    const finHtml = fin.length === 0 ? "<p style='color:#888;font-size:13px'>Nenhum lançamento registrado.</p>"
      : fin.map((l) => `<tr><td>${l.data || "—"}</td><td>${l.descricao || "—"}</td><td>${l.categoria || "—"}</td><td style="color:${l.tipo === "receita" ? "#2e9e5b" : "#c0392b"}">${l.tipo === "receita" ? "+" : "-"}${fmt(l.valor)}</td></tr>`).join("");

    const diarioHtml = diarioObra.length === 0 ? "<p style='color:#888;font-size:13px'>Nenhum registro no diário.</p>"
      : diarioObra.map((r) => `<div style="padding:8px 0;border-bottom:1px solid #eee"><div style="font-size:11px;color:#888;margin-bottom:4px">${r.data} · ${r.clima || ""} · ${r.turno || ""}</div><div style="font-size:13px">${r.atividades || ""}</div>${r.ocorrencias ? `<div style="background:#fff5f5;border-left:3px solid #981915;padding:5px 10px;margin-top:6px;font-size:12px;color:#555">⚠️ ${r.ocorrencias}</div>` : ""}</div>`).join("");

    const fotos    = arqs.filter((a) => a.tipo === "imagem" && a.url);
    const docsArqs = arqs.filter((a) => a.tipo !== "imagem");

    const fotosPorFase = FASES.map((fase) => {
      const imgs = fotos.filter((f) => f.fase === fase);
      if (!imgs.length) return "";
      return `<div style="margin-bottom:16px">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#981915;margin-bottom:8px;text-transform:uppercase">${fase}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${imgs.map((f) => `<img src="${f.url}" alt="${f.nome}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;border:1px solid #eee">`).join("")}
        </div>
      </div>`;
    }).join("");
    const fotosSemFase = fotos.filter((f) => !f.fase);
    const fotosSemFaseHtml = fotosSemFase.length ? `<div style="margin-bottom:16px">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#981915;margin-bottom:8px;text-transform:uppercase">Sem fase</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${fotosSemFase.map((f) => `<img src="${f.url}" alt="${f.nome}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;border:1px solid #eee">`).join("")}
      </div>
    </div>` : "";

    const arqHtml = docsArqs.length === 0 ? "<p style='color:#888;font-size:13px'>Nenhum documento.</p>"
      : docsArqs.map((a) => `<div style="font-size:12px;padding:4px 0;border-bottom:1px solid #eee">${a.nome} <span style="color:#888">· ${a.categoria} · ${a.tamanho}</span></div>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório — ${obra.nome}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;padding:32px;max-width:900px;margin:0 auto}
      h1{font-size:22px;font-weight:800;margin-bottom:4px}h2{font-size:14px;font-weight:700;letter-spacing:1px;color:#981915;margin:24px 0 12px;text-transform:uppercase;border-bottom:2px solid #981915;padding-bottom:6px}
      table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:8px;background:#f5f5f5;font-size:11px;letter-spacing:.5px}td{padding:8px;border-bottom:1px solid #eee}
      .kpi{display:inline-block;background:#f5f5f5;border-radius:8px;padding:10px 18px;margin-right:10px;margin-bottom:10px;text-align:center}
      .kpi-v{font-size:18px;font-weight:800}.kpi-l{font-size:10px;color:#888;letter-spacing:.5px;margin-top:2px}
      @media print{body{padding:16px}h2{margin-top:16px}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
      <div>
        <div style="font-size:10px;letter-spacing:2px;color:#981915;margin-bottom:6px">STICKFRAME · RELATÓRIO DE OBRA</div>
        <h1>${obra.nome}</h1>
        <div style="font-size:13px;color:#555;margin-top:6px">Cliente: <strong>${obra.cliente || "—"}</strong> &nbsp;·&nbsp; Status: <strong>${obra.status}</strong> &nbsp;·&nbsp; Progresso: <strong>${obra.progresso || 0}%</strong></div>
        ${obra.prazo_inicio || obra.prazo_fim ? `<div style="font-size:12px;color:#888;margin-top:4px">Início: ${obra.prazo_inicio ? new Date(obra.prazo_inicio + "T00:00").toLocaleDateString("pt-BR") : "—"} &nbsp;·&nbsp; Entrega: ${obra.prazo_fim ? new Date(obra.prazo_fim + "T00:00").toLocaleDateString("pt-BR") : "—"}</div>` : ""}
      </div>
      <div style="text-align:right;font-size:11px;color:#888">Gerado em ${hoje}</div>
    </div>

    <h2>Resumo Financeiro</h2>
    <div>
      ${[["Contrato", fmt(obra.contrato)], ["Receitas", fmt(receitas)], ["Despesas", fmt(despesas)], ["Resultado", fmt(resultado)]].map(([l, v]) => `<div class="kpi"><div class="kpi-v">${v}</div><div class="kpi-l">${l.toUpperCase()}</div></div>`).join("")}
    </div>

    <h2>Etapas da Obra</h2>${fasesHtml}

    <h2>Medições</h2>
    ${meds.length > 0 ? `<table><tr><th>Nº</th><th>Descrição</th><th>Valor</th><th>Status</th></tr>${medsHtml}</table>` : medsHtml}

    <h2>Lançamentos Financeiros</h2>
    ${fin.length > 0 ? `<table><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr>${finHtml}</table>` : finHtml}

    <h2>Diário de Obra (últimos 10)</h2>${diarioHtml}

    ${fotos.length > 0 ? `<h2>Fotos por Fase (${fotos.length})</h2>${fotosPorFase}${fotosSemFaseHtml}` : ""}

    ${docsArqs.length > 0 ? `<h2>Documentos (${docsArqs.length})</h2>${arqHtml}` : ""}
    </body></html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  function handleFiles(files) {
    const lista = Array.from(files);
    if (!lista.length) return;
    setUploadMeta({ files: lista, disciplina: "Outro", status_doc: "Ativo" });
  }

  async function confirmarUpload() {
    if (!uploadMeta) return;
    const { files, disciplina, status_doc } = uploadMeta;
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
                  {[["fases", "📋 Fases da obra"], ["fotos", "📷 Fotos"], ["arquivos", "📁 Arquivos"], ["historico", "🕑 Histórico"]].map(([k, l]) => (
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
                                  ? <img src={f.url} alt={f.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                        {arqFiltro.map((a) => (
                          <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: C.darker, borderRadius: 8, border: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{ICONE_TIPO[a.tipo] || "📎"}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.tamanho} · {a.data}</div>
                              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                                {a.disciplina && <span style={{ background: "#4a9eff18", color: "#4a9eff", border: "1px solid #4a9eff33", borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{a.disciplina}</span>}
                                {a.fase && <span style={{ background: "#98191518", color: "#981915", border: "1px solid #98191533", borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{a.fase}</span>}
                                {a.status_doc && <span style={{ background: (STATUS_DOC_COR[a.status_doc] || C.muted) + "18", color: STATUS_DOC_COR[a.status_doc] || C.muted, border: `1px solid ${(STATUS_DOC_COR[a.status_doc] || C.muted)}33`, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{a.status_doc}</span>}
                              </div>
                            </div>
                            {a.url && (
                              <a href={a.url} target="_blank" rel="noreferrer" style={{
                                background: "#4a9eff22", border: "1px solid #4a9eff44",
                                borderRadius: 6, color: "#4a9eff", fontSize: 11, fontWeight: 700,
                                padding: "4px 10px", textDecoration: "none", flexShrink: 0,
                              }}>↓</a>
                            )}
                            <button onClick={() => deleteArquivo(obraId, a.id, a.path)} style={{
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
              </div>

              {/* Coluna lateral */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Ações rápidas */}
                <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 18 }}>
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
                    <Btn variant="ghost" size="sm" fullWidth onClick={abrirEditar}>✏️ Editar obra</Btn>
                    <button onClick={gerarRelatorio} style={{
                      width: "100%", padding: "8px 0",
                      background: "#2e9e5b22", border: "1px solid #2e9e5b44",
                      borderRadius: 6, color: "#2e9e5b", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>📄 Relatório PDF</button>
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
                    ["Início",    obra.prazo_inicio ? new Date(obra.prazo_inicio + "T00:00").toLocaleDateString("pt-BR") : "—"],
                    ["Entrega",   obra.prazo_fim    ? new Date(obra.prazo_fim    + "T00:00").toLocaleDateString("pt-BR") : "—"],
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

      {/* Lightbox fotos */}
      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, cursor: "pointer",
        }}>
          <img src={fotoAmpliada.url} alt={fotoAmpliada.nome} style={{
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
