import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';

export const LoginPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-emerald-950 p-6">
            <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl border border-white/20">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-4 shadow-lg">P</div>
                    <h1 className="text-3xl font-black text-slate-900">Pie Pro</h1>
                    <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-widest">Modern Social Dashboard</p>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#14b8a6',
                                    brandAccent: '#0d9488',
                                }
                            }
                        }
                    }}
                    theme="light"
                    providers={[]}
                    redirectTo={window.location.origin}
                />

                <div className="mt-8 text-center bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium">Use email authentication to secure your social accounts.</p>
                </div>
            </div>
        </div>
    );
};
