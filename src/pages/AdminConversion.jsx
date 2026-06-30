/**
 * /admin/conversion — Dashboard comercial da StickFrame Conversion Layer™ (C.9).
 *
 * Fontes de dados (somente o que já é legível pelos painéis admin):
 *   - saas_events  → funil de produto (viewed_pricing → started_trial →
 *                    created_first_quote → converted_plan) nos últimos 30 dias.
 *   - vw_trial_health → estágio dos trials (ativos, vencendo, prontos).
 *
 * O topo de funil de marketing (landing_view, calculator_started/completed,
 * lead_created) vive no GA4 (eventos client-side) — há um atalho para o GA4.
 */
import { useEffect, useState } from "react";
import { sb } from "../services/supabase";
import AdminNav from "../components/AdminNav";

const THEME = {
  surface: "#1c1b20", card: "#26252b", border: "rgba(255,255,255,.08)",
  text: "#ece7df", muted: "rgba(236,231,223,.45)", accent: "#981915", green: "#3f9d6b",
};

function StatCard({ label, value, color = THEME.text, sub }) {
  return (
    <div style={{
      background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12,
      padding: "18px 20px", minWidth: 150,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: THEME.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1 }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// Etapas do funil de produto (event_type em saas_events)
const FUNNEL = [
  { key: "viewed_pricing",      label: "Viram planos" },
  { key: "started_trial",       label: "Iniciaram trial" },
  { key: "created_first_quote", label: "1º orçamento" },
  { key: "converted_plan",      label: "Converteram" },
];

export default function AdminConversion() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const desde = new Date(Date.now() - 30 * 86400000).toISOString();
        const [eventsRes, trialsRes] = await Promise.all([
          sb.from("saas_events").select("event_type, created_at").gte("created_at", desde),
          sb.from("vw_trial_health").select("*"),
        ]);

        const events = eventsRes.data || [];
        const trials = trialsRes.data || [];

        const counts = {};
        events.forEach((e) => { counts[e.event_type] = (counts[e.event_type] || 0) + 1; });

        const startedTrial  = counts.started_trial || 0;
        const converted     = counts.converted_plan || 0;
        const taxaConversao = startedTrial > 0 ? Math.round((converted / startedTrial) * 1000) / 10 : 0;

        setData({
          counts,
          taxaConversao,
          totalEventos: events.length,
          trialsAtivos:  trials.filter((t) => t.trial_active).length,
          vencendo:      trials.filter((t) => t.trial_status === "ending_soon").length,
          prontos:       trials.filter((t) => t.activation_pct >= 60 && t.trial_active).length,
        });
      } catch (e) {
        console.warn("[AdminConversion] load error:", e);
        setData({ counts: {}, taxaConversao: 0, totalEventos: 0, trialsAtivos: 0, vencendo: 0, prontos: 0 });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const wrap = { minHeight: "100vh", background: THEME.surface, padding: 40, fontFamily: "'Inter', sans-serif", color: THEME.text };

  if (loading) {
    return <div style={{ ...wrap, color: THEME.muted }}><AdminNav />Carregando conversão…</div>;
  }

  const maxFunnel = Math.max(1, ...FUNNEL.map((f) => data.counts[f.key] || 0));

  return (
    <div style={wrap}>
      <AdminNav />
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 30, fontWeight: 900, margin: "8px 0 2px" }}>
        Conversão
      </h1>
      <div style={{ fontSize: 12.5, color: THEME.muted, marginBottom: 22 }}>
        Funil de produto · últimos 30 dias · fonte: saas_events + vw_trial_health
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Taxa de conversão" value={`${data.taxaConversao}%`} color={THEME.green} sub="trial → plano" />
        <StatCard label="Trials ativos" value={data.trialsAtivos} />
        <StatCard label="Vencendo (7d)" value={data.vencendo} color="#e0a020" />
        <StatCard label="Prontos p/ converter" value={data.prontos} color={THEME.green} sub="ativação ≥ 60%" />
        <StatCard label="Eventos (30d)" value={data.totalEventos} />
      </div>

      {/* Funil */}
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: THEME.muted, marginBottom: 16 }}>
          Funil de produto
        </div>
        {FUNNEL.map((f) => {
          const v = data.counts[f.key] || 0;
          const pct = Math.round((v / maxFunnel) * 100);
          return (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span>{f.label}</span>
                <span style={{ fontWeight: 800 }}>{v}</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,.06)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: THEME.accent, borderRadius: 5 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Topo de funil (GA4) */}
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: "16px 20px", fontSize: 12.5, color: THEME.muted }}>
        <strong style={{ color: THEME.text }}>Topo de funil (visitantes, calculadora, leads):</strong> rastreado no GA4
        — eventos <code>landing_view</code>, <code>calculator_started</code>, <code>calculator_completed</code>, <code>lead_created</code>.{" "}
        <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" style={{ color: THEME.green, fontWeight: 700 }}>
          Abrir Google Analytics →
        </a>
      </div>
    </div>
  );
}
