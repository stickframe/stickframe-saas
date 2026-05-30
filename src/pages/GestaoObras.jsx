import { useState, useEffect } from "react";
import { C, FASES } from "../utils/constants";
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
  const [toast,       setToast]       = useState(null);
  const [form,        setForm]        = useState(FORM_VAZIO);
  const [busca,       setBusca]       = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [histObra,    setHistObra]    = useState([]);
  const [histLoading, setHistLoading] = useState(false);

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
      await updateObra(obraId, {
        ...form,
        cliente_id: form.cliente_id || null,
        contrato:   Number(form.contrato) || 0,
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
    const novaFase  = FASES[i + 1];
    const progresso = Math.round(((i + 2) / FASES.length) * 100);
    avancarFase(obra.id, novaFase, progresso);
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

    const win = window.open("", "_blank");
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
                  {[["fases", "📋 Fases da obra"], ["arquivos", "📁 Arquivos"], ["historico", "🕑 Histórico"]].map(([k, l]) => (
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
    </>
  );
}
