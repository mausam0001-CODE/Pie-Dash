import React from 'react';
import { LayoutDashboard, Film, BarChart3, Calendar, Layers, CheckCircle, FileEdit, Clock, Send, Share2, Settings as SettingsIcon, MessageSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate, useLocation } from 'react-router-dom';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Film, label: 'Library', path: '/library' },
    { icon: MessageSquare, label: 'Interactions', path: '/interactions' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Layers, label: 'Workflow', path: '/workflow' },
    { icon: Share2, label: 'Connections', path: '/connections' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

const contentItems = [
    { label: 'All', color: 'text-slate-400' },
    { label: 'Approved', color: 'text-teal-500' },
    { label: 'Published', color: 'text-green-500' },
    { label: 'Scheduled', color: 'text-orange-500' },
    { label: 'Drafts', color: 'text-slate-400' },
];

export const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-20">
            <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">P</div>
                <div>
                    <h1 className="font-bold text-slate-900 leading-none">Pie</h1>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Social Pro</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-8 mt-4">
                <div>
                    <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Main Menu</p>
                    {navItems.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
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
                    {contentItems.map((item) => (
                        <button
                            key={item.label}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <div className={cn("w-2 h-2 rounded-full", item.color.replace('text-', 'bg-'))} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 flex items-center justify-center text-white font-semibold text-xs">P</div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">Pie Team</p>
                        <p className="text-[10px] text-slate-400 font-medium">Pro Manager</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
