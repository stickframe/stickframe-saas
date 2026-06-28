import { useState, useEffect, useCallback, useMemo } from "react";
import { C } from "../utils/constants";
import { carregarOperacional, desfazerAcaoIA } from "../services/stickbrainService";
import { montarFilaAcoes } from "../services/stickbrainActions";
import useAppStore from "../store/useAppStore";
import { useToast } from "../hooks/useToast";
import { SkeletonList } from "../components/Skeleton";
import ErrorState from "../components/ErrorState";
import TodayBand from "../components/stickbrain/TodayBand";
import ActionQueue from "../components/stickbrain/ActionQueue";
import LeadThermometer from "../components/stickbrain/LeadThermometer";
import DealCloseList from "../components/stickbrain/DealCloseList";
import OriginSignal from "../components/stickbrain/OriginSignal";
import AutomationLog from "../components/stickbrain/AutomationLog";

const cond = "var(--cond)";
const VISOES = [["sugeridas", "Sugeridas"], ["automaticas", "Automáticas"], ["todas", "Todas"]];

export default function StickBrainOperacional() {
  const [op, setOp] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [visao, setVisao] = useState("sugeridas");
  const [adiadas, setAdiadas] = useState(() => new Set());
  const setActivePage = useAppStore((s) => s.setActivePage);
  const { toast, mostrarToast } = useToast();

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try { setOp(await carregarOperacional()); }
    catch (e) { setErro(e.message); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Telemetria de produto: marco "abriu StickBrain"
  useEffect(() => {
    import("../services/health/productMetrics").then(({ trackStickBrainOpened }) => trackStickBrainOpened()).catch(() => {});
  }, []);

  const fila = useMemo(() => (op ? montarFilaAcoes(op) : null), [op]);
  const gruposFiltrados = useMemo(() => {
    if (!fila) return {};
    const filtra = (arr) => arr.filter((a) => !adiadas.has(a.id));
    return { agora: filtra(fila.grupos.agora), hoje: filtra(fila.grupos.hoje), semana: filtra(fila.grupos.semana) };
  }, [fila, adiadas]);

  function onCta(acao, cta) {
    switch (cta.k) {
      case "recuperar": case "ver_lista": setActivePage("inteligencia"); break;
      case "agendar": setActivePage("agenda"); break;
      default: setActivePage("orcamentos"); break;
    }
    mostrarToast(`Abrindo para: ${acao.verbo} ${acao.entidade.nome}`);
  }
  function onDismiss(acao) {
    setAdiadas((prev) => new Set(prev).add(acao.id));
  }
  async function onDesfazer(a) {
    try { await desfazerAcaoIA(a.id); carregar(); mostrarToast(" Automação desfeita."); }
    catch (e) { mostrarToast(` ${e.message}`, true); }
  }

  const monit = op?.monitorando || 0;

  const Header = (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
      <div>
        <h1 style={{ fontFamily: cond, fontWeight: 800, fontSize: 28, color: C.text, lineHeight: 1 }}>
          StickBrain <span style={{ color: C.red }}>Operacional™</span>
        </h1>
        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>A IA agindo: o que fazer agora para não perder dinheiro.</p>
      </div>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 13px", fontSize: 12, fontWeight: 600, color: C.text }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, boxShadow: `0 0 6px ${C.success}` }} />
        Monitorando {monit} oportunidades
      </span>
    </div>
  );

  if (carregando) return <div>{Header}<SkeletonList rows={4} /></div>;
  if (erro) return <div>{Header}<ErrorState title="Não foi possível carregar o Operacional" message={erro} onRetry={carregar} /></div>;

  const b = op?.band || {};

  return (
    <div>
      {toast}
      {Header}

      <TodayBand total={fila?.total} valorEmJogo={fila?.valorEmJogo} imediatas={fila?.imediatas}
        esfriando={b.esfriando} quentes={b.quentes} automacoes={b.automacoes_hoje} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(280px,1fr)", gap: 18, alignItems: "start" }} className="oper-grid">
        {/* Coluna principal — fila */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: cond, fontWeight: 800, fontSize: 21, color: C.text }}>Ações de hoje</div>
              <div style={{ fontSize: 11.5, color: C.muted }}>Priorizadas pela IA por impacto × urgência</div>
            </div>
            <div style={{ display: "inline-flex", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden" }}>
              {VISOES.map(([k, lbl]) => (
                <button key={k} onClick={() => setVisao(k)} style={{
                  background: visao === k ? C.red : "transparent", color: visao === k ? "#fff" : C.text,
                  border: "none", padding: "6px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>{lbl}</button>
              ))}
            </div>
          </div>

          {visao !== "automaticas" && <ActionQueue grupos={gruposFiltrados} onCta={onCta} onDismiss={onDismiss} />}

          {visao !== "sugeridas" && (
            <div style={{ marginTop: 18 }}>
              <AutomationLog itens={op?.feito_ia} onDesfazer={onDesfazer} />
            </div>
          )}
        </div>

        {/* Coluna de sinais */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LeadThermometer oportunidades={op?.oportunidades} />
          <DealCloseList oportunidades={op?.oportunidades} onAbrir={() => setActivePage("orcamentos")} />
          <OriginSignal sinais={op?.origem_sinais} />
        </div>
      </div>
    </div>
  );
}
