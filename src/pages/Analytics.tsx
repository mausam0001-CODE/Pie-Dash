import React, { useState } from 'react';
import { usePosts } from '../features/posts/usePosts';
import { useMetrics } from '../features/accounts/useMetrics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area, LineChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Eye, BarChart3, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { format, subMonths, startOfMonth, isSameMonth, subDays, subHours, isAfter } from 'date-fns';

// ── Helpers ──────────────────────────────────────────────────────────
function momBadge(current: number, prev: number) {
    if (prev === 0) return { pct: '+0%', up: true };
    const pct = ((current - prev) / prev) * 100;
    return { pct: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, up: pct >= 0 };
}

export const Analytics = () => {
    const { data: posts = [], isLoading: postsLoading } = usePosts();
    const { data: metrics = [], isLoading: metricsLoading } = useMetrics();
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | 'all'>('30d');

    const isLoading = postsLoading || metricsLoading;

    // ── Filtering Logic ──────────────────────────────────────────────────
    const dateLimit = React.useMemo(() => {
        const now = new Date();
        if (timeRange === '24h') return subHours(now, 24);
        if (timeRange === '7d') return subDays(now, 7);
        if (timeRange === '30d') return subDays(now, 30);
        if (timeRange === '90d') return subDays(now, 90);
        return new Date(0); // All time
    }, [timeRange]);

    const filteredPosts = React.useMemo(() => {
        if (timeRange === 'all') return posts;
        return posts.filter((p: any) => isAfter(new Date(p.scheduled_at || p.created_at), dateLimit));
    }, [posts, dateLimit, timeRange]);

    // ── Granular Data Generation ─────────────────────────────────────────
    const chartTimePoints = React.useMemo(() => {
        const points: { label: string, date: Date, isMonth?: boolean }[] = [];
        const now = new Date();

        if (timeRange === '24h') {
            for (let i = 24; i >= 0; i -= 3) {
                const d = subHours(now, i);
                points.push({ label: format(d, 'HH:mm'), date: d });
            }
        } else if (timeRange === '7d') {
            for (let i = 7; i >= 0; i--) {
                const d = subDays(now, i);
                points.push({ label: format(d, 'EEE'), date: d });
            }
        } else if (timeRange === '30d' || timeRange === '90d') {
            const days = timeRange === '30d' ? 30 : 90;
            const step = timeRange === '30d' ? 5 : 15;
            for (let i = days; i >= 0; i -= step) {
                const d = subDays(now, i);
                points.push({ label: format(d, 'MMM d'), date: d });
            }
        } else {
            // All time / 6 months
            for (let i = 5; i >= 0; i--) {
                const d = subMonths(now, i);
                points.push({ label: format(d, 'MMM'), date: startOfMonth(d), isMonth: true });
            }
        }
        return points;
    }, [timeRange]);

    const audienceData = React.useMemo(() => {
        return chartTimePoints.map(({ label, date, isMonth }) => {
            const metricEntry = metrics.find(m => {
                const mDate = new Date(m.month);
                return isMonth ? isSameMonth(mDate, date) : isAfter(new Date(m.month), subDays(date, 1));
            });
            const followers = metricEntry?.follower_count || 0;
            const following = metricEntry?.following_count || 0;

            return { name: label, followers, following };
        });
    }, [chartTimePoints, metrics, timeRange]);

    const latestPoint = audienceData[audienceData.length - 1] || { followers: 0 };
    const prevPoint = audienceData[audienceData.length - 2] || latestPoint;
    const followerMoM = momBadge(latestPoint.followers, prevPoint.followers);

    const growthData = React.useMemo(() => {
        return chartTimePoints.map(({ label, date, isMonth }) => {
            const rangePosts = posts.filter((p: any) => {
                const pDate = new Date(p.scheduled_at || p.created_at);
                if (isMonth) return isSameMonth(pDate, date);
                // For daily/hourly, check if it's within the window
                const windowStart = timeRange === '24h' ? subHours(date, 3) : subDays(date, 1);
                return isAfter(pDate, windowStart) && !isAfter(pDate, date);
            });
            return {
                name: label,
                views: rangePosts.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0),
                likes: rangePosts.reduce((sum: number, p: any) => sum + (p.like_count || 0), 0),
            };
        });
    }, [chartTimePoints, posts, timeRange]);

    const categoryData = React.useMemo(() => {
        if (!posts.length) return [];
        const counts = posts.reduce((acc: Record<string, number>, post: any) => {
            acc[post.category || 'Uncategorized'] = (acc[post.category || 'Uncategorized'] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts)
            .map(([name, value], i) => ({ name, value, color: ['#14b8a6', '#a855f7', '#f97316', '#3b82f6', '#ec4899'][i % 5] }))
            .sort((a, b) => (b.value as number) - (a.value as number))
            .slice(0, 6);
    }, [posts]);

    const topPosts = React.useMemo(() => {
        return [...filteredPosts]
            .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 5)
            .map((post: any) => ({
                ...post,
                views: (post.view_count || 0) > 1000 ? `${((post.view_count || 0) / 1000).toFixed(1)}k` : post.view_count || 0,
                likes: (post.like_count || 0) > 1000 ? `${((post.like_count || 0) / 1000).toFixed(1)}k` : post.like_count || 0,
            }));
    }, [posts]);

    const aggregates = React.useMemo(() => {
        const totalViews = filteredPosts.reduce((s: number, p: any) => s + (p.view_count || 0), 0);
        const totalLikes = filteredPosts.reduce((s: number, p: any) => s + (p.like_count || 0), 0);
        const avgEngage = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : '0';
        const fmt = (n: number) => n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n > 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
        return { totalViews: fmt(totalViews), engagement: `${avgEngage}%`, growth: followerMoM.pct };
    }, [filteredPosts, followerMoM]);

    if (isLoading) return <div className="p-8 text-slate-400 font-medium animate-pulse text-center">Crunching Data...</div>;

    const stats = [
        {
            label: 'Total Views', value: aggregates.totalViews, icon: Eye,
            color: 'text-blue-600', bg: 'bg-blue-50', badge: '+4.2%', up: true
        },
        {
            label: 'Followers', value: (latestPoint?.followers || 0).toLocaleString(), icon: Users,
            color: 'text-purple-600', bg: 'bg-purple-50', badge: followerMoM.pct, up: followerMoM.up
        },
        {
            label: 'Following', value: (latestPoint?.following || 0).toLocaleString(), icon: Users,
            color: 'text-slate-600', bg: 'bg-slate-50', badge: 'Following', up: true
        },
        {
            label: 'Avg. Engagement', value: aggregates.engagement, icon: TrendingUp,
            color: 'text-teal-600', bg: 'bg-teal-50', badge: '+1.8%', up: true
        },
        {
            label: 'Growth Rate', value: followerMoM.pct, icon: BarChart3,
            color: 'text-orange-600', bg: 'bg-orange-50', badge: `${filteredPosts.length} Posts`, up: true
        },
    ];

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Performance Analytics</h2>
                    <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium italic">Strategic insights for your content ecosystem.</p>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                    {(['24h', '7d', '30d', '90d', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats with MoM badges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <div className={`p-2 md:p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className={`flex items-center gap-0.5 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.up ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {stat.badge}
                            </span>
                        </div>
                        <p className="text-[10px] md:text-xs font-medium text-slate-500">{stat.label}</p>
                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Audience Growth (Followers with MoM dots) */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm md:text-base font-bold text-slate-900">Audience Growth</h3>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Follower count · Month over month</p>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${followerMoM.up ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                            {followerMoM.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {followerMoM.pct} Growth
                        </span>
                    </div>
                    {/* Summary badges are handled in the header */}
                    <div className="h-44 md:h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={audienceData}>
                                <defs>
                                    <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '12px' }}
                                    formatter={(v: any) => [v.toLocaleString(), 'Followers']}
                                />
                                <Area type="monotone" dataKey="followers" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorFollow)" dot={{ fill: '#a855f7', r: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Views + Likes over time */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1">Content Performance</h3>
                    <p className="text-[10px] text-slate-400 font-medium mb-4">Views vs. Likes by month</p>
                    <div className="h-44 md:h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                                <Line type="monotone" dataKey="views" stroke="#14b8a6" strokeWidth={2.5} dot={false} name="Views" />
                                <Line type="monotone" dataKey="likes" stroke="#f97316" strokeWidth={2.5} dot={false} name="Likes" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-3 h-0.5 bg-teal-500 inline-block rounded" /> Views</span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className="w-3 h-0.5 bg-orange-500 inline-block rounded" /> Likes</span>
                    </div>
                </div>
            </div>

            {/* Engagement by Category */}
            {categoryData.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm">
                    <h3 className="text-sm md:text-base font-bold text-slate-900 mb-4">Engagement by Topic</h3>
                    <div className="h-48 md:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                                    {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Top Content Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100">
                    <h3 className="text-sm md:text-base font-bold text-slate-900">🔥 Top Performing Content</h3>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-slate-50/50">
                            <tr>
                                {['Content', 'Views', 'Likes', 'Shares'].map(h => (
                                    <th key={h} className="px-4 md:px-6 py-3 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {topPosts.map((post: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 md:px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden shrink-0">
                                                <img src={post.thumbnail_url || post.media_url} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{post.title}</p>
                                                <p className="text-[9px] text-slate-400 font-medium uppercase">{post.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 text-xs font-bold text-slate-700">{post.views}</td>
                                    <td className="px-4 md:px-6 py-3 text-xs text-slate-500">{post.likes}</td>
                                    <td className="px-4 md:px-6 py-3 text-xs text-slate-500">{post.share_count || 0}</td>
                                </tr>
                            ))}
                            {topPosts.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-12 text-sm text-slate-400">No data yet. Create and publish some posts to see analytics.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
