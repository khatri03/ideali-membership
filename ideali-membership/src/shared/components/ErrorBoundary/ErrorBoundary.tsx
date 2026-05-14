import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
          <section className="w-full max-w-lg rounded-[2rem] border border-rose-200 bg-white/95 p-8 text-center shadow-xl shadow-rose-200/30">
            <h1 className="text-2xl font-bold tracking-tight text-rose-950">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-rose-900/80">{this.state.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: "" })}
              className="mt-6 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Try again
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
