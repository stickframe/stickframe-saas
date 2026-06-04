import { useState, useEffect, useCallback } from "react";
import { C } from "../../utils/constants";
import Btn from "../ui/Btn";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import {
  listarCertificacoes,
  criarCertificacao,
  atualizarCertificacao,
  deletarCertificacao,
} from "../../services/repositories/certificacaoRepository";
import useAppStore from "../../store/useAppStore";

const NR_PRESETS = [
  "NR-5 (CIPA)",
  "NR-6 (EPI)",
  "NR-10 (Elétrica)",
  "NR-12 (Máquinas)",
  "NR-18 (Construção Civil)",
  "NR-23 (Incêndio)",
  "NR-35 (Altura)",
  "NR-33 (Espaço Confinado)",
  "NR-34 (Náutico)",
  "Habilitação",
  "ASO (Exame Médico)",
];

const STATUS_CONFIG = {
  Vencida:  { color: "#ef4444", bg: "#ef444418", label: "Vencida",  order: 0 },
  Vencendo: { color: "#f59e0b", bg: "#f59e0b18", label: "Vencendo", order: 1 },
  Vigente:  { color: "#22c55e", bg: "#22c55e18", label: "Vigente",  order: 2 },
};

const FORM_VAZIO = {
  colaborador_id: "",
  nr: "",
  descricao: "",
  data_emissao: "",
  data_validade: "",
  instituicao: "",
  carga_horaria: "",
  observacoes: "",
};

