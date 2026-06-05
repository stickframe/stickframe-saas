import { lazy, Suspense, useEffect } from "react";
import { setEmpresaId } from "./services/supabase";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/globals.css";
import "./styles/responsive.css";
import useAppStore from "./store/useAppStore";
import AppLayout from "./components/layout/AppLayout";
import LoginScreen from "./pages/LoginScreen";
import LoadingScreen from "./components/ui/LoadingScreen";
import { PageSkeleton } from "./components/ui/Skeleton";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import UndoBar from "./components/ui/UndoBar";
import { OnboardingTour } from "./components/ui/OnboardingTour";
import { useUndoStore } from "./store/undoStore";
import { useHotkeys } from "react-hotkeys-hook";

// Auto-reload on chunk fetch failure (stale SW cache after deploy)
function lazyWithRetry(fn) {
  return lazy(() => fn().catch((e) => {
    if (e?.message?.includes("fetch") || e?.message?.includes("Failed")) {
      window.location.reload();
    }
    throw e;
  }));
}

const Dashboard   = lazyWithRetry(() => import("./pages/Dashboard"));
const Agenda      = lazyWithRetry(() => import("./pages/Agenda"));
const CRM         = lazyWithRetry(() => import("./pages/CRM"));
const Orcamentos  = lazyWithRetry(() => import("./pages/Orcamentos"));
const GestaoObras = lazyWithRetry(() => import("./pages/GestaoObras"));
const Medicoes    = lazyWithRetry(() => import("./pages/Medicoes"));
const DiarioObra  = lazyWithRetry(() => import("./pages/DiarioObra"));
const Financeiro  = lazyWithRetry(() => import("./pages/Financeiro"));
const Contratos   = lazyWithRetry(() => import("./pages/Contratos"));
const Historico   = lazyWithRetry(() => import("./pages/Historico"));
const PortalOnline   = lazyWithRetry(() => import("./pages/PortalOnline"));
const PropostaOnline  = lazyWithRetry(() => import("./pages/PropostaOnline"));
const ContratoOnline  = lazyWithRetry(() => import("./pages/ContratoOnline"));
const Equipe      = lazyWithRetry(() => import("./pages/Equipe"));
const Cronograma  = lazyWithRetry(() => import("./pages/Cronograma"));
const Vistorias   = lazyWithRetry(() => import("./pages/Vistorias"));
const BIM           = lazyWithRetry(() => import("./pages/BIM"));
const Quantitativos  = lazyWithRetry(() => import("./pages/Quantitativos"));
const Configuracoes  = lazyWithRetry(() => import("./pages/Configuracoes"));
const Fornecedores   = lazyWithRetry(() => import("./pages/Fornecedores"));
const Calculadora       = lazyWithRetry(() => import("./pages/Calculadora"));
const OrcamentoTecnico  = lazyWithRetry(() => import("./pages/OrcamentoTecnico"));
const MonitorPrecos     = lazyWithRetry(() => import("./pages/MonitorPrecos"));
const Equipamentos      = lazyWithRetry(() => import("./pages/Equipamentos"));
const Checklists        = lazyWithRetry(() => import("./pages/Checklists"));
const QRObra            = lazyWithRetry(() => import("./pages/QRObra"));
const Inteligencia      = lazyWithRetry(() => import("./pages/Inteligencia"));
const CalculadoraPublica   = lazyWithRetry(() => import("./pages/CalculadoraPublica"));
const AnalisePublica       = lazyWithRetry(() => import("./pages/AnalisePublica"));
const ConcorrenciaPublica  = lazyWithRetry(() => import("./pages/ConcorrenciaPublica"));
const PontoColaborador     = lazyWithRetry(() => import("./pages/PontoColaborador"));
const AmbienteQR           = lazyWithRetry(() => import("./pages/AmbienteQR"));
const PainelQR             = lazyWithRetry(() => import("./pages/PainelQR"));
const BI                   = lazyWithRetry(() => import("./pages/BI"));
const SST                  = lazyWithRetry(() => import("./pages/SST"));
const Suprimentos          = lazyWithRetry(() => import("./pages/Suprimentos"));
const PortalColaborador    = lazyWithRetry(() => import("./pages/PortalColaborador"));

