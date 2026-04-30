import React from 'react';
import { usePosts } from '../features/posts/usePosts';
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
    { name: 'Mon', posts: 4, engagement: 2400 },
    { name: 'Tue', posts: 3, engagement: 1398 },
    { name: 'Wed', posts: 5, engagement: 9800 },
    { name: 'Thu', posts: 2, engagement: 3908 },
    { name: 'Fri', posts: 4, engagement: 4800 },
    { name: 'Sat', posts: 6, engagement: 3800 },
    { name: 'Sun', posts: 4, engagement: 4300 },
];

export const Dashboard = () => {
    const { data: posts = [], isLoading } = usePosts();

    const stats = [
        { label: 'Published', value: posts.filter(p => p.status === 'Published').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Scheduled', value: posts.filter(p => p.status === 'Scheduled').length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Pending Approval', value: posts.filter(p => p.status === 'Approved').length, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Failed', value: posts.filter(p => p.status === 'Failed').length, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    if (isLoading) return <div className="animate-pulse flex flex-col gap-8">
        <div className="h-32 bg-slate-200 rounded-3xl w-full" />
        <div className="h-64 bg-slate-200 rounded-3xl w-full" />
    </div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Status</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                        <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Performance Snapshot</h3>
                            <p className="text-xs text-slate-400 font-medium">Engagement across platforms this week</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">Top Growth</div>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="engagement" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorEngagement)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick List */}
                <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                    <h3 className="text-white font-black text-lg mb-6 relative">Upcoming Queue</h3>
                    <div className="space-y-4 relative">
                        {posts.filter(p => p.status === 'Scheduled').slice(0, 4).map((post) => (
                            <div key={post.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0">
                                    <img src={post.thumbnail} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{post.title}</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{new Date(post.scheduled_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/20">View Calendar</button>
                </div>
            </div>
        </div>
    );
};
