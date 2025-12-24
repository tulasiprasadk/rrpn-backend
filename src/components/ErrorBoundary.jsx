import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Optionally send error + info to a logging service here.
    // console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ padding: 24 }}>
          <h1>Something went wrong</h1>
          <p>Try refreshing the page. If the problem persists, open the browser console for details.</p>
        </main>
      );
    }
    return this.props.children;
  }
}
