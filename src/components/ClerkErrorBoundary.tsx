'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ClerkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Authentication provider caught error gracefully:', error?.message);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback !== undefined ? this.props.fallback : this.props.children;
    }
    return this.props.children;
  }
}
