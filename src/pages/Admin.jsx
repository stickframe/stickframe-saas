import { useEffect, useState } from "react";
import { sb } from "../services/supabase";
import { C } from "../utils/constants";

const ADMIN_EMAIL = "andre@stickframe.com.br";

function Badge({ children, color }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: color === "pro" ? C.red : C.border,
      color: color === "pro" ? "#fff" : C.muted,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    }}>
      {children}
    </span>
  );
}

function StatCard({ label, value, color, accent, big }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderTop: accent ? `3px solid ${accent}` : `1px solid ${C.border}`,
      borderRadius: 10,
      padding: big ? "22px 28px" : "18px 24px",
      minWidth: big ? 180 : 120,
      flex: big ? "1 1 180px" : undefined,
      boxShadow: C.shadow,
    }}>
      <div style={{ fontSize: big ? 34 : 28, fontWeight: 700, color: color || C.text }}>{value}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// Gráfico de cadastros por dia (últimos 30 dias), derivado de created_at
function CadastrosChart({ empresas }) {
  const dias = [];
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(hoje.getTime() - i * 86400_000);
    dias.push({ key: d.toISOString().slice(0, 10), label: d.getDate(), count: 0 });
  }
  const idx = Object.fromEntries(dias.map((d, i) => [d.key, i]));
  for (const e of empresas) {
    const k = (e.created_at || "").slice(0, 10);
    if (k in idx) dias[idx[k]].count++;
  }
  const max = Math.max(1, ...dias.map((d) => d.count));
  const W = 600, H = 110, pad = 4;
  const bw = W / dias.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {dias.map((d, i) => {
        const h = (d.count / max) * (H - pad);
        return (
          <g key={d.key}>
            <rect
              x={i * bw + 2} y={H - h} width={bw - 4} height={Math.max(h, 2)}
              rx={2} fill={d.count > 0 ? "#2e9e5b" : C.border}
            />
            {d.count > 0 && (
              <text x={i * bw + bw / 2} y={H - h - 5} textAnchor="middle" fontSize="9" fill="#2e9e5b" fontWeight="700">{d.count}</text>
            )}
            {i % 5 === 0 && (
              <text x={i * bw + bw / 2} y={H + 13} textAnchor="middle" fontSize="8" fill={C.muted}>{d.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function Admin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) throw new Error("Sessão não encontrada");

        const { data: result, error: fnError } = await sb.functions.invoke("admin-stats", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (fnError) throw fnError;
        if (result?.error) throw new Error(result.error);
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const containerStyle = {
    fontFamily: "'Inter', sans-serif",
    minHeight: "100vh",
    background: C.bg,
    padding: "40px 32px",
    color: C.text,
  };

  if (loading) return (
    <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: C.muted, fontSize: 16 }}>Carregando dados...</span>
    </div>
  );

  if (error) return (
    <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32, textAlign: "center" }}>
        <div style={{ color: C.danger, fontWeight: 600, marginBottom: 8 }}>Erro ao carregar</div>
        <div style={{ color: C.muted, fontSize: 14 }}>{error}</div>
      </div>
    </div>
  );

  const { empresas = [], totals = {}, crescimento = {}, funil = {}, origens = {}, asaas = null, proStats = {} } = data || {};

  const ESTADO_BADGE = {
    pago:         { label: "Paga ✓",        bg: "#2e9e5b18", color: "#2e9e5b" },
    trial:        { label: "Trial ⏳",       bg: "#f59e0b18", color: "#b45309" },
    inadimplente: { label: "Vencida ⚠️",     bg: "#dc262618", color: "#dc2626" },
    aguardando:   { label: "Aguardando",     bg: "#3b6ea518", color: "#3b6ea5" },
  };

  const fmtBRL = (v) => `R$ ${(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const funilEtapas = [
    ["Criou conta",      funil.criou_conta],
    ["Criou obra",       funil.criou_obra],
    ["Fez orçamento",    funil.fez_orcamento],
    ["Convidou usuário", funil.convidou_usuario],
    ["Virou PRO",        funil.virou_pro],
  ];
  const funilMax = Math.max(1, funil.criou_conta ?? 1);

  const sectionTitle = (t) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "28px 0 12px" }}>{t}</div>
  );

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: C.red, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Painel Admin</h1>
        </div>
        <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
          Acesso restrito — {ADMIN_EMAIL}
        </p>
      </div>

      {/* Topo CEO */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
        <StatCard big accent="#2e9e5b" label="MRR" value={fmtBRL(asaas?.mrr)} color="#2e9e5b" />
        <StatCard big accent={C.red} label="Empresas" value={totals.total ?? 0} />
        <StatCard big accent="#3b6ea5" label="Conversão Free → Pro" value={`${crescimento.conversao ?? 0}%`} />
        <StatCard big accent="#b45309" label="Inadimplentes" value={asaas?.inadimplentes ?? 0} color={(asaas?.inadimplentes ?? 0) > 0 ? C.danger : C.text} />
      </div>

      {/* 🟢 Crescimento */}
      {sectionTitle("🟢 Crescimento")}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
        <StatCard accent="#2e9e5b" label="Cadastros hoje" value={crescimento.hoje ?? 0} />
        <StatCard accent="#2e9e5b" label="Últimos 7 dias" value={crescimento.semana ?? 0} />
        <StatCard accent="#2e9e5b" label="Últimos 30 dias" value={crescimento.mes ?? 0} />
        <StatCard accent="#2e9e5b" label="Free" value={totals.free ?? 0} color={C.muted} />
        <StatCard accent="#2e9e5b" label="PRO pagos" value={proStats.pagos ?? 0} color="#2e9e5b" />
        <StatCard accent="#2e9e5b" label="PRO em trial" value={proStats.trial ?? 0} color="#b45309" />
        <StatCard accent="#2e9e5b" label="PRO inadimplentes" value={proStats.inadimplentes ?? 0} color={(proStats.inadimplentes ?? 0) > 0 ? C.danger : C.muted} />
        <StatCard accent="#2e9e5b" label="Trials free ativos" value={crescimento.trials_ativos ?? 0} />
      </div>

      {/* Gráfico de evolução */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: C.shadow, marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Cadastros por dia — últimos 30 dias</div>
        <CadastrosChart empresas={empresas} />
      </div>

      {/* 🔵 Receita (Asaas) */}
      {asaas && (
        <>
          {sectionTitle("🔵 Receita · Asaas")}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
            <StatCard accent="#3b6ea5" label="MRR" value={fmtBRL(asaas.mrr)} color="#2e9e5b" />
            <StatCard accent="#3b6ea5" label="ARR projetado" value={fmtBRL(asaas.arr)} />
            <StatCard accent="#3b6ea5" label="Assinaturas ativas" value={asaas.pagantes} />
          </div>
        </>
      )}

      {/* 🟠 Atenção */}
      {sectionTitle("🟠 Atenção")}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
        <StatCard accent="#b45309" label="Inadimplentes" value={asaas?.inadimplentes ?? 0} color={(asaas?.inadimplentes ?? 0) > 0 ? C.danger : C.muted} />
        <StatCard accent="#b45309" label="Trials vencendo (7d)" value={crescimento.trials_vencendo_7d ?? 0} color="#b45309" />
        <StatCard accent="#b45309" label="Trials expirados" value={crescimento.trials_expirados ?? 0} color={C.danger} />
        <StatCard accent="#b45309" label="Empresas em risco" value={empresas.filter((e) => e.health < 30).length} color={C.danger} />
      </div>

      {/* Empresas em risco */}
      {empresas.some((e) => e.health < 30) && (
        <>
          {sectionTitle("⚠️ Empresas em risco de abandono")}
          <div style={{ background: C.surface, border: `1px solid ${C.danger}40`, borderRadius: 12, padding: "14px 20px", boxShadow: C.shadow }}>
            {empresas.filter((e) => e.health < 30).sort((a, b) => a.health - b.health).map((e) => {
              const h = e.health ?? 0;
              const [emoji, bg, col] = h >= 50 ? ["🟡", "#b07a1e18", "#b45309"] : ["🔴", "#dc262618", "#dc2626"];
              const waNum = (e.telefone || "").replace(/\D/g, "");
              const waMsg = encodeURIComponent(`Olá${e.contato_nome ? ", " + e.contato_nome : ""}! Vi que a ${e.nome} não está usando muito o StickFrame. Posso ajudar com algo?`);
              return (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{e.nome}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{e.contato_nome || "—"} · {e.contato_email || "sem e-mail"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 10, background: bg, color: col, fontWeight: 700, fontSize: 12 }}>
                      {emoji} {h}
                    </span>
                    {e.contato_email && (
                      <a href={`mailto:${e.contato_email}?subject=Oi, ${e.contato_nome || e.nome}! Posso ajudar?`}
                        title="Enviar e-mail" style={{ textDecoration: "none", fontSize: 16 }}>📧</a>
                    )}
                    {waNum && (
                      <a href={`https://wa.me/55${waNum}?text=${waMsg}`} target="_blank" rel="noreferrer"
                        title="Abrir WhatsApp" style={{ textDecoration: "none", fontSize: 16 }}>💬</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Funil + Origens */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        <div>
          {sectionTitle("Funil de ativação")}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: C.shadow }}>
            {funilEtapas.map(([label, val]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: C.text }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{val ?? 0}</span>
                </div>
                <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: 8, width: `${((val ?? 0) / funilMax) * 100}%`, background: C.red, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {sectionTitle("Origem dos leads")}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: C.shadow }}>
            {Object.keys(origens).length === 0 ? (
              <span style={{ color: C.muted, fontSize: 13 }}>Sem dados ainda</span>
            ) : Object.entries(origens).sort((a, b) => b[1] - a[1]).map(([origem, qtd]) => (
              <div key={origem} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, textTransform: "capitalize" }}>{origem}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{qtd}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {sectionTitle("Empresas")}

      {/* Table */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: C.shadow,
      }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Empresas cadastradas</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["Nome", "Contato", "Plano", "Assinatura", "Health", "Trial", "Cadastro", "Obras Ativas", "Usuários"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontWeight: 600, fontSize: 12, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    borderBottom: `1px solid ${C.border}`,
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empresas.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: "center", color: C.muted }}>
                    Nenhuma empresa encontrada
                  </td>
                </tr>
              ) : empresas.map((e, i) => (
                <tr key={e.id} style={{
                  borderBottom: i < empresas.length - 1 ? `1px solid ${C.border}` : "none",
                  transition: "background 0.1s",
                }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>{e.nome}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {e.contato_nome ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{e.contato_nome}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{e.contato_email || "—"}</div>
                      </div>
                    ) : <span style={{ color: C.muted }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge color={e.plano}>{e.plano || "—"}</Badge>
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {(() => {
                      const b = ESTADO_BADGE[e.estado_assinatura];
                      return b ? (
                        <span style={{ background: b.bg, color: b.color, padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                          {b.label}
                        </span>
                      ) : <span style={{ color: C.muted }}>—</span>;
                    })()}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {(() => {
                      const h = e.health ?? 0;
                      const [emoji, bg, col] = h >= 80 ? ["🟢", "#2e9e5b18", "#2e9e5b"] : h >= 50 ? ["🟡", "#b07a1e18", "#b45309"] : ["🔴", "#dc262618", "#dc2626"];
                      return (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 10, background: bg, color: col, fontWeight: 700, fontSize: 12 }}>
                          {emoji} {h}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {e.trial_ativo ? (
                      <span style={{ color: "#b45309", fontWeight: 600, fontSize: 12 }}>
                        ⏳ até {new Date(e.trial_ends_at).toLocaleDateString("pt-BR")}
                      </span>
                    ) : e.plano === "free" && e.trial_ends_at ? (
                      <span style={{ color: C.muted, fontSize: 12 }}>expirado</span>
                    ) : <span style={{ color: C.muted }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", color: C.muted, whiteSpace: "nowrap" }}>
                    {e.created_at
                      ? new Date(e.created_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span style={{
                      fontWeight: 600,
                      color: e.obras_ativas > 0 ? C.success : C.muted,
                    }}>
                      {e.obras_ativas}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    {e.total_usuarios}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
