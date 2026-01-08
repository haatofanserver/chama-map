import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Error boundary fallback component
const DefaultErrorFallback: React.FC<{ error?: Error; onRetry?: () => void }> = ({
  error,
  onRetry
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="text-center">
        <div className="text-red-600 text-sm font-medium mb-2">
          {t('error.componentError', 'Component Error')}
        </div>
        <div className="text-red-500 text-xs mb-3">
          {error?.message || t('error.unknownError', 'An unknown error occurred')}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300 transition-colors"
          >
            {t('error.retry', 'Retry')}
          </button>
        )}
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or default error component
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;