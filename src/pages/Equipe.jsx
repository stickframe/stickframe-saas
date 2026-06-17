import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { ClipboardList, DollarSign, Pencil, Phone, Trash2 } from "../components/ui/Icon";
import Certificacoes from "../components/equipe/Certificacoes";
import { printHtml } from "../utils/printHtml";
import { LOGO_STICKFRAME } from "../utils/cdn";
import { useToast } from "../hooks/useToast";
import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import { mesAno } from "../utils/date";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";
import { listarCertificacoes } from "../services/repositories/certificacaoRepository";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const ESPECIALIDADES = ["Montador","Ajudante","Fundação","Elétrica","Hidráulica","Acabamento","Projeto","Administração","Outro"];
const STATUS_OPTS    = ["Ativo","Férias","Afastado","Inativo"];
const STATUS_COR     = { Ativo: "#2e9e5b", Férias: "#4a9eff", Afastado: "#c88a00", Inativo: C.muted };
const FUNCOES        = ["Montador","Mestre de obra","Pedreiro","Eletricista","Encanador","Pintor","Acabamento","Coordenador","Outro"];
const UNIDADES       = ["m²","m","un","kg","hr","vb"];

function LabelField({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

//  Tab 
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", fontSize: 12, fontWeight: active ? 700 : 400,
      background: active ? C.red : "transparent",
      color: active ? "#fff" : C.muted,
      border: `1px solid ${active ? C.red : C.border}`,
      borderRadius: 8, cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
    }}>
      {label}
    </button>
  );
}

//  Formulário colaborador 
const FORM_VAZIO = {
  nome: "", cargo: "", email: "", telefone: "",
  especialidade: "Montador", status: "Ativo", salario: "", observacoes: "",
  tipo_contrato: "CLT", valor_producao: "", unidade_producao: "m²",
  foto_url: "",
};

