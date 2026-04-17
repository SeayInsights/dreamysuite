"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { trackEditorError } from "@/lib/telemetry/editor";

interface Props {
  siteId: string;
  children: ReactNode;
}

interface State {
  error: string | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(err: Error) {
    return { error: err.message || "Unknown editor error" };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    trackEditorError(
      this.props.siteId,
      `${err.message}\n${info.componentStack ?? ""}`.slice(0, 1024),
      "boundary",
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-sm text-destructive">
          <p>Something went wrong in the editor.</p>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
