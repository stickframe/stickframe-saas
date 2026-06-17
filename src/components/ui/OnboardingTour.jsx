import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import useAppStore from "../../store/useAppStore";

const PASSOS = [
  { titulo: "Bem-vindo ao StickFrame! ", descricao: "Seu sistema completo de gestão de obras. Vamos conhecer as principais funcionalidades em menos de 1 minuto.", icone: "" },
  { titulo: "Dashboard", descricao: "Acompanhe o VGV, obras ativas, receitas e despesas em tempo real. Clique em Analytics para ver relatórios avançados.", icone: "", pagina: "dashboard" },
  { titulo: "CRM / Clientes", descricao: "Gerencie seu pipeline com o kanban de clientes. Mova leads pelo funil até converter em obras contratadas.", icone: "", pagina: "crm" },
  { titulo: "Gestão de Obras", descricao: "Controle obras com financeiro, diário, arquivos, apontamentos e NCR. Adicione membros da equipe por projeto.", icone: "", pagina: "obras" },
  { titulo: "Financeiro", descricao: "Lançamentos de receitas e despesas, fluxo de caixa e relatórios por obra ou empresa.", icone: "", pagina: "financeiro" },
  { titulo: "Tudo pronto! ", descricao: "Explore os módulos: Cronograma, Medições, BIM, Checklists e muito mais. Boa gestão de obras!", icone: "" },
];

export function OnboardingTour() {
  const [passo, setPasso] = useState(0);
  const [visivel, setVisivel] = useState(false);
  const setActivePage = useAppStore(s => s.setActivePage);

  const user = useAppStore(s => s.user);

  useEffect(() => {
    if (user && !localStorage.getItem("sf_onboarding_done")) setVisivel(true);
  }, [user]);

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

  const modal = (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--bg-card,#fff)", borderRadius: 20, padding: "40px 36px", width: "min(480px, 100%)", textAlign: "center", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
        <button onClick={fechar} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#999", lineHeight: 1 }}></button>
        <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>{atual.icone}</div>
        <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800 }}>{atual.titulo}</h2>
        <p style={{ color: "#666", fontSize: 15, lineHeight: 1.65, margin: "0 0 28px" }}>{atual.descricao}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
          {PASSOS.map((_, i) => (
            <div key={i} onClick={() => setPasso(i)} style={{ width: i === passo ? 24 : 8, height: 8, borderRadius: 4, background: i === passo ? "#b41e1e" : "#ddd", cursor: "pointer", transition: "all 0.25s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {passo > 0 && (
            <button onClick={() => setPasso(p => p - 1)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #ddd", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>← Voltar</button>
          )}
          <button onClick={avancar} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: "#b41e1e", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
            {passo === PASSOS.length - 1 ? "Começar! " : "Próximo →"}
          </button>
        </div>
        <button onClick={fechar} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", fontSize: 12, color: "#999", cursor: "pointer" }}>Pular tour</button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
