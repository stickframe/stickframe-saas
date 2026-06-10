import React, { useState, useEffect } from "react";
import { fmtBRL, fmtPct } from "../../utils/format";
import { C } from "../../utils/constants";
import { Skeleton } from "../ui/Skeleton";
import { sb, getEmpresaId } from "../../services/supabase";

async function fetchKPIs(empresaId) {
  if (!empresaId) return null;

  const [obrasRes, orcamentosRes, clientesRes] = await Promise.all([
    sb.from("obras").select("id, status").eq("empresa_id", empresaId),
    sb.from("orcamentos").select("id, valor, status").eq("empresa_id", empresaId),
    sb.from("clientes").select("id, status").eq("empresa_id", empresaId),
  ]);

  // ── Obras ──────────────────────────────────────────────────────────────────
  const obras = obrasRes.data || [];
  const totalObras = obras.length;
  const obrasAtivas = obras.filter(
    (o) => o.status && o.status !== "Concluída" && o.status !== "Cancelada"
  ).length;

  // ── Orçamentos / Pipeline ──────────────────────────────────────────────────
  const orcamentos = orcamentosRes.data || [];
  const statusPipeline = ["Enviado", "Em análise", "Revisão", "Aguardando aprovação", "Pendente"];
  const excluidos = ["Fechado", "Cancelado"];
  const orcPipeline = orcamentos.filter((o) => !excluidos.includes(o.status));
  const totalPipeline = orcPipeline.reduce((acc, o) => acc + (Number(o.valor) || 0), 0);
  const aguardando = orcamentos.filter((o) => statusPipeline.includes(o.status)).length;

  // ── Conversão CRM (clientes com status "Fechado" / total) ──────────────────
  const clientes = clientesRes.data || [];
  const totalClientes = clientes.length;
  const fechados = clientes.filter((c) => c.status === "Fechado").length;
  const conversao = totalClientes > 0 ? (fechados / totalClientes) * 100 : null;

  return {
    obrasAtivas,
    totalObras,
    totalPipeline,
    aguardando,
    conversao,
    fechados,
  };
}

export default function DashboardKPIs() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const empresaId = getEmpresaId();

    setLoading(true);
    fetchKPIs(empresaId)
      .then((result) => { if (!cancelled) { setDados(result); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const kpis = [
    {
      id: 1,
      label: "Obras Ativas",
      valor: loading ? null : dados ? String(dados.obrasAtivas) : "—",
      sub: loading ? null : dados ? `de ${dados.totalObras} total` : "sem dados",
      cor: C.red,
      icon: "◆",
    },
    {
      id: 2,
      label: "Orçamentos (Pipeline)",
      valor: loading ? null : dados ? fmtBRL(dados.totalPipeline) : "—",
      sub: loading ? null : dados ? `${dados.aguardando} aguardando` : "sem dados",
      cor: C.warning,
      icon: "◻",
    },
    {
      id: 3,
      label: "Margem Média",
      valor: "—",
      sub: "dados financeiros pendentes",
      cor: C.success,
      icon: "%",
    },
    {
      id: 4,
      label: "Conversão CRM",
      valor: loading ? null : dados && dados.conversao != null ? fmtPct(dados.conversao) : "—",
      sub: loading ? null : dados ? `${dados.fechados} fechados` : "sem dados",
      cor: C.steel,
      icon: "◈",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
      {kpis.map((kpi) => (
        <div key={kpi.id} className="sf-card card-hover" style={{ borderTop: `3px solid ${kpi.cor}` }}>
          <div className="sf-row-between" style={{ marginBottom: 12 }}>
            <span className="sf-label" style={{ marginBottom: 0 }}>{kpi.label}</span>
            <span style={{ color: kpi.cor, fontSize: 16 }}>{kpi.icon}</span>
          </div>

          {/* A classe "num" garante a fonte Barlow Condensed */}
          {loading && kpi.id !== 3 ? (
            <Skeleton h={32} w="60%" radius={4} />
          ) : (
            <div className="num" style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>
              {kpi.valor}
            </div>
          )}

          <div className="sf-muted-sm" style={{ marginTop: 8 }}>
            {loading && kpi.id !== 3 ? <Skeleton h={12} w="70%" radius={4} /> : kpi.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
