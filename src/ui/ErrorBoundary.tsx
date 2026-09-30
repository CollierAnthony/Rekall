import { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  readonly fallback: (error: Error) => ReactNode;
  readonly children: ReactNode;
};

type ErrorBoundaryState = {
  readonly error: Error | null;
};

/** Pas d'Error Boundary en function component : une classe reste nécessaire. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override render(): ReactNode {
    return this.state.error === null ? this.props.children : this.props.fallback(this.state.error);
  }
}
