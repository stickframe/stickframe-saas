import React from "react";
import { useEffect } from "react";
import { AlertTriangle } from "./components/ui/Icon";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";
import { sb } from "./services/supabase";

if ("serviceWorker" in navigator) {
  registerSW({ immediate: true });
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
});

function SentryAuthProvider({ children }) {
  useEffect(() => {
    const sub = sb.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || user.email,
        });
        const empresaId = user.user_metadata?.empresa_id;
        if (empresaId) {
          Sentry.setTag("empresa_id", empresaId);
        }
        Sentry.setTag("modulo", "app");
      } else {
        Sentry.setUser(null);
      }
    });
    return () => sub.data?.subscription?.unsubscribe();
  }, []);
  return children;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}><AlertTriangle size={14} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Algo deu errado</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>{error?.message}</div>
          <button onClick={resetError} style={{ padding: "10px 24px", background: "#981915", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            Tentar novamente
          </button>
        </div>
      )}>
        <SentryAuthProvider>
          <App />
        </SentryAuthProvider>
      </Sentry.ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
);
