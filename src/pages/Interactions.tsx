import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Send, UserCircle, ShieldAlert, MoreHorizontal, Clock } from 'lucide-react';
import { useInteractions, Interaction } from '../features/interactions/useInteractions';

export const Interactions = () => {
    const { data: interactions = [], isLoading, sendReply, isSending } = useInteractions();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const selected = interactions.find(i => i.id === selectedId) || interactions[0];

    useEffect(() => {
        if (!selectedId && interactions.length > 0) {
            setSelectedId(interactions[0].id);
        }
    }, [interactions, selectedId]);

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selected) return;
        sendReply({ parentId: selected.id, content: replyText });
        setReplyText('');
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400 animate-pulse font-medium">Loading Intelligence...</div>;

    return (
        <div className="h-[calc(100vh-180px)] flex flex-col md:flex-row bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden animate-in zoom-in duration-500">
            {/* Sidebar List */}
            <div className="w-full md:w-80 border-r border-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {interactions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-medium italic">No conversations yet...</div>
                    ) : (
                        interactions.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`p-5 flex items-center gap-4 cursor-pointer transition-all border-b border-slate-50 ${selectedId === item.id ? 'bg-teal-50/30' : 'hover:bg-slate-50'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                                    <img src={item.user_avatar || `https://ui-avatars.com/api/?name=${item.user_name}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-900 truncate">{item.user_name}</p>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.platform}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.content}</p>
                                </div>
                                {item.status === 'Open' && (
                                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Content Area */}
            {selected ? (
                <div className="flex-1 flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden ring-4 ring-white shadow-sm">
                                <img src={selected.user_avatar || `https://ui-avatars.com/api/?name=${selected.user_name}`} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{selected.user_name}</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selected.platform}</p>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">Active Now</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                <UserCircle className="w-5 h-5" />
                            </button>
                            <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                <ShieldAlert className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20">
                        <div className="flex flex-col gap-1 max-w-[80%]">
                            <div className="p-5 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700 leading-relaxed">
                                {selected.content}
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(selected.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    {/* Reply Area */}
                    <div className="p-6 border-t border-slate-100 bg-white">
                        <form onSubmit={handleSendReply} className="relative">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full p-4 pr-32 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all resize-none h-24"
                            />
                            <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                <button type="button" className="p-2 text-slate-400 hover:text-teal-600 transition-all">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending || !replyText.trim()}
                                    className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    <Send className="w-3.5 h-3.5" /> {isSending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/20">
                    <div className="p-6 bg-white rounded-full shadow-sm border border-slate-100 mb-4 text-slate-300">
                        <MessageSquare className="w-12 h-12" />
                    </div>
                    <p className="font-bold uppercase tracking-widest text-[10px]">Select a conversation to begin</p>
                </div>
            )}
        </div>
    );
};
