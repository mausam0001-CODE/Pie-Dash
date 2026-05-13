import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { PostBuilder } from '../components/PostBuilder';
import { NotificationContainer } from '../components/NotificationToast';

export const DashboardLayout = () => {
    const [isPostBuilderOpen, setIsPostBuilderOpen] = useState(false);
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

            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    onOpenPostBuilder={() => setIsPostBuilderOpen(true)}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main className="p-4 md:p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>

            {isPostBuilderOpen && (
                <PostBuilder onClose={() => setIsPostBuilderOpen(false)} />
            )}
            <NotificationContainer />
        </div>
    );
};
