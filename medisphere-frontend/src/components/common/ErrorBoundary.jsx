// src/components/common/ErrorBoundary.jsx
import { Component } from 'react';
import { RiAlertLine } from 'react-icons/ri';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('MediSphere ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <RiAlertLine className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-400 mb-4">{this.state.error?.message}</p>
          <button
            className="btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
