import { useEffect } from "react";
import { C, FASES } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "16px 18px",
      border: `1px solid ${C.border}`, borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function BarraProgresso({ valor, max, cor = C.red }) {
  const pct = max > 0 ? Math.min((valor / max) * 100, 100) : 0;
  return (
    <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 3, transition: "width .3s" }} />
    </div>
  );
}

function ObraCard({ obra, financeiro, medicoes, bimApontamentos, hoje, destaque }) {
  const fin    = financeiro[obra.id] || { lancamentos: [] };
  const lancs  = fin.lancamentos || [];
  const recTotal  = lancs.filter((l) => l.tipo === "receita").reduce((a, l) => a + (l.valor || 0), 0);
  const despTotal = lancs.filter((l) => l.tipo === "despesa").reduce((a, l) => a + (l.valor || 0), 0);
  const previsto  = obra.contrato || 0;
  const desvio    = previsto > 0 ? (((despTotal - previsto) / previsto) * 100).toFixed(1) : null;
  const desvioPos = desvio !== null && Number(desvio) > 0;

  const prazoFim      = obra.prazo_fim ? new Date(obra.prazo_fim + "T00:00") : null;
  const diasRestantes = prazoFim ? Math.ceil((prazoFim - hoje) / (1000 * 60 * 60 * 24)) : null;
  const prazoAtrasado = diasRestantes !== null && diasRestantes < 0;

  const medObra = (medicoes[obra.id] || []).filter((m) => m.status === "Pendente");
  const aptObra = (bimApontamentos[obra.id] || []).filter((a) => a.status === "Aberto");

  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: `1px solid ${destaque ? C.red + "55" : C.border}`,
      borderLeft: `4px solid ${prazoAtrasado ? C.danger : destaque ? C.red : C.border}`,
      padding: "20px 24px",
      boxShadow: destaque ? `0 2px 12px ${C.red}18` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{obra.nome}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {obra.cliente && <span>{obra.cliente} · </span>}
            <span style={{ color: C.red, fontWeight: 600 }}>{obra.fase || FASES[0]}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: Number(obra.progresso) >= 80 ? C.success : C.text }}>
            {obra.progresso || 0}%
          </div>
          <div style={{ fontSize: 10, color: C.muted }}>concluído</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 5 }}>
          <span>Progresso físico</span><span>{obra.progresso || 0}%</span>
        </div>
        <BarraProgresso valor={obra.progresso || 0} max={100} cor={C.red} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: obra.prazo_fim ? 14 : 0 }}>
        <div style={{ background: C.darker, borderRadius: 8, padding: "12px 14px", border: desvioPos ? `1px solid ${C.danger}44` : `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Custo realizado</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: desvioPos ? C.danger : C.text }}>{fmt(despTotal)}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>previsto: {fmt(previsto)}</div>
          {desvio !== null && (
            <div style={{ fontSize: 10, fontWeight: 700, color: desvioPos ? C.danger : C.success, marginTop: 2 }}>
              {desvioPos ? `▲ +${desvio}% acima` : `▼ ${Math.abs(Number(desvio))}% abaixo`}
            </div>
          )}
          {previsto > 0 && <div style={{ marginTop: 8 }}><BarraProgresso valor={despTotal} max={previsto} cor={desvioPos ? C.danger : C.success} /></div>}
        </div>

        <div style={{ background: C.darker, borderRadius: 8, padding: "12px 14px", border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Medições pendentes</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: medObra.length > 0 ? C.warning : C.success }}>{medObra.length}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{fmt(medObra.reduce((a, m) => a + (m.valor || 0), 0))} a faturar</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>receita: {fmt(recTotal)}</div>
        </div>

        <div style={{ background: C.darker, borderRadius: 8, padding: "12px 14px", border: `1px solid ${aptObra.length > 0 ? C.danger + "44" : C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Apontamentos BIM</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: aptObra.length > 0 ? C.danger : C.success }}>{aptObra.length}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>abertos</div>
          {aptObra.filter((a) => a.prioridade === "Alta").length > 0 && (
            <div style={{ fontSize: 10, color: C.danger, fontWeight: 700, marginTop: 2 }}>
              {aptObra.filter((a) => a.prioridade === "Alta").length} alta prioridade
            </div>
          )}
        </div>
      </div>

      {prazoFim && (
        <div style={{
          marginTop: 14, padding: "8px 14px", borderRadius: 8,
          background: prazoAtrasado ? C.danger + "10" : diasRestantes <= 14 ? C.warning + "10" : C.success + "08",
          border: `1px solid ${prazoAtrasado ? C.danger + "33" : diasRestantes <= 14 ? C.warning + "33" : C.success + "22"}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: C.muted }}>Entrega prevista: <strong>{prazoFim.toLocaleDateString("pt-BR")}</strong></span>
          <span style={{ fontSize: 12, fontWeight: 800, color: prazoAtrasado ? C.danger : diasRestantes <= 14 ? C.warning : C.success }}>
            {prazoAtrasado ? `⚠ ${Math.abs(diasRestantes)} dias atrasado` : diasRestantes === 0 ? "Entrega hoje!" : `${diasRestantes} dias restantes`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function DashboardEngenheiro() {
  useModuleLoad("obras");
  useModuleLoad("financeiro");
  useModuleLoad("medicoes");

  const obras           = useAppStore((s) => s.obras);
  const financeiro      = useAppStore((s) => s.financeiro);
  const medicoes        = useAppStore((s) => s.medicoes);
  const bimApontamentos = useAppStore((s) => s.bimApontamentos);
  const alocacoes       = useAppStore((s) => s.alocacoes);
  const loadMedicoes    = useAppStore((s) => s.loadMedicoes);
  const user            = useAppStore((s) => s.user);

  useModuleLoad("alocacoes");

  useEffect(() => {
    obras.forEach((o) => loadMedicoes(o.id));
  }, [obras, loadMedicoes]);

  const obrasAtivas = obras.filter((o) => o.status === "Em andamento");

  // Obras onde o engenheiro está alocado (destaque no topo)
  const minhasObras = alocacoes?.length
    ? obrasAtivas.filter((o) => alocacoes.some((a) => a.obra_id === o.id && a.colaborador_id === user?.uid))
    : [];
  const outrasObras = obrasAtivas.filter((o) => !minhasObras.find((m) => m.id === o.id));
  const hoje          = new Date();

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const allMedicoes   = Object.values(medicoes).flat();
  const medPendentes  = allMedicoes.filter((m) => m.status === "Pendente");
  const atrasadas     = obras.filter((o) => o.prazo_fim && o.status !== "Concluída" && new Date(o.prazo_fim) < hoje);

  const allApontamentos = Object.values(bimApontamentos).flat();
  const apontAbertos    = allApontamentos.filter((a) => a.status === "Aberto" && a.prioridade === "Alta");

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>
          {saudacao()}, {user?.nome?.split(" ")[0] || "Engenheiro"} 👷
        </h2>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Obras atrasadas" value={String(atrasadas.length)}     sub="prazo vencido"                       accent={atrasadas.length > 0 ? C.danger : C.success} />
        <KpiCard label="Apontamentos !" value={String(apontAbertos.length)}   sub="BIM — alta prioridade"               accent={apontAbertos.length > 0 ? C.danger : C.success} />
      </div>

      {/* Minhas obras — destaque */}
      {minhasObras.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: C.red, textTransform: "uppercase", marginBottom: 12 }}>
            ◆ Minhas obras ({minhasObras.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {minhasObras.map((obra) => <ObraCard key={obra.id} obra={obra} financeiro={financeiro} medicoes={medicoes} bimApontamentos={bimApontamentos} hoje={hoje} destaque />)}
          </div>
        </div>
      )}

      {/* Demais obras ativas */}
      {(minhasObras.length > 0 && outrasObras.length > 0) && (
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase", marginBottom: 12 }}>
          Outras obras ativas ({outrasObras.length})
        </div>
      )}

      {/* Cards por obra */}
      {obrasAtivas.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`,
          padding: "48px 0", textAlign: "center", color: C.muted,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◆</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Nenhuma obra em andamento</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(minhasObras.length > 0 ? outrasObras : obrasAtivas).map((obra) => (
            <ObraCard key={obra.id} obra={obra} financeiro={financeiro} medicoes={medicoes} bimApontamentos={bimApontamentos} hoje={hoje} />
          ))}
        </div>
      )}
    </>
  );
}
