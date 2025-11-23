import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Client error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', color: '#fff', fontFamily: 'Sora', background: '#111' }}>
          <p>Something went wrong. Please refresh.</p>
          {this.state.message && (
            <p style={{ marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
              {this.state.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