function FormColaborador({ form, setForm, onSave, onCancel, btnLabel }) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const [uploadingFoto, setUploadingFoto] = React.useState(false);

  async function handleFotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const { sb, getEmpresaId } = await import("../services/supabase");
      const path = `${getEmpresaId()}/colaboradores/${Date.now()}-${file.name}`;
      const { error } = await sb.storage.from("arquivos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = sb.storage.from("arquivos").getPublicUrl(path);
      set("foto_url")(publicUrl);
    } catch (err) {
      console.warn("Erro ao fazer upload da foto:", err);
    } finally {
      setUploadingFoto(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Foto do colaborador */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: form.foto_url ? "transparent" : C.red, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {form.foto_url
            ? <img src={form.foto_url} alt="foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ color: "#fff", fontSize: 24, fontWeight: 900 }}>{form.nome?.[0]?.toUpperCase() || "?"}</span>
          }
        </div>
        <div>
          <label style={{ display: "inline-block", padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.muted }}>
            {uploadingFoto ? "Enviando..." : " Foto do colaborador"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFotoUpload} disabled={uploadingFoto} />
          </label>
          {form.foto_url && <button onClick={() => set("foto_url")("")} style={{ marginLeft: 8, background: "none", border: "none", color: C.danger, fontSize: 11, cursor: "pointer" }}>Remover</button>}
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Aparece no crachá de ponto</div>
        </div>
      </div>
      <div>
        <LabelField required>Nome</LabelField>
        <Input value={form.nome} onChange={set("nome")} placeholder="Nome completo" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <LabelField>Cargo</LabelField>
          <Input value={form.cargo} onChange={set("cargo")} placeholder="Ex: Mestre de obra" />
        </div>
        <div>
          <LabelField>Especialidade</LabelField>
          <Select value={form.especialidade} onChange={set("especialidade")}
            options={ESPECIALIDADES.map((e) => ({ value: e, label: e }))} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <LabelField>E-mail</LabelField>
          <Input value={form.email} onChange={set("email")} type="email" placeholder="email@exemplo.com" />
        </div>
        <div>
          <LabelField>Telefone</LabelField>
          <Input value={form.telefone} onChange={set("telefone")} placeholder="+55 (11) 99999-9999" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <LabelField>Salário / valor diária (R$)</LabelField>
          <Input value={form.salario} onChange={set("salario")} type="number" min="0" placeholder="0,00" />
        </div>
        <div>
          <LabelField>Status</LabelField>
          <Select value={form.status} onChange={set("status")}
            options={STATUS_OPTS.map((s) => ({ value: s, label: s }))} />
        </div>
      </div>
      {/* Tipo de contrato */}
      <div style={{ background: C.darker, borderRadius: 10, padding: "14px 16px" }}>
        <LabelField>Tipo de Contrato</LabelField>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          {["CLT", "Empreiteiro"].map((t) => (
            <button key={t} onClick={() => set("tipo_contrato")(t)} style={{
              padding: "6px 16px", borderRadius: 8, border: `1px solid ${form.tipo_contrato === t ? C.red : C.border}`,
              background: form.tipo_contrato === t ? C.red + "18" : "#fff",
              color: form.tipo_contrato === t ? C.text : C.muted,
              fontSize: 12, fontWeight: form.tipo_contrato === t ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit",
            }}>{t}</button>
          ))}
        </div>
        {form.tipo_contrato === "Empreiteiro" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
            <div>
              <LabelField required>Valor por Unidade (R$)</LabelField>
              <Input value={form.valor_producao} onChange={set("valor_producao")} type="number" min="0" placeholder="Ex: 25,00" />
            </div>
            <div>
              <LabelField>Unidade de Medição</LabelField>
              <Select value={form.unidade_producao} onChange={set("unidade_producao")}
                options={UNIDADES.map((u) => ({ value: u, label: u }))} />
            </div>
          </div>
        )}
      </div>

      <div>
        <LabelField>Observações</LabelField>
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

//  Componente principal 
export default function Equipe() {
  const { toast, mostrarToast } = useToast();
  useModuleLoad("colaboradores");
  useModuleLoad("obras");

  const colaboradores       = useAppStore((s) => s.colaboradores);
  const addColaborador      = useAppStore((s) => s.addColaborador);
  const updateColaborador   = useAppStore((s) => s.updateColaborador);
  const deleteColaborador   = useAppStore((s) => s.deleteColaborador);
  const obras               = useAppStore((s) => s.obras);
  const addLancamento       = useAppStore((s) => s.addLancamento);
  const alocacoes           = useAppStore((s) => s.alocacoes);
  const loadAlocacoes       = useAppStore((s) => s.loadAlocacoes);
  const addAlocacao         = useAppStore((s) => s.addAlocacao);
  const removeAlocacao      = useAppStore((s) => s.removeAlocacao);
  const horasTrabalhadas    = useAppStore((s) => s.horasTrabalhadas);
  const loadHorasTrabalhadas = useAppStore((s) => s.loadHorasTrabalhadas);
  const addHorasTrabalhadas = useAppStore((s) => s.addHorasTrabalhadas);
  const removeHorasTrabalhadas = useAppStore((s) => s.removeHorasTrabalhadas);

  const [tab,        setTab]        = useState("equipe");
  const [empModal,   setEmpModal]   = useState(null); // { colaborador }
  const [empForm,    setEmpForm]    = useState({ obra_id: "", quantidade: "", descricao: "", data_inicio: "", data_fim: "" });
  const [empApurando, setEmpApurando] = useState(false);
  const [modal,      setModal]      = useState(null);
  const [editId,     setEditId]     = useState(null);
  const [confirm,    setConfirm]    = useState(null);
  const [form,       setForm]       = useState(FORM_VAZIO);
  const [busca,      setBusca]      = useState("");
  const [statusF,    setStatusF]    = useState("Todos");

  // Folha
  const [folhaModal,   setFolhaModal]   = useState(false);
  const [obraFolha,    setObraFolha]    = useState("");
  const [selecionados, setSelecionados] = useState({});

  // Alocação
  const [alocModal,  setAlocModal]  = useState(false);
  const [alocForm,   setAlocForm]   = useState({ colaborador_id: "", obra_id: "", funcao: "Montador", data_inicio: "", data_fim: "" });
  const [alocFiltroObra, setAlocFiltroObra] = useState("");

  // Horas
  const [horaModal,  setHoraModal]  = useState(false);
  const [horaForm,   setHoraForm]   = useState({ colaborador_id: "", obra_id: "", data: "", horas: "", descricao: "" });
  const [horaFiltroColaborador, setHoraFiltroColaborador] = useState("");
  const [horaFiltroObra, setHoraFiltroObra] = useState("");

  // Relatório de Horas (registros_ponto)
  const [relAno,     setRelAno]     = useState(() => new Date().getFullYear());
  const [relMes,     setRelMes]     = useState(() => new Date().getMonth() + 1);
  const [relDados,   setRelDados]   = useState([]);
  const [relLoading, setRelLoading] = useState(false);

  useEffect(() => {
    loadAlocacoes();
    loadHorasTrabalhadas();
  }, [loadAlocacoes, loadHorasTrabalhadas]);

  const carregarRelatorio = useCallback(async () => {
    setRelLoading(true);
    try {
      const { sb, getEmpresaId } = await import("../services/supabase");
      const startOfMonth = new Date(relAno, relMes - 1, 1).toISOString();
      const endOfMonth   = new Date(relAno, relMes,     1).toISOString();
      const { data, error } = await sb
        .from("registros_ponto")
        .select("*, colaborador:colaboradores(nome)")
        .eq("empresa_id", getEmpresaId())
        .gte("entrada", startOfMonth)
        .lt("entrada", endOfMonth);
      if (error) throw error;
      const mapa = {};
      (data || []).forEach((r) => {
        const id = r.colaborador_id;
        if (!mapa[id]) mapa[id] = { id, nome: r.colaborador?.nome || id, totalHoras: 0, dias: new Set(), obras: new Set() };
        if (r.entrada && r.saida) {
          const h = (new Date(r.saida) - new Date(r.entrada)) / 3600000;
          if (h > 0) mapa[id].totalHoras += h;
        }
        if (r.entrada) mapa[id].dias.add(r.entrada.slice(0, 10));
        if (r.obra_id) mapa[id].obras.add(r.obra_id);
      });
      const linhas = Object.values(mapa).map((row) => ({
        id:          row.id,
        nome:        row.nome,
        totalHoras:  row.totalHoras,
        diasCount:   row.dias.size,
        mediaDiaria: row.dias.size > 0 ? row.totalHoras / row.dias.size : 0,
        obrasNomes:  [...row.obras].map((oid) => obras.find((o) => o.id === oid)?.nome?.split("—")[0]?.trim() || oid).join(", "),
      })).sort((a, b) => b.totalHoras - a.totalHoras);
      setRelDados(linhas);
    } catch (e) {
      console.error("Erro ao carregar relatório de horas:", e);
    } finally {
      setRelLoading(false);
    }
  }, [relAno, relMes, obras]);

  useEffect(() => {
    if (tab === "relatorio") carregarRelatorio();
  }, [tab, carregarRelatorio]);

  function exportarRelatorioExcel() {
    const mesNome = new Date(relAno, relMes - 1, 1).toLocaleString("pt-BR", { month: "long" });
    const rows = relDados.map((r) => ({
      "Nome":             r.nome,
      "Total de Horas":   parseFloat(r.totalHoras.toFixed(2)),
      "Dias Trabalhados": r.diasCount,
      "Média Diária (h)": parseFloat(r.mediaDiaria.toFixed(2)),
      "Obras":            r.obrasNomes || "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Horas");
    XLSX.writeFile(wb, `relatorio-horas-${mesNome}-${relAno}.xlsx`);
  }

  // Certificações para badges nos cards
  const [certsByColab, setCertsByColab] = useState({});
  const recarregarCerts = useCallback(async () => {
    try {
      const all = await listarCertificacoes();
      const map = {};
      all.forEach(c => {
        if (!map[c.colaborador_id]) map[c.colaborador_id] = [];
        map[c.colaborador_id].push(c);
      });
      setCertsByColab(map);
    } catch {}
  }, []);
  useEffect(() => { recarregarCerts(); }, [recarregarCerts]);

  //  Crachá / QR Ponto 
  const NR_ICONES = {
    "NR-01": { icon: "fa-clipboard-check",   label: "PGR" },
    "NR-05": { icon: "fa-users",             label: "CIPA" },
    "NR-06": { icon: "fa-hard-hat",          label: "EPI" },
    "NR-6":  { icon: "fa-hard-hat",          label: "EPI" },
    "NR-10": { icon: "fa-bolt",              label: "NR-10" },
    "NR-12": { icon: "fa-cog",               label: "NR-12" },
    "NR-17": { icon: "fa-chair",             label: "Ergon." },
    "NR-18": { icon: "fa-hard-hat",          label: "NR-18" },
    "NR-20": { icon: "fa-fire",              label: "NR-20" },
    "NR-23": { icon: "fa-fire-extinguisher", label: "NR-23" },
    "NR-33": { icon: "fa-wind",              label: "NR-33" },
    "NR-35": { icon: "fa-user-shield",       label: "Altura" },
    "ASO":   { icon: "fa-heartbeat",         label: "ASO" },
    "Habilitação": { icon: "fa-id-card",     label: "CNH" },
  };

  function gerarCracha(c, certs = []) {
    if (!c.token_ponto) return;
    const url = `${window.location.origin}/ponto/${c.token_ponto}`;
    const qr  = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}`;
    const inicial = c.nome[0].toUpperCase();
    const avatarHtml = c.foto_url
      ? `<img src="${c.foto_url}" class="avatar-foto"/>`
      : `<div class="avatar">${inicial}</div>`;

    // Deduplica por nr no crachá — mantém o mais recente
    const certsUniq = Object.values(certs.reduce((acc, c) => {
      const k = c.nr || "";
      if (!acc[k] || (c.data_validade || "") > (acc[k].data_validade || "")) acc[k] = c;
      return acc;
    }, {}));

    const certBadges = certsUniq.length > 0
      ? `<div class="certs-row">${certsUniq.map((cert) => {
          const nrVal = (cert.nr != null && cert.nr !== "" && cert.nr !== "undefined") ? String(cert.nr) : "";
          const key = nrVal ? Object.keys(NR_ICONES).find((k) => nrVal.includes(k)) : undefined;
          const info = key ? NR_ICONES[key] : null;
          const icon = info ? `<i class="fas ${info.icon}"></i>` : "";
          const rawLabel = nrVal.replace(/\s*\(.*\)/, "").trim();
          const label = info?.label || (rawLabel && rawLabel !== "undefined" ? rawLabel.slice(0, 7) : "NR");
          const valid = cert.data_validade ? new Date(cert.data_validade) > new Date() : true;
          return `<div class="cert-badge ${valid ? "" : "cert-vencido"}" title="${nrVal}">${icon}<span>${label}</span></div>`;
        }).join("")}</div>`
      : "";

    printHtml(`
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @page { size: 85.6mm 120mm; margin: 0; }
        body { display:flex; align-items:center; justify-content:center; width:85.6mm; height:120mm; background:#f5f5f7; font-family:Inter,Arial,sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        .card { width:85.6mm; height:120mm; background:#fff; border-radius:8px; padding:10px 10px 8px; text-align:center; box-shadow:0 2px 10px rgba(0,0,0,.12); border-top:5px solid #981915; overflow:hidden; }
        .logo { height:22px; margin-bottom:6px; display:block; margin-left:auto; margin-right:auto; }
        .avatar { width:44px; height:44px; border-radius:50%; background:#981915; color:#fff; font-size:17px; font-weight:900; line-height:44px; text-align:center; margin:0 auto 5px; display:block; }
        .avatar-foto { width:44px; height:44px; border-radius:50%; object-fit:cover; margin:0 auto 5px; display:block; border:2px solid #981915; }
        .nome { font-size:9px; font-weight:800; color:#1a1a1a; margin-bottom:2px; letter-spacing:.2px; text-transform:uppercase; }
        .cargo { font-size:7.5px; color:#6b7280; margin-bottom:6px; text-transform:uppercase; letter-spacing:.7px; }
        .qr { width:72px; height:72px; margin:0 auto 4px; display:block; border:1px solid #eee; border-radius:4px; padding:2px; }
        .label { font-size:6.5px; font-weight:700; letter-spacing:1.5px; color:#9ca3af; text-transform:uppercase; }
        .certs-row { display:flex; flex-wrap:wrap; justify-content:center; gap:3px; margin-top:5px; }
        .cert-badge { display:flex; flex-direction:column; align-items:center; gap:1px; background:#f1f5f9; border-radius:5px; padding:3px 4px; min-width:30px; }
        .cert-badge i { font-size:10px; color:#981915; }
        .cert-badge span { font-size:5.5px; font-weight:700; color:#374151; letter-spacing:.3px; text-transform:uppercase; }
        .cert-vencido { opacity:.45; }
        @media print { body { background:#fff; } .card { box-shadow:none; border-radius:0; } }
      </style>
      <div class="card">
        <img src="${LOGO_STICKFRAME}" class="logo" onerror="this.style.display='none'"/>
        ${avatarHtml}
        <div class="nome">${c.nome}</div>
        <div class="cargo">${c.cargo || c.especialidade || "Colaborador"}</div>
        <img src="${qr}" class="qr"/>
        <div class="label">⏱ Ponto Eletrônico</div>
        ${certBadges}
      </div>
    `, `cracha-${c.nome}`);
  }

  //  Equipe CRUD 
  function abrirNovo() { setForm(FORM_VAZIO); setModal("novo"); }

  function abrirEditar(c) {
    setEditId(c.id);
    setForm({
      nome: c.nome || "", cargo: c.cargo || "", email: c.email || "",
      telefone: c.telefone || "", especialidade: c.especialidade || "Montador",
      status: c.status || "Ativo", salario: c.salario || "", observacoes: c.observacoes || "",
      tipo_contrato: c.tipo_contrato || "CLT", valor_producao: c.valor_producao || "", unidade_producao: c.unidade_producao || "m²",
      foto_url: c.foto_url || "",
    });
    setModal("editar");
  }

  async function salvarNovo() {
    const payload = { ...form, salario: form.salario ? Number(form.salario) : null, valor_producao: form.valor_producao ? Number(form.valor_producao) : null };
    await addColaborador(payload);
    setModal(null);
    mostrarToast(" Colaborador cadastrado!");
  }

  async function salvarEdicao() {
    const payload = { ...form, salario: form.salario ? Number(form.salario) : null, valor_producao: form.valor_producao ? Number(form.valor_producao) : null };
    await updateColaborador(editId, payload);
    setModal(null);
    mostrarToast(" Dados atualizados!");
  }

  async function executarDelete() {
    await deleteColaborador(confirm);
    setConfirm(null);
    mostrarToast(" Colaborador removido.");
  }

  //  Folha 
  const colaboradoresAtivosComSalario = colaboradores.filter((c) => c.status === "Ativo" && c.salario);
  const totalSelecionado = colaboradoresAtivosComSalario
    .filter((c) => selecionados[c.id])
    .reduce((a, c) => a + (c.salario || 0), 0);

  function abrirFolhaModal() {
    const iniciais = {};
    colaboradoresAtivosComSalario.forEach((c) => { iniciais[c.id] = true; });
    setSelecionados(iniciais);
    setObraFolha(obras[0]?.id || "");
    setFolhaModal(true);
  }

  async function lancarFolha() {
    if (!obraFolha || totalSelecionado === 0) return;
    const nomes = colaboradoresAtivosComSalario
      .filter((c) => selecionados[c.id])
      .map((c) => c.nome.split(" ")[0])
      .join(", ");
    await addLancamento(obraFolha, {
      tipo: "despesa", categoria: "Mão de obra",
      descricao: `Folha ${mesAno()} — ${nomes}`,
      valor: totalSelecionado,
      data: new Date().toLocaleDateString("pt-BR"),
    });
    setFolhaModal(false);
    mostrarToast(` Folha de ${fmt(totalSelecionado)} lançada!`);
  }

  //  Alocações 
  async function salvarAlocacao() {
    if (!alocForm.colaborador_id || !alocForm.obra_id) return;
    await addAlocacao({
      colaborador_id: alocForm.colaborador_id,
      obra_id:        alocForm.obra_id,
      funcao:         alocForm.funcao,
      data_inicio:    alocForm.data_inicio || null,
      data_fim:       alocForm.data_fim    || null,
    });
    setAlocModal(false);
    setAlocForm({ colaborador_id: "", obra_id: "", funcao: "Montador", data_inicio: "", data_fim: "" });
    mostrarToast(" Alocação registrada!");
  }

  const alocacoesFiltradas = alocFiltroObra
    ? alocacoes.filter((a) => a.obra_id === alocFiltroObra)
    : alocacoes;

  //  Horas 
  async function salvarHoras() {
    if (!horaForm.colaborador_id || !horaForm.obra_id || !horaForm.horas) return;
    await addHorasTrabalhadas({
      colaborador_id: horaForm.colaborador_id,
      obra_id:        horaForm.obra_id,
      data:           horaForm.data || new Date().toISOString().split("T")[0],
      horas:          Number(horaForm.horas),
      descricao:      horaForm.descricao,
    });
    setHoraModal(false);
    setHoraForm({ colaborador_id: "", obra_id: "", data: "", horas: "", descricao: "" });
    mostrarToast(" Horas registradas!");
  }

  const horasFiltradas = horasTrabalhadas.filter((h) => {
    const matchC = !horaFiltroColaborador || h.colaborador_id === horaFiltroColaborador;
    const matchO = !horaFiltroObra        || h.obra_id        === horaFiltroObra;
    return matchC && matchO;
  });

  // Custo de horas: horas × (salario_diario / 8 horas)
  function custoPorHoras(colaboradorId, horasQtd) {
    const c = colaboradores.find((x) => x.id === colaboradorId);
    if (!c?.salario) return 0;
    return (c.salario / 8) * horasQtd;
  }

  const totalHorasFiltradas = horasFiltradas.reduce((a, h) => a + Number(h.horas), 0);
  const totalCustoFiltrado  = horasFiltradas.reduce((a, h) => a + custoPorHoras(h.colaborador_id, Number(h.horas)), 0);

  //  KPIs 
  const ativos = colaboradores.filter((c) => c.status === "Ativo").length;
  const folha  = colaboradores.filter((c) => c.status === "Ativo" && c.salario).reduce((a, c) => a + (c.salario || 0), 0);

  const lista = colaboradores.filter((c) => {
    const matchB = !busca || c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.cargo?.toLowerCase().includes(busca.toLowerCase());
    const matchS = statusF === "Todos" || c.status === statusF;
    return matchB && matchS;
  });

  // helpers
  const nomeColab = (id) => colaboradores.find((c) => c.id === id)?.nome || id;
  const nomeObra  = (id) => obras.find((o) => o.id === id)?.nome?.split("—")[0]?.trim() || id;

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

      {/*  Modais colaborador  */}
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
            <div style={{ fontSize: 22, marginBottom: 8 }}><Trash2 size={13} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Remover colaborador?</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Essa ação não pode ser desfeita.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
              <button onClick={executarDelete} style={{
                padding: "10px 24px", background: C.danger, border: "none",
                borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {/*  Modal folha  */}
      {folhaModal && (
        <Modal title="Lançar folha no Financeiro" onClose={() => setFolhaModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <LabelField>Selecionar colaboradores</LabelField>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { const s = {}; colaboradoresAtivosComSalario.forEach(c => { s[c.id] = true; }); setSelecionados(s); }}
                    style={{ fontSize: 11, color: C.red, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Todos</button>
                  <button onClick={() => setSelecionados({})}
                    style={{ fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Nenhum</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {colaboradoresAtivosComSalario.map((c) => (
                  <label key={c.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${selecionados[c.id] ? C.success + "66" : C.border}`,
                    background: selecionados[c.id] ? C.success + "08" : "transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="checkbox" checked={!!selecionados[c.id]}
                        onChange={() => setSelecionados((p) => ({ ...p, [c.id]: !p[c.id] }))}
                        style={{ accentColor: C.success, width: 16, height: 16 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nome}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{c.especialidade} · {c.cargo || "—"}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: selecionados[c.id] ? C.success : C.muted }}>{fmt(c.salario)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ background: C.darker, borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.muted }}>{colaboradoresAtivosComSalario.filter(c => selecionados[c.id]).length} selecionado(s)</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: totalSelecionado > 0 ? C.success : C.muted }}>{fmt(totalSelecionado)}</span>
            </div>
            <div>
              <LabelField>Obra destino</LabelField>
              <Select value={obraFolha} onChange={setObraFolha}
                options={obras.map((o) => ({ value: o.id, label: o.nome?.split("—")[0]?.trim() }))} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setFolhaModal(false)}>Cancelar</Btn>
              <Btn disabled={!obraFolha || totalSelecionado === 0} onClick={lancarFolha}><DollarSign size={13} /> Lançar {fmt(totalSelecionado)}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/*  Modal alocação  */}
      {alocModal && (
        <Modal title="Nova alocação" onClose={() => setAlocModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <LabelField required>Colaborador</LabelField>
              <Select value={alocForm.colaborador_id}
                onChange={(v) => setAlocForm((f) => ({ ...f, colaborador_id: v }))}
                options={[{ value: "", label: "Selecionar colaborador..." }, ...colaboradores.filter(c => c.status === "Ativo").map((c) => ({ value: c.id, label: c.nome }))]} />
            </div>
            <div>
              <LabelField required>Obra</LabelField>
              <Select value={alocForm.obra_id}
                onChange={(v) => setAlocForm((f) => ({ ...f, obra_id: v }))}
                options={[{ value: "", label: "Selecionar obra..." }, ...obras.map((o) => ({ value: o.id, label: o.nome?.split("—")[0]?.trim() }))]} />
            </div>
            <div>
              <LabelField>Função na obra</LabelField>
              <Select value={alocForm.funcao}
                onChange={(v) => setAlocForm((f) => ({ ...f, funcao: v }))}
                options={FUNCOES.map((f) => ({ value: f, label: f }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <LabelField>Início previsto</LabelField>
                <Input type="date" value={alocForm.data_inicio}
                  onChange={(v) => setAlocForm((f) => ({ ...f, data_inicio: v }))} />
              </div>
              <div>
                <LabelField>Término previsto</LabelField>
                <Input type="date" value={alocForm.data_fim}
                  onChange={(v) => setAlocForm((f) => ({ ...f, data_fim: v }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setAlocModal(false)}>Cancelar</Btn>
              <Btn disabled={!alocForm.colaborador_id || !alocForm.obra_id} onClick={salvarAlocacao}>Salvar alocação</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/*  Modal horas  */}
      {horaModal && (
        <Modal title="Registrar horas" onClose={() => setHoraModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <LabelField required>Colaborador</LabelField>
              <Select value={horaForm.colaborador_id}
                onChange={(v) => setHoraForm((f) => ({ ...f, colaborador_id: v }))}
                options={[{ value: "", label: "Selecionar colaborador..." }, ...colaboradores.map((c) => ({ value: c.id, label: c.nome }))]} />
            </div>
            <div>
              <LabelField required>Obra</LabelField>
              <Select value={horaForm.obra_id}
                onChange={(v) => setHoraForm((f) => ({ ...f, obra_id: v }))}
                options={[{ value: "", label: "Selecionar obra..." }, ...obras.map((o) => ({ value: o.id, label: o.nome?.split("—")[0]?.trim() }))]} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <LabelField required>Data</LabelField>
                <Input type="date" value={horaForm.data}
                  onChange={(v) => setHoraForm((f) => ({ ...f, data: v }))} />
              </div>
              <div>
                <LabelField required>Horas trabalhadas</LabelField>
                <Input type="number" min="0.5" step="0.5" value={horaForm.horas} placeholder="Ex: 8"
                  onChange={(v) => setHoraForm((f) => ({ ...f, horas: v }))} />
              </div>
            </div>
            <div>
              <LabelField>Descrição / atividade</LabelField>
              <Input value={horaForm.descricao} onChange={(v) => setHoraForm((f) => ({ ...f, descricao: v }))}
                placeholder="Ex: Montagem de painéis — bloco A" />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <Btn variant="ghost" onClick={() => setHoraModal(false)}>Cancelar</Btn>
              <Btn disabled={!horaForm.colaborador_id || !horaForm.obra_id || !horaForm.horas} onClick={salvarHoras}>
                ⏱ Registrar
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/*  Layout  */}
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
          <div style={{ display: "flex", gap: 8 }}>
            {tab === "equipe" && folha > 0 && (
              <button onClick={abrirFolhaModal} style={{
                padding: "8px 16px", background: C.success + "18",
                border: `1px solid ${C.success}44`, borderRadius: 8,
                color: C.success, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                <DollarSign size={13} /> Lançar folha ({fmt(folha)})
              </button>
            )}
            {tab === "equipe"   && <Btn onClick={abrirNovo}>+ Novo colaborador</Btn>}
            {tab === "alocacoes" && <Btn onClick={() => setAlocModal(true)}>+ Nova alocação</Btn>}
            {tab === "horas"    && <Btn onClick={() => setHoraModal(true)}>+ Registrar horas</Btn>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <Tab label=" Equipe"        active={tab === "equipe"}       onClick={() => setTab("equipe")} />
          <Tab label=" Empreiteiros" active={tab === "empreiteiros"} onClick={() => setTab("empreiteiros")} />
          <Tab label=" Alocações"    active={tab === "alocacoes"}    onClick={() => setTab("alocacoes")} />
          <Tab label="⏱ Horas"        active={tab === "horas"}        onClick={() => setTab("horas")} />
          <Tab label=" Compliance"  active={tab === "compliance"}   onClick={() => setTab("compliance")} />
          <Tab label=" Horas"       active={tab === "relatorio"}    onClick={() => setTab("relatorio")} />
        </div>

        {/*  Tab: Equipe  */}
        {tab === "equipe" && (
          <>
            {colaboradores.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  value={busca} onChange={(e) => setBusca(e.target.value)}
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

            {colaboradores.length === 0 ? (
              <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: "60px 0", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}></div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nenhum colaborador cadastrado</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Cadastre sua equipe para controlar disponibilidade e custos.</div>
                <Btn onClick={abrirNovo}>+ Cadastrar primeiro colaborador</Btn>
              </div>
            ) : lista.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}>Nenhum resultado para os filtros aplicados.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 14 }}>
                {lista.map((c) => {
                  const alocAtivas = alocacoes.filter((a) => a.colaborador_id === c.id);
                  const certsRaw = certsByColab[c.id] || [];
                  // Deduplica por nr — mantém o mais recente (maior data_validade)
                  const certsMap = {};
                  certsRaw.forEach(cert => {
                    const key = cert.nr || "";
                    if (!certsMap[key] || (cert.data_validade || "") > (certsMap[key].data_validade || "")) certsMap[key] = cert;
                  });
                  const certs = Object.values(certsMap);
                  return (
                    <div key={c.id} style={{
                      background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: "18px 20px",
                      border: `1px solid ${C.border}`, borderTop: `3px solid ${STATUS_COR[c.status] || C.muted}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800 }}>{c.nome}</div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.cargo || "—"} · {c.especialidade}</div>
                        </div>
                        <Badge label={c.status} color={STATUS_COR[c.status] || C.muted} />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                        {c.email    && <div style={{ fontSize: 12, color: C.muted }}> {c.email}</div>}
                        {c.telefone && <div style={{ fontSize: 12, color: C.muted }}><Phone size={12} /> {c.telefone}</div>}
                        {c.salario  && <div style={{ fontSize: 12, color: C.success, fontWeight: 700 }}><DollarSign size={13} /> {fmt(c.salario)}</div>}
                      </div>

                      {alocAtivas.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          {alocAtivas.slice(0, 2).map((a) => (
                            <div key={a.id} style={{
                              fontSize: 11, padding: "4px 8px", borderRadius: 5, marginBottom: 4,
                              background: C.red + "12", color: C.red, fontWeight: 600,
                            }}>
                               {nomeObra(a.obra_id)} {a.funcao ? `· ${a.funcao}` : ""}
                            </div>
                          ))}
                          {alocAtivas.length > 2 && (
                            <div style={{ fontSize: 10, color: C.muted }}>+{alocAtivas.length - 2} obra(s)</div>
                          )}
                        </div>
                      )}

                      {certs.length > 0 && (
                        <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {certs.map(cert => {
                            const cor = cert.status === "Vencida" ? "#ef4444" : cert.status === "Vencendo" ? "#f59e0b" : "#22c55e";
                            const short = cert.nr.replace(/\s*\(.*\)/, "");
                            return (
                              <span key={cert.id} title={`${cert.nr} · ${cert.status}`} style={{
                                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                                background: cor + "20", color: cor, border: `1px solid ${cor}40`,
                                cursor: "default",
                              }}>{short}</span>
                            );
                          })}
                        </div>
                      )}

                      {c.observacoes && (
                        <div style={{ fontSize: 11, color: C.muted, background: C.darker, borderRadius: 6, padding: "8px 10px", marginBottom: 12, lineHeight: 1.5 }}>
                          {c.observacoes}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Btn variant="ghost" size="sm" onClick={() => abrirEditar(c)}><Pencil size={13} /> Editar</Btn>
                        {c.token_ponto && (
                          <Btn variant="ghost" size="sm" onClick={() => gerarCracha(c, certsByColab[c.id] || [])}> Crachá</Btn>
                        )}
                        {c.token_ponto && (
                          <Btn variant="ghost" size="sm" onClick={() => window.open(`${window.location.origin}/portal/${c.token_ponto}`, "_blank")}> Portal</Btn>
                        )}
                        <button onClick={() => setConfirm(c.id)} style={{
                          padding: "6px 12px", background: C.danger + "22",
                          border: `1px solid ${C.danger}44`, borderRadius: 6,
                          color: C.danger, fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                        }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/*  Tab: Empreiteiros  */}
        {tab === "empreiteiros" && (() => {
          const empreiteiros = colaboradores.filter((c) => c.tipo_contrato === "Empreiteiro");
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {empreiteiros.length === 0 ? (
                <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: "50px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}></div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Nenhum empreiteiro cadastrado</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Cadastre um colaborador e defina o tipo como "Empreiteiro"</div>
                </div>
              ) : empreiteiros.map((c) => (
                <div key={c.id} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: "20px", borderLeft: `4px solid #7c3aed` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{c.nome}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{c.especialidade} · {c.cargo || "Empreiteiro"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#7c3aed" }}>R$ {c.valor_producao?.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>por {c.unidade_producao}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setEmpModal({ colaborador: c }); setEmpForm({ obra_id: obras[0]?.id || "", quantidade: "", descricao: "", data_inicio: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), data_fim: new Date().toISOString().slice(0, 10) }); }}
                    style={{ padding: "8px 18px", background: "#7c3aed22", border: "1px solid #7c3aed44", borderRadius: 8, color: "#7c3aed", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                     Apurar Pagamento
                  </button>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Modal apurar empreiteiro */}
        {empModal && (
          <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 460, padding: "28px 28px 22px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}> Apurar Pagamento — {empModal.colaborador.nome}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>OBRA</div>
                  <Select value={empForm.obra_id} onChange={(v) => setEmpForm((f) => ({ ...f, obra_id: v }))}
                    options={obras.map((o) => ({ value: o.id, label: o.nome?.split("—")[0]?.trim() }))} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>DATA INÍCIO</div>
                    <Input type="date" value={empForm.data_inicio} onChange={(v) => setEmpForm((f) => ({ ...f, data_inicio: v })) } />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>DATA FIM</div>
                    <Input type="date" value={empForm.data_fim} onChange={(v) => setEmpForm((f) => ({ ...f, data_fim: v })) } />
                  </div>
                </div>
                <div style={{ background: C.darker, borderRadius: 10, padding: "12px 14px", fontSize: 12, color: C.muted }}>
                  O sistema irá buscar toda a produção não paga no período e gerar um lançamento de despesa no Financeiro.
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
                  <Btn variant="ghost" onClick={() => setEmpModal(null)}>Cancelar</Btn>
                  <Btn disabled={empApurando || !empForm.obra_id || !empForm.data_inicio || !empForm.data_fim} onClick={async () => {
                    setEmpApurando(true);
                    try {
                      const { sb } = await import("../services/supabase");
                      const empresaId = (await import("../store/useAppStore")).default.getState().empresaId;
                      const { data, error } = await sb.rpc("apurar_empreiteiro", {
                        p_empresa_id: empresaId, p_colaborador_id: empModal.colaborador.id,
                        p_obra_id: empForm.obra_id, p_data_inicio: empForm.data_inicio, p_data_fim: empForm.data_fim,
                      });
                      if (error) throw error;
                      mostrarToast(` Lançado R$ ${data.total?.toFixed(2)} — ${data.quantidade} ${data.unidade}`);
                      setEmpModal(null);
                    } catch (e) { mostrarToast(` ${e.message}`, true); }
                    finally { setEmpApurando(false); }
                  }}>
                    {empApurando ? "Apurando..." : "Gerar Pagamento"}
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/*  Tab: Alocações  */}
        {tab === "alocacoes" && (
          <div>
            {/* Filtro por obra */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>FILTRAR OBRA:</span>
              <button
                onClick={() => setAlocFiltroObra("")}
                style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                  fontWeight: !alocFiltroObra ? 700 : 400,
                  border: `1px solid ${!alocFiltroObra ? C.red : C.border}`,
                  background: !alocFiltroObra ? C.red + "18" : "transparent",
                  color: !alocFiltroObra ? C.red : C.muted,
                }}
              >Todas</button>
              {obras.map((o) => (
                <button key={o.id} onClick={() => setAlocFiltroObra(o.id)} style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                  fontWeight: alocFiltroObra === o.id ? 700 : 400,
                  border: `1px solid ${alocFiltroObra === o.id ? C.red : C.border}`,
                  background: alocFiltroObra === o.id ? C.red + "18" : "transparent",
                  color: alocFiltroObra === o.id ? C.red : C.muted,
                }}>{o.nome?.split("—")[0]?.trim()}</button>
              ))}
            </div>

            {alocacoesFiltradas.length === 0 ? (
              <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: "50px 0", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}><ClipboardList size={36} /></div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Nenhuma alocação registrada</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Aloque colaboradores às obras para controlar a equipe por projeto.</div>
                <Btn onClick={() => setAlocModal(true)}>+ Nova alocação</Btn>
              </div>
            ) : (
              <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.darker }}>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Colaborador</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Obra</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Função</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Período</th>
                      <th style={{ padding: "10px 8px", width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {alocacoesFiltradas.map((a, i) => (
                      <tr key={a.id} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{nomeColab(a.colaborador_id)}</td>
                        <td style={{ padding: "12px 16px", color: C.red, fontWeight: 600 }}> {nomeObra(a.obra_id)}</td>
                        <td style={{ padding: "12px 16px", color: C.muted }}>{a.funcao || "—"}</td>
                        <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
                          {a.data_inicio ? new Date(a.data_inicio + "T00:00").toLocaleDateString("pt-BR") : "—"}
                          {" → "}
                          {a.data_fim    ? new Date(a.data_fim    + "T00:00").toLocaleDateString("pt-BR") : "em aberto"}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <button onClick={() => removeAlocacao(a.id)} style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: C.muted, fontSize: 14, padding: 4,
                          }}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/*  Tab: Horas  */}
        {tab === "horas" && (
          <div>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total de horas", value: `${totalHorasFiltradas.toFixed(1)} h`, sub: "no filtro atual", accent: "#4a9eff" },
                { label: "Custo estimado", value: fmt(totalCustoFiltrado), sub: "baseado na diária", accent: C.red },
                { label: "Lançamentos", value: String(horasFiltradas.length), sub: "registros de horas", accent: C.success },
              ].map((k) => (
                <div key={k.label} style={{ background: C.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border}`, borderTop: `3px solid ${k.accent}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <select
                value={horaFiltroColaborador}
                onChange={(e) => setHoraFiltroColaborador(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.text, fontSize: 12, fontFamily: "inherit",
                }}
              >
                <option value="">Todos os colaboradores</option>
                {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select
                value={horaFiltroObra}
                onChange={(e) => setHoraFiltroObra(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.text, fontSize: 12, fontFamily: "inherit",
                }}
              >
                <option value="">Todas as obras</option>
                {obras.map((o) => <option key={o.id} value={o.id}>{o.nome?.split("—")[0]?.trim()}</option>)}
              </select>
            </div>

            {horasFiltradas.length === 0 ? (
              <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, padding: "50px 0", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏱</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Nenhuma hora registrada</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Registre as horas trabalhadas por colaborador e obra.</div>
                <Btn onClick={() => setHoraModal(true)}>+ Registrar horas</Btn>
              </div>
            ) : (
              <div style={{ background: C.surface, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `1px solid ${C.border}`, overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.darker }}>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Data</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Colaborador</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Obra</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Atividade</th>
                      <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Horas</th>
                      <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Custo</th>
                      <th style={{ padding: "10px 8px", width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {horasFiltradas.map((h, i) => {
                      const custo = custoPorHoras(h.colaborador_id, Number(h.horas));
                      return (
                        <tr key={h.id} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
                          <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>
                            {h.data ? new Date(h.data + "T00:00").toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{nomeColab(h.colaborador_id)}</td>
                          <td style={{ padding: "12px 16px", color: C.red, fontWeight: 600 }}> {nomeObra(h.obra_id)}</td>
                          <td style={{ padding: "12px 16px", color: C.muted }}>{h.descricao || "—"}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>{Number(h.horas).toFixed(1)} h</td>
                          <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: custo > 0 ? C.red : C.muted }}>
                            {custo > 0 ? fmt(custo) : "—"}
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <button onClick={() => removeHorasTrabalhadas(h.id)} style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: C.muted, fontSize: 14, padding: 4,
                            }}><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/*  Tab: Compliance  */}
        {tab === "compliance" && (
          <Certificacoes onSaved={recarregarCerts} />
        )}

        {/*  Tab: Relatório de Horas  */}
        {tab === "relatorio" && (
          <div>
            {/* Controls */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={relMes}
                onChange={(e) => setRelMes(Number(e.target.value))}
                style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, fontFamily: "inherit" }}
              >
                {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={relAno}
                onChange={(e) => setRelAno(Number(e.target.value))}
                style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, fontFamily: "inherit" }}
              >
                {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={carregarRelatorio}
                style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${C.red}`, background: C.red + "18", color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >{relLoading ? "Carregando..." : " Atualizar"}</button>
              {relDados.length > 0 && (
                <button
                  onClick={exportarRelatorioExcel}
                  style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${C.success}`, background: C.success + "18", color: C.success, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                > Exportar Excel</button>
              )}
            </div>

            {relLoading ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: C.muted, fontSize: 13 }}>Carregando dados...</div>
            ) : relDados.length === 0 ? (
              <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: "60px 0", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}></div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Nenhum registro de ponto no período</div>
                <div style={{ fontSize: 12, color: C.muted }}>Selecione outro mês ou verifique os registros de ponto eletrônico.</div>
              </div>
            ) : (
              <>
                {/* Bar chart */}
                <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>Horas por colaborador</div>
                  {(() => {
                    const maxH = Math.max(...relDados.map((r) => r.totalHoras), 1);
                    return relDados.map((r) => (
                      <div key={r.id} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{r.nome}</span>
                          <span style={{ fontWeight: 700, color: "#4a9eff" }}>{r.totalHoras.toFixed(1)} h</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 6, background: C.darker, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 6,
                            background: "linear-gradient(90deg, #4a9eff, #2563eb)",
                            width: `${(r.totalHoras / maxH) * 100}%`,
                            transition: "width .4s ease",
                          }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Table */}
                <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 500, borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.darker }}>
                        {["Nome", "Total de Horas", "Dias Trabalhados", "Média Diária", "Obras"].map((h) => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {relDados.map((r, i) => (
                        <tr key={r.id} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700 }}>{r.nome}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 800, color: "#4a9eff" }}>{r.totalHoras.toFixed(1)} h</td>
                          <td style={{ padding: "12px 16px", color: C.muted }}>{r.diasCount}</td>
                          <td style={{ padding: "12px 16px", color: C.muted }}>{r.mediaDiaria.toFixed(1)} h/dia</td>
                          <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{r.obrasNomes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
