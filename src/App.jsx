import { lazy, Suspense, useEffect, useState } from "react";
import { initGA, trackPageView } from "./utils/analytics";
import { setEmpresaId, sb } from "./services/supabase";
import { silentError } from "./utils/logger";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/globals.css";
import "./styles/responsive.css";
import "./styles/theme-stickframe.css";
import useAppStore from "./store/useAppStore";
import AppLayout from "./components/layout/AppLayout";
import LoadingScreen from "./components/ui/LoadingScreen";
import { PageSkeleton } from "./components/ui/Skeleton";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import UndoBar from "./components/ui/UndoBar";
import { OnboardingTour } from "./components/ui/OnboardingTour";
import TourPopover from "./components/ui/TourPopover";
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
const BIM           = lazyWithRetry(() => import("./pages/BimSF")); // legacy route → BimSF
const BimSF         = lazyWithRetry(() => import("./pages/BimSF"));
const StickFEM      = lazyWithRetry(() => import("./pages/StickFEM"));
const Quantitativos  = lazyWithRetry(() => import("./pages/Quantitativos"));
const Configuracoes  = lazyWithRetry(() => import("./pages/Configuracoes"));
const Fornecedores   = lazyWithRetry(() => import("./pages/Fornecedores"));
const Calculadora       = lazyWithRetry(() => import("./pages/Calculadora"));
const OrcamentoTecnico  = lazyWithRetry(() => import("./pages/OrcamentoTecnico"));
const Insumos           = lazyWithRetry(() => import("./pages/Insumos"));
const OrcamentoSF       = lazyWithRetry(() => import("./pages/OrcamentoSF"));
const MonitorPrecos     = lazyWithRetry(() => import("./pages/MonitorPrecos"));
const StickPrice        = lazyWithRetry(() => import("./pages/StickPrice"));
const Equipamentos      = lazyWithRetry(() => import("./pages/Equipamentos"));
const Checklists        = lazyWithRetry(() => import("./pages/Checklists"));
const QRObra            = lazyWithRetry(() => import("./pages/QRObra"));
const Inteligencia      = lazyWithRetry(() => import("./pages/Inteligencia"));
const StickBrainDashboard = lazyWithRetry(() => import("./pages/StickBrainDashboard"));
const StickBrainOperacional = lazyWithRetry(() => import("./pages/StickBrainOperacional"));
const CalculadoraPublica   = lazyWithRetry(() => import("./pages/CalculadoraPublica"));
const AnalisePublica       = lazyWithRetry(() => import("./pages/AnalisePublica"));
const ConcorrenciaPublica  = lazyWithRetry(() => import("./pages/ConcorrenciaPublica"));
const PontoColaborador     = lazyWithRetry(() => import("./pages/PontoColaborador"));
const AmbienteQR           = lazyWithRetry(() => import("./pages/AmbienteQR"));
const PainelQR             = lazyWithRetry(() => import("./pages/PainelQR"));
const BI                   = lazyWithRetry(() => import("./pages/BI"));
const Rentabilidade        = lazyWithRetry(() => import("./pages/Rentabilidade"));
const Ecossistema          = lazyWithRetry(() => import("./pages/Ecossistema"));
const SST                  = lazyWithRetry(() => import("./pages/SST"));
const Suprimentos          = lazyWithRetry(() => import("./pages/Suprimentos"));
const EquipeSF             = lazyWithRetry(() => import("./pages/EquipeSF"));
const Oportunidades        = lazyWithRetry(() => import("./pages/Oportunidades"));
const Planos               = lazyWithRetry(() => import("./pages/Planos"));
const LoginScreen     = lazyWithRetry(() => import("./pages/LoginScreen"));
const Cadastro        = lazyWithRetry(() => import("./pages/Cadastro"));
const Pricing         = lazyWithRetry(() => import("./pages/Pricing"));
const LandingPage     = lazyWithRetry(() => import("./pages/LandingPage"));
const CheckoutTrial   = lazyWithRetry(() => import("./pages/CheckoutTrial"));
const PortalColaborador = lazyWithRetry(() => import("./pages/PortalColaborador"));
const Admin           = lazyWithRetry(() => import("./pages/Admin"));
const AdminMobile     = lazyWithRetry(() => import("./pages/AdminMobile"));
const AdminHealth     = lazyWithRetry(() => import("./pages/AdminHealth"));
const AdminGrowth     = lazyWithRetry(() => import("./pages/AdminGrowth"));
const AdminConversion = lazyWithRetry(() => import("./pages/AdminConversion"));
const Biblioteca      = lazyWithRetry(() => import("./pages/Biblioteca"));
const Benchmarks      = lazyWithRetry(() => import("./pages/Benchmarks"));
const Cursos          = lazyWithRetry(() => import("./pages/Cursos"));
const PublicObras     = lazyWithRetry(() => import("./pages/PublicObras"));
const PublicObraDetail = lazyWithRetry(() => import("./pages/PublicObraDetail"));
const Blog            = lazyWithRetry(() => import("./pages/Blog"));
const BlogPostDetail  = lazyWithRetry(() => import("./pages/BlogPostDetail"));

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
  rentabilidade: Rentabilidade,
  ecossistema:   Ecossistema,
  equipe:     Equipe,
  cronograma: Cronograma,
  vistorias:  Vistorias,
  bim:           BIM,
  bim_sf:        BimSF,
  stickfem:      StickFEM,
  quantitativos:  Quantitativos,
  configuracoes:  Configuracoes,
  fornecedores:      Fornecedores,
  calculadora:       Calculadora,
  orcamento_tecnico: OrcamentoTecnico,
  orcamento_sf:      OrcamentoSF,
  monitor_precos: MonitorPrecos,
  stickprice:     StickPrice,
  equipamentos:   Equipamentos,
  checklists:     Checklists,
  insumos:        Insumos,
  inteligencia:   Inteligencia,
  stickbrain:     StickBrainDashboard,
  stickbrain_op:  StickBrainOperacional,
  bi:             BI,
  sst:            SST,
  suprimentos:    Suprimentos,
  equipe_sf:      EquipeSF,
  oportunidades:  Oportunidades,
  planos:         Planos,
  biblioteca:     Biblioteca,
  benchmarks:     Benchmarks,
  cursos:         Cursos,
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
    trackPageView(path);
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
      <TourPopover />
    </AppLayout>
  );
}

