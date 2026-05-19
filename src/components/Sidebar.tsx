import React from 'react';
import { Home, Layout, Calendar, Library, Settings, Inbox, Plus, ChevronRight, LogOut, Search, Command, Users, TrendingUp, Zap, HelpCircle, UserCircle, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccountContext } from '../features/accounts/AccountContext';
import { useUser } from '../features/auth/UserContext';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Library, label: 'Library', path: '/library' },
    { icon: Inbox, label: 'Interactions', path: '/interactions' },
    { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
    { icon: Search, label: 'Competitor Insights', path: '/competitor-insights' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Zap, label: 'Workflow', path: '/workflow' },
];

const contentItems = [
    { label: 'All', color: 'text-slate-400' },
    { label: 'Approved', color: 'text-teal-500' },
    { label: 'Published', color: 'text-green-500' },
    { label: 'Scheduled', color: 'text-orange-500' },
    { label: 'Drafts', color: 'text-slate-400' },
];

import { AccountSwitcher } from './AccountSwitcher';

export const Sidebar = ({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) => {
    const { activeAccount } = useAccountContext();
    const { profile } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 lg:h-screen",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="p-6 flex items-center justify-between border-b border-slate-100 mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <h1 className="font-black text-slate-900 leading-none text-xl md:text-2xl tracking-tighter">Pie</h1>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em] mt-0.5">Social Pro</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 lg:hidden"
                >
                    <Plus className="w-5 h-5 rotate-45" />
                </button>
            </div>

            <AccountSwitcher />

            <nav className="flex-1 p-4 pt-0 space-y-8 mt-4 overflow-y-auto">
                <div>
                    <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Main Menu</p>
                    {navItems.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    navigate(item.path);
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                                    active ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", active ? "text-teal-600" : "text-slate-400")} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                <div>
                    <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pipeline Stages</p>
                    {contentItems.map((item) => {
                        const searchParams = new URLSearchParams(location.search);
                        const currentStatus = searchParams.get('status') || 'All';
                        const active = location.pathname === '/library' && currentStatus === item.label;

                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    navigate(`/library?status=${item.label}`);
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                                    active ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <div className={cn("w-2 h-2 rounded-full", item.color.replace('text-', 'bg-'))} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Section - Profile */}
            <div className="p-4 mt-auto border-t border-slate-100/50 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg overflow-hidden border border-white shrink-0">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            <UserCircle className="w-6 h-6" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{profile?.full_name || 'Pie Team'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile?.role || 'Pro Manager'}</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/settings');
                        }}
                        className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100 group/btn"
                    >
                        <Settings className="w-4 h-4 text-slate-300 group-hover/btn:text-teal-600 group-hover/btn:rotate-90 transition-all duration-500" />
                    </button>
                </div>
            </div>
        </aside>
    );
};
