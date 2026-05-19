import React from 'react';
import { Search, Bell, HelpCircle, Plus, Menu, AlertCircle, CheckCircle2, History, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../features/notifications/useNotifications';

export const Header = ({
    onOpenPostBuilder,
    onMenuClick
}: {
    onOpenPostBuilder: () => void;
    onMenuClick: () => void;
}) => {
    const { notifications, markAllAsRead, hasUnread, clearHistory } = useNotifications();
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/library?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const handleHelp = () => {
        alert('Pie Pro Support: Visit docs.pie.social for guidance on creating Reels and managing your workflow.');
    };

    const handleNotifications = () => {
        setShowNotifications(!showNotifications);
        if (hasUnread) {
            markAllAsRead();
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="relative w-full max-w-md hidden sm:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        placeholder="Search Reels, hooks, hashtags..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <button
                    onClick={handleHelp}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-all hidden xs:block"
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
                <div className="relative">
                    <button
                        onClick={handleNotifications}
                        className={`p-2 transition-all relative rounded-xl ${showNotifications ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                        <Bell className={`w-5 h-5 ${hasUnread ? 'animate-[bell-swing_2s_infinite]' : ''}`} />
                        {hasUnread && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                    </button>

                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                                        Notifications
                                        {hasUnread && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                                    </h4>
                                    <div className="flex gap-3">
                                        <button onClick={markAllAsRead} className="text-[10px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-widest">Mark All Read</button>
                                        <button onClick={clearHistory} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest">Clear</button>
                                    </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-10 text-center space-y-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto ring-4 ring-slate-50/50">
                                                <Bell className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">No new alerts</p>
                                                <p className="text-[10px] font-medium text-slate-400">We'll notify you when your posts are live.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group relative ${!notif.read ? 'bg-teal-50/30' : ''}`}>
                                                {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />}
                                                <div className="flex gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                                                        notif.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                                                        }`}>
                                                        {notif.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium text-slate-700">
                                                            {notif.platform && <span className="font-bold text-slate-900 capitalize">{notif.platform} </span>}
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                                    <button className="flex items-center gap-1.5 mx-auto text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                                        <History className="w-3 h-3" />
                                        View History
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="w-[1px] h-6 bg-slate-200 mx-1 md:mx-2"></div>
                <button
                    onClick={onOpenPostBuilder}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all shadow-teal-500/10"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Reel</span>
                </button>
            </div>
        </header>
    );
};
