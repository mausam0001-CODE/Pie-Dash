import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { LoginPage } from '../features/auth/LoginPage';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const session = useSession();

    // session === undefined means session is still loading
    if (session === undefined) {
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
