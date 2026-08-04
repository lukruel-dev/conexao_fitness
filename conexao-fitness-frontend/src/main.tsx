import { Component, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#09090b", color: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Ops! Ocorreu um erro no aplicativo.</h2>
          <p style={{ color: "#a1a1aa", fontSize: "0.875rem", marginBottom: "1.5rem", maxWidth: "400px" }}>
            {this.state.error?.message || "Algo deu errado durante a execução."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 20px", borderRadius: "8px", backgroundColor: "#14b8a6", color: "#fff", fontWeight: "bold", border: "none", cursor: "pointer" }}
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

