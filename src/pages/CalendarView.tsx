import React from 'react';
import { usePosts } from '../features/posts/usePosts';
import { PostDrawer } from '../components/PostDrawer';
import { PostBuilder } from '../components/PostBuilder';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval
} from 'date-fns';

import { useUI } from '../context/UIContext';

export const CalendarView = () => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const { data: posts = [], isLoading } = usePosts();
    const { openBuilder } = useUI();
    const [selectedReel, setSelectedReel] = React.useState<any | null>(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="animate-spin mb-4"><CalendarIcon className="w-12 h-12" /></div>
            <p className="font-bold uppercase tracking-widest text-[10px]">Syncing Timeline...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">Content Calendar</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Schedule and plan your strategy visually.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex shadow-sm items-center">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-all"><ChevronLeft className="w-5 h-5" /></button>
                        <span className="px-6 text-sm font-black text-slate-900 min-w-[140px] text-center tracking-tight">{format(currentDate, 'MMMM yyyy')}</span>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-all"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                    <button
                        onClick={() => openBuilder()}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-3 rounded-2xl text-xs font-black shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Post
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl md:rounded-[2.5rem] shadow-xl overflow-hidden shadow-slate-200/50">
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, i) => {
                                const dayPosts = posts.filter((p: any) => p.scheduled_at && isSameDay(new Date(p.scheduled_at), day));
                                const isCurrentMonth = isSameMonth(day, monthStart);

                                return (
                                    <div key={i} className={`min-h-[140px] border-r border-b border-slate-100 p-4 transition-colors group relative ${!isCurrentMonth ? 'bg-slate-50/30' : 'bg-white hover:bg-slate-50/50'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-black ${isCurrentMonth ? 'text-slate-900' : 'text-slate-300'}`}>
                                                {format(day, 'd')}
                                            </span>
                                            {isCurrentMonth && (
                                                <button
                                                    onClick={() => openBuilder()}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all shadow-sm"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-1.5 overflow-y-auto max-h-[100px] scrollbar-hide">
                                            {dayPosts.map((post: any, idx: number) => (
                                                <div
                                                    key={post.id}
                                                    onClick={() => setSelectedReel(post)}
                                                    className={`p-2 rounded-xl border truncate text-[10px] font-bold cursor-pointer hover:scale-[1.03] active:scale-95 transition-all shadow-sm ${post.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        post.status === 'Scheduled' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                                            'bg-slate-50 text-slate-700 border-slate-100'
                                                        }`}
                                                >
                                                    {post.thumbnail_url && <img src={post.thumbnail_url} className="w-3 h-3 inline-block rounded-sm mr-1 object-cover" />}
                                                    {post.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {selectedReel && (
                <PostDrawer
                    post={selectedReel}
                    onClose={() => setSelectedReel(null)}
                    onEdit={(post) => {
                        setSelectedReel(null);
                        openBuilder(post);
                    }}
                />
            )}
        </div>
    );
};

