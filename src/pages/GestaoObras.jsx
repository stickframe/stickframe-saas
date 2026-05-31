import { useState, useEffect, useMemo } from "react";
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
import { emailAlertaObraAtrasada } from "../services/emailService";

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
  const perfil            = useAppStore((s) => s.user?.perfil);
  const medicoes          = useAppStore((s) => s.medicoes);
  const diario            = useAppStore((s) => s.diario);
  const loadMedicoes      = useAppStore((s) => s.loadMedicoes);
  const loadDiario        = useAppStore((s) => s.loadDiario);
  const vistorias         = useAppStore((s) => s.vistorias);
  const loadVistorias     = useAppStore((s) => s.loadVistorias);

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
  const [form,        setForm]        = useState(FORM_VAZIO);
  const [busca,       setBusca]       = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [histObra,    setHistObra]    = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [checklistModal,   setChecklistModal]   = useState(false);
  const [checklistMarcados, setChecklistMarcados] = useState({});
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [qrModal,      setQrModal]      = useState(false);

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

  async function gerarDossie() {
    if (!obra) return;
    mostrarToast("⏳ Gerando dossiê...");
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

  async function gerarRelatorioObra() {
    if (!obra) return;
    mostrarToast("⏳ Gerando relatório...");
    await loadMedicoes(obraId);

    const lans = financeiro[obraId]?.lancamentos || [];
    const meds = medicoes[obraId] || [];
    const contrato = Number(obra.contrato) || 0;
    const receitas = lans.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
    const despesas = lans.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
    const margem = contrato > 0 ? (((contrato - despesas) / contrato) * 100).toFixed(1) : "—";
    const hoje = new Date().toLocaleDateString("pt-BR");
    const fmtR = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Prazo info
    const inicio = obra.prazo_inicio ? new Date(obra.prazo_inicio + "T00:00").toLocaleDateString("pt-BR") : "—";
    const fim = obra.prazo_fim ? new Date(obra.prazo_fim + "T00:00").toLocaleDateString("pt-BR") : "—";
    const diasRestantes = obra.prazo_fim
      ? Math.ceil((new Date(obra.prazo_fim + "T00:00") - new Date()) / 86400000)
      : null;

    // Cash flow — sorted lancamentos with running balance
    const lansOrdenados = [...lans].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
    let saldoAcc = 0;
    const cashFlowRows = lansOrdenados.map((l) => {
      saldoAcc += l.tipo === "receita" ? (l.valor || 0) : -(l.valor || 0);
      return `<tr>
        <td>${l.data ? new Date(l.data + "T00:00").toLocaleDateString("pt-BR") : "—"}</td>
        <td>${l.descricao || "—"}</td>
        <td style="color:${l.tipo === "receita" ? "#2e9e5b" : "#dc2626"};font-weight:600">${l.tipo === "receita" ? "+" : "−"}${fmtR(l.valor)}</td>
        <td style="font-weight:700;color:${saldoAcc >= 0 ? "#2e9e5b" : "#dc2626"}">${fmtR(saldoAcc)}</td>
      </tr>`;
    }).join("");

    // Medições table
    const medsRows = meds.map((m) => `<tr>
      <td>${m.numero || "—"}</td>
      <td>${m.descricao || "—"}</td>
      <td>${fmtR(m.valor)}</td>
      <td style="color:${m.status === "Aprovada" ? "#2e9e5b" : "#b97a00"};font-weight:700">${m.status}</td>
    </tr>`).join("");

    const htmlContent = `
      <div style="max-width:900px;margin:0 auto;padding:40px">
        <!-- Header -->
        <div style="border-bottom:3px solid #981915;padding-bottom:20px;margin-bottom:24px">
          <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:#981915;margin-bottom:8px">STICKFRAME · RELATÓRIO DE OBRA</div>
          <h1 style="font-size:26px;font-weight:900;margin:0 0 6px">${obra.nome}</h1>
          <div style="font-size:13px;color:#6b7280">Cliente: <strong>${obra.cliente || "—"}</strong> &nbsp;·&nbsp; Gerado em: <strong>${hoje}</strong></div>
        </div>

        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px">
          ${[
            ["CONTRATO TOTAL", fmtR(contrato), "#1a1a1a"],
            ["RECEITAS", fmtR(receitas), "#2e9e5b"],
            ["DESPESAS", fmtR(despesas), "#dc2626"],
            ["MARGEM ESTIMADA", margem !== "—" ? margem + "%" : "—", Number(margem) > 20 ? "#2e9e5b" : "#b97a00"],
            ["PROGRESSO", `${obra.progresso || 0}%`, "#981915"],
            ["FASE ATUAL", obra.fase || "—", "#1a1a1a"],
          ].map(([l, v, c]) => `<div style="background:#f9fafb;border-radius:10px;padding:14px 18px;border:1px solid #e5e7eb">
            <div style="font-size:10px;color:#9ca3af;letter-spacing:1px;margin-bottom:6px">${l}</div>
            <div style="font-size:20px;font-weight:900;color:${c}">${v}</div>
          </div>`).join("")}
        </div>

        <!-- Prazo -->
        <h2 style="font-size:13px;font-weight:800;letter-spacing:1px;color:#981915;margin:24px 0 12px;text-transform:uppercase;border-bottom:1px solid #e5e7eb;padding-bottom:8px">⏱ Prazo</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
          <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;border:1px solid #e5e7eb"><div style="font-size:10px;color:#9ca3af;margin-bottom:4px">INÍCIO</div><div style="font-weight:700">${inicio}</div></div>
          <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;border:1px solid #e5e7eb"><div style="font-size:10px;color:#9ca3af;margin-bottom:4px">ENTREGA PREVISTA</div><div style="font-weight:700">${fim}</div></div>
          <div style="background:${diasRestantes != null && diasRestantes < 0 ? "#fef2f2" : "#f9fafb"};border-radius:8px;padding:12px 16px;border:1px solid ${diasRestantes != null && diasRestantes < 0 ? "#fca5a5" : "#e5e7eb"}">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">DIAS RESTANTES</div>
            <div style="font-weight:700;color:${diasRestantes != null && diasRestantes < 0 ? "#dc2626" : "#1a1a1a"}">${diasRestantes != null ? (diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias de atraso` : `${diasRestantes} dias`) : "—"}</div>
          </div>
        </div>

        <!-- Cash Flow -->
        <h2 style="font-size:13px;font-weight:800;letter-spacing:1px;color:#981915;margin:24px 0 12px;text-transform:uppercase;border-bottom:1px solid #e5e7eb;padding-bottom:8px">💰 Fluxo de Caixa</h2>
        ${lans.length === 0 ? "<p style='color:#9ca3af;font-size:13px'>Nenhum lançamento registrado.</p>" : `
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f3f4f6">
            <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:.8px">DATA</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:.8px">DESCRIÇÃO</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:.8px">VALOR</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:.8px">SALDO ACUMULADO</th>
          </tr></thead>
          <tbody>${cashFlowRows}</tbody>
        </table>`}

        <!-- Medições -->
        <h2 style="font-size:13px;font-weight:800;letter-spacing:1px;color:#981915;margin:28px 0 12px;text-transform:uppercase;border-bottom:1px solid #e5e7eb;padding-bottom:8px">📐 Medições (${meds.length})</h2>
        ${meds.length === 0 ? "<p style='color:#9ca3af;font-size:13px'>Nenhuma medição registrada.</p>" : `
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f3f4f6">
            <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:.8px">Nº</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:.8px">DESCRIÇÃO</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:.8px">VALOR</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:.8px">STATUS</th>
          </tr></thead>
          <tbody>${medsRows}</tbody>
        </table>`}

        <div style="margin-top:40px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
          Stick Frame Sistemas Construtivos · Santo André/SP · Relatório gerado em ${hoje}
        </div>
      </div>`;

    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Relatório — ${obra.nome}</title><style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; }
      @media print { @page { margin: 20mm; } }
      table td, table th { border-bottom: 1px solid #e5e7eb; }
    </style></head><body>${htmlContent}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
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
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportarObrasExcel(obras)} style={{
            padding: "8px 14px", background: "#2e9e5b22",
            border: "1px solid #2e9e5b44", borderRadius: 8,
            color: "#2e9e5b", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>📊 Exportar Excel</button>
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
                  <span style={{ fontSize: 18 }}>⚠️</span> OBRAS ATRASADAS ({atrasadas.length})
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
                  {[["fases", "📋 Fases"], ["financeiro", "💰 Financeiro"], ["fluxo", "📈 Fluxo"], ["fotos", "📷 Fotos"], ["arquivos", "📁 Arquivos"], ["historico", "🕑 Histórico"]].map(([k, l]) => (
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
                                <div style={{ fontSize: 11, color: C.muted }}>{l.categoria || l.tipo} · {l.data ? new Date(l.data + "T00:00").toLocaleDateString("pt-BR") : "—"}</div>
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
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>📈 Fluxo de Caixa Mensal</div>

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
                                    <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: C.muted, whiteSpace: "nowrap", textAlign: h === "Mês" ? "left" : "right" }}>{h}</th>
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
                    <button onClick={gerarDossie} style={{
                      width: "100%", padding: "8px 0",
                      background: "#2e9e5b22", border: "1px solid #2e9e5b44",
                      borderRadius: 6, color: "#2e9e5b", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>📄 Dossiê de Obra</button>

                    <button onClick={gerarRelatorioObra} style={{
                      width: "100%", padding: "8px 0",
                      background: "#0f766e22", border: "1px solid #0f766e44",
                      borderRadius: 6, color: "#0f766e", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>📊 Relatório de Obra</button>

                    <button onClick={() => setQrModal(true)} style={{
                      width: "100%", padding: "8px 0",
                      background: "#9b59b622", border: "1px solid #9b59b644",
                      borderRadius: 6, color: "#9b59b6", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>📱 QR Code Check-in</button>

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
