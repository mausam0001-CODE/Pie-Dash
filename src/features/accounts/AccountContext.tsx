import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccounts, SocialAccount } from './useAccounts';

interface AccountContextType {
    activeAccount: SocialAccount | null;
    isLoading: boolean;
    switchAccount: (id: string) => void;
    accounts: SocialAccount[];
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: accounts = [], isLoading } = useAccounts();
    const [activeAccountId, setActiveAccountId] = useState<string | null>(
        localStorage.getItem('pie_pro_active_account')
    );

    // MULTI-ACCOUNT IMPROVEMENT: Auto-switch to newly connected accounts
    const [prevAccountCount, setPrevAccountCount] = useState<number | null>(null);

    const switchAccount = (id: string) => {
        setActiveAccountId(id);
        localStorage.setItem('pie_pro_active_account', id);
    };

    useEffect(() => {
        // Skip logic if accounts are still loading for the very first time
        if (isLoading) return;

        // If a new account was just added (not the initial load), switch to it
        if (prevAccountCount !== null && accounts.length > prevAccountCount) {
            // Since useAccounts now orders by descending, accounts[0] is the newest
            const newestAccount = accounts[0];
            if (newestAccount && newestAccount.id !== activeAccountId) {
                switchAccount(newestAccount.id);
            }
        }

        // Update the reference count
        setPrevAccountCount(accounts.length);

        // Standard default: if no account is selected but we have accounts, pick the first one
        if (!activeAccountId && accounts.length > 0) {
            setActiveAccountId(accounts[0].id);
        }
    }, [accounts, isLoading, activeAccountId, prevAccountCount]);

    // Priority: 
    // 1. Valid account matching activeAccountId
    // 2. Previously selected account from localStorage (handled by initial state + find)
    // 3. Fallback to first account if nothing matches
    const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0] || null;

    return (
        <AccountContext.Provider value={{ activeAccount, isLoading, switchAccount, accounts }}>
            {children}
        </AccountContext.Provider>
    );
};

export const useAccountContext = () => {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error('useAccountContext must be used within an AccountProvider');
    }
    return context;
};
