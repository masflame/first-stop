import React from "react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep detailed diagnostics in console for debugging.
    console.error("App crashed in error boundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#f4f2ee",
            color: "#111",
            fontFamily: "'Courier New', Courier, monospace",
            padding: "2rem",
          }}
        >
          <section style={{ maxWidth: 640, width: "100%" }}>
            <h1 style={{ marginBottom: "0.75rem", fontSize: "1.4rem" }}>
              Something went wrong.
            </h1>
            <p style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
              An unexpected error occurred while loading this page.
            </p>
            {this.state.error?.message ? (
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "#e9e6df",
                  border: "1px solid #d6d0c3",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                }}
              >
                {this.state.error.message}
              </pre>
            ) : null}
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                background: "#111",
                color: "#fff",
                border: "none",
                padding: "0.65rem 1rem",
                cursor: "pointer",
              }}
            >
              Reload page
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
