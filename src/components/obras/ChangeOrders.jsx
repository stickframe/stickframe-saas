import { useEffect, useState } from "react";
import {
  listarChangeOrders,
  criarChangeOrder,
  atualizarChangeOrder,
  aprovarChangeOrder,
  rejeitarChangeOrder,
  deletarChangeOrder,
} from "../../services/repositories/changeOrderRepository";
import Modal from "../ui/Modal";
import Btn from "../ui/Btn";
import Input from "../ui/Input";
import { useToast } from "../../hooks/useToast";
import { useObraPermission } from "../../hooks/useObraPermission";
import { C } from "../../utils/constants";
import { fmt } from "../../utils/format";

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");

const TIPO_COLORS = {
  Aditivo:   { bg: C.steel + "15", color: C.steel, border: C.steel + "44" },
  Supressão: { bg: C.danger + "15", color: C.danger, border: C.danger + "44" },
  Alteração: { bg: C.warning + "15", color: C.warning, border: C.warning + "44" },
};

const STATUS_COLORS = {
  Rascunho:  { bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" },
  Pendente:  { bg: C.warning + "15", color: C.warning, border: C.warning + "44" },
  Aprovado:  { bg: C.success + "15", color: C.success, border: C.success + "44" },
  Rejeitado: { bg: C.danger + "15", color: C.danger, border: C.danger + "44" },
};

const TIPO_OPTS = ["Aditivo", "Supressão", "Alteração"];

const EMPTY_FORM = {
  titulo: "",
  tipo: "Aditivo",
  descricao: "",
  valor: "",
  impacto_prazo: "",
  solicitado_por: "",
  justificativa: "",
};

export default function ChangeOrders({ obraId, userPerfil }) {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null); // CO being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [rejeitarModal, setRejeitarModal] = useState(null); // id being rejected
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const { mostrarToast } = useToast();
  const { podeEditar, podeGerenciar } = useObraPermission(obraId);

  const isDiretor = userPerfil === "diretor" || podeGerenciar();

  useEffect(() => {
    if (!obraId) return;
    listarChangeOrders(obraId)
      .then(setLista)
      .catch((e) => mostrarToast("Erro ao carregar Change Orders: " + e.message))
      .finally(() => setLoading(false));
  }, [obraId]);

  const totalAprovado = lista
    .filter((co) => co.status === "Aprovado")
    .reduce((s, co) => s + Number(co.valor || 0), 0);

  const diasImpacto = lista
    .filter((co) => co.status === "Aprovado")
    .reduce((s, co) => s + Number(co.impacto_prazo || 0), 0);

  const abrirNovo = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const abrirEditar = (co) => {
    setEditando(co.id);
    setForm({
      titulo: co.titulo || "",
      tipo: co.tipo || "Aditivo",
      descricao: co.descricao || "",
      valor: co.valor != null ? String(co.valor) : "",
      impacto_prazo: co.impacto_prazo != null ? String(co.impacto_prazo) : "",
      solicitado_por: co.solicitado_por || "",
      justificativa: co.justificativa || "",
    });
    setModal(true);
  };

  const fecharModal = () => {
    setModal(false);
    setEditando(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) return mostrarToast("Título é obrigatório");
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        tipo: form.tipo,
        descricao: form.descricao || null,
        valor: Number(form.valor) || 0,
        impacto_prazo: Number(form.impacto_prazo) || 0,
        solicitado_por: form.solicitado_por || null,
        justificativa: form.justificativa || null,
        obra_id: obraId,
      };

      if (editando) {
        const updated = await atualizarChangeOrder(editando, payload);
        setLista((prev) => prev.map((co) => (co.id === editando ? updated : co)));
        mostrarToast("Change Order atualizado");
      } else {
        const novo = await criarChangeOrder(payload);
        setLista((prev) => [novo, ...prev]);
        mostrarToast("Change Order criado");
      }
      fecharModal();
    } catch (e) {
      mostrarToast("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarAprovacao = async (id) => {
    try {
      const updated = await atualizarChangeOrder(id, { status: "Pendente" });
      setLista((prev) => prev.map((co) => (co.id === id ? updated : co)));
      mostrarToast("Enviado para aprovação");
    } catch (e) {
      mostrarToast("Erro: " + e.message);
    }
  };

  const handleAprovar = async (id) => {
    try {
      const updated = await aprovarChangeOrder(id, "");
      setLista((prev) => prev.map((co) => (co.id === id ? updated : co)));
      mostrarToast("Change Order aprovado");
    } catch (e) {
      mostrarToast("Erro: " + e.message);
    }
  };

  const handleRejeitar = async () => {
    if (!rejeitarModal) return;
    try {
      const updated = await rejeitarChangeOrder(rejeitarModal, motivoRejeicao);
      setLista((prev) => prev.map((co) => (co.id === rejeitarModal ? updated : co)));
      mostrarToast("Change Order rejeitado");
      setRejeitarModal(null);
      setMotivoRejeicao("");
    } catch (e) {
      mostrarToast("Erro: " + e.message);
    }
  };

  const handleReabrir = async (id) => {
    try {
      const updated = await atualizarChangeOrder(id, { status: "Rascunho", observacoes: null });
      setLista((prev) => prev.map((co) => (co.id === id ? updated : co)));
      mostrarToast("Change Order reaberto como Rascunho");
    } catch (e) {
      mostrarToast("Erro: " + e.message);
    }
  };

  const handleDeletar = async (id) => {
    if (!window.confirm("Excluir este Change Order?")) return;
    try {
      await deletarChangeOrder(id);
      setLista((prev) => prev.filter((co) => co.id !== id));
      mostrarToast("Change Order excluído");
    } catch (e) {
      mostrarToast("Erro: " + e.message);
    }
  };

  if (loading) {
    return <div style={{ padding: "16px 0", color: C.muted, fontSize: 13 }}>Carregando Change Orders…</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Change Orders</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            Aditivos contratuais formais · {lista.length} registro{lista.length !== 1 ? "s" : ""}
            {lista.length > 0 && (
              <span style={{ marginLeft: 8 }}>
                · Aprovados:{" "}
                <strong style={{ color: totalAprovado >= 0 ? C.success : C.danger }}>
                  {totalAprovado >= 0 ? "+" : ""}{fmt(totalAprovado)}
                </strong>
                {diasImpacto !== 0 && (
                  <span style={{ marginLeft: 6, color: diasImpacto > 0 ? C.warning : C.success }}>
                    · {diasImpacto > 0 ? "+" : ""}{diasImpacto} dia{Math.abs(diasImpacto) !== 1 ? "s" : ""}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        {podeEditar() && (
          <Btn variant="primary" size="sm" onClick={abrirNovo}>+ Novo CO</Btn>
        )}
      </div>

      {/* List */}
      {lista.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: 13 }}>
          Nenhum Change Order registrado.<br />
          <span style={{ fontSize: 11 }}>Change Orders formalizam alterações de escopo e protegem a empresa legalmente.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lista.map((co) => {
            const tipoCor = TIPO_COLORS[co.tipo] || TIPO_COLORS.Aditivo;
            const stCor = STATUS_COLORS[co.status] || STATUS_COLORS.Rascunho;
            return (
              <div
                key={co.id}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${stCor.border}`,
                  background: C.surface || "var(--surface)",
                  overflow: "hidden",
                }}
              >
                {/* Main row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", flexWrap: "wrap" }}>
                  {/* Número badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                    background: stCor.bg, color: stCor.color, border: `1px solid ${stCor.border}`,
                    flexShrink: 0,
                  }}>
                    {co.numero || "CO-???"}
                  </span>

                  {/* Tipo badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
                    background: tipoCor.bg, color: tipoCor.color, border: `1px solid ${tipoCor.border}`,
                    flexShrink: 0,
                  }}>
                    {co.tipo}
                  </span>

                  {/* Status badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
                    background: stCor.bg, color: stCor.color,
                    flexShrink: 0,
                  }}>
                    {co.status}
                  </span>

                  {/* Title + meta */}
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{co.titulo}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {fmt(co.valor || 0)}
                      {Number(co.impacto_prazo) !== 0 && (
                        <span style={{ marginLeft: 6 }}>
                          · {co.impacto_prazo > 0 ? "+" : ""}{co.impacto_prazo} dia{Math.abs(co.impacto_prazo) !== 1 ? "s" : ""}
                        </span>
                      )}
                      {co.data_solicitacao && (
                        <span style={{ marginLeft: 6 }}>· {fmtDate(co.data_solicitacao)}</span>
                      )}
                    </div>
                  </div>

                  {/* Lock icon for approved */}
                  {co.status === "Aprovado" && (
                    <span style={{ fontSize: 16, color: "#15803d" }} title="Aprovado — bloqueado"></span>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {co.status === "Rascunho" && podeEditar() && (
                      <>
                        <Btn variant="primary" size="sm" onClick={() => handleEnviarAprovacao(co.id)}>
                          Enviar para aprovação
                        </Btn>
                        <Btn variant="ghost" size="sm" onClick={() => abrirEditar(co)}>Editar</Btn>
                        <Btn variant="danger" size="sm" onClick={() => handleDeletar(co.id)}>Excluir</Btn>
                      </>
                    )}
                    {co.status === "Pendente" && (
                      <>
                        {isDiretor && (
                          <>
                            <Btn variant="success" size="sm" onClick={() => handleAprovar(co.id)}> Aprovar</Btn>
                            <Btn variant="danger" size="sm" onClick={() => { setRejeitarModal(co.id); setMotivoRejeicao(""); }}>
                               Rejeitar
                            </Btn>
                          </>
                        )}
                        {podeEditar() && (
                          <Btn variant="ghost" size="sm" onClick={() => abrirEditar(co)}>Editar</Btn>
                        )}
                      </>
                    )}
                    {co.status === "Rejeitado" && podeEditar() && (
                      <Btn variant="ghost" size="sm" onClick={() => handleReabrir(co.id)}>Reabrir</Btn>
                    )}
                  </div>
                </div>

                {/* Extra details row */}
                {(co.descricao || co.justificativa || co.solicitado_por || co.observacoes) && (
                  <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${stCor.border}`, background: "var(--bg)", fontSize: 12, color: C.muted, display: "flex", flexDirection: "column", gap: 4 }}>
                    {co.solicitado_por && <div><strong>Solicitado por:</strong> {co.solicitado_por}</div>}
                    {co.descricao && <div><strong>Descrição:</strong> {co.descricao}</div>}
                    {co.justificativa && <div><strong>Justificativa:</strong> {co.justificativa}</div>}
                    {co.observacoes && <div style={{ color: C.danger }}><strong>Obs:</strong> {co.observacoes}</div>}
                    {co.status === "Aprovado" && co.data_aprovacao && (
                      <div style={{ color: C.success }}>Aprovado em {fmtDate(co.data_aprovacao)}{co.aprovado_por ? ` por ${co.aprovado_por}` : ""}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary bar */}
      {lista.length > 0 && (
        <div style={{
          marginTop: 16, padding: "10px 16px", borderRadius: 8,
          background: C.success + "15", border: "1px solid " + C.success + "44",
          fontSize: 13, color: C.success, fontWeight: 600,
          display: "flex", gap: 16, flexWrap: "wrap",
        }}>
          <span>Total aprovado: {fmt(totalAprovado)}</span>
          {diasImpacto !== 0 && (
            <span>· {diasImpacto > 0 ? "+" : ""}{diasImpacto} dia{Math.abs(diasImpacto) !== 1 ? "s" : ""} no prazo</span>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <Modal
          title={editando ? "Editar Change Order" : "Novo Change Order"}
          onClose={fecharModal}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 360 }}>
            {/* Título */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Título *
              </div>
              <Input
                value={form.titulo}
                onChange={(v) => setForm((f) => ({ ...f, titulo: v }))}
                placeholder="Ex: Ampliação da área de serviço"
              />
            </div>

            {/* Tipo segmented */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Tipo
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {TIPO_OPTS.map((t) => {
                  const tc = TIPO_COLORS[t];
                  const active = form.tipo === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                      style={{
                        flex: 1, padding: "7px 4px", borderRadius: 7,
                        border: `1px solid ${active ? tc.border : "var(--border)"}`,
                        background: active ? tc.bg : "var(--surface)",
                        color: active ? tc.color : C.muted,
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Descrição
              </div>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva as alterações de escopo…"
                rows={3}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  border: "1px solid var(--border)", fontSize: 13,
                  background: "var(--surface)", color: "var(--text)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Valor + impacto prazo */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                  Valor (R$)
                </div>
                <Input
                  value={form.valor}
                  onChange={(v) => setForm((f) => ({ ...f, valor: v }))}
                  type="number"
                  placeholder="0,00"
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                  Impacto prazo (dias)
                </div>
                <Input
                  value={form.impacto_prazo}
                  onChange={(v) => setForm((f) => ({ ...f, impacto_prazo: v }))}
                  type="number"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Solicitado por */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Solicitado por
              </div>
              <Input
                value={form.solicitado_por}
                onChange={(v) => setForm((f) => ({ ...f, solicitado_por: v }))}
                placeholder="Nome do solicitante"
              />
            </div>

            {/* Justificativa */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Justificativa
              </div>
              <textarea
                value={form.justificativa}
                onChange={(e) => setForm((f) => ({ ...f, justificativa: e.target.value }))}
                placeholder="Motivo da alteração (imprevisto, solicitação do cliente…)"
                rows={2}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  border: "1px solid var(--border)", fontSize: 13,
                  background: "var(--surface)", color: "var(--text)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4, borderTop: "1px solid var(--border)" }}>
              <Btn variant="ghost" size="sm" onClick={fecharModal}>Cancelar</Btn>
              <Btn
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving || !form.titulo.trim()}
              >
                {saving ? "Salvando…" : editando ? "Salvar alterações" : "Criar Change Order"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejeitarModal && (
        <Modal title="Rejeitar Change Order" onClose={() => { setRejeitarModal(null); setMotivoRejeicao(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 320 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Motivo da rejeição
              </div>
              <textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Descreva o motivo da rejeição…"
                rows={3}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  border: "1px solid var(--border)", fontSize: 13,
                  background: "var(--surface)", color: "var(--text)",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: 4 }}>
              <Btn variant="ghost" size="sm" onClick={() => { setRejeitarModal(null); setMotivoRejeicao(""); }}>Cancelar</Btn>
              <Btn variant="danger" size="sm" onClick={handleRejeitar}>Confirmar rejeição</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
