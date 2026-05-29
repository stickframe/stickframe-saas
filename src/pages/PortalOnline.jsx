import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sb } from "../services/supabase";
import { FASES } from "../utils/constants";
import { fmt } from "../utils/format";

export default function PortalOnline() {
  const { token } = useParams();
  const [obra, setObra]       = useState(null);
  const [financeiro, setFin]  = useState({ contrato: 0, lancamentos: [] });
  const [diario, setDiario]   = useState([]);
  const [loading, setLoading] = useState(true);
  const hoje = new Date().toLocaleDateString("pt-BR");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const { data: obraData, error } = await sb.rpc("get_obra_portal", { p_token: token });
        if (error || !obraData) { setLoading(false); return; }
        setObra(obraData);

        const [{ data: fins }, { data: logs }] = await Promise.all([
          sb.from("financeiro").select("*").eq("obra_id", obraData.id),
          sb.from("diario").select("*").eq("obra_id", obraData.id).order("created_at", { ascending: false }).limit(5),
        ]);

        const lancamentos = fins || [];
        const contrato    = obraData.contrato || 0;
        setFin({ contrato, lancamentos });
        setDiario(logs || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

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

  const rec     = financeiro.lancamentos.filter((l) => l.tipo === "receita").reduce((a, l) => a + l.valor, 0);
  const pct     = financeiro.contrato > 0 ? Math.round((rec / financeiro.contrato) * 100) : 0;
  const faseIdx = FASES.indexOf(obra.fase);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>

      <div style={{ background: "#1A1A1A", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#414141 50%,#981915 50%)", borderRadius: 7, border: "1px solid #333" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2, color: "#fff" }}>
              <span style={{ color: "#555" }}>STICK</span><span style={{ color: "#981915" }}>FRAME</span>
            </div>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 1.5 }}>SISTEMAS CONSTRUTIVOS</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#444" }}>Atualizado em {hoje}</div>
      </div>

      <div style={{ background: "linear-gradient(135deg,#981915,#6e1210)", padding: "28px 20px", color: "#fff" }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, opacity: .7, marginBottom: 6 }}>ACOMPANHAMENTO DE OBRA</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{obra.nome}</div>
        <div style={{ fontSize: 13, opacity: .8, marginBottom: 14 }}>Cliente: {obra.cliente}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[obra.status, `Prazo: ${obra.prazo}`, `${obra.progresso}% concluído`].map((b) => (
            <span key={b} style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600 }}>{b}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px", maxWidth: 480, margin: "0 auto" }}>
        <Card title="Progresso Geral">
          <div style={{ fontSize: 30, fontWeight: 800, color: "#981915" }}>{obra.progresso}%</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2, marginBottom: 10 }}>concluído</div>
          <Bar val={obra.progresso} color="linear-gradient(90deg,#981915,#6e1210)" />
        </Card>

        <Card title="Etapas da Obra">
          {FASES.map((f, i) => {
            const done = i < faseIdx, curr = i === faseIdx;
            return (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < FASES.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? "#2e9e5b" : curr ? "#981915" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: done || curr ? "#fff" : "#bbb", flexShrink: 0 }}>
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: 12, color: done ? "#2e9e5b" : curr ? "#981915" : "#bbb", fontWeight: curr ? 700 : 400, flex: 1 }}>{f}</div>
                {curr && <span style={{ background: "#981915", color: "#fff", borderRadius: 10, padding: "1px 8px", fontSize: 9, fontWeight: 700 }}>Atual</span>}
              </div>
            );
          })}
        </Card>

        {financeiro.contrato > 0 && (
          <Card title="Financeiro">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <FinItem label="Contrato" value={fmt(financeiro.contrato)} />
              <FinItem label="Recebido"  value={fmt(rec)} color="#2e9e5b" />
            </div>
            <Bar val={pct} color="linear-gradient(90deg,#2e9e5b,#1a7a40)" />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888", marginTop: 5 }}>
              <span>{pct}% recebido</span><span>{100 - pct}% a receber</span>
            </div>
          </Card>
        )}

        {diario.length > 0 && (
          <Card title="Últimas Atualizações">
            {diario.map((r, i) => (
              <div key={r.id || i} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: i < diario.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 3 }}>{r.data} · {r.clima} · {r.turno}</div>
                <div style={{ fontSize: 12, color: "#444", lineHeight: 1.5 }}>{r.atividades}</div>
                {r.ocorrencias && (
                  <div style={{ background: "#fff5f5", borderLeft: "3px solid #981915", padding: "6px 10px", borderRadius: "0 4px 4px 0", fontSize: 11, color: "#555", marginTop: 5 }}>
                    ⚠️ {r.ocorrencias}
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}

        <div style={{ textAlign: "center", padding: "16px 0", fontSize: 10, color: "#aaa" }}>
          <strong style={{ color: "#555" }}>Stick Frame Sistemas Construtivos</strong><br />
          Santo André/SP · {hoje}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "#888", marginBottom: 10, textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}

function Bar({ val, color }) {
  return (
    <div style={{ height: 7, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: 7, width: `${Math.min(val, 100)}%`, background: color, borderRadius: 4 }} />
    </div>
  );
}

function FinItem({ label, value, color = "#222" }) {
  return (
    <div style={{ background: "#f9f9f9", borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
