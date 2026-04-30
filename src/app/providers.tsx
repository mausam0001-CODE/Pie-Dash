import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <SessionContextProvider supabaseClient={supabase}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </SessionContextProvider>
    );
};
