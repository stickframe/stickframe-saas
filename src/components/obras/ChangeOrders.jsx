import { useEffect, useState } from "react";
import {
  listarChangeOrders,
  criarChangeOrder,
  aprovarChangeOrder,
  reprovarChangeOrder,
  deletarChangeOrder,
} from "../../services/repositories/changeOrderRepository";
import Modal from "../ui/Modal";
import Btn from "../ui/Btn";
import Input from "../ui/Input";
import { useToast } from "../../hooks/useToast";
import { useObraPermission } from "../../hooks/useObraPermission";

const fmtC = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("pt-BR") : "—";

const TIPO_OPTS = [
  { value: "aditivo",   label: "Aditivo — aumenta o contrato" },
  { value: "supressao", label: "Supressão — reduz o contrato" },
  { value: "prazo",     label: "Prazo — altera prazo sem valor" },
];

const STATUS_STYLE = {
  pendente:  { bg: "#fff8e1", color: "#7a5400", border: "#b97a00", label: "Pendente" },
  aprovado:  { bg: "#e6f9f0", color: "#1a6b40", border: "#2e9e5b", label: "Aprovado" },
  reprovado: { bg: "#fde8e8", color: "#8b1515", border: "#c0392b", label: "Reprovado" },
};

const EMPTY_FORM = { titulo: "", descricao: "", justificativa: "", tipo: "aditivo", valor: "", prazo_dias: "" };