const PAGES = {
  dashboard:  Dashboard,
  agenda:     Agenda,
  crm:        CRM,
  orcamentos: Orcamentos,
  obras:      GestaoObras,
  medicoes:   Medicoes,
  diario:     DiarioObra,
  financeiro: Financeiro,
  contratos:  Contratos,
  historico:  Historico,
  equipe:     Equipe,
  cronograma: Cronograma,
  vistorias:  Vistorias,
  bim:           BIM,
  quantitativos:  Quantitativos,
  configuracoes:  Configuracoes,
  fornecedores:      Fornecedores,
  calculadora:       Calculadora,
  orcamento_tecnico: OrcamentoTecnico,
  monitor_precos: MonitorPrecos,
  equipamentos:   Equipamentos,
  checklists:     Checklists,
  inteligencia:   Inteligencia,
  bi:             BI,
  sst:            SST,
  suprimentos:    Suprimentos,
};

function AuthenticatedApp() {
  const activePage    = useAppStore((s) => s.activePage);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const user          = useAppStore((s) => s.user);
  const loaded        = useAppStore((s) => s.loaded);

  useEffect(() => {
    if (user?.empresaId) setEmpresaId(user.empresaId);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const PREFETCH = [
      () => import("./pages/CRM"),
      () => import("./pages/Orcamentos"),
      () => import("./pages/GestaoObras"),
      () => import("./pages/Financeiro"),
      () => import("./pages/Dashboard"),
    ];
    const hasRIC = typeof requestIdleCallback !== "undefined";
    const id = hasRIC
      ? requestIdleCallback(() => PREFETCH.forEach((fn) => fn()), { timeout: 3000 })
      : setTimeout(() => PREFETCH.forEach((fn) => fn()), 1500);
    return () => hasRIC ? cancelIdleCallback(id) : clearTimeout(id);
  }, [user]);

  useEffect(() => {
    const path = `/${activePage === "dashboard" ? "" : activePage}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, [activePage]);

  useEffect(() => {
    const page = window.location.pathname.replace("/", "") || "dashboard";
    if (PAGES[page] && page !== activePage) setActivePage(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPop = () => {
      const page = window.location.pathname.replace("/", "") || "dashboard";
      if (PAGES[page]) setActivePage(page);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setActivePage]);

  const darkMode = useAppStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const ActivePage = PAGES[activePage] || Dashboard;

  return (
    <AppLayout>
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <div key={activePage} className="page-transition">
            <ActivePage />
          </div>
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

function RequireAuth({ children }) {
  const user = useAppStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
}

function GlobalHotkeys() {
  const pop = useUndoStore((s) => s.pop);
  const toast = useToast();

  useHotkeys("ctrl+z, meta+z", async (e) => {
    e.preventDefault();
    const entry = pop();
    if (!entry) return;
    try {
      await entry.restoreFn();
      toast.success(`↩️ Desfeito: ${entry.label}`);
    } catch (err) {
      toast.error(`Erro ao desfazer: ${err.message}`);
    }
  }, { enableOnFormTags: false });

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <GlobalHotkeys />
      <UndoBar />
      <OnboardingTour />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/portal/:token"        element={<PortalOnline />} />
          <Route path="/proposta/:token"      element={<PropostaOnline />} />
          <Route path="/contrato/:token"      element={<ContratoOnline />} />
          <Route path="/qr/obra/:obraId"      element={<QRObra />} />
          <Route path="/calcular"             element={<CalculadoraPublica />} />
          <Route path="/docs-publicos"        element={<AnalisePublica />} />
          <Route path="/concorrencia/:token"  element={<ConcorrenciaPublica />} />
          <Route path="/ponto/:token"         element={<PontoColaborador />} />
          <Route path="/colaborador/:token"   element={<PortalColaborador />} />
          <Route path="/ambiente/:token"      element={<AmbienteQR />} />
          <Route path="/painel/:token"        element={<PainelQR />} />
          <Route path="/login"                element={<LoginScreen />} />
          <Route path="/*" element={
            <RequireAuth>
              <AuthenticatedApp />
            </RequireAuth>
          } />
        </Routes>
      </Suspense>
      </ToastProvider>
    </BrowserRouter>
  );
}
