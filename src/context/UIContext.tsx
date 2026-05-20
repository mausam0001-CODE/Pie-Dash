import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isPostBuilderOpen: boolean;
    builderInitialData: any | null;
    openBuilder: (initialData?: any) => void;
    closeBuilder: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [isPostBuilderOpen, setIsPostBuilderOpen] = useState(false);
    const [builderInitialData, setBuilderInitialData] = useState<any | null>(null);

    const openBuilder = (initialData?: any) => {
        setBuilderInitialData(initialData || null);
        setIsPostBuilderOpen(true);
    };

    const closeBuilder = () => {
        setIsPostBuilderOpen(false);
        setBuilderInitialData(null);
    };

    return (
        <UIContext.Provider value={{
            isPostBuilderOpen,
            builderInitialData,
            openBuilder,
            closeBuilder
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
