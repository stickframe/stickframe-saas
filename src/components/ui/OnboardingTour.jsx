import { useState, useEffect } from "react";
import useAppStore from "../../store/useAppStore";

const PASSOS = [
  { titulo: "Bem-vindo ao StickFrame! 🏗️", descricao: "Seu sistema completo de gestão de obras. Vamos conhecer as principais funcionalidades em menos de 1 minuto.", icone: "🏠" },
  { titulo: "Dashboard", descricao: "Acompanhe o VGV, obras ativas, receitas e despesas em tempo real. Clique em Analytics para ver relatórios avançados.", icone: "📊", pagina: "dashboard" },
  { titulo: "CRM / Clientes", descricao: "Gerencie seu pipeline com o kanban de clientes. Mova leads pelo funil até converter em obras contratadas.", icone: "👥", pagina: "crm" },
  { titulo: "Gestão de Obras", descricao: "Controle obras com financeiro, diário, arquivos, apontamentos e NCR. Adicione membros da equipe por projeto.", icone: "🏗️", pagina: "obras" },
  { titulo: "Financeiro", descricao: "Lançamentos de receitas e despesas, fluxo de caixa e relatórios por obra ou empresa.", icone: "💰", pagina: "financeiro" },
  { titulo: "Tudo pronto! 🎉", descricao: "Explore os módulos: Cronograma, Medições, BIM, Checklists e muito mais. Boa gestão de obras!", icone: "🚀" },
];

export function OnboardingTour() {
  const [passo, setPasso] = useState(0);
  const [visivel, setVisivel] = useState(false);
  const setActivePage = useAppStore(s => s.setActivePage);

  useEffect(() => {
    if (!localStorage.getItem("sf_onboarding_done")) setVisivel(true);
  }, []);

  function fechar() {
    localStorage.setItem("sf_onboarding_done", "1");
    setVisivel(false);
  }

  function avancar() {
    const prox = PASSOS[passo + 1];
    if (prox?.pagina) setActivePage(prox.pagina);
    if (passo < PASSOS.length - 1) setPasso(p => p + 1);
    else fechar();
  }

  if (!visivel) return null;
  const atual = PASSOS[passo];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: "40px 36px", width: "min(460px, 90vw)", textAlign: "center", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <button onClick={fechar} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
        <div style={{ fontSize: 60, marginBottom: 16 }}>{atual.icone}</div>
        <h2 style={{ margin: "0 0 10px", fontSize: 21 }}>{atual.titulo}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.65, margin: "0 0 28px" }}>{atual.descricao}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
          {PASSOS.map((_, i) => (
            <div key={i} onClick={() => setPasso(i)} style={{ width: i === passo ? 22 : 8, height: 8, borderRadius: 4, background: i === passo ? "#b41e1e" : "var(--border)", cursor: "pointer", transition: "all 0.2s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {passo > 0 && (
            <button onClick={() => setPasso(p => p - 1)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: 14 }}>← Voltar</button>
          )}
          <button onClick={avancar} style={{ padding: "9px 26px", borderRadius: 10, border: "none", background: "#b41e1e", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            {passo === PASSOS.length - 1 ? "Começar! 🚀" : "Próximo →"}
          </button>
        </div>
        <button onClick={fechar} style={{ marginTop: 10, background: "none", border: "none", fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>Pular tour</button>
      </div>
    </div>
  );
}