function RequireAuth({ children }) {
  const user = useAppStore((s) => s.user);
  if (user) return children;
  if (window.location.pathname === "/") return <LandingPage />;
  return <Navigate to="/login" replace />;
}

// Allowlist fixo — sempre tem acesso, independente de env/banco.
const CORE_ADMINS = ["andre@stickframe.com.br", "admin@stickframe.com.br"];

const parseEmails = (s) => (s || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

function useAdminEmails() {
  // União de TODAS as fontes (fixo + env + tabela), em vez de uma sobrepor a
  // outra. Antes, VITE_ADMIN_EMAILS tinha precedência e retornava cedo, então
  // a tabela admin_emails era ignorada e quem não estava na env era barrado.
  const [dbEmails, setDbEmails] = useState([]);
  useEffect(() => {
    sb.from("configuracoes_sistema")
      .select("valor")
      .eq("chave", "admin_emails")
      .single()
      .then(({ data }) => {
        if (data?.valor) setDbEmails(parseEmails(data.valor));
      })
      .catch(silentError("App.jsx:configuracoes_sistema"));
  }, []);
  const envEmails = parseEmails(import.meta.env.VITE_ADMIN_EMAILS);
  return [...new Set([...CORE_ADMINS, ...envEmails, ...dbEmails])];
}

function RequireAdmin({ children }) {
  const user = useAppStore((s) => s.user);
  const adminEmails = useAdminEmails();
  if (!user) return <Navigate to="/login" replace />;
  if (!adminEmails.includes((user.email || "").toLowerCase())) return <Navigate to="/" replace />;
  return children;
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
      toast.success(`↩ Desfeito: ${entry.label}`);
    } catch (err) {
      toast.error(`Erro ao desfazer: ${err.message}`);
    }
  }, { enableOnFormTags: false });

  return null;
}

export default function App() {
  useEffect(() => {
    initGA();
    trackPageView(window.location.pathname);
  }, []);

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
          <Route path="/admin" element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          } />
          <Route path="/admin/mobile" element={
            <RequireAdmin>
              <AdminMobile />
            </RequireAdmin>
          } />
          <Route path="/admin/health" element={
            <RequireAdmin>
              <AdminHealth />
            </RequireAdmin>
          } />
          <Route path="/admin/growth" element={
            <RequireAdmin>
              <AdminGrowth />
            </RequireAdmin>
          } />
          <Route path="/admin/conversion" element={
            <RequireAdmin>
              <AdminConversion />
            </RequireAdmin>
          } />
          <Route path="/login"                element={<LoginScreen />} />
          <Route path="/cadastro"             element={<Cadastro />} />
          <Route path="/pricing"              element={<Pricing />} />
          <Route path="/checkout"             element={<CheckoutTrial />} />
          <Route path="/obras"                element={<PublicObras />} />
          <Route path="/obra/:slug"           element={<PublicObraDetail />} />
          <Route path="/blog"                 element={<Blog />} />
          <Route path="/blog/:slug"           element={<BlogPostDetail />} />
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
