"use client";

import React, { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorInfo {
  componentStack: string;
}

// Custom hook for error boundary functionality
function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const resetError = () => setError(null);

  return { error, resetError };
}

// Functional Error Boundary Component
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const { error, resetError } = useErrorBoundary();

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
        <p className="text-red-600 mb-4">
          An error occurred while rendering this component.
        </p>
        <details className="text-sm text-red-700">
          <summary className="cursor-pointer font-medium">Error details</summary>
          <pre className="mt-2 whitespace-pre-wrap">
            {error.message}
          </pre>
        </details>
        <button
          onClick={resetError}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// Class-based Error Boundary for React error boundaries (backup)
export class ClassErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">
            An error occurred while rendering this component.
          </p>
          <details className="text-sm text-red-700">
            <summary className="cursor-pointer font-medium">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {this.state.error?.message}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
