import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import StickAssist from "../ui/StickAssist";
import NotificacaoDropdown from "../notificacoes/NotificacaoDropdown";
import PresenceAvatars from "./PresenceAvatars";
import CommandPalette from "../ui/CommandPalette";
import PWAInstallBanner from "../ui/PWAInstallBanner";
import { subscribePush } from "../../services/pushService";
import { C, NAV } from "../../utils/constants";
import { buscarEmpresa } from "../../services/repositories/empresaRepository";
import useAppStore from "../../store/useAppStore";
import { useTrial } from "../../hooks/useTrial";
import OnboardingWizard from "../ui/OnboardingWizard";
import { setMetricsContext } from "../../services/health/productMetrics";

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMenuOpen(true);
    document.addEventListener("sf:open-menu", handler);
    return () => document.removeEventListener("sf:open-menu", handler);
  }, []);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const empresaId  = useAppStore((s) => s.empresaId);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const activePage = useAppStore((s) => s.activePage);
  const perfil     = useAppStore((s) => s.user?.perfil);
  const activeLabel = NAV.find((n) => n.key === activePage)?.label || "";
  const obras       = useAppStore((s) => s.obras);
  const plano       = useAppStore((s) => s.user?.plano);
  const obraAtiva   = obras.find((o) => o.status === "Em andamento") || obras[0] || null;
  const loadClientes = useAppStore((s) => s.loadClientes);
  const userId = useAppStore((s) => s.user?.id);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const { isTrial, isExpired, daysLeft } = useTrial();

  useEffect(() => {
    if (empresaId && userId) {
      subscribePush(empresaId, userId);
    }
  }, [empresaId, userId]);

  // Sync browser back/forward with activePage
  useEffect(() => {
    const onHash = () => {
      const page = window.location.hash.replace("#", "").trim();
      if (page) setActivePage(page);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [setActivePage]);

  // Pré-carrega clientes para o badge de follow-up do perfil comercial
  useEffect(() => {
    if (perfil === "comercial" && empresaId) loadClientes();
  }, [perfil, empresaId, loadClientes]);

  useEffect(() => {
    if (userId && empresaId) setMetricsContext(userId, empresaId);
  }, [userId, empresaId]);

  useEffect(() => {
    if (!empresaId) return;
    buscarEmpresa()
      .then((data) => {
        if (data && !data.onboarding_completo) setShowOnboarding(true);
        setCheckDone(true);
      })
      .catch(() => setCheckDone(true));
  }, [empresaId]);

  return (
    <div className="app-layout">
      {showOnboarding && checkDone && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}


      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-area">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button className="hamburger" onClick={() => setMenuOpen((v) => !v)}></button>

            {/* Página atual */}
            <span className="topbar-page-title" style={{ fontSize: 15, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>
              {activeLabel}
            </span>

            {/* Separador + obra ativa (desktop only) */}
            {obraAtiva && (
              <div className="topbar-obra-ativa" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 12px", borderRadius: 8,
                background: C.red + "0a", border: `1px solid ${C.red}22`,
                cursor: "pointer", transition: "background .15s",
              }}
                onClick={() => setActivePage("obras")}
                title="Ir para Gestão de Obras"
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3f7a4b", flexShrink: 0, boxShadow: "0 0 6px #3f7a4b" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                    {obraAtiva.nome}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                    Obra ativa · {obraAtiva.progresso || 0}%
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Plano badge */}
            <div style={{
              padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
              background: isTrial ? "#f59e0b18" : plano === "enterprise" ? "#1a1a2e" : plano === "pro" ? C.red + "15" : "#f4f1ec",
              color: isTrial ? "#b45309" : plano === "enterprise" ? "#a78bfa" : plano === "pro" ? C.red : C.muted,
              border: `1px solid ${isTrial ? "#f59e0b50" : plano === "enterprise" ? "#a78bfa50" : plano === "pro" ? C.red + "30" : C.border}`,
              letterSpacing: 0.5, whiteSpace: "nowrap",
            }}>
              {isTrial ? "TRIAL" : plano === "enterprise" ? "ENTERPRISE" : plano === "pro" ? "PRO" : "FREE"}
            </div>
            <PresenceAvatars />
            <NotificacaoDropdown />
            <button
              onClick={toggleDarkMode}
              title={darkMode ? "Modo claro" : "Modo escuro"}
              style={{
                background: "none", border: `1px solid ${C.border}`, cursor: "pointer",
                fontSize: 15, lineHeight: 1, padding: "6px 8px",
                borderRadius: 8, color: C.muted,
              }}
            >
              {darkMode ? "" : ""}
            </button>
          </div>
        </div>
        {(isTrial || isExpired) && (
          <div style={{
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "inherit",
            background: isExpired || daysLeft <= 3 ? "#dc2626" : "#f59e0b",
            color: "#fff",
          }}>
            <span>
              {isExpired
                ? "Seu trial expirou — "
                : `Seu trial Pro expira em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} — `}
            </span>
            <a
              href="/pricing"
              style={{
                background: "rgba(255,255,255,0.25)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "none",
              }}
            >
              {isExpired ? "Assinar agora" : "Fazer upgrade"}
            </a>
          </div>
        )}
        <main className="main-content">
          {children}
        </main>
      </div>
      <CommandPalette onNavigate={setActivePage} />
      <PWAInstallBanner />
      <StickAssist />
    </div>
  );
}
