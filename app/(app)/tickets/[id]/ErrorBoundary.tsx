'use client';
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[ErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error details:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-5xl mx-auto">
          <div className="card p-6 bg-red-50 border border-red-200">
            <h2 className="text-red-800 font-bold mb-2">Error Loading Ticket</h2>
            <p className="text-red-700 text-sm mb-2">{this.state.error?.message}</p>
            <p className="text-red-600 text-xs font-mono bg-red-100 p-2 rounded overflow-auto max-h-40">
              {this.state.error?.stack}
            </p>
            <a href="/tickets" className="text-blue-600 hover:underline mt-4 inline-block">
              Back to Tickets
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
