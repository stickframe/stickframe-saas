import { useEffect, useState } from "react";
import { sb } from "../services/supabase";
import { C } from "../utils/constants";

const ADMIN_EMAIL = "andrequeirozcandido@gmail.com";

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

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "18px 24px",
      minWidth: 120,
      boxShadow: C.shadow,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || C.text }}>{value}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{label}</div>
    </div>
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

  const { empresas = [], totals = {} } = data || {};

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

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard label="Total de empresas" value={totals.total ?? 0} />
        <StatCard label="Plano Free" value={totals.free ?? 0} color={C.muted} />
        <StatCard label="Plano Pro" value={totals.pro ?? 0} color={C.red} />
      </div>

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
                {["Nome", "Plano", "Cadastro", "Limite Obras", "Obras Ativas", "Usuários"].map((h) => (
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
                  <td colSpan={6} style={{ padding: 32, textAlign: "center", color: C.muted }}>
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
                    <Badge color={e.plano}>{e.plano || "—"}</Badge>
                  </td>
                  <td style={{ padding: "12px 16px", color: C.muted, whiteSpace: "nowrap" }}>
                    {e.created_at
                      ? new Date(e.created_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    {e.limite_obras ?? "—"}
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
