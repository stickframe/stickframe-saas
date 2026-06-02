import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import { LOGO_STICKFRAME, storageUrl } from "../utils/cdn";

export default function PortalOnline() {
  const { token } = useParams();
  const [obra,       setObra]    = useState(null);
  const [financeiro, setFin]     = useState({ contrato: 0, lancamentos: [] });
  const [diario,     setDiario]  = useState([]);
  const [medicoes,   setMedicoes]= useState([]);
  const [outrasObras,setOutras]  = useState([]);
  const [fotos,      setFotos]   = useState([]);
  const [vistorias,  setVistorias] = useState([]);
  const [mensagens,  setMensagens] = useState([]);
  const [empresa,    setEmpresa] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [docUploading, setDocUploading] = useState(false);
  const [sigNome,    setSigNome] = useState("");
  const [sigEnv,     setSigEnv] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [fotoAberta, setFotoAberta] = useState(null);
  const [loading,    setLoading] = useState(true);
  const [chatNome,   setChatNome] = useState("");
  const [chatMsg,    setChatMsg] = useState("");
  const [chatEnv,    setChatEnv] = useState(false);
  const msgEndRef = useRef(null);
  const hoje = new Date().toLocaleDateString("pt-BR");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await sb.rpc("get_portal_data", { p_token: token });
        if (error || !data) { setLoading(false); return; }
        setObra(data.obra);
        setFin({ contrato: data.obra.contrato || 0, lancamentos: data.financeiro || [] });
        setDiario(data.diario || []);
        setMedicoes(data.medicoes || []);
        setOutras(data.outras_obras || []);
        setFotos(data.fotos || []);
        setVistorias(data.vistorias || []);
        setEmpresa(data.empresa || null);
        setMensagens(data.mensagens || []);
        setDocumentos(data.documentos || []);

        // Realtime: escuta novas mensagens da construtora em tempo real
        if (data.obra?.id) {
          sb.channel(`portal-msgs-${data.obra.id}`)
            .on("postgres_changes", {
              event: "INSERT", schema: "public", table: "portal_mensagens",
              filter: `obra_id=eq.${data.obra.id}`,
            }, (payload) => {
              setMensagens((prev) => {
                if (prev.find((m) => m.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
            })
            .subscribe();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Scroll automático para última mensagem
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid #333", borderTop: "3px solid #981915", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 13, color: "#666" }}>Carregando...</div>
    </div>
  );

  if (!obra) return (
    <div style={{ minHeight: "100vh", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0", textAlign: "center" }}>Link inválido ou expirado</div>
      <div style={{ fontSize: 13, color: "#888", textAlign: "center" }}>Entre em contato com a Stick Frame para obter o link correto.</div>
    </div>
  );

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const rec       = financeiro.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
  const pctPago   = financeiro.contrato > 0 ? Math.round((rec / financeiro.contrato) * 100) : 0;
  const aReceber  = Math.max(financeiro.contrato - rec, 0);
  const faseIdx   = FASES.indexOf(obra.fase);

  const medAprovadas = medicoes.filter((m) => m.status === "Aprovada");
  const medPendentes = medicoes.filter((m) => m.status === "Pendente");
  const totalMedAprov = medAprovadas.reduce((a, m) => a + (m.valor || 0), 0);
  const proxMedicao   = medPendentes[0] || null;

  const prazoFim    = obra.prazo_fim ? new Date(obra.prazo_fim) : null;
  const diasRestantes = prazoFim ? Math.ceil((prazoFim - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const atrasada    = diasRestantes !== null && diasRestantes < 0 && obra.status !== "Concluída";

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1A1A1A", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={empresa?.logo_url || LOGO_STICKFRAME} style={{ width: 32, height: 32, borderRadius: 7, objectFit: "contain" }} alt="Logo da empresa" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, color: "#fff" }}>
              <span style={{ color: "#555" }}>STICK</span><span style={{ color: "#981915" }}>FRAME</span>
            </div>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 1.5 }}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#444" }}>Atualizado em {hoje}</div>
      </div>

      {/* Switcher: outras obras do mesmo cliente */}
      {outrasObras.length > 0 && (
        <div style={{ background: "#111", borderBottom: "1px solid #222", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 0, minWidth: "max-content" }}>
            {/* obra atual */}
            <div style={{ padding: "10px 18px", borderBottom: "2px solid #981915", color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", cursor: "default" }}>
              {obra.nome?.split("—")[0]?.trim()}
            </div>
            {outrasObras.map((o) => (
              <a
                key={o.id}
                href={`/portal/${o.token_portal}`}
                style={{ padding: "10px 18px", borderBottom: "2px solid transparent", color: "#888", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none", display: "block" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#ccc"; e.currentTarget.style.borderBottomColor = "#444"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderBottomColor = "transparent"; }}
              >
                {o.nome?.split("—")[0]?.trim()}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#981915,#6e1210)", padding: "28px 20px", color: "#fff" }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, opacity: .7, marginBottom: 6 }}>ACOMPANHAMENTO DE OBRA</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{obra.nome}</div>
        <div style={{ fontSize: 13, opacity: .8, marginBottom: 16 }}>Cliente: {obra.cliente}</div>

        {/* KPIs rápidos no hero */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "Progresso", value: `${obra.progresso || 0}%` },
            { label: "Fase atual", value: obra.fase?.split(" ")[0] || "—" },
            { label: prazoFim ? (atrasada ? "Atraso" : "Dias restantes") : "Status",
              value: prazoFim ? (atrasada ? `${Math.abs(diasRestantes)}d` : `${diasRestantes}d`) : obra.status,
              alert: atrasada },
          ].map((k) => (
            <div key={k.label} style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 12px", border: k.alert ? "1px solid rgba(255,200,0,.5)" : "1px solid rgba(255,255,255,.15)" }}>
              <div style={{ fontSize: 9, opacity: .7, marginBottom: 4, letterSpacing: 1 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.alert ? "#ffd700" : "#fff" }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px", maxWidth: 520, margin: "0 auto" }}>

        {/* Progresso + Fases */}
        <Card title="Etapas da Obra">
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#888" }}>Progresso geral</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#981915" }}>{obra.progresso || 0}%</span>
            </div>
            <Bar val={obra.progresso || 0} color="linear-gradient(90deg,#981915,#6e1210)" />
          </div>
          {FASES.map((f, i) => {
            const done = i < faseIdx, curr = i === faseIdx;
            return (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < FASES.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "#2e9e5b" : curr ? "#981915" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: done || curr ? "#fff" : "#bbb", flexShrink: 0 }}>
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: 13, color: done ? "#2e9e5b" : curr ? "#1a1a1a" : "#bbb", fontWeight: curr ? 700 : 400, flex: 1 }}>{f}</div>
                {curr && <span style={{ background: "#981915", color: "#fff", borderRadius: 10, padding: "2px 10px", fontSize: 9, fontWeight: 700 }}>EM ANDAMENTO</span>}
                {done && <span style={{ fontSize: 10, color: "#2e9e5b" }}>✓</span>}
              </div>
            );
          })}
        </Card>

        {/* Financeiro detalhado */}
        {financeiro.contrato > 0 && (
          <Card title="Resumo Financeiro">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              <FinItem label="Contrato total" value={fmt(financeiro.contrato)} />
              <FinItem label="Pago"           value={fmt(rec)}               color="#2e9e5b" />
              <FinItem label="A receber"      value={fmt(aReceber)}          color={aReceber > 0 ? "#b97a00" : "#2e9e5b"} />
            </div>
            <Bar val={pctPago} color="linear-gradient(90deg,#2e9e5b,#1a7a40)" />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888", marginTop: 6 }}>
              <span style={{ color: "#2e9e5b", fontWeight: 700 }}>{pctPago}% pago</span>
              <span>{100 - pctPago}% restante</span>
            </div>
          </Card>
        )}

        {/* Medições */}
        {medicoes.length > 0 && (
          <Card title="Medições">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <FinItem label="Aprovadas" value={`${medAprovadas.length} · ${fmt(totalMedAprov)}`} color="#2e9e5b" />
              <FinItem label="Pendentes" value={`${medPendentes.length}`} color={medPendentes.length > 0 ? "#b97a00" : "#888"} />
            </div>

            {medicoes.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Medição {m.numero}</div>
                  {m.descricao && <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{m.descricao}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: m.status === "Aprovada" ? "#2e9e5b" : "#b97a00" }}>{fmt(m.valor)}</div>
                  {m.status === "Aprovada" ? (
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#2e9e5b", marginTop: 2 }}>✓ Aprovada</div>
                  ) : (
                    <button
                      onClick={async () => {
                        const { error } = await sb.rpc("portal_aprovar_medicao", { p_token: token, p_medicao_id: m.id });
                        if (!error) setMedicoes((prev) => prev.map((x) => x.id === m.id ? { ...x, status: "Aprovada" } : x));
                      }}
                      style={{ marginTop: 4, background: "#2e9e5b", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                    >
                      Aprovar ✓
                    </button>
                  )}
                </div>
              </div>
            ))}

            {proxMedicao && (
              <div style={{ marginTop: 12, background: "#fffbf0", border: "1px solid #f0d080", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#b97a00", marginBottom: 4 }}>PRÓXIMA MEDIÇÃO PENDENTE</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#555" }}>Medição {proxMedicao.numero}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#b97a00" }}>{fmt(proxMedicao.valor)}</span>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Prazo */}
        {prazoFim && (
          <Card title="Prazo">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Entrega prevista</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{prazoFim.toLocaleDateString("pt-BR")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {obra.status === "Concluída" ? (
                  <div style={{ background: "#2e9e5b", color: "#fff", borderRadius: 10, padding: "6px 16px", fontSize: 12, fontWeight: 700 }}>✓ Entregue</div>
                ) : atrasada ? (
                  <div style={{ background: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 10, padding: "6px 16px" }}>
                    <div style={{ fontSize: 9, color: "#c0392b", fontWeight: 700, marginBottom: 2 }}>ATRASO</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#c0392b" }}>{Math.abs(diasRestantes)}d</div>
                  </div>
                ) : (
                  <div style={{ background: "#f0f8f0", border: "1px solid #a8d5b0", borderRadius: 10, padding: "6px 16px" }}>
                    <div style={{ fontSize: 9, color: "#2e9e5b", fontWeight: 700, marginBottom: 2 }}>RESTAM</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#2e9e5b" }}>{diasRestantes}d</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Diário de obra */}
        {diario.length > 0 && (
          <Card title="Últimas Atualizações">
            {diario.map((r, i) => (
              <div key={r.id || i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < diario.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>{r.data} · {r.clima} · {r.turno}</div>
                <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{r.atividades}</div>
                {r.ocorrencias && (
                  <div style={{ background: "#fff5f5", borderLeft: "3px solid #981915", padding: "6px 10px", borderRadius: "0 6px 6px 0", fontSize: 12, color: "#555", marginTop: 8, lineHeight: 1.5 }}>
                    ⚠️ {r.ocorrencias}
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}

        {/* Fotos da obra */}
        {fotos.length > 0 && (
          <Card title={`Fotos da Obra (${fotos.length})`}>
            {/* Agrupar por fase */}
            {Object.entries(
              fotos.reduce((acc, f) => {
                const fase = f.fase || "Geral";
                if (!acc[fase]) acc[fase] = [];
                acc[fase].push(f);
                return acc;
              }, {})
            ).map(([fase, imgs]) => (
              <div key={fase} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1, marginBottom: 8 }}>{fase.toUpperCase()}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {imgs.map((f) => {
                    const url = f.storage_path
                      ? storageUrl(f.storage_path)
                      : null;
                    if (!url) return null;
                    return (
                      <div key={f.id} onClick={() => setFotoAberta(url)}
                        style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "#f0f0f0" }}>
                        <img src={url} alt={f.nome || "Imagem da obra"} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Vistorias */}
        {vistorias.length > 0 && (
          <Card title="Vistorias e Inspeções">
            {vistorias.map((v, i) => {
              const aprovada = v.resultado === "Aprovado";
              const reprovada = v.resultado === "Reprovado";
              const itens = Array.isArray(v.itens) ? v.itens : [];
              const totalItens = itens.length;
              const confItens = itens.filter((it) => it.conforme).length;
              const pct = totalItens > 0 ? Math.round((confItens / totalItens) * 100) : null;
              return (
                <div key={v.id || i} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i < vistorias.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{v.servico || v.tipo}</div>
                      <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{v.fase} · {v.data} · {v.responsavel}</div>
                    </div>
                    <span style={{
                      padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: aprovada ? "#dcfce7" : reprovada ? "#fee2e2" : "#fff7ed",
                      color: aprovada ? "#166534" : reprovada ? "#991b1b" : "#92400e",
                    }}>
                      {aprovada ? "✓ Aprovado" : reprovada ? "✗ Reprovado" : v.resultado || "Pendente"}
                    </span>
                  </div>
                  {pct !== null && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888", marginBottom: 3 }}>
                        <span>Conformidade</span><span style={{ fontWeight: 700, color: aprovada ? "#2e9e5b" : "#b97a00" }}>{pct}%</span>
                      </div>
                      <Bar val={pct} color={aprovada ? "linear-gradient(90deg,#2e9e5b,#1a7a40)" : "linear-gradient(90deg,#f59e0b,#d97706)"} />
                    </div>
                  )}
                  {v.observacoes && (
                    <div style={{ background: "#f9f9f9", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: "#555", lineHeight: 1.5 }}>
                      {v.observacoes}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}

        {/* Lightbox de foto */}
        {fotoAberta && (
          <div onClick={() => setFotoAberta(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <img src={fotoAberta} alt="Foto ampliada"
              style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 10, objectFit: "contain" }} />
            <button onClick={() => setFotoAberta(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 22, width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Chat com a empresa */}
        <Card title="Mensagens">
          {mensagens.length === 0 && (
            <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: "12px 0" }}>Nenhuma mensagem ainda. Envie uma abaixo.</div>
          )}
          <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {mensagens.map((m, i) => {
              const isClient = m.autor === "cliente";
              return (
                <div key={m.id || i} style={{ display: "flex", justifyContent: isClient ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "78%", background: isClient ? "#981915" : "#f0f0f0",
                    color: isClient ? "#fff" : "#222", borderRadius: isClient ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                    padding: "8px 12px", fontSize: 12, lineHeight: 1.5,
                  }}>
                    {!isClient && <div style={{ fontSize: 9, fontWeight: 700, color: "#981915", marginBottom: 3 }}>🏗️ {m.nome || "Equipe Stick Frame"}</div>}
                    <div>{m.mensagem}</div>
                    <div style={{ fontSize: 9, opacity: .6, marginTop: 4, textAlign: "right" }}>
                      {m.created_at ? new Date(m.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={msgEndRef} />
          </div>
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
            <input
              value={chatNome}
              onChange={(e) => setChatNome(e.target.value)}
              placeholder="Seu nome"
              style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 8, outline: "none" }}
            />
            <textarea
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              placeholder="Escreva sua mensagem..."
              rows={3}
              style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 8, resize: "vertical", outline: "none" }}
            />
            <button
              disabled={chatEnv || !chatNome.trim() || !chatMsg.trim()}
              onClick={async () => {
                setChatEnv(true);
                const { error } = await sb.rpc("portal_enviar_mensagem", { p_token: token, p_nome: chatNome.trim(), p_mensagem: chatMsg.trim() });
                if (!error) {
                  setMensagens((prev) => [...prev, { autor: "cliente", nome: chatNome.trim(), mensagem: chatMsg.trim(), created_at: new Date().toISOString() }]);
                  setChatMsg("");
                }
                setChatEnv(false);
              }}
              style={{ width: "100%", background: chatEnv || !chatNome.trim() || !chatMsg.trim() ? "#ccc" : "#981915", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: chatEnv ? "wait" : "pointer" }}
            >
              {chatEnv ? "Enviando..." : "Enviar mensagem"}
            </button>
          </div>
        </Card>

        {/* Documentos */}
        <Card title="Documentos">
          {documentos.length === 0 && (
            <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: "8px 0 12px" }}>Nenhum documento ainda.</div>
          )}
          {documentos.map((doc, i) => (
            <div key={doc.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{doc.nome}</div>
                <div style={{ fontSize: 10, color: "#888" }}>{doc.tamanho} · {doc.created_at ? new Date(doc.created_at).toLocaleDateString("pt-BR") : ""}</div>
              </div>
              <a href={storageUrl(doc.storage_path)} target="_blank" rel="noreferrer"
                style={{ background: "#981915", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
                ⬇ Baixar
              </a>
            </div>
          ))}
          <div style={{ marginTop: 14, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Enviar documento</div>
            <input type="file" disabled={docUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setDocUploading(true);
                try {
                  const ts = Date.now();
                  const path = `portal/${token}/${ts}-${file.name}`;
                  const { error: upErr } = await sb.storage.from("arquivos").upload(path, file);
                  if (upErr) { alert("Erro no upload: " + upErr.message); return; }
                  const formatSize = file.size > 1024 * 1024
                    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${(file.size / 1024).toFixed(0)} KB`;
                  const { error: rpcErr } = await sb.rpc("portal_registrar_documento", {
                    p_token: token, p_nome: file.name, p_storage_path: path, p_tamanho: formatSize,
                  });
                  if (rpcErr) { alert("Erro ao registrar: " + rpcErr.message); return; }
                  setDocumentos((prev) => [...prev, { nome: file.name, storage_path: path, tamanho: formatSize, created_at: new Date().toISOString() }]);
                  e.target.value = "";
                } finally {
                  setDocUploading(false);
                }
              }}
              style={{ width: "100%", fontSize: 12, padding: "8px", border: "1px solid #ddd", borderRadius: 8, background: "#fafafa" }}
            />
            {docUploading && <div style={{ fontSize: 11, color: "#981915", marginTop: 6 }}>Enviando...</div>}
          </div>
        </Card>

        {/* Assinatura Digital */}
        {!obra.assinatura_data && (
          <Card title="Assinatura Digital">
            <div style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>
              Assine abaixo para confirmar o acompanhamento desta obra.
            </div>
            <input
              value={sigNome}
              onChange={(e) => setSigNome(e.target.value)}
              placeholder="Seu nome completo"
              style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 10, outline: "none" }}
            />
            <div style={{ border: "1px solid #ddd", borderRadius: 8, background: "#fafafa", marginBottom: 10, overflow: "hidden", touchAction: "none" }}>
              <canvas ref={canvasRef} width={400} height={150} style={{ display: "block", width: "100%", cursor: "crosshair" }}
                onMouseDown={(e) => {
                  isDrawing.current = true;
                  const r = e.currentTarget.getBoundingClientRect();
                  const sx = e.currentTarget.width / r.width;
                  const sy = e.currentTarget.height / r.height;
                  const ctx = canvasRef.current.getContext("2d");
                  ctx.beginPath(); ctx.moveTo((e.clientX - r.left) * sx, (e.clientY - r.top) * sy);
                }}
                onMouseMove={(e) => {
                  if (!isDrawing.current) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  const sx = e.currentTarget.width / r.width;
                  const sy = e.currentTarget.height / r.height;
                  const ctx = canvasRef.current.getContext("2d");
                  ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#1a1a1a";
                  ctx.lineTo((e.clientX - r.left) * sx, (e.clientY - r.top) * sy); ctx.stroke();
                }}
                onMouseUp={() => { isDrawing.current = false; }}
                onMouseLeave={() => { isDrawing.current = false; }}
                onTouchStart={(e) => {
                  e.preventDefault(); isDrawing.current = true;
                  const r = e.currentTarget.getBoundingClientRect();
                  const sx = e.currentTarget.width / r.width;
                  const sy = e.currentTarget.height / r.height;
                  const t = e.touches[0];
                  const ctx = canvasRef.current.getContext("2d");
                  ctx.beginPath(); ctx.moveTo((t.clientX - r.left) * sx, (t.clientY - r.top) * sy);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  if (!isDrawing.current) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  const sx = e.currentTarget.width / r.width;
                  const sy = e.currentTarget.height / r.height;
                  const t = e.touches[0];
                  const ctx = canvasRef.current.getContext("2d");
                  ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#1a1a1a";
                  ctx.lineTo((t.clientX - r.left) * sx, (t.clientY - r.top) * sy); ctx.stroke();
                }}
                onTouchEnd={() => { isDrawing.current = false; }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => {
                const ctx = canvasRef.current.getContext("2d");
                ctx.clearRect(0, 0, 400, 150);
              }} style={{ flex: 1, padding: "9px 0", background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Limpar
              </button>
              <button disabled={sigEnv || !sigNome.trim()} onClick={async () => {
                const canvas = canvasRef.current;
                const dataUrl = canvas.toDataURL("image/png");
                // Check if canvas is blank
                const blank = document.createElement("canvas");
                blank.width = canvas.width; blank.height = canvas.height;
                if (dataUrl === blank.toDataURL("image/png")) { alert("Por favor, desenhe sua assinatura."); return; }
                setSigEnv(true);
                try {
                  const res = await fetch(dataUrl);
                  const blob = await res.blob();
                  const path = `assinaturas/${token}.png`;
                  const { error: upErr } = await sb.storage.from("arquivos").upload(path, blob, { upsert: true, contentType: "image/png" });
                  if (upErr) { alert("Erro no upload: " + upErr.message); return; }
                  const assinaturaUrl = storageUrl(path);
                  const { error: rpcErr } = await sb.rpc("portal_assinar", {
                    p_token: token, p_nome: sigNome.trim(), p_assinatura_url: assinaturaUrl,
                  });
                  if (rpcErr) { alert("Erro ao assinar: " + rpcErr.message); return; }
                  setObra((prev) => ({ ...prev, assinatura_data: new Date().toISOString(), assinatura_nome: sigNome.trim() }));
                } finally {
                  setSigEnv(false);
                }
              }} style={{ flex: 2, padding: "9px 0", background: sigEnv || !sigNome.trim() ? "#ccc" : "#981915", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: sigEnv ? "wait" : "pointer" }}>
                {sigEnv ? "Assinando..." : "✍ Assinar"}
              </button>
            </div>
          </Card>
        )}
        {obra.assinatura_data && (
          <Card title="Assinatura Digital">
            <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>✓</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
                  Assinado por {obra.assinatura_nome}
                </div>
                <div style={{ fontSize: 11, color: "#166534", opacity: .8 }}>
                  {new Date(obra.assinatura_data).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Contato */}
        <div style={{ background: "#1A1A1A", borderRadius: 14, padding: "20px", marginBottom: 12, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, marginBottom: 8 }}>DÚVIDAS SOBRE SUA OBRA?</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>Fale com a Stick Frame</div>
          {empresa?.telefone ? (
            <a
              href={`https://wa.me/55${empresa.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Tenho dúvidas sobre a obra: ${obra.nome}`)}`}
              target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
            >
              <span style={{ fontSize: 16 }}>💬</span> WhatsApp
            </a>
          ) : empresa?.email ? (
            <a href={`mailto:${empresa.email}?subject=Dúvida sobre obra: ${obra.nome}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#981915", color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              <span style={{ fontSize: 16 }}>✉️</span> Enviar e-mail
            </a>
          ) : null}
        </div>

        <div style={{ textAlign: "center", padding: "12px 0 24px", fontSize: 10, color: "#aaa" }}>
          <strong style={{ color: "#555" }}>Stick Frame Sistemas Construtivos</strong><br />
          Santo André/SP · {hoje}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "#888", marginBottom: 12, textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}

function Bar({ val, color }) {
  return (
    <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: 8, width: `${Math.min(val, 100)}%`, background: color, borderRadius: 4, transition: "width .5s ease" }} />
    </div>
  );
}

function FinItem({ label, value, color = "#222" }) {
  return (
    <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 9, color: "#888", marginBottom: 4, letterSpacing: .5 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
