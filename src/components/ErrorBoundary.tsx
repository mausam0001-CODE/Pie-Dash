import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] Caught:', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 bg-white rounded-[2.5rem] border border-rose-100 shadow-sm">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 border-4 border-rose-100">
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-sm text-slate-500 font-medium max-w-sm leading-relaxed mb-8">
                        {this.state.error?.message || 'An unexpected error occurred in this section.'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
