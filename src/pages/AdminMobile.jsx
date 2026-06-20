import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sb } from "../services/supabase";

const R = "#981915";

function Card({ label, value, color, sub }) {
  return (
    <div style={{
      background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16,
      padding: "20px 20px 16px", flex: "1 1 0",
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || "#fff", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Pill({ h }) {
  const [emoji, bg, col] = h >= 80 ? ["", "#3f7a4b18", "#3f7a4b"] : h >= 50 ? ["", "#b07a1e18", "#b45309"] : ["", "#dc262618", "#dc2626"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 8, background: bg, color: col, fontWeight: 700, fontSize: 12 }}>
      {emoji} {h}
    </span>
  );
}

export default function AdminMobile() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const s = { fontFamily: "'Inter', sans-serif", minHeight: "100dvh", background: "#0e0e0e", color: "#fff", padding: "0 0 32px" };

  if (loading) return (
    <div style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}></div>
        <div style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>Carregando...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#1a1a1a", borderRadius: 16, padding: 24, textAlign: "center" }}>
        <div style={{ color: "#dc2626", marginBottom: 8, fontWeight: 600 }}>Erro</div>
        <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>{error}</div>
        <button onClick={load} style={{ marginTop: 16, background: R, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>
          Tentar novamente
        </button>
      </div>
    </div>
  );

  const { empresas = [], totals = {}, crescimento = {}, asaas = null, proStats = {} } = data || {};
  const agora = Date.now();
  const trialsVencendo7d = empresas.filter(e =>
    e.trial_ativo && new Date(e.trial_ends_at).getTime() - agora <= 7 * 86400_000
  );
  const emRisco = empresas.filter(e => e.health < 50).sort((a, b) => a.health - b.health);
  const fmtBRL = (v) => `R$ ${(v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const temAtencao = (asaas?.inadimplentes ?? 0) > 0 || trialsVencendo7d.length > 0;

  return (
    <div style={s}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>StickFrame</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Admin</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={load} style={{ background: "none", border: "1px solid #2a2a2a", color: "rgba(255,255,255,.4)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
            ↻ Atualizar
          </button>
          <button onClick={() => navigate("/admin")} style={{ background: "none", border: "1px solid #2a2a2a", color: "rgba(255,255,255,.4)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
            Completo →
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div style={{ padding: "6px 20px 0", fontSize: 11, color: "rgba(255,255,255,.2)" }}>
          Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}

      {/* Cards principais 2×2 */}
      <div style={{ padding: "20px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card label="MRR" value={fmtBRL(asaas?.mrr)} color="#3f7a4b" />
        <Card label="Empresas" value={totals.total ?? 0} />
        <Card label="PRO pagos" value={proStats.pagos ?? 0} color="#3f7a4b" />
        <Card
          label="Inadimplentes"
          value={asaas?.inadimplentes ?? 0}
          color={(asaas?.inadimplentes ?? 0) > 0 ? "#dc2626" : "rgba(255,255,255,.3)"}
        />
      </div>

      {/* Trials */}
      <div style={{ padding: "10px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card label="Trials ativos" value={crescimento.trials_ativos ?? 0} color="#b45309" />
        <Card
          label="Vencendo (7d)"
          value={trialsVencendo7d.length}
          color={trialsVencendo7d.length > 0 ? "#dc2626" : "rgba(255,255,255,.3)"}
        />
      </div>

      {/* Alerta atenção */}
      {temAtencao && (
        <div style={{ margin: "16px 16px 0", background: "#dc262610", border: "1px solid #dc262630", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 8, letterSpacing: "0.04em" }}> ATENÇÃO</div>
          {(asaas?.inadimplentes ?? 0) > 0 && (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 4 }}>
              • {asaas.inadimplentes} cliente(s) com cobrança vencida
            </div>
          )}
          {trialsVencendo7d.map(e => (
            <div key={e.id} style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginBottom: 4 }}>
              • {e.nome} — trial vence em {Math.ceil((new Date(e.trial_ends_at).getTime() - agora) / 86400_000)}d
            </div>
          ))}
        </div>
      )}

      {/* Cadastros recentes */}
      <div style={{ margin: "16px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#3f7a4b" }}>{crescimento.hoje ?? 0}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4 }}>Hoje</div>
        </div>
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{crescimento.semana ?? 0}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4 }}>7 dias</div>
        </div>
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{crescimento.mes ?? 0}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4 }}>30 dias</div>
        </div>
      </div>

      {/* Empresas em risco */}
      {emRisco.length > 0 && (
        <div style={{ margin: "16px 16px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
            Empresas em risco
          </div>
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 14, overflow: "hidden" }}>
            {emRisco.map((e, i) => {
              const waNum = (e.telefone || "").replace(/\D/g, "");
              const waMsg = encodeURIComponent(`Olá${e.contato_nome ? ", " + e.contato_nome : ""}! Vi que a ${e.nome} não está usando muito o StickFrame. Posso ajudar com algo?`);
              return (
                <div key={e.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 16px",
                  borderBottom: i < emRisco.length - 1 ? "1px solid #2a2a2a" : "none",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.nome}</div>
                    {e.contato_nome && (
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 2 }}>{e.contato_nome}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 10, flexShrink: 0 }}>
                    <Pill h={e.health ?? 0} />
                    {e.contato_email && (
                      <a href={`mailto:${e.contato_email}?subject=Posso ajudar?`}
                        style={{ textDecoration: "none", fontSize: 18, lineHeight: 1 }}></a>
                    )}
                    {waNum && (
                      <a href={`https://wa.me/55${waNum}?text=${waMsg}`} target="_blank" rel="noreferrer"
                        style={{ textDecoration: "none", fontSize: 18, lineHeight: 1 }}></a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo PRO */}
      <div style={{ margin: "16px 16px 0", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Assinaturas PRO</div>
        {[
          ["Pagos", proStats.pagos ?? 0, "#3f7a4b"],
          ["Trial", proStats.trial ?? 0, "#b45309"],
          ["Inadimplentes", proStats.inadimplentes ?? 0, (proStats.inadimplentes ?? 0) > 0 ? "#dc2626" : "rgba(255,255,255,.3)"],
          ["Aguardando", proStats.aguardando ?? 0, "rgba(255,255,255,.4)"],
        ].map(([l, v, c]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1f1f1f" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>{l}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
