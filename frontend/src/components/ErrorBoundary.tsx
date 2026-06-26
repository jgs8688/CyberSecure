import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-4xl font-bold mb-4 text-red-500">Oops, something went wrong.</h1>
          <p className="text-lg text-gray-300 mb-6 text-center max-w-xl">
            An unexpected error has occurred. We've logged the issue and are looking into it. 
            Please try refreshing the page or navigating back to the home page.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => window.location.href = "/"} 
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
