import { Component } from "react";
import { C } from "../../utils/constants";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    // Futuro: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            Algo deu errado neste módulo
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            {this.state.error?.message || "Erro desconhecido"}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: "10px 24px", background: C.red, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
