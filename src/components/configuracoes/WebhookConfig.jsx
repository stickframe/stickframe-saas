import { useState, useEffect } from "react";
import {
  EVENTOS_DISPONIVEIS,
  listarWebhooks,
  criarWebhook,
  atualizarWebhook,
  deletarWebhook,
  listarLogs,
} from "../../services/repositories/webhookRepository";

const C = {
  surface:  "var(--surface, #1a1a2e)",
  border:   "var(--border, #2a2a3e)",
  muted:    "var(--muted, #6b7280)",
  text:     "var(--text, #f0f0f0)",
  red:      "var(--red, #981915)",
  success:  "var(--success, #22c55e)",
  danger:   "var(--danger, #ef4444)",
  darker:   "var(--darker, #12121e)",
  warning:  "var(--warning, #f59e0b)",
};

function Badge({ children, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
      background: (color || C.red) + "22", color: color || C.red,
      border: `1px solid ${(color || C.red)}44`,
    }}>{children}</span>
  );
}

function Modal({ onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "#0009", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: 28, width: "100%", maxWidth: 520,
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function WebhookConfig() {
  const [webhooks, setWebhooks]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [logs, setLogs]             = useState({});
  const [toast, setToast]           = useState(null);
  const [form, setForm]             = useState({ url: "", eventos: [] });
  const [saving, setSaving]         = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  async function carregar() {
    setLoading(true);
    try { setWebhooks(await listarWebhooks()); }
    catch (e) { showToast("Erro ao carregar webhooks: " + e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, []);

  async function handleExpand(wh) {
    if (expandedId === wh.id) { setExpandedId(null); return; }
    setExpandedId(wh.id);
    if (!logs[wh.id]) {
      try {
        const data = await listarLogs(wh.id);
        setLogs((prev) => ({ ...prev, [wh.id]: data }));
      } catch (_) {}
    }
  }

  async function handleToggleAtivo(wh) {
    try {
      const updated = await atualizarWebhook(wh.id, { ativo: !wh.ativo });
      setWebhooks((prev) => prev.map((w) => w.id === wh.id ? updated : w));
    } catch (e) { showToast("Erro: " + e.message); }
  }

  async function handleDeletar(wh) {
    if (!confirm(`Excluir webhook para ${wh.url}?`)) return;
    try {
      await deletarWebhook(wh.id);
      setWebhooks((prev) => prev.filter((w) => w.id !== wh.id));
      showToast("Webhook excluído.");
    } catch (e) { showToast("Erro: " + e.message); }
  }

  async function handleCriar() {
    if (!form.url || form.eventos.length === 0) {
      showToast("Preencha a URL e selecione ao menos um evento.");
      return;
    }
    setSaving(true);
    try {
      const created = await criarWebhook({ url: form.url, eventos: form.eventos });
      setWebhooks((prev) => [...prev, created]);
      setShowModal(false);
      setForm({ url: "", eventos: [] });
      showToast("Webhook criado com sucesso!");
    } catch (e) { showToast("Erro: " + e.message); }
    finally { setSaving(false); }
  }

  async function handleTestar(wh) {
    try {
      await fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-StickFrame-Event": "teste", "X-StickFrame-Secret": wh.segredo || "" },
        body: JSON.stringify({ evento: "teste", timestamp: new Date().toISOString(), mensagem: "Webhook de teste do StickFrame" }),
      });
      showToast("Requisição de teste enviada!");
    } catch (e) { showToast("Erro ao testar: " + e.message); }
  }

  function toggleEvento(v) {
    setForm((f) => ({
      ...f,
      eventos: f.eventos.includes(v) ? f.eventos.filter((e) => e !== v) : [...f.eventos, v],
    }));
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 1100,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 32px #0006", color: C.text,
        }}>{toast}</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Webhooks configurados</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Notificações automáticas para sistemas externos via HTTP POST.</div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "9px 18px", background: C.red, border: "none",
            borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 12,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          + Novo webhook
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>Carregando…</div>
      ) : webhooks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}></div>
          Nenhum webhook configurado. Clique em "Novo webhook" para começar.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {webhooks.map((wh) => (
            <div key={wh.id} style={{
              border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden",
              background: C.darker,
            }}>
              {/* Row principal */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                cursor: "pointer",
              }}
                onClick={() => handleExpand(wh)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {wh.url}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {(wh.eventos || []).map((ev) => {
                      const label = EVENTOS_DISPONIVEIS.find((e) => e.value === ev)?.label || ev;
                      return <Badge key={ev}>{label}</Badge>;
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {/* Toggle ativo */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleAtivo(wh); }}
                    style={{
                      padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                      border: "none", cursor: "pointer", fontFamily: "inherit",
                      background: wh.ativo ? C.success + "22" : C.muted + "22",
                      color: wh.ativo ? C.success : C.muted,
                    }}
                  >
                    {wh.ativo ? "Ativo" : "Inativo"}
                  </button>
                  {/* Testar */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTestar(wh); }}
                    style={{
                      padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                      border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit",
                      background: "transparent", color: C.muted,
                    }}
                  >
                    Testar
                  </button>
                  {/* Deletar */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletar(wh); }}
                    style={{
                      padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                      border: `1px solid ${C.danger}44`, cursor: "pointer", fontFamily: "inherit",
                      background: C.danger + "11", color: C.danger,
                    }}
                  >
                    
                  </button>
                  <span style={{ color: C.muted, fontSize: 10 }}>{expandedId === wh.id ? "" : ""}</span>
                </div>
              </div>

              {/* Expanded: segredo + logs */}
              {expandedId === wh.id && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px" }}>
                  {/* Segredo */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                      Chave secreta (HMAC)
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        readOnly
                        value={wh.segredo || "—"}
                        style={{
                          flex: 1, padding: "8px 12px", background: C.surface,
                          border: `1px solid ${C.border}`, borderRadius: 8,
                          fontFamily: "monospace", fontSize: 11, color: C.text,
                        }}
                      />
                      <button
                        onClick={() => { navigator.clipboard.writeText(wh.segredo || ""); showToast("Segredo copiado!"); }}
                        style={{
                          padding: "8px 14px", background: C.surface, border: `1px solid ${C.border}`,
                          borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, color: C.text,
                        }}
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  {/* Logs */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                      Últimas 20 entregas
                    </div>
                    {!logs[wh.id] ? (
                      <div style={{ color: C.muted, fontSize: 12 }}>Carregando logs…</div>
                    ) : logs[wh.id].length === 0 ? (
                      <div style={{ color: C.muted, fontSize: 12 }}>Nenhuma entrega registrada ainda.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {logs[wh.id].map((log) => (
                          <div key={log.id} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 12px", borderRadius: 8, background: C.surface,
                            border: `1px solid ${C.border}`, fontSize: 11,
                          }}>
                            <span style={{
                              fontWeight: 700, padding: "2px 7px", borderRadius: 5, fontSize: 10,
                              background: log.erro ? C.danger + "22" : log.status_code >= 200 && log.status_code < 300 ? C.success + "22" : C.warning + "22",
                              color: log.erro ? C.danger : log.status_code >= 200 && log.status_code < 300 ? C.success : C.warning,
                            }}>
                              {log.erro ? "ERRO" : log.status_code || "—"}
                            </span>
                            <span style={{ color: C.muted, fontFamily: "monospace" }}>{log.evento}</span>
                            <span style={{ color: C.muted, marginLeft: "auto" }}>
                              {log.erro ? log.erro.slice(0, 50) : new Date(log.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal novo webhook */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>Novo webhook</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>URL do endpoint *</div>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://seu-sistema.com/webhook"
              style={{
                width: "100%", padding: "10px 13px", background: C.darker,
                border: `1px solid ${C.border}`, borderRadius: 8,
                color: C.text, fontFamily: "inherit", fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Eventos *</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {EVENTOS_DISPONIVEIS.map((ev) => (
                <label key={ev.value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.eventos.includes(ev.value)}
                    onChange={() => toggleEvento(ev.value)}
                    style={{ width: 15, height: 15, accentColor: C.red }}
                  />
                  {ev.label}
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: "monospace" }}>({ev.value})</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: "10px 20px", background: "transparent", border: `1px solid ${C.border}`,
                borderRadius: 9, color: C.muted, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCriar}
              disabled={saving || !form.url || form.eventos.length === 0}
              style={{
                padding: "10px 22px", background: saving ? C.muted : C.red,
                border: "none", borderRadius: 9, color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {saving ? "Criando…" : "Criar webhook"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
