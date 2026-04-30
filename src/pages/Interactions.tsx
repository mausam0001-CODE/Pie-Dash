import React, { useState } from 'react';
import { MessageSquare, User, Clock, CheckCircle2, ChevronRight, Search, Send, Instagram, Twitter, Facebook, Sparkles } from 'lucide-react';

interface Interaction {
    id: string;
    user: string;
    content: string;
    timestamp: string;
    platform: 'instagram' | 'twitter' | 'facebook';
    status: 'Open' | 'Resolved';
    avatar: string;
}

const mockInteractions: Interaction[] = [
    { id: '1', user: 'Alex Rivers', content: 'Love this reel! Where can I get the full script?', timestamp: '2h ago', platform: 'instagram', status: 'Open', avatar: 'https://i.pravatar.cc/150?u=alex' },
    { id: '2', user: 'Sarah Jenkins', content: 'The visual quality is amazing. What camera did you use?', timestamp: '5h ago', platform: 'instagram', status: 'Open', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: '3', user: 'Mark Thompson', content: 'Great tips on the hook! Can you do a video on captions next?', timestamp: '1d ago', platform: 'facebook', status: 'Resolved', avatar: 'https://i.pravatar.cc/150?u=mark' },
];

export const Interactions = () => {
    const [selectedId, setSelectedId] = useState(mockInteractions[0].id);
    const selected = mockInteractions.find(i => i.id === selectedId) || mockInteractions[0];

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
            {/* Platform & Inbox View (Left/Middle unified) */}
            <div className="w-full md:w-[400px] bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-50 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Unified Inbox</h2>
                        <span className="bg-teal-50 text-teal-600 text-[10px] font-bold px-2 py-0.5 rounded-full">2 New</span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/10"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {mockInteractions.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className={`w-full p-6 flex gap-4 text-left border-b border-slate-50 transition-all ${selectedId === item.id ? 'bg-slate-50 ring-1 ring-inset ring-teal-500/10' : 'hover:bg-slate-50/50'}`}
                        >
                            <div className="relative">
                                <img src={item.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt={item.user} />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center border border-slate-100">
                                    {item.platform === 'instagram' && <Instagram className="w-3 h-3 text-pink-500" />}
                                    {item.platform === 'facebook' && <Facebook className="w-3 h-3 text-blue-600" />}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-slate-900 text-sm truncate">{item.user}</h4>
                                    <span className="text-[10px] text-slate-400 font-medium">{item.timestamp}</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.content}</p>
                                {item.status === 'Resolved' && (
                                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                                        <CheckCircle2 className="w-3 h-3" /> Resolved
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail & Reply Panel (Right) */}
            <div className="flex-1 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col relative">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <img src={selected.avatar} className="w-10 h-10 rounded-full" alt={selected.user} />
                        <div>
                            <h3 className="font-bold text-slate-900 leading-none">{selected.user}</h3>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">Interacting on Instagram Reel #128</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-100">Resolve</button>
                        <button className="px-4 py-2 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all">Assign</button>
                    </div>
                </div>

                {/* Conversation Area */}
                <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-50/30">
                    <div className="flex gap-4">
                        <img src={selected.avatar} className="w-8 h-8 rounded-full" alt={selected.user} />
                        <div className="max-w-[80%] bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm space-y-2">
                            <p className="text-sm text-slate-700 leading-relaxed">{selected.content}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                <Clock className="w-3 h-3" /> 2:45 PM
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">A</div>
                        <div className="max-w-[80%] bg-teal-600 p-4 rounded-2xl rounded-tr-none shadow-lg space-y-2">
                            <p className="text-sm text-white leading-relaxed">Hey Sarah! We used a Sony A7S III for this shoot with a 24-70mm lens to get that cinematic look. Hope that helps!</p>
                            <div className="flex items-center gap-2 text-[10px] text-teal-200 font-medium">
                                <Clock className="w-3 h-3" /> 2:50 PM
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reply Box */}
                <div className="p-6 border-t border-slate-50 space-y-4">
                    <div className="relative group">
                        <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-teal-100 rounded-full flex items-center gap-2 shadow-sm scale-95 opacity-0 group-focus-within:opacity-100 group-focus-within:scale-100 transition-all duration-300">
                            <Sparkles className="w-3 h-3 text-teal-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-teal-600">AI Assistant suggestions available</span>
                        </div>
                        <textarea
                            placeholder="Write a reply..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500/20 min-h-[120px] transition-all"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-slate-400">
                            <button className="hover:text-slate-600 transition-colors"><SmileIcon className="w-5 h-5" /></button>
                            <button className="hover:text-slate-600 transition-colors"><PaperclipIcon className="w-5 h-5" /></button>
                        </div>
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                            Send Reply <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SmileIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
);

const PaperclipIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
);