export default function ChangeOrders({ obraId, onContratoAtualizado }) {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const { mostrarToast } = useToast();
  const { podeEditar, podeGerenciar } = useObraPermission(obraId);

  useEffect(() => {
    if (!obraId) return;
    listarChangeOrders(obraId).then(setLista).finally(() => setLoading(false));
  }, [obraId]);

  const totalAprovado = lista
    .filter((c) => c.status === "aprovado" && c.tipo !== "prazo")
    .reduce((s, c) => s + Number(c.valor), 0);

  const pendentes = lista.filter((c) => c.status === "pendente").length;

  const handleSave = async () => {
    if (!form.titulo) return;
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao,
        justificativa: form.justificativa,
        tipo: form.tipo,
        valor: form.tipo === "supressao" ? -Math.abs(Number(form.valor) || 0) : (form.tipo === "prazo" ? 0 : Number(form.valor) || 0),
        prazo_dias: Number(form.prazo_dias) || 0,
      };
      const novo = await criarChangeOrder(obraId, payload);
      setLista((prev) => [...prev, novo]);
      setModal(false);
      setForm(EMPTY_FORM);
      mostrarToast("✅ Aditivo criado — aguardando aprovação");
    } catch (e) {
      mostrarToast("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAprovar = async (id) => {
    try {
      const updated = await aprovarChangeOrder(id, obraId);
      setLista((prev) => prev.map((c) => c.id === id ? updated : c));
      onContratoAtualizado?.();
      mostrarToast("✅ Aditivo aprovado — contrato atualizado");
    } catch (e) {
      mostrarToast("❌ " + e.message);
    }
  };

  const handleReprovar = async (id) => {
    try {
      const updated = await reprovarChangeOrder(id);
      setLista((prev) => prev.map((c) => c.id === id ? updated : c));
      mostrarToast("🗑 Aditivo reprovado");
    } catch (e) {
      mostrarToast("❌ " + e.message);
    }
  };

  const handleDeletar = async (id) => {
    try {
      await deletarChangeOrder(id);
      setLista((prev) => prev.filter((c) => c.id !== id));
      mostrarToast("🗑 Aditivo excluído");
    } catch (e) {
      mostrarToast("❌ " + e.message);
    }
  };

  if (loading) return <div style={{ padding: "16px 0", color: "var(--muted)", fontSize: 13 }}>Carregando aditivos…</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
            Aditivos de Contrato ({lista.length})
          </div>
          {lista.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Impacto aprovado: <strong style={{ color: totalAprovado >= 0 ? "#2e9e5b" : "#c0392b" }}>{totalAprovado >= 0 ? "+" : ""}{fmtC(totalAprovado)}</strong>
              {pendentes > 0 && <span style={{ marginLeft: 8, color: "#b97a00" }}>· {pendentes} pendente(s)</span>}
            </div>
          )}
        </div>
        {podeEditar() && (
          <Btn variant="primary" size="sm" onClick={() => setModal(true)}>+ Novo aditivo</Btn>
        )}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 13 }}>
          Nenhum aditivo registrado.<br />
          <span style={{ fontSize: 11 }}>Aditivos formalizam alterações de escopo, valor e prazo.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lista.map((co) => {
            const st = STATUS_STYLE[co.status] || STATUS_STYLE.pendente;
            const isExpanded = expanded === co.id;
            return (
              <div
                key={co.id}
                style={{
                  borderRadius: 10, border: `1px solid ${st.border}`,
                  background: "var(--surface)", overflow: "hidden",
                }}
              >
                {/* Row */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
                  onClick={() => setExpanded(isExpanded ? null : co.id)}
                >
                  <div style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                    background: st.bg, color: st.color, border: `1px solid ${st.border}`, flexShrink: 0,
                  }}>
                    CO-{String(co.numero).padStart(3, "0")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{co.titulo}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {co.tipo === "prazo" ? `${co.prazo_dias > 0 ? "+" : ""}${co.prazo_dias} dias` : fmtC(co.valor)}
                      {" · "}{fmtDate(co.created_at)}
                      {co.criado_por?.nome && ` · ${co.criado_por.nome}`}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: st.bg, color: st.color,
                  }}>
                    {st.label}
                  </div>
                  {co.tipo !== "prazo" && (
                    <div style={{
                      fontSize: 15, fontWeight: 800,
                      color: Number(co.valor) >= 0 ? "#2e9e5b" : "#c0392b",
                      minWidth: 90, textAlign: "right",
                    }}>
                      {Number(co.valor) >= 0 ? "+" : ""}{fmtC(co.valor)}
                    </div>
                  )}
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>{isExpanded ? "▲" : "▼"}</span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: "12px 16px 16px", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
                    {co.descricao && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Descrição</div>
                        <div style={{ fontSize: 13, color: "var(--text)" }}>{co.descricao}</div>
                      </div>
                    )}
                    {co.justificativa && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Justificativa</div>
                        <div style={{ fontSize: 13, color: "var(--text)" }}>{co.justificativa}</div>
                      </div>
                    )}
                    {co.status === "aprovado" && co.aprovado_por?.nome && (
                      <div style={{ fontSize: 11, color: "#2e9e5b" }}>
                        ✓ Aprovado por {co.aprovado_por.nome} em {fmtDate(co.aprovado_em)}
                      </div>
                    )}
                    {co.status === "reprovado" && co.aprovado_por?.nome && (
                      <div style={{ fontSize: 11, color: "#c0392b" }}>
                        ✗ Reprovado por {co.aprovado_por.nome} em {fmtDate(co.aprovado_em)}
                      </div>
                    )}
                    {co.status === "pendente" && podeGerenciar() && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <Btn variant="success" size="sm" onClick={() => handleAprovar(co.id)}>✓ Aprovar</Btn>
                        <Btn variant="danger"  size="sm" onClick={() => handleReprovar(co.id)}>✗ Reprovar</Btn>
                        <Btn variant="ghost"   size="sm" onClick={() => handleDeletar(co.id)}>🗑 Excluir</Btn>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal novo aditivo */}
      {modal && (
        <Modal title="Novo aditivo de contrato" onClose={() => { setModal(false); setForm(EMPTY_FORM); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 360 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Tipo *</div>
              <div style={{ display: "flex", gap: 6 }}>
                {TIPO_OPTS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm((f) => ({ ...f, tipo: t.value }))}
                    style={{
                      flex: 1, padding: "8px 4px", borderRadius: 8, border: "1px solid var(--border)",
                      background: form.tipo === t.value ? "var(--red)" : "var(--surface)",
                      color: form.tipo === t.value ? "#fff" : "var(--text)",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {t.value === "aditivo" ? "📈 Aditivo" : t.value === "supressao" ? "📉 Supressão" : "📅 Prazo"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Título *</div>
              <Input value={form.titulo} onChange={(v) => setForm((f) => ({ ...f, titulo: v })) } placeholder="Ex: Ampliação da garagem" />
            </div>

            {form.tipo !== "prazo" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                  Valor (R$) *
                </div>
                <Input value={form.valor} onChange={(v) => setForm((f) => ({ ...f, valor: v }))} type="number" min="0" placeholder="0,00" />
              </div>
            )}

            {form.tipo === "prazo" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Dias (positivo = prorrogação)</div>
                <Input value={form.prazo_dias} onChange={(v) => setForm((f) => ({ ...f, prazo_dias: v }))} type="number" placeholder="Ex: 30" />
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Descrição do escopo</div>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva o que está sendo alterado no contrato…"
                rows={3}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  border: "1px solid var(--border)", fontSize: 13,
                  background: "var(--surface)", color: "var(--text)",
                  fontFamily: "inherit", resize: "vertical",
                }}
              />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Justificativa</div>
              <textarea
                value={form.justificativa}
                onChange={(e) => setForm((f) => ({ ...f, justificativa: e.target.value }))}
                placeholder="Motivo da alteração (imprevisto, solicitação do cliente…)"
                rows={2}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  border: "1px solid var(--border)", fontSize: 13,
                  background: "var(--surface)", color: "var(--text)",
                  fontFamily: "inherit", resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4, borderTop: "1px solid var(--border)" }}>
              <Btn variant="ghost" size="sm" onClick={() => { setModal(false); setForm(EMPTY_FORM); }}>Cancelar</Btn>
              <Btn variant="primary" size="sm" onClick={handleSave} disabled={saving || !form.titulo || (form.tipo !== "prazo" && !form.valor)}>
                {saving ? "Salvando…" : "Criar aditivo"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
