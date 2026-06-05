import { useState, useEffect } from "react";
import { C } from "../utils/constants";
import useAppStore from "../store/useAppStore";
import { useToast } from "../hooks/useToast";
import Modal from "../components/ui/Modal";
import Btn from "../components/ui/Btn";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { enviarWhatsApp } from "../services/whatsappService";
import {
  listarConcorrencias, criarConcorrencia, atualizarStatusConcorrencia,
  getResultado, adicionarParticipante,
} from "../services/repositories/concorrenciaRepository";

const BASE_URL = window.location.origin;
const STATUS_COR = { Aberta: C.success, Encerrada: C.muted, Cancelada: C.danger };

function Badge({ status }) {
  const cor = STATUS_COR[status] || C.muted;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 10, background: cor + "22", color: cor }}>{status}</span>;
}

function ItemRow({ item, onChange, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <input value={item.descricao} onChange={(e) => onChange("descricao", e.target.value)}
        placeholder="Descrição do item" style={{ flex: 3, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
      <input value={item.quantidade} onChange={(e) => onChange("quantidade", e.target.value)}
        placeholder="Qtd" type="number" min="0" style={{ flex: 1, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
      <input value={item.unidade} onChange={(e) => onChange("unidade", e.target.value)}
        placeholder="Un" style={{ flex: 1, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
      <button onClick={onRemove} style={{ background: C.danger + "15", border: `1px solid ${C.danger}33`, borderRadius: 6, padding: "7px 10px", color: C.danger, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>✕</button>
    </div>
  );
}

function PartRow({ part, onChange, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <input value={part.nome_fornecedor} onChange={(e) => onChange("nome_fornecedor", e.target.value)}
        placeholder="Nome do fornecedor" style={{ flex: 2, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
      <input value={part.telefone} onChange={(e) => onChange("telefone", e.target.value)}
        placeholder="WhatsApp (opcional)" style={{ flex: 2, padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
      <button onClick={onRemove} style={{ background: C.danger + "15", border: `1px solid ${C.danger}33`, borderRadius: 6, padding: "7px 10px", color: C.danger, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>✕</button>
    </div>
  );
}

export default function Concorrencias() {
  const obras = useAppStore((s) => s.obras);
  const { toast, mostrarToast } = useToast();

  const [lista,     setLista]    = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [sel,       setSel]      = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loadingRes, setLoadingRes] = useState(false);
  const [modal,     setModal]    = useState(false);
  const [saving,    setSaving]   = useState(false);
  const [addPartModal, setAddPartModal] = useState(false);
  const [novoPartForm, setNovoPartForm] = useState({ nome_fornecedor: "", telefone: "" });

  const [form, setForm] = useState({
    titulo: "", descricao: "", prazo_resposta: "", obra_id: "",
    itens: [{ descricao: "", quantidade: "", unidade: "un" }],
    participantes: [{ nome_fornecedor: "", telefone: "" }],
  });

  useEffect(() => {
    listarConcorrencias()
      .then(setLista)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function abrirResultado(conc) {
    setSel(conc);
    setLoadingRes(true);
    try {
      const res = await getResultado(conc.id);
      setResultado(res);
    } catch { mostrarToast("❌ Erro ao carregar resultado"); }
    finally { setLoadingRes(false); }
  }

  async function criar() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        obra_id: form.obra_id || null,
        prazo_resposta: form.prazo_resposta || null,
        itens: form.itens.filter((i) => i.descricao.trim()),
        participantes: form.participantes.filter((p) => p.nome_fornecedor.trim()),
      };
      await criarConcorrencia(payload);
      const atualizada = await listarConcorrencias();
      setLista(atualizada);
      setModal(false);
      mostrarToast("✅ Concorrência criada!");
    } catch (e) { mostrarToast("❌ " + e.message); }
    finally { setSaving(false); }
  }

  async function encerrar(conc) {
    if (!confirm("Encerrar esta concorrência?")) return;
    await atualizarStatusConcorrencia(conc.id, "Encerrada");
    setLista((l) => l.map((c) => c.id === conc.id ? { ...c, status: "Encerrada" } : c));
    if (sel?.id === conc.id) setSel((s) => ({ ...s, status: "Encerrada" }));
    mostrarToast("Concorrência encerrada.");
  }

  async function adicionarParticipanteNovo() {
    if (!novoPartForm.nome_fornecedor.trim()) return;
    try {
      await adicionarParticipante(sel.id, novoPartForm);
      const atualizada = await listarConcorrencias();
      setLista(atualizada);
      setSel(atualizada.find((c) => c.id === sel.id));
      await abrirResultado(atualizada.find((c) => c.id === sel.id));
      setAddPartModal(false);
      setNovoPartForm({ nome_fornecedor: "", telefone: "" });
      mostrarToast("✅ Fornecedor adicionado!");
    } catch (e) { mostrarToast("❌ " + e.message); }
  }

  function setItem(i, k, v) {
    setForm((f) => { const itens = [...f.itens]; itens[i] = { ...itens[i], [k]: v }; return { ...f, itens }; });
  }
  function setPart(i, k, v) {
    setForm((f) => { const participantes = [...f.participantes]; participantes[i] = { ...participantes[i], [k]: v }; return { ...f, participantes }; });
  }

  // ── Calcular vencedor por item e total ────────────────────────────────────────
  function calcularResultado(res) {
    if (!res) return null;
    const { itens, participantes, propostas } = res;

    // Por item: qual participante tem menor preço
    const menorPorItem = {};
    itens.forEach((it) => {
      const propsItem = propostas.filter((p) => p.concorrencia_item_id === it.id && p.preco_unitario > 0);
      if (!propsItem.length) return;
      const menor = propsItem.reduce((a, b) => (a.preco_unitario < b.preco_unitario ? a : b));
      menorPorItem[it.id] = menor.participante_id;
    });

    // Total por participante
    const totalPorPart = {};
    participantes.forEach((p) => {
      const total = propostas
        .filter((pr) => pr.participante_id === p.id && pr.preco_unitario > 0)
        .reduce((acc, pr) => {
          const it = itens.find((i) => i.id === pr.concorrencia_item_id);
          return acc + pr.preco_unitario * (Number(it?.quantidade) || 1);
        }, 0);
      totalPorPart[p.id] = total;
    });

    // Vencedor geral
    const comTotal = participantes.filter((p) => totalPorPart[p.id] > 0);
    const vencedor = comTotal.length ? comTotal.reduce((a, b) => totalPorPart[a.id] < totalPorPart[b.id] ? a : b) : null;

    return { menorPorItem, totalPorPart, vencedor };
  }

  const analise = calcularResultado(resultado);

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* Lista esquerda — oculta no mobile quando há seleção */}
      <div style={{
        width: isMobile ? "100%" : 320,
        flexShrink: 0,
        borderRight: isMobile ? "none" : `1px solid ${C.border}`,
        display: isMobile && sel ? "none" : "flex",
        flexDirection: "column",
      }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Concorrências</h3>
            <Btn size="sm" onClick={() => {
              setForm({ titulo: "", descricao: "", prazo_resposta: "", obra_id: "", itens: [{ descricao: "", quantidade: "", unidade: "un" }], participantes: [{ nome_fornecedor: "", telefone: "" }] });
              setModal(true);
            }}>+ Nova</Btn>
          </div>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{lista.length} processo{lista.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>Carregando...</div> :
            lista.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: C.muted, fontSize: 13 }}>
                Nenhuma concorrência criada ainda.
              </div>
            ) : lista.map((c) => (
              <div key={c.id} onClick={() => abrirResultado(c)} style={{
                padding: "14px 16px", cursor: "pointer", borderBottom: `1px solid ${C.border}`,
                background: sel?.id === c.id ? C.red + "08" : "#fff",
                borderLeft: sel?.id === c.id ? `3px solid ${C.red}` : "3px solid transparent",
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.titulo}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{(c.concorrencia_participantes || []).length} fornecedores · {(c.concorrencia_itens || []).length} itens</span>
                  <Badge status={c.status} />
                </div>
                {c.prazo_resposta && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                    Prazo: {new Date(c.prazo_resposta + "T00:00").toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>

      {/* Painel direito — ocupa tela toda no mobile */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px" : "24px", display: isMobile && !sel ? "none" : "block" }}>
        {!sel ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Selecione uma concorrência</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>ou crie um novo processo de cotação</div>
          </div>
        ) : loadingRes ? (
          <div style={{ color: C.muted, padding: "40px 0", textAlign: "center" }}>Carregando propostas...</div>
        ) : resultado && (
          <>
            {/* Botão voltar mobile */}
            {isMobile && (
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.red, padding: "0 0 16px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                ← Voltar
              </button>
            )}
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>{resultado.concorrencia.titulo}</h2>
                {resultado.concorrencia.descricao && <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{resultado.concorrencia.descricao}</p>}
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: C.muted }}>
                  {resultado.concorrencia.prazo_resposta && <span>📅 Prazo: {new Date(resultado.concorrencia.prazo_resposta + "T00:00").toLocaleDateString("pt-BR")}</span>}
                  <span>👥 {resultado.participantes.length} fornecedores · {resultado.participantes.filter((p) => p.respondido).length} responderam</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Badge status={resultado.concorrencia.status} />
                {resultado.concorrencia.status === "Aberta" && (
                  <>
                    <button onClick={() => setAddPartModal(true)} style={{ padding: "6px 12px", background: "#4a9eff22", border: "1px solid #4a9eff44", borderRadius: 7, fontSize: 12, fontWeight: 700, color: "#4a9eff", cursor: "pointer", fontFamily: "inherit" }}>+ Fornecedor</button>
                    <button onClick={() => encerrar(resultado.concorrencia)} style={{ padding: "6px 12px", background: C.danger + "15", border: `1px solid ${C.danger}33`, borderRadius: 7, fontSize: 12, fontWeight: 700, color: C.danger, cursor: "pointer", fontFamily: "inherit" }}>Encerrar</button>
                  </>
                )}
              </div>
            </div>

            {/* Vencedor */}
            {analise?.vencedor && (
              <div style={{ background: C.success + "10", border: `1px solid ${C.success}33`, borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 28 }}>🏆</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.success, letterSpacing: 1, textTransform: "uppercase" }}>Melhor proposta geral</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{analise.vencedor.nome_fornecedor}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>Total estimado: <strong style={{ color: C.success }}>R$ {analise.totalPorPart[analise.vencedor.id].toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                </div>
              </div>
            )}

            {/* Links dos fornecedores */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Links para fornecedores</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {resultado.participantes.map((p) => {
                  const link = `${BASE_URL}/concorrencia/${p.token}`;
                  return (
                    <div key={p.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p.nome_fornecedor}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2, wordBreak: "break-all" }}>{link}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: p.respondido ? C.success + "22" : C.warning + "22", color: p.respondido ? C.success : C.warning }}>
                          {p.respondido ? "✓ Enviou" : "Pendente"}
                        </span>
                        <button onClick={() => { navigator.clipboard?.writeText(link); mostrarToast("Link copiado!"); }} style={{ padding: "5px 10px", background: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>📋</button>
                        {p.telefone && (
                          <button onClick={() => enviarWhatsApp(p.telefone, `Olá ${p.nome_fornecedor.split(" ")[0]}! Você foi convidado para participar do nosso processo de cotação "${resultado.concorrencia.titulo}". Acesse o link para enviar sua proposta: ${link}`)}
                            style={{ padding: "5px 10px", background: "#25D36622", border: "1px solid #25D36644", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#25D366", cursor: "pointer", fontFamily: "inherit" }}>📲 WA</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabela comparativa */}
            {resultado.participantes.some((p) => p.respondido) && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Comparativo de propostas</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.darker }}>
                        <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: 11, color: C.muted, letterSpacing: 0.5, borderBottom: `1px solid ${C.border}` }}>ITEM</th>
                        <th style={{ padding: "10px 10px", textAlign: "center", fontWeight: 700, fontSize: 10, color: C.muted, borderBottom: `1px solid ${C.border}` }}>QTD</th>
                        {resultado.participantes.filter((p) => p.respondido).map((p) => (
                          <th key={p.id} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: analise?.vencedor?.id === p.id ? C.success : C.muted, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                            {analise?.vencedor?.id === p.id ? "🏆 " : ""}{p.nome_fornecedor}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.itens.map((it, idx) => (
                        <tr key={it.id} style={{ background: idx % 2 === 0 ? "#fff" : C.darker }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{it.descricao}</td>
                          <td style={{ padding: "10px 10px", textAlign: "center", color: C.muted, fontSize: 12, borderBottom: `1px solid ${C.border}` }}>{it.quantidade ? `${it.quantidade} ${it.unidade}` : "—"}</td>
                          {resultado.participantes.filter((p) => p.respondido).map((p) => {
                            const prop = resultado.propostas.find((pr) => pr.participante_id === p.id && pr.concorrencia_item_id === it.id);
                            const isMenor = analise?.menorPorItem[it.id] === p.id;
                            return (
                              <td key={p.id} style={{ padding: "10px 12px", textAlign: "right", fontWeight: isMenor ? 800 : 400, color: isMenor ? C.success : C.text, borderBottom: `1px solid ${C.border}`, background: isMenor ? C.success + "08" : "transparent" }}>
                                {prop?.preco_unitario > 0 ? (
                                  <div>
                                    <div>R$ {Number(prop.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                                    {prop.observacao && <div style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>{prop.observacao}</div>}
                                    {isMenor && <div style={{ fontSize: 10, color: C.success }}>▼ menor</div>}
                                  </div>
                                ) : <span style={{ color: C.muted }}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: C.darker, fontWeight: 800 }}>
                        <td colSpan={2} style={{ padding: "12px 14px", borderTop: `2px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.muted }}>TOTAL ESTIMADO</td>
                        {resultado.participantes.filter((p) => p.respondido).map((p) => {
                          const total = analise?.totalPorPart[p.id] || 0;
                          const isWinner = analise?.vencedor?.id === p.id;
                          return (
                            <td key={p.id} style={{ padding: "12px 12px", textAlign: "right", borderTop: `2px solid ${C.border}`, color: isWinner ? C.success : C.text, fontWeight: 900, fontSize: 15 }}>
                              {total > 0 ? `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {!resultado.participantes.some((p) => p.respondido) && (
              <div style={{ textAlign: "center", padding: "48px 0", color: C.muted, fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                Aguardando respostas dos fornecedores.
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal criar concorrência */}
      {modal && (
        <Modal title="🤝 Nova Concorrência" onClose={() => setModal(false)}>
          <div className="sf-col">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>TÍTULO *</div>
              <Input value={form.titulo} onChange={(v) => setForm((f) => ({ ...f, titulo: v }))} placeholder="Ex: Cotação de perfis de aço — Obra Centro" />
            </div>
            <div className="sf-grid-2">
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>OBRA</div>
                <Select value={form.obra_id} onChange={(v) => setForm((f) => ({ ...f, obra_id: v }))} options={[{ value: "", label: "Nenhuma" }, ...obras.map((o) => ({ value: o.id, label: o.nome }))]} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>PRAZO PARA RESPOSTA</div>
                <Input value={form.prazo_resposta} onChange={(v) => setForm((f) => ({ ...f, prazo_resposta: v }))} type="date" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>DESCRIÇÃO</div>
              <Input value={form.descricao} onChange={(v) => setForm((f) => ({ ...f, descricao: v }))} placeholder="Instruções ou condições gerais" />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>ITENS *</div>
                <button onClick={() => setForm((f) => ({ ...f, itens: [...f.itens, { descricao: "", quantidade: "", unidade: "un" }] }))}
                  style={{ fontSize: 12, fontWeight: 700, color: C.red, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ Item</button>
              </div>
              {form.itens.map((it, i) => (
                <ItemRow key={i} item={it} onChange={(k, v) => setItem(i, k, v)} onRemove={() => setForm((f) => ({ ...f, itens: f.itens.filter((_, j) => j !== i) }))} />
              ))}
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>FORNECEDORES CONVIDADOS</div>
                <button onClick={() => setForm((f) => ({ ...f, participantes: [...f.participantes, { nome_fornecedor: "", telefone: "" }] }))}
                  style={{ fontSize: 12, fontWeight: 700, color: C.red, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ Fornecedor</button>
              </div>
              {form.participantes.map((p, i) => (
                <PartRow key={i} part={p} onChange={(k, v) => setPart(i, k, v)} onRemove={() => setForm((f) => ({ ...f, participantes: f.participantes.filter((_, j) => j !== i) }))} />
              ))}
            </div>

            <div className="sf-actions">
              <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn disabled={!form.titulo || form.itens.every((i) => !i.descricao) || saving} onClick={criar}>
                {saving ? "Criando…" : "🤝 Criar concorrência"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal adicionar participante */}
      {addPartModal && (
        <Modal title="+ Adicionar fornecedor" onClose={() => setAddPartModal(false)}>
          <div className="sf-col">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>NOME *</div>
              <Input value={novoPartForm.nome_fornecedor} onChange={(v) => setNovoPartForm((f) => ({ ...f, nome_fornecedor: v }))} placeholder="Nome do fornecedor" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>WHATSAPP</div>
              <Input value={novoPartForm.telefone} onChange={(v) => setNovoPartForm((f) => ({ ...f, telefone: v }))} placeholder="(11) 99999-9999" />
            </div>
            <div className="sf-actions">
              <Btn variant="ghost" onClick={() => setAddPartModal(false)}>Cancelar</Btn>
              <Btn disabled={!novoPartForm.nome_fornecedor.trim()} onClick={adicionarParticipanteNovo}>Adicionar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#1a1a1a", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>{toast}</div>
      )}
    </div>
  );
}
