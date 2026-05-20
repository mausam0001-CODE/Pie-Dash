import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { PostBuilder } from '../components/PostBuilder';
import { NotificationContainer } from '../components/NotificationToast';

import { useUI } from '../context/UIContext';

export const DashboardLayout = () => {
    const { isPostBuilderOpen, closeBuilder, openBuilder, builderInitialData } = useUI();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
                <Header
                    onOpenPostBuilder={() => openBuilder()}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main className="p-4 md:p-6 overflow-y-auto">
                    {isPostBuilderOpen ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PostBuilder
                                onClose={closeBuilder}
                                initialReel={builderInitialData}
                            />
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>
            <NotificationContainer />
        </div>
    );
};
