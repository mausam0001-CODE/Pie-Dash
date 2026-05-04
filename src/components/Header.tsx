import React from 'react';
import { Search, Bell, HelpCircle, Plus } from 'lucide-react';

export const Header = ({ onOpenPostBuilder }: { onOpenPostBuilder: () => void }) => {
    const [hasNotifications, setHasNotifications] = React.useState(true);

    const handleHelp = () => {
        alert('Pie Pro Support: Visit docs.pie.social for guidance on creating Reels and managing your workflow.');
    };

    const handleNotifications = () => {
        setHasNotifications(false);
        alert('No new notifications. You are all caught up!');
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search Reels, hooks, hashtags..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleHelp}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-all"
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
                <button
                    onClick={handleNotifications}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-all relative"
                >
                    <Bell className="w-5 h-5" />
                    {hasNotifications && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>}
                </button>
                <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
                <button
                    onClick={onOpenPostBuilder}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all shadow-teal-500/10"
                >
                    <Plus className="w-4 h-4" />
                    New Reel
                </button>
            </div>
        </header>
    );
};
