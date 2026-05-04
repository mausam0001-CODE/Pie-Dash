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

    const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0] || null;

    useEffect(() => {
        if (!activeAccountId && accounts.length > 0) {
            setActiveAccountId(accounts[0].id);
        }
    }, [accounts, activeAccountId]);

    const switchAccount = (id: string) => {
        setActiveAccountId(id);
        localStorage.setItem('pie_pro_active_account', id);
    };

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
