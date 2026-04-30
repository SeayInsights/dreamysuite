"use client";

import { Component, type ReactNode } from "react";
import { initSentry, captureError } from "@/lib/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    initSentry();
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureError(error, {
      componentStack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[200px] items-center justify-center p-8 text-center">
            <div>
              <h2 className="mb-2 text-lg font-semibold">
                Something went wrong
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                An unexpected error occurred. Please refresh the page.
              </p>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
