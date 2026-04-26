import React from "react";

// Top-level React error boundary. Catches render/lifecycle errors anywhere in
// the tree below it and shows a hardcoded fallback. Strings are intentionally
// hardcoded English: this renders during catastrophic failures, possibly from
// inside the translation/settings providers themselves.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[MB] App crashed:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const wrap = {
      position: "fixed", inset: 0, background: "#0d0d0d",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, textAlign: "center",
      fontFamily: '"Barlow Condensed", sans-serif',
      color: "#e8d5b0", zIndex: 200000,
    };

    return (
      <div style={wrap}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: 4, margin: 0, color: "#cf0000" }}>
          SOMETHING WENT WRONG
        </h1>
        <p style={{ fontSize: 13, color: "#9a8a7a", margin: "12px 0 28px", maxWidth: 320, lineHeight: 1.5 }}>
          MovesBook hit an unexpected error. Reloading should fix it. Your data is safe.
        </p>
        <button onClick={this.handleReload} style={{
          background: "#8b1a1a", color: "#fff", border: "none",
          borderRadius: 8, padding: "12px 32px", fontSize: 14, fontWeight: 900,
          fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: 2,
          cursor: "pointer",
        }}>
          RELOAD
        </button>
        {this.state.error?.message && (
          <pre style={{
            fontSize: 11, color: "#6a5a4a", marginTop: 24, maxWidth: 320,
            fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {String(this.state.error.message).slice(0, 200)}
          </pre>
        )}
      </div>
    );
  }
}
