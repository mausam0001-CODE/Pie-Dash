import React, { useState } from 'react';
import { ChevronDown, Instagram, Facebook, Twitter, Check } from 'lucide-react';
import { useAccountContext } from '../features/accounts/AccountContext';

export const AccountSwitcher = () => {
    const { activeAccount, accounts, switchAccount, isLoading } = useAccountContext();
    const [isOpen, setIsOpen] = useState(false);

    if (isLoading) return <div className="h-12 w-full bg-slate-50 animate-pulse rounded-xl" />;
    if (!activeAccount) return null;

    return (
        <div className="relative px-3 mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0 overflow-hidden border border-slate-200">
                        {activeAccount.avatar_url ? (
                            <img src={activeAccount.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            activeAccount.username.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{activeAccount.username}</p>
                        <div className="flex items-center gap-1">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{activeAccount.platform}</div>
                        </div>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-full top-0 ml-4 w-64 bg-white border border-slate-200 rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-40 py-3 animate-in fade-in slide-in-from-left-2 duration-300 ring-1 ring-slate-900/5">
                        <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch Account</p>
                        {accounts.map((acc) => (
                            <button
                                key={acc.id}
                                onClick={() => {
                                    switchAccount(acc.id);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-md bg-teal-500 text-white font-bold text-[10px] flex items-center justify-center overflow-hidden border border-slate-100">
                                        {acc.avatar_url ? (
                                            <img src={acc.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            acc.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-slate-900">{acc.username}</p>
                                        <p className="text-[9px] text-slate-400 font-medium uppercase">{acc.platform}</p>
                                    </div>
                                </div>
                                {activeAccount.id === acc.id && (
                                    <Check className="w-3.5 h-3.5 text-teal-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
