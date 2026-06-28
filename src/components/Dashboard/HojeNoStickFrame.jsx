import { useEffect, useState } from "react";
import { C } from "../../utils/constants";
import { sb, getEmpresaId } from "../../services/supabase";

const ICON = {
  obra: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" />
    </svg>
  ),
  orcamento: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4M9 13h6M9 17h4" />
    </svg>
  ),
  alerta: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  vencimento: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
};

function WidgetCard({ icon, label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: "1 1 160px", minWidth: 140,
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "16px 18px", boxShadow: C.shadow, cursor: onClick ? "pointer" : "default",
        transition: "box-shadow .15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ color: color || C.steel }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || C.text }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function HojeNoStickFrame({ setActivePage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const empresaId = await getEmpresaId();
        if (!empresaId) { setLoading(false); return; }

        const [obrasRes, orcamentosRes] = await Promise.allSettled([
          sb.from("obras").select("id, status, created_at", { count: "exact", head: true }).eq("empresa_id", empresaId),
          sb.from("orcamentos").select("id, status, created_at, valor_total", { count: "exact", head: true }).eq("empresa_id", empresaId),
        ]);

        if (cancelled) return;

        const obrasAtivas = obrasRes.status === "fulfilled" ? obrasRes.value.count ?? 0 : 0;
        const orcamentosAbertos = orcamentosRes.status === "fulfilled" ? orcamentosRes.value.count ?? 0 : 0;

        setData({ obrasAtivas, orcamentosAbertos });
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: "20px 24px", boxShadow: C.shadow, marginBottom: 20,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          Hoje no StickFrame
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: "1 1 140px", height: 80, background: C.border, borderRadius: 8, animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  const widgets = [
    {
      icon: <ICON.obra />, label: "Obras ativas",
      value: data?.obrasAtivas ?? 0, color: C.success,
      onClick: () => setActivePage?.("obras"),
    },
    {
      icon: <ICON.orcamento />, label: "Orçamentos abertos",
      value: data?.orcamentosAbertos ?? 0, color: C.steel,
      onClick: () => setActivePage?.("orcamentos"),
    },
  ];

  if (!data || (data.obrasAtivas === 0 && data.orcamentosAbertos === 0)) {
    return null;
  }

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: "20px 24px", boxShadow: C.shadow, marginBottom: 20,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
        Hoje no StickFrame
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {widgets.map((w, i) => (
          <WidgetCard key={i} {...w} />
        ))}
      </div>
    </div>
  );
}
