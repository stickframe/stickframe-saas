import { C } from "../utils/constants";
import { fmt } from "../utils/format";
import useAppStore from "../store/useAppStore";
import { useModuleLoad } from "../hooks/useModuleLoad";

function KPI({ label, value, sub, cor = C.text, badge }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, marginBottom: 8 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</div>}
      {badge && (
        <div style={{ marginTop: 8, display: "inline-block", background: badge.cor + "22", color: badge.cor, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
          {badge.label}
        </div>
      )}
    </div>
  );
}

function Linha({ label, valor, cor, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 13, color: bold ? C.text : C.muted, fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 800 : 600, color: cor || C.text }}>{valor}</span>
    </div>
  );
}

export default function DashboardFinanceiro() {
  useModuleLoad("financeiro");
  useModuleLoad("obras");
  useModuleLoad("contratos");

  const financeiro = useAppStore((s) => s.financeiro);
  const obras      = useAppStore((s) => s.obras);
  const contratos  = useAppStore((s) => s.contratos);
  const user       = useAppStore((s) => s.user);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const hoje     = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7); // YYYY-MM

  const allLanc = Object.values(financeiro).flatMap((f) => f.lancamentos || []);

  // Totais gerais
  const totalReceitas  = allLanc.filter((l) => l.tipo === "receita").reduce((s, l) => s + (l.valor || 0), 0);
  const totalDespesas  = allLanc.filter((l) => l.tipo === "despesa").reduce((s, l) => s + (l.valor || 0), 0);
  const saldoGeral     = totalReceitas - totalDespesas;

  // Mês atual
  const lancMes       = allLanc.filter((l) => (l.data || "").startsWith(mesAtual));
  const receitasMes   = lancMes.filter((l) => l.tipo === "receita").reduce((s, l) => s + (l.valor || 0), 0);
  const despesasMes   = lancMes.filter((l) => l.tipo === "despesa").reduce((s, l) => s + (l.valor || 0), 0);
  const saldoMes      = receitasMes - despesasMes;

  // Por obra — top 5 maior despesa
  const obrasComSaldo = obras.map((o) => {
    const fin      = financeiro[o.id] || { lancamentos: [] };
    const lancs    = fin.lancamentos || [];
    const rec      = lancs.filter((l) => l.tipo === "receita").reduce((s, l) => s + (l.valor || 0), 0);
    const desp     = lancs.filter((l) => l.tipo === "despesa").reduce((s, l) => s + (l.valor || 0), 0);
    return { nome: o.nome?.split("—")[0]?.trim() || "Obra", rec, desp, saldo: rec - desp };
  }).sort((a, b) => b.desp - a.desp).slice(0, 5);

  // Contratos
  const valorContratos = contratos.reduce((s, c) => s + (c.valor || 0), 0);
  const contratosAtivos = contratos.filter((c) => c.status === "Ativo" || c.status === "Em andamento").length;

  // DRE por categoria (despesas)
  const categDespesas = {};
  allLanc.filter((l) => l.tipo === "despesa").forEach((l) => {
    const cat = l.categoria || "Outros";
    categDespesas[cat] = (categDespesas[cat] || 0) + (l.valor || 0);
  });
  const dreLinhas = Object.entries(categDespesas).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          {saudacao}, {user?.nome?.split(" ")[0]} 👋
        </h2>
        <p style={{ color: C.muted, fontSize: 13 }}>Visão financeira consolidada da empresa</p>
      </div>

      {/* KPIs principais */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <KPI
          label="Saldo Geral"
          value={fmt(saldoGeral)}
          sub={`${fmt(totalReceitas)} receitas · ${fmt(totalDespesas)} despesas`}
          cor={saldoGeral >= 0 ? C.success : C.danger}
          badge={saldoGeral >= 0
            ? { label: "Positivo", cor: C.success }
            : { label: "Negativo", cor: C.danger }}
        />
        <KPI
          label={`Resultado ${mesAtual.slice(5, 7)}/${mesAtual.slice(0, 4)}`}
          value={fmt(saldoMes)}
          sub={`${fmt(receitasMes)} entrada · ${fmt(despesasMes)} saída`}
          cor={saldoMes >= 0 ? C.success : C.danger}
        />
        <KPI
          label="Contratos ativos"
          value={contratosAtivos}
          sub={`${fmt(valorContratos)} em carteira`}
          cor={C.text}
        />
        <KPI
          label="Obras com lançamentos"
          value={Object.keys(financeiro).length}
          sub={`${obras.filter((o) => o.status === "Em andamento").length} em andamento`}
          cor={C.text}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
        {/* DRE por categoria */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16 }}>DRE — Despesas por categoria</div>
          {dreLinhas.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 20 }}>Sem lançamentos</div>
          ) : (
            <>
              <Linha label="Total receitas"  valor={fmt(totalReceitas)}  cor={C.success} bold />
              <Linha label="Total despesas"  valor={`(${fmt(totalDespesas)})`} cor={C.danger} bold />
              <div style={{ height: 12 }} />
              {dreLinhas.map(([cat, val]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{cat}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 60, height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min((val / totalDespesas) * 100, 100)}%`, height: "100%", background: C.red, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text, minWidth: 90, textAlign: "right" }}>{fmt(val)}</span>
                  </div>
                </div>
              ))}
              <div style={{ height: 8 }} />
              <Linha label="Resultado líquido" valor={fmt(saldoGeral)} cor={saldoGeral >= 0 ? C.success : C.danger} bold />
            </>
          )}
        </div>

        {/* Top obras por despesa */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16 }}>Top obras — maior custo</div>
          {obrasComSaldo.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 20 }}>Sem dados</div>
          ) : obrasComSaldo.map((o, i) => (
            <div key={i} style={{ padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{o.nome}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: o.saldo >= 0 ? C.success : C.danger }}>{fmt(o.saldo)}</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 11, color: C.success }}>↑ {fmt(o.rec)}</span>
                <span style={{ fontSize: 11, color: C.danger }}>↓ {fmt(o.desp)}</span>
              </div>
              <div style={{ marginTop: 5, height: 4, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                <div style={{
                  width: `${o.rec > 0 ? Math.min((o.rec / (o.rec + o.desp)) * 100, 100) : 0}%`,
                  height: "100%", background: C.success, borderRadius: 3
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mês a mês (últimos 6 meses) */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16 }}>Fluxo mensal — últimos 6 meses</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 100, padding: "0 4px" }}>
          {Array.from({ length: 6 }, (_, i) => {
            const d   = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
            const key = d.toISOString().slice(0, 7);
            const rec  = allLanc.filter((l) => l.tipo === "receita" && (l.data || "").startsWith(key)).reduce((s, l) => s + (l.valor || 0), 0);
            const desp = allLanc.filter((l) => l.tipo === "despesa" && (l.data || "").startsWith(key)).reduce((s, l) => s + (l.valor || 0), 0);
            const maxVal = Math.max(...Array.from({ length: 6 }, (_, j) => {
              const dk   = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - j), 1).toISOString().slice(0, 7);
              return Math.max(
                allLanc.filter((l) => l.tipo === "receita" && (l.data || "").startsWith(dk)).reduce((s, l) => s + (l.valor || 0), 0),
                allLanc.filter((l) => l.tipo === "despesa" && (l.data || "").startsWith(dk)).reduce((s, l) => s + (l.valor || 0), 0),
              );
            }), 1);
            const mes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][d.getMonth()];
            return (
              <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 80 }}>
                  <div style={{ flex: 1, height: Math.max((rec / maxVal) * 80, 2), background: C.success + "cc", borderRadius: "2px 2px 0 0" }} title={`Receita: ${fmt(rec)}`} />
                  <div style={{ flex: 1, height: Math.max((desp / maxVal) * 80, 2), background: C.danger + "cc", borderRadius: "2px 2px 0 0" }} title={`Despesa: ${fmt(desp)}`} />
                </div>
                <span style={{ fontSize: 9, color: C.muted }}>{mes}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 10, color: C.success, fontWeight: 700 }}>■ Receitas</span>
          <span style={{ fontSize: 10, color: C.danger, fontWeight: 700 }}>■ Despesas</span>
        </div>
      </div>
    </div>
  );
}
