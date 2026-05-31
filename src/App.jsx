import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/globals.css";
import "./styles/responsive.css";
import useAppStore from "./store/useAppStore";
import AppLayout from "./components/layout/AppLayout";
import LoginScreen from "./pages/LoginScreen";
import LoadingScreen from "./components/ui/LoadingScreen";
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
const PropostaOnline = lazy(() => import("./pages/PropostaOnline"));
const Equipe      = lazy(() => import("./pages/Equipe"));
const Cronograma  = lazy(() => import("./pages/Cronograma"));
const Vistorias   = lazy(() => import("./pages/Vistorias"));
const BIM           = lazy(() => import("./pages/BIM"));
const Quantitativos  = lazy(() => import("./pages/Quantitativos"));
const Configuracoes  = lazy(() => import("./pages/Configuracoes"));
const Fornecedores   = lazy(() => import("./pages/Fornecedores"));
const Calculadora       = lazy(() => import("./pages/Calculadora"));
const OrcamentoTecnico  = lazy(() => import("./pages/OrcamentoTecnico"));

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
};

function AuthenticatedApp() {
  const activePage = useAppStore((s) => s.activePage);
  const user       = useAppStore((s) => s.user);
  const loaded     = useAppStore((s) => s.loaded);

  // Restaura empresaId no service após refresh (persist só salva o valor, não o setter)
  useEffect(() => {
    if (user?.empresaId) {
      import("./services/supabase").then(({ setEmpresaId }) => setEmpresaId(user.empresaId));
    }
  }, [user]);

  const ActivePage = PAGES[activePage] || Dashboard;

  return (
    <AppLayout>
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
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
          <Route path="/proposta/:token" element={<PropostaOnline />} />
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
