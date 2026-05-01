import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoginPage } from '../features/auth/LoginPage';
import { supabase } from '../lib/supabase';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { session, isLoading } = useAuth();

    if (!supabase) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border-t-8 border-red-500">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Configuration Error</h2>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Supabase Environment Variables are missing in Vercel. Please add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> to your project settings.
                    </p>
                </div>
            </div>
        );
    }

    // session === undefined means session is still loading
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Restoring Session...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return <LoginPage />;
    }

    return <>{children}</>;
};
