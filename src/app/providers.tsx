import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountProvider } from '../features/accounts/AccountContext';
import { UserProvider } from '../features/auth/UserContext';

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
        <QueryClientProvider client={queryClient}>
            <UserProvider>
                <AccountProvider>
                    {children}
                </AccountProvider>
            </UserProvider>
        </QueryClientProvider>
    );
};
