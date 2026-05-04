import React from 'react';
import { usePosts } from '../features/posts/usePosts';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Eye, BarChart3 } from 'lucide-react';

const growthData = [
    { name: 'Jan', followers: 4000, views: 24000 },
    { name: 'Feb', followers: 4500, views: 28000 },
    { name: 'Mar', followers: 5100, views: 35000 },
    { name: 'Apr', followers: 6000, views: 42000 },
    { name: 'May', followers: 7200, views: 58000 },
    { name: 'Jun', followers: 8500, views: 75000 },
];

export const Analytics = () => {
    const { data: posts = [], isLoading } = usePosts();

    // Memoize stats to prevent re-randomization on every render
    const categoryData = React.useMemo(() => {
        if (!posts) return [];
        const categoryCounts = posts.reduce((acc: Record<string, number>, post: any) => {
            acc[post.category] = (acc[post.category] || 0) + 1;
            return acc;
        }, {});

        return Object.keys(categoryCounts)
            .map((name, i) => ({
                name,
                value: categoryCounts[name] * (Math.floor(Math.random() * 50) + 10),
                color: ['#14b8a6', '#a855f7', '#f97316', '#3b82f6', '#ec4899'][i % 5]
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [posts]);

    const topPostsWithStats = React.useMemo(() => {
        return posts.slice(0, 5).map((post: any) => ({
            ...post,
            views: `${(Math.random() * 50 + 10).toFixed(1)}k`,
            likes: `${(Math.random() * 5 + 1).toFixed(1)}k`,
            shares: Math.floor(Math.random() * 500 + 100),
        }));
    }, [posts]);

    if (isLoading) return <div className="p-8 text-slate-400 font-medium animate-pulse text-center">Crunching Data...</div>;

    const stats = [
        { label: 'Total Views', value: '1.2M', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Followers', value: '8,502', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Avg. Engagement', value: '4.8%', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'Growth Rate', value: '+12.5%', icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Performance Analytics</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium italic">Strategic insights for your content ecosystem.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+4.2%</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Growth Trend */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-slate-900 font-display">Follower Growth</h3>
                        <select className="text-xs bg-slate-50 border-none rounded-lg font-bold px-3 py-2 outline-none">
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                                <Area type="monotone" dataKey="followers" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorFollow)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Engagement by Category */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-8 font-display">Engagement by Topic</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Content Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 italic font-display">🔥 Top Performing Content</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Content</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Views</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Likes</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Shares</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topPostsWithStats.map((post: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-slate-200 overflow-hidden">
                                                <img src={post.thumbnail_url || post.media_url} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{post.title}</p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase">{post.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{post.views}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{post.likes}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{post.shares}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