function LabelField({ children, required }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 6, textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Vigente;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}40`,
    }}>
      {cfg.label}
    </span>
  );
}

export default function Certificacoes({ colaboradorId = null }) {
  const colaboradores = useAppStore((s) => s.colaboradores);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // "novo" | "editar"
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarCertificacoes(colaboradorId);
      setCerts(data);
    } catch (e) {
      console.error("[Certificacoes]", e.message);
    } finally {
      setLoading(false);
    }
  }, [colaboradorId]);

  useEffect(() => { carregar(); }, [carregar]);

  const vencidas  = certs.filter(c => c.status === "Vencida");
  const vencendo  = certs.filter(c => c.status === "Vencendo");
  const vigentes  = certs.filter(c => c.status === "Vigente");
  const ordenados = [...vencidas, ...vencendo, ...vigentes];

  async function salvar() {
    if (!form.data_validade || !form.nr || !form.colaborador_id) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        carga_horaria: form.carga_horaria ? parseInt(form.carga_horaria, 10) : null,
      };
      if (modal === "editar" && editId) {
        const updated = await atualizarCertificacao(editId, payload);
        setCerts(cs => cs.map(c => c.id === editId ? { ...updated, diasRestantes: Math.ceil((new Date(updated.data_validade) - new Date()) / 86400000), status: calcStatus(updated.data_validade) } : c));
      } else {
        const created = await criarCertificacao(payload);
        setCerts(cs => [...cs, { ...created, diasRestantes: Math.ceil((new Date(created.data_validade) - new Date()) / 86400000), status: calcStatus(created.data_validade) }]);
      }
      setModal(null);
      setForm(FORM_VAZIO);
    } catch (e) {
      console.error("[Certificacoes]", e.message);
    } finally {
      setSaving(false);
    }
  }

  function calcStatus(validade) {
    const dias = Math.ceil((new Date(validade) - new Date()) / 86400000);
    if (dias < 0) return "Vencida";
    if (dias <= 30) return "Vencendo";
    return "Vigente";
  }

  async function excluir(id) {
    await deletarCertificacao(id);
    setCerts(cs => cs.filter(c => c.id !== id));
    setConfirm(null);
  }

  function abrirEditar(c) {
    setEditId(c.id);
    setForm({
      colaborador_id: c.colaborador_id || "",
      nr: c.nr || "",
      descricao: c.descricao || "",
      data_emissao: c.data_emissao || "",
      data_validade: c.data_validade || "",
      instituicao: c.instituicao || "",
      carga_horaria: c.carga_horaria != null ? String(c.carga_horaria) : "",
      observacoes: c.observacoes || "",
    });
    setModal("editar");
  }

  function abrirNovo() {
    setForm({ ...FORM_VAZIO, colaborador_id: colaboradorId || "" });
    setEditId(null);
    setModal("novo");
  }

  const colOpts = colaboradores.map(c => ({ value: c.id, label: c.nome }));

  return (
    <div>
      {/* Alert banner */}
      {(vencidas.length > 0 || vencendo.length > 0) && (
        <div style={{
          marginBottom: 16,
          padding: "12px 18px",
          borderRadius: 10,
          background: vencidas.length > 0 ? "#ef444418" : "#f59e0b18",
          border: `1px solid ${vencidas.length > 0 ? "#ef4444" : "#f59e0b"}40`,
          color: vencidas.length > 0 ? "#ef4444" : "#f59e0b",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span>{vencidas.length > 0 ? "🔴" : "🟡"}</span>
          <span>
            {vencidas.length > 0 && `${vencidas.length} certificação(ões) vencida(s)`}
            {vencidas.length > 0 && vencendo.length > 0 && " · "}
            {vencendo.length > 0 && `${vencendo.length} vencendo em breve`}
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
          Certificações NR
          {certs.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: C.muted, fontWeight: 400 }}>({certs.length} total)</span>}
        </div>
        <Btn onClick={abrirNovo}>+ Nova certificação</Btn>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: C.muted, fontSize: 13, padding: "20px 0" }}>Carregando...</div>
      ) : ordenados.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 13, padding: "20px 0", textAlign: "center" }}>
          Nenhuma certificação registrada. Clique em "+ Nova certificação" para começar.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Colaborador", "NR", "Descrição", "Validade", "Dias restantes", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenados.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}20` }}>
                  <td style={{ padding: "10px 12px", color: C.text, fontWeight: 600 }}>
                    {c.colaborador?.nome || "—"}
                    {c.colaborador?.cargo && <div style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{c.colaborador.cargo}</div>}
                  </td>
                  <td style={{ padding: "10px 12px", color: C.text, fontWeight: 700 }}>{c.nr}</td>
                  <td style={{ padding: "10px 12px", color: C.muted }}>{c.descricao || "—"}</td>
                  <td style={{ padding: "10px 12px", color: C.text }}>
                    {c.data_validade ? new Date(c.data_validade + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: c.diasRestantes < 0 ? "#ef4444" : c.diasRestantes <= 30 ? "#f59e0b" : C.text, fontWeight: 600 }}>
                    {c.diasRestantes < 0 ? `${Math.abs(c.diasRestantes)} dias atrás` : `${c.diasRestantes} dias`}
                  </td>
                  <td style={{ padding: "10px 12px" }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => abrirEditar(c)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Editar</button>
                      <button onClick={() => setConfirm(c.id)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid #ef444440`, background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Nova / Editar */}
      {modal && (
        <Modal title={modal === "editar" ? "Editar Certificação" : "Nova Certificação"} onClose={() => { setModal(null); setForm(FORM_VAZIO); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Colaborador */}
            <div>
              <LabelField required>Colaborador</LabelField>
              <Select
                value={form.colaborador_id}
                onChange={set("colaborador_id")}
                options={[{ value: "", label: "Selecionar..." }, ...colOpts]}
              />
            </div>

            {/* NR quick-select chips */}
            <div>
              <LabelField required>NR / Certificação</LabelField>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {NR_PRESETS.map(nr => (
                  <button key={nr} onClick={() => set("nr")(nr)} style={{
                    padding: "4px 10px", borderRadius: 16, fontSize: 11, cursor: "pointer",
                    fontFamily: "inherit", fontWeight: form.nr === nr ? 700 : 400,
                    border: `1px solid ${form.nr === nr ? C.red : C.border}`,
                    background: form.nr === nr ? C.red + "18" : "transparent",
                    color: form.nr === nr ? C.red : C.muted,
                  }}>{nr}</button>
                ))}
              </div>
              <Input value={form.nr} onChange={set("nr")} placeholder="Ou digite livremente..." />
            </div>

            {/* Descrição */}
            <div>
              <LabelField>Descrição</LabelField>
              <Input value={form.descricao} onChange={set("descricao")} placeholder="Ex: Trabalho em Altura" />
            </div>

            {/* Datas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <LabelField>Data de Emissão</LabelField>
                <Input type="date" value={form.data_emissao} onChange={set("data_emissao")} />
              </div>
              <div>
                <LabelField required>Data de Validade</LabelField>
                <Input type="date" value={form.data_validade} onChange={set("data_validade")} />
              </div>
            </div>

            {/* Instituição e carga horária */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <LabelField>Instituição</LabelField>
                <Input value={form.instituicao} onChange={set("instituicao")} placeholder="Ex: SENAI" />
              </div>
              <div>
                <LabelField>Carga Horária (h)</LabelField>
                <Input type="number" min="0" value={form.carga_horaria} onChange={set("carga_horaria")} placeholder="Ex: 8" />
              </div>
            </div>

            {/* Observações */}
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
              <Btn variant="ghost" onClick={() => { setModal(null); setForm(FORM_VAZIO); }}>Cancelar</Btn>
              <Btn disabled={!form.nr || !form.data_validade || !form.colaborador_id || saving} onClick={salvar}>
                {saving ? "Salvando..." : modal === "editar" ? "Salvar alterações" : "Criar certificação"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {confirm && (
        <Modal title="Excluir certificação?" onClose={() => setConfirm(null)}>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Btn>
            <Btn onClick={() => excluir(confirm)} style={{ background: "#ef4444" }}>Excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
