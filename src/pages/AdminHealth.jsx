import { useEffect, useState, useCallback } from "react";
import { sb } from "../services/supabase";
import { runHealthCheck, getLastHealth } from "../services/health/healthService";
import { C } from "../utils/constants";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@stickframe.com.br";

function StatCard({ label, value, accent, color }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "14px 18px", minWidth: 140, boxShadow: C.shadow,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || accent || C.text }}>{value ?? "—"}</div>
    </div>
  );
}

function StatusDot({ ok }) {
  return (
    <span style={{
      display: "inline-block", width: 10, height: 10, borderRadius: "50%",
      background: ok ? "#3f7a4b" : "#dc2626", marginRight: 6, flexShrink: 0,
    }} />
  );
}

function CheckRow({ label, status }) {
  const ok = status === "ok";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
      <StatusDot ok={ok} />
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: ok ? C.success : C.danger, fontWeight: 600 }}>{status}</span>
    </div>
  );
}

export default function AdminHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailLog, setEmailLog] = useState(null);

  const check = useCallback(async () => {
    setLoading(true);
    const result = await runHealthCheck();
    setHealth(result);
    setLoading(false);
  }, []);

  useEffect(() => { check(); }, [check]);

  const sendTestAlert = async () => {
    setSending(true);
    setEmailLog(null);
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error("Sessão não encontrada");
      const { data, error } = await sb.functions.invoke("admin-stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setEmailLog({ ok: true, msg: "Edge function respondeu (admin-stats)." });
    } catch (e) {
      setEmailLog({ ok: false, msg: e.message });
    } finally {
      setSending(false);
    }
  };

  const containerStyle = {
    fontFamily: "'Inter', sans-serif",
    minHeight: "100vh", background: C.bg, padding: "40px 32px", color: C.text,
  };

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
            background: C.steel, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Saúde do Sistema</h1>
        </div>
        <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
          Acesso restrito — {ADMIN_EMAIL}
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={check} disabled={loading} style={{
          background: C.steel, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1,
        }}>
          {loading ? "Verificando..." : "Verificar agora"}
        </button>
        <button onClick={sendTestAlert} disabled={sending} style={{
          background: C.warning, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: sending ? 0.6 : 1,
        }}>
          {sending ? "Enviando..." : "Testar edge function"}
        </button>
      </div>

      {emailLog && (
        <div style={{
          background: emailLog.ok ? "#3f7a4b10" : "#dc262610",
          border: `1px solid ${emailLog.ok ? C.success : C.danger}40`,
          borderRadius: 8, padding: "10px 16px", marginBottom: 16,
          fontSize: 13, color: emailLog.ok ? C.success : C.danger,
        }}>
          {emailLog.msg}
        </div>
      )}

      {/* Status geral */}
      {loading && !health ? (
        <div style={{ color: C.muted, fontSize: 14, padding: 20 }}>Verificando saúde do sistema...</div>
      ) : health ? (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
            <StatCard
              accent={health.status === "healthy" ? "#3f7a4b" : C.danger}
              label="Status geral"
              value={health.status === "healthy" ? "Saudável" : "Degradado"}
              color={health.status === "healthy" ? "#3f7a4b" : C.danger}
            />
            <StatCard accent={C.steel} label="Latência (ms)" value={`${health.latency}ms`} />
            <StatCard accent={C.steel} label="Latência rede (ms)" value={`${health.netMs}ms`} />
            <StatCard accent={C.muted} label="Última verificação" value={new Date(health.timestamp).toLocaleTimeString("pt-BR")} />
          </div>

          {/* Checks detalhados */}
          {sectionTitle("Checks")}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "14px 20px", boxShadow: C.shadow, marginBottom: 8,
          }}>
            <CheckRow label="Banco de dados (Supabase)" status={health.database} />
            <CheckRow label="Autenticação (Auth)" status={health.auth} />
          </div>

          {/* Diagrama de dependências */}
          {sectionTitle("Diagrama de dependências")}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "18px 20px", boxShadow: C.shadow, fontSize: 13,
          }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>StickFrame™ SaaS</div>
            <div style={{ paddingLeft: 20, borderLeft: `2px solid ${C.border}`, marginLeft: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <StatusDot ok={health.database === "ok"} /> Supabase (Postgres)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <StatusDot ok={health.database === "ok"} /> Supabase Realtime
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <StatusDot ok={health.auth === "ok"} /> Supabase Auth
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", color: C.muted }}>
                <StatusDot ok={false} /> Asaas API (externo)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", color: C.muted }}>
                <StatusDot ok={false} /> Edge Functions
              </div>
            </div>
          </div>

          {/* Resposta manual */}
          {sectionTitle("Diagnóstico manual")}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "18px 20px", boxShadow: C.shadow, fontSize: 13, lineHeight: 1.6,
          }}>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Sessão ativa:</strong>{" "}
              {health.auth === "ok" ? "Sim" : "Não"} —{" "}
              {health.auth === "ok"
                ? "Usuário pode autenticar normalmente."
                : "Problema no serviço de autenticação."}
            </p>
            <p style={{ margin: "0 0 8px" }}>
              <strong>Banco de dados:</strong>{" "}
              {health.database === "ok" ? "OK" : "Falha"} —{" "}
              {health.database === "ok"
                ? "Queries respondendo dentro do esperado."
                : "Banco pode estar sobrecarregado ou inacessível."}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Latência total:</strong> {health.latency}ms —{" "}
              {health.latency < 300
                ? "Tempo de resposta saudável."
                : health.latency < 1000
                  ? "Aceitável, mas pode indicar lentidão."
                  : "Crítico — verifique a conexão com Supabase."}
            </p>
          </div>
        </>
      ) : (
        <div style={{ color: C.danger, fontSize: 14, padding: 20 }}>Não foi possível verificar a saúde do sistema.</div>
      )}
    </div>
  );
}
