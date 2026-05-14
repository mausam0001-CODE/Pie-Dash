import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';

export const LoginPage = () => {
    const [view, setView] = React.useState<'sign_in' | 'update_password'>('sign_in');

    React.useEffect(() => {
        // Detect if user is coming from a password reset link
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery')) {
            setView('update_password');
        }
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
            <div className="absolute top-12 left-12">
                <span className="text-2xl font-black tracking-tight text-slate-900">Pie</span>
            </div>

            <div className="w-full max-w-[400px] text-center space-y-12">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-medium text-slate-900 tracking-tight">
                        social media dashboard
                    </h1>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-500 text-[11px] font-bold uppercase tracking-widest px-4">
                        <span>AI Content Engine</span>
                        <span>•</span>
                        <span>Multi-Account Sync</span>
                        <span>•</span>
                        <span>Viral Insights</span>
                    </div>
                </div>

                <div className="bg-white">
                    <Auth
                        supabaseClient={supabase}
                        view={view}
                        showLinks={false}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#0f172a',
                                        brandAccent: '#1e293b',
                                        inputBackground: '#eff6ff',
                                        inputText: '#0f172a',
                                        inputPlaceholder: '#94a3b8',
                                        inputBorder: 'transparent',
                                        inputBorderFocus: '#3b82f6',
                                    },
                                    radii: {
                                        borderRadiusButton: '12px',
                                        inputBorderRadius: '12px',
                                    }
                                }
                            }
                        }}
                        theme="light"
                        providers={[]}
                        redirectTo={window.location.origin}
                        localization={{
                            variables: {
                                sign_in: {
                                    button_label: 'Continue with email',
                                    email_label: '',
                                    password_label: '',
                                    email_input_placeholder: 'Email',
                                    password_input_placeholder: 'Password',
                                },
                                update_password: {
                                    button_label: 'Update Password',
                                    password_label: 'New Password',
                                    password_input_placeholder: 'Enter new password',
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
