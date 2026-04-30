import React from 'react';
import { useReelsData, Reel } from '../hooks/useReelsData';
import { PostDrawer } from '../components/PostDrawer';
import { PostBuilder } from '../components/PostBuilder';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarView = () => {
    const { data, loading } = useReelsData();
    const [selectedReel, setSelectedReel] = React.useState<Reel | null>(null);
    const [isBuildingPost, setIsBuildingPost] = React.useState(false);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentMonth = "March 2026";

    if (loading) return <div className="p-8 text-slate-400 italic">Processing Calendar...</div>;

    // Filter reels that have post dates
    const scheduledReels = data.filter(r => r.piePosted || r.charPosted);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">Content Calendar</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Schedule and plan your strategy visually.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
                        <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="px-4 py-1.5 text-sm font-bold text-slate-700">{currentMonth}</span>
                        <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden glass">
                <div className="grid grid-cols-7 border-b border-slate-100">
                    {days.map(day => (
                        <div key={day} className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-[140px]">
                    {[...Array(35)].map((_, i) => (
                        <div key={i} className="border-r border-b border-slate-100 p-3 hover:bg-slate-50/50 transition-colors group relative">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-300 group-hover:text-slate-900 transition-colors">{i + 1 % 31}</span>
                                <button
                                    onClick={() => setIsBuildingPost(true)}
                                    className="opacity-0 group-hover:opacity-100 p-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all shadow-sm"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="mt-2 space-y-1 overflow-hidden h-[90px]">
                                {scheduledReels.slice(0, 1).map((reel, idx) => {
                                    const statusColor = reel.status === 'Published' ? 'bg-green-50 text-green-700 border-green-100' :
                                        reel.status === 'Scheduled' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                            'bg-slate-50 text-slate-700 border-slate-100';
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedReel(reel)}
                                            className={`${statusColor} p-1.5 rounded-lg border truncate text-[10px] font-bold cursor-pointer hover:scale-105 transition-transform`}
                                        >
                                            🎬 {reel.id}: {reel.title}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedReel && <PostDrawer reel={selectedReel} onClose={() => setSelectedReel(null)} />}
            {isBuildingPost && <PostBuilder onClose={() => setIsBuildingPost(false)} />}
        </div>
    );
};
