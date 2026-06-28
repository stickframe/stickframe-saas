import { useEffect, useState } from "react";
import { sb } from "../services/supabase";
import { C } from "../utils/constants";
import AdminNav from "../components/AdminNav";

const THEME = {
  surface: "#1c1b20", card: "#26252b", border: "rgba(255,255,255,.08)",
  text: "#ece7df", muted: "rgba(236,231,223,.45)", accent: "#981915",
};

function StatCard({ label, value, color = THEME.text, sub }) {
  return (
    <div style={{
      background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12,
      padding: "18px 20px", minWidth: 140,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: THEME.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1 }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminGrowth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [trialsRes, eventsRes, activationRes] = await Promise.all([
          sb.from("vw_trial_health").select("*"),
          sb.from("saas_events").select("event_type, created_at").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
          sb.from("saas_events").select("empresa_id").eq("event_type", "completed_onboarding"),
        ]);

        const trials = trialsRes.data || [];
        const recentEvents = eventsRes.data || [];
        const onboarded = activationRes.data || [];

        const activeTrials = trials.filter((t) => t.trial_active);
        const endingSoon = trials.filter((t) => t.trial_status === "ending_soon");
        const readyToConvert = trials.filter((t) => t.activation_pct >= 60 && t.trial_active);
        const expiredTrials = trials.filter((t) => t.trial_status === "expired");
        const partiallyActivated = trials.filter((t) => t.activation_pct >= 40 && t.activation_pct < 80 && t.trial_active);

        const grouped = {};
        recentEvents.forEach((e) => {
          grouped[e.event_type] = (grouped[e.event_type] || 0) + 1;
        });

        setData({
          activeTrials: activeTrials.length,
          endingSoon: endingSoon.length,
          readyToConvert: readyToConvert.length,
          expiredTrials: expiredTrials.length,
          partiallyActivated: partiallyActivated.length,
          totalTrials: trials.length,
          onboarded: onboarded.length,
          eventCounts: grouped,
          endingSoonList: endingSoon.slice(0, 10),
          readyList: readyToConvert.slice(0, 10),
        });
      } catch (e) {
        console.warn("[AdminGrowth] load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: THEME.surface, padding: 40, color: THEME.muted, fontFamily: "'Inter', sans-serif" }}>
        Carregando...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: THEME.surface, padding: 40, color: THEME.muted, fontFamily: "'Inter', sans-serif" }}>
        Erro ao carregar dados
      </div>
    );
  }

  const conversionRate = data.totalTrials > 0 ? ((data.readyToConvert / data.totalTrials) * 100).toFixed(0) : "0";

  return (
    <div style={{ minHeight: "100vh", background: THEME.surface, padding: "36px 32px", fontFamily: "'Inter', sans-serif", color: THEME.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -.5 }}>Growth</h1>
        <p style={{ fontSize: 13, color: THEME.muted, marginTop: 4 }}>Métricas de crescimento e conversão</p>
      </div>

      <AdminNav />

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Trials ativos" value={data.activeTrials} color="#fbbf24" />
        <StatCard label="Prontos p/ converter" value={data.readyToConvert} color="#4ade80" sub={`${conversionRate}% do total`} />
        <StatCard label="Trials encerrando (7d)" value={data.endingSoon} color="#f87171" sub="risco de churn" />
        <StatCard label="Onboardings completos" value={data.onboarded} color="#60a5fa" />
        <StatCard label="Empresas paradas" value={data.partiallyActivated} color="#fb923c" sub="ativação < 80%" />
        <StatCard label="Trials expirados" value={data.expiredTrials} color={THEME.muted} />
      </div>

      {/* Events table */}
      <div style={{
        background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 14, padding: 20, marginBottom: 20,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: THEME.muted, textTransform: "uppercase", marginBottom: 14 }}>
          Eventos Growth (30 dias)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(data.eventCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <div key={type} style={{
              background: "rgba(255,255,255,.05)", borderRadius: 8,
              padding: "8px 12px", display: "flex", alignItems: "center", gap: 10,
              fontSize: 12, border: `1px solid ${THEME.border}`,
            }}>
              <span style={{ fontWeight: 700, color: "#fff" }}>{count}</span>
              <span style={{ color: THEME.muted }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trials ending soon */}
      {data.endingSoonList.length > 0 && (
        <div style={{
          background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 14, padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: THEME.muted, textTransform: "uppercase", marginBottom: 14 }}>
            Trials encerrando (próximos 7 dias)
          </div>
          {data.endingSoonList.map((t) => (
            <div key={t.empresa_id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.06)",
              fontSize: 13,
            }}>
              <div>
                <div style={{ fontWeight: 700, color: "#fff" }}>{t.empresa_nome}</div>
                <div style={{ fontSize: 11, color: THEME.muted }}>
                  Ativação: {t.activation_pct}% · Clientes: {t.total_clientes} · Obras: {t.total_obras}
                </div>
              </div>
              <span style={{ color: "#f87171", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
                {new Date(t.trial_ends_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Ready to convert */}
      {data.readyList.length > 0 && (
        <div style={{
          background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 14, padding: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: THEME.muted, textTransform: "uppercase", marginBottom: 14 }}>
            Prontos para converter
          </div>
          {data.readyList.map((t) => (
            <div key={t.empresa_id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.06)",
              fontSize: 13,
            }}>
              <div>
                <div style={{ fontWeight: 700, color: "#fff" }}>{t.empresa_nome}</div>
                <div style={{ fontSize: 11, color: THEME.muted }}>
                  Ativação: {t.activation_pct}% · {t.total_orcamentos} orçamentos · {t.total_obras} obras
                </div>
              </div>
              <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
                {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString("pt-BR") : "Sem trial"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 28, fontSize: 11, color: THEME.muted }}>
        Dados atualizados em tempo real via vw_trial_health e saas_events
      </div>
    </div>
  );
}
