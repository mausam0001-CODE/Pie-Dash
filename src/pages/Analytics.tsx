import React from 'react';
import { usePosts } from '../features/posts/usePosts';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Eye, BarChart3 } from 'lucide-react';

export const Analytics = () => {
    const { data: posts = [], isLoading } = usePosts();

    const growthData = React.useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return months.map((month, i) => {
            const monthPosts = posts.filter((p: any) => new Date(p.scheduled_at || p.created_at).getMonth() === i);
            return {
                name: month,
                followers: 4000 + (monthPosts.length * 50), // Projection based on posts
                views: monthPosts.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0)
            };
        });
    }, [posts]);

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
                value: categoryCounts[name],
                color: ['#14b8a6', '#a855f7', '#f97316', '#3b82f6', '#ec4899'][i % 5]
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [posts]);

    const topPostsWithStats = React.useMemo(() => {
        return [...posts]
            .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 5)
            .map((post: any) => ({
                ...post,
                views: post.view_count > 1000 ? `${(post.view_count / 1000).toFixed(1)}k` : post.view_count,
                likes: post.like_count > 1000 ? `${(post.like_count / 1000).toFixed(1)}k` : post.like_count,
                shares: post.share_count || 0,
            }));
    }, [posts]);

    const aggregates = React.useMemo(() => {
        const totalViews = posts.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0);
        const totalLikes = posts.reduce((sum: number, p: any) => sum + (p.like_count || 0), 0);
        const avgEngagement = posts.length > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : '0';

        return {
            totalViews: totalViews > 1000000 ? `${(totalViews / 1000000).toFixed(1)}M` : totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews,
            followers: 4000 + (posts.length * 50),
            engagement: `${avgEngagement}%`,
            growth: `+${(posts.length * 0.5).toFixed(1)}%`
        };
    }, [posts]);

    if (isLoading) return <div className="p-8 text-slate-400 font-medium animate-pulse text-center">Crunching Data...</div>;

    const stats = [
        { label: 'Total Views', value: aggregates.totalViews, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Followers', value: aggregates.followers.toLocaleString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Avg. Engagement', value: aggregates.engagement, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'Growth Rate', value: aggregates.growth, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display">Performance Analytics</h2>
                <p className="text-slate-500 text-[10px] md:text-sm mt-1 font-medium italic">Strategic insights for your content ecosystem.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-4 h-4 md:w-6 md:h-6" />
                            </div>
                            <span className="text-[8px] md:text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 md:py-1 rounded-full">+4.2%</span>
                        </div>
                        <p className="text-[10px] md:text-sm font-medium text-slate-500 line-clamp-1">{stat.label}</p>
                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Growth Trend */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <h3 className="text-sm md:text-base font-bold text-slate-900 font-display">Follower Growth</h3>
                        <select className="text-[10px] bg-slate-50 border-none rounded-lg font-bold px-2 py-1.5 outline-none">
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-48 md:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="followers" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorFollow)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Engagement by Category */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 mb-6 md:mb-8 font-display">Engagement by Topic</h3>
                    <div className="h-48 md:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={16}>
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
                <div className="p-4 md:p-6 border-b border-slate-100">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 italic font-display">🔥 Top Performing Content</h3>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Content</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Views</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Likes</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Shares</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topPostsWithStats.map((post: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-slate-200 overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                                                <img src={post.thumbnail_url || post.media_url} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] md:text-xs font-bold text-slate-900 truncate">{post.title}</p>
                                                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">{post.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-[11px] md:text-xs font-bold text-slate-700">{post.views}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-[11px] md:text-xs font-medium text-slate-500">{post.likes}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-[11px] md:text-xs font-medium text-slate-500">{post.shares}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
