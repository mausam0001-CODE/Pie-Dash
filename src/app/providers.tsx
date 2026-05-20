import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountProvider } from '../features/accounts/AccountContext';
import { UserProvider } from '../features/auth/UserContext';
import { NotificationProvider } from '../context/NotificationContext';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

import { FloatingPublishStatus } from '../components/FloatingPublishStatus';

import { UIProvider } from '../context/UIContext';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <NotificationProvider>
                <UserProvider>
                    <AccountProvider>
                        <UIProvider>
                            {children}
                            <FloatingPublishStatus />
                        </UIProvider>
                    </AccountProvider>
                </UserProvider>
            </NotificationProvider>
        </QueryClientProvider>
    );
};
