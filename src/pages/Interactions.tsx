import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Send, UserCircle, ShieldAlert, MoreHorizontal, Clock } from 'lucide-react';
import { useInteractions, Interaction } from '../features/interactions/useInteractions';

export const Interactions = () => {
    const { data: interactions = [], isLoading, sendReply, isSending } = useInteractions();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const selected = interactions.find(i => i.id === selectedId) || interactions[0];

    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        if (!selectedId && interactions.length > 0) {
            setSelectedId(interactions[0].id);
        }
    }, [interactions, selectedId]);

    const handleSelect = (id: string) => {
        setSelectedId(id);
        setShowChat(true);
    };

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selected) return;
        sendReply({ parentId: selected.id, content: replyText });
        setReplyText('');
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400 animate-pulse font-medium">Loading Intelligence...</div>;

    return (
        <div className="h-[calc(100vh-180px)] md:h-[calc(100vh-180px)] flex bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] shadow-sm overflow-hidden animate-in zoom-in duration-500">
            {/* Sidebar List */}
            <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${showChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search interactions..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] md:text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {interactions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-[10px] md:text-xs font-medium italic">No conversations yet...</div>
                    ) : (
                        interactions.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleSelect(item.id)}
                                className={`p-4 md:p-5 flex items-center gap-3 md:gap-4 cursor-pointer transition-all border-b border-slate-50 ${selectedId === item.id ? 'bg-teal-50/30' : 'hover:bg-slate-50'}`}
                            >
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden border border-slate-100">
                                    <img src={item.user_avatar || `https://ui-avatars.com/api/?name=${item.user_name}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs md:text-sm font-bold text-slate-900 truncate">{item.user_name}</p>
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.platform}</span>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-slate-500 truncate mt-0.5">{item.content}</p>
                                </div>
                                {item.status === 'Open' && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 shadow-sm shadow-teal-500/50"></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Content Area */}
            {selected ? (
                <div className={`flex-1 flex flex-col h-full bg-slate-50/10 ${!showChat ? 'hidden md:flex' : 'flex'}`}>
                    {/* Header */}
                    <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                            <button
                                onClick={() => setShowChat(false)}
                                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                                <MoreHorizontal className="w-5 h-5 rotate-180" />
                            </button>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                                <img src={selected.user_avatar || `https://ui-avatars.com/api/?name=${selected.user_name}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-slate-900 text-sm md:text-base truncate">{selected.user_name}</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selected.platform}</p>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <p className="text-[8px] md:text-[10px] text-teal-600 font-bold uppercase tracking-widest">Live</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1 md:gap-2 shrink-0">
                            <button className="p-2 md:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                <UserCircle className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button className="p-2 md:p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-medium text-[10px] uppercase hidden sm:flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        <div className="flex flex-col gap-1 max-w-[90%] md:max-w-[80%]">
                            <div className="p-4 md:p-5 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm text-xs md:text-sm text-slate-700 leading-relaxed ring-1 ring-slate-900/5">
                                {selected.content}
                            </div>
                            <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {new Date(selected.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    {/* Reply Area */}
                    <div className="p-4 md:p-6 border-t border-slate-100 bg-white">
                        <form onSubmit={handleSendReply} className="relative">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Message..."
                                className="w-full p-4 pr-32 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] md:text-xs outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all resize-none h-20 md:h-24 scrollbar-hide"
                            />
                            <div className="absolute right-3 bottom-3 flex items-center gap-1.5 md:gap-2">
                                <button type="button" className="p-2 text-slate-400 hover:text-teal-600 transition-all hidden sm:block">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending || !replyText.trim()}
                                    className="px-4 md:px-5 py-2 md:py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-[10px] md:text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    <Send className="w-3 md:w-3.5 h-3 md:h-3.5" /> {isSending ? '...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className={`flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/20 ${!showChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6 bg-white rounded-full shadow-sm border border-slate-100 mb-4 text-slate-300">
                        <MessageSquare className="w-12 h-12" />
                    </div>
                    <p className="font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Select a session to begin</p>
                </div>
            )}
        </div>
    );
};
