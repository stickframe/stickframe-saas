import { lazy, Suspense, useEffect } from "react";
import { setEmpresaId } from "./services/supabase";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/globals.css";
import "./styles/responsive.css";
import useAppStore from "./store/useAppStore";
import AppLayout from "./components/layout/AppLayout";
import LoginScreen from "./pages/LoginScreen";
import LoadingScreen, { PageLoader } from "./components/ui/LoadingScreen";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

const Dashboard   = lazy(() => import("./pages/Dashboard"));
const Agenda      = lazy(() => import("./pages/Agenda"));
const CRM         = lazy(() => import("./pages/CRM"));
const Orcamentos  = lazy(() => import("./pages/Orcamentos"));
const GestaoObras = lazy(() => import("./pages/GestaoObras"));
const Medicoes    = lazy(() => import("./pages/Medicoes"));
const DiarioObra  = lazy(() => import("./pages/DiarioObra"));
const Financeiro  = lazy(() => import("./pages/Financeiro"));
const Contratos   = lazy(() => import("./pages/Contratos"));
const Historico   = lazy(() => import("./pages/Historico"));
const PortalOnline   = lazy(() => import("./pages/PortalOnline"));
const PropostaOnline  = lazy(() => import("./pages/PropostaOnline"));
const ContratoOnline  = lazy(() => import("./pages/ContratoOnline"));
const Equipe      = lazy(() => import("./pages/Equipe"));
const Cronograma  = lazy(() => import("./pages/Cronograma"));
const Vistorias   = lazy(() => import("./pages/Vistorias"));
const BIM           = lazy(() => import("./pages/BIM"));
const Quantitativos  = lazy(() => import("./pages/Quantitativos"));
const Configuracoes  = lazy(() => import("./pages/Configuracoes"));
const Fornecedores   = lazy(() => import("./pages/Fornecedores"));
const Calculadora       = lazy(() => import("./pages/Calculadora"));
const OrcamentoTecnico  = lazy(() => import("./pages/OrcamentoTecnico"));
const MonitorPrecos     = lazy(() => import("./pages/MonitorPrecos"));
const Equipamentos      = lazy(() => import("./pages/Equipamentos"));
const Checklists        = lazy(() => import("./pages/Checklists"));
const QRObra            = lazy(() => import("./pages/QRObra"));
const Inteligencia      = lazy(() => import("./pages/Inteligencia"));
const CalculadoraPublica = lazy(() => import("./pages/CalculadoraPublica"));

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
};

function AuthenticatedApp() {
  const activePage    = useAppStore((s) => s.activePage);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const user          = useAppStore((s) => s.user);
  const loaded        = useAppStore((s) => s.loaded);

  // Restaura empresaId no service após refresh — import síncrono elimina race condition
  useEffect(() => {
    if (user?.empresaId) setEmpresaId(user.empresaId);
  }, [user]);

  // Sincroniza URL com activePage (permite compartilhar links e usar botão Voltar)
  useEffect(() => {
    const path = `/${activePage === "dashboard" ? "" : activePage}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, [activePage]);

  // Lê a URL ao montar para restaurar a página correta após reload
  useEffect(() => {
    const page = window.location.pathname.replace("/", "") || "dashboard";
    if (PAGES[page] && page !== activePage) setActivePage(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suporte ao botão Voltar/Avançar do navegador
  useEffect(() => {
    const onPop = () => {
      const page = window.location.pathname.replace("/", "") || "dashboard";
      if (PAGES[page]) setActivePage(page);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setActivePage]);

  const ActivePage = PAGES[activePage] || Dashboard;

  return (
    <AppLayout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <ActivePage />
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

function RequireAuth({ children }) {
  const user = useAppStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/portal/:token"   element={<PortalOnline />} />
          <Route path="/proposta/:token"  element={<PropostaOnline />} />
          <Route path="/contrato/:token" element={<ContratoOnline />} />
          <Route path="/qr/obra/:obraId" element={<QRObra />} />
          <Route path="/calcular" element={<CalculadoraPublica />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/*" element={
            <RequireAuth>
              <AuthenticatedApp />
            </RequireAuth>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
