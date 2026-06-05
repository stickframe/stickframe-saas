import React from "react";
import { AlertTriangle } from "./components/ui/Icon";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min cache
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
        <App />
      </Sentry.ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
);
