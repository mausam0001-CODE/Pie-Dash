import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { PostBuilder } from '../components/PostBuilder';

export const DashboardLayout = () => {
    const [isPostBuilderOpen, setIsPostBuilderOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onOpenPostBuilder={() => setIsPostBuilderOpen(true)} />
                <main className="p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>

            {isPostBuilderOpen && (
                <PostBuilder onClose={() => setIsPostBuilderOpen(false)} />
            )}
        </div>
    );
};
