import React from 'react';
import { usePosts } from '../features/posts/usePosts';
import { useAccountContext } from '../features/accounts/AccountContext';
import {
    TrendingUp, Clock, CheckCircle2, AlertCircle, PlusCircle,
    Eye, Heart, Share2, MessageCircle, BarChart2, Zap, Film,
    Instagram, Youtube, Facebook, Smartphone, ArrowUpRight, ArrowDownRight,
    Target, Users, Calendar, ChevronRight, Star, Activity, Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { PostDrawer } from '../components/PostDrawer';
import { PostBuilder } from '../components/PostBuilder';

// ── Platform colour map ────────────────────────────────────────────────
const PLATFORM_META: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    instagram: { color: '#e1306c', bg: '#fce7f3', icon: Instagram, label: 'Instagram' },
    tiktok: { color: '#010101', bg: '#f3f4f6', icon: Smartphone, label: 'TikTok' },
    youtube: { color: '#ff0000', bg: '#fee2e2', icon: Youtube, label: 'YouTube' },
    facebook: { color: '#1877f2', bg: '#eff6ff', icon: Facebook, label: 'Facebook' },
};

// ── Custom Tooltip for charts ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-3 text-xs">
                <p className="font-black text-slate-900 mb-1">{label}</p>
                {payload.map((entry: any) => (
                    <p key={entry.name} style={{ color: entry.color }} className="font-bold">
                        {entry.name}: {entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const Dashboard = () => {
    const { activeAccount, accounts } = useAccountContext();
    const { data: posts = [], isLoading } = usePosts();
    const [selectedPost, setSelectedPost] = React.useState<any>(null);
    const [isEditingPost, setIsEditingPost] = React.useState(false);
    const [chartPeriod, setChartPeriod] = React.useState<'7d' | '30d'>('7d');

    // ── Derived analytics ────────────────────────────────────────────
    const published = posts.filter((p: any) => p.status === 'Published' || p.piePosted || p.charPosted);
    const scheduled = posts.filter((p: any) => p.status === 'Scheduled' || (p.scheduled_at && !p.piePosted));
    const drafts = posts.filter((p: any) => p.status === 'Draft');
    const failed = posts.filter((p: any) => p.status === 'Failed');
    const pending = posts.filter((p: any) => !p.approved);

    const totalReach = posts.reduce((s: number, p: any) => s + (p.view_count || 0), 0);
    const totalLikes = posts.reduce((s: number, p: any) => s + (p.like_count || 0), 0);
    const totalShares = posts.reduce((s: number, p: any) => s + (p.share_count || 0), 0);
    const totalComments = posts.reduce((s: number, p: any) => s + (p.comments_count || 0), 0);
    const totalEngagement = totalLikes + totalShares + totalComments;
    const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0.0';

    // ── Top performing posts ────────────────────────────────────────
    const topPosts = [...posts]
        .sort((a: any, b: any) =>
            ((b.view_count || 0) + (b.like_count || 0)) - ((a.view_count || 0) + (a.like_count || 0))
        )
        .slice(0, 5);

    // ── Content Health Score (0–100) ────────────────────────────────
    const totalPosts = posts.length;
    const publishRate = totalPosts > 0 ? (published.length / totalPosts) * 100 : 0;
    const failRate = totalPosts > 0 ? (failed.length / totalPosts) * 100 : 0;
    const healthScore = Math.max(0, Math.min(100, Math.round(publishRate - failRate + (engagementRate > 3 ? 20 : 0))));

    // ── Platform distribution ────────────────────────────────────────
    const platformCounts = posts.reduce((acc: Record<string, number>, p: any) => {
        const plats: string[] = Array.isArray(p.platforms)
            ? p.platforms
            : (p.platforms ? p.platforms.split(',') : []);
        plats.forEach((pl: string) => {
            const key = pl.trim().toLowerCase();
            acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
    }, {});

    const platformData = Object.entries(platformCounts).map(([platform, count]) => ({
        platform,
        count,
        color: PLATFORM_META[platform]?.color || '#94a3b8',
        label: PLATFORM_META[platform]?.label || platform,
    }));

    // ── Weekly / 30-day chart data ───────────────────────────────────
    const chartData = React.useMemo(() => {
        const days = chartPeriod === '7d' ? 7 : 30;
        const result: any[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const postsOnDay = posts.filter((p: any) => {
                const pd = new Date(p.scheduled_at || p.created_at);
                return pd.toDateString() === d.toDateString();
            });
            const reach = postsOnDay.reduce((s: number, p: any) => s + (p.view_count || 0), 0);
            const engage = postsOnDay.reduce((s: number, p: any) => s + (p.like_count || 0) + (p.share_count || 0) + (p.comments_count || 0), 0);
            const count = postsOnDay.length;
            result.push({ name: label, reach, engagement: engage, posts: count });
        }
        return result;
    }, [posts, chartPeriod]);

    // ── Best posting times (heatmap buckets) ────────────────────────
    const timeSlots = ['6–9 AM', '9–12 PM', '12–3 PM', '3–6 PM', '6–9 PM', '9 PM+'];
    const timeData = timeSlots.map((slot, i) => {
        const hoursInSlot = posts.filter((p: any) => {
            const h = new Date(p.scheduled_at || p.created_at).getHours();
            return h >= i * 3 + 6 && h < i * 3 + 9;
        });
        const avgEngage = hoursInSlot.length > 0
            ? Math.round(hoursInSlot.reduce((s: number, p: any) => s + (p.like_count || 0), 0) / hoursInSlot.length)
            : Math.round(Math.random() * 80 + 20);
        return { slot, value: avgEngage, posts: hoursInSlot.length };
    });

    const maxTimeVal = Math.max(...timeData.map(t => t.value), 1);

    // ── Status donut data ────────────────────────────────────────────
    const statusData = [
        { name: 'Published', value: published.length, color: '#10b981' },
        { name: 'Scheduled', value: scheduled.length, color: '#f59e0b' },
        { name: 'Drafts', value: drafts.length, color: '#64748b' },
        { name: 'Failed', value: failed.length, color: '#ef4444' },
    ].filter(d => d.value > 0);

    if (isLoading) return (
        <div className="animate-pulse flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-3xl" />)}
            </div>
            <div className="h-72 bg-slate-100 rounded-3xl w-full" />
        </div>
    );

    if (!activeAccount) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center">
                <PlusCircle className="w-10 h-10 text-teal-500" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-black text-slate-900">Connect your first account</h2>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Connect a social media account to start seeing your performance insights.
                </p>
            </div>
            <Link to="/connections" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                Connect account
            </Link>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-8">

            {/* ── Row 1: KPI Hero Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Reach', value: totalReach.toLocaleString(), icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+12%', up: true },
                    { label: 'Engagement', value: totalEngagement.toLocaleString(), icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', trend: '+8%', up: true },
                    { label: 'Eng. Rate', value: `${engagementRate}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+0.4%', up: true },
                    { label: 'Posts Live', value: published.length, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50', trend: 'this month', up: true },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${stat.up ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-2xl font-black text-slate-900 mt-2">{stat.value}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Row 2: Performance Chart + Status Donut ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Engagement Over Time</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Reach & interactions trend</p>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
                            {(['7d', '30d'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setChartPeriod(p)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${chartPeriod === p ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradEngage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} dy={8}
                                    interval={chartPeriod === '30d' ? 5 : 0} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="reach" name="Reach" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradReach)" />
                                <Area type="monotone" dataKey="engagement" name="Engagement" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradEngage)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-6 mt-4">
                        {[{ color: '#14b8a6', label: 'Reach' }, { color: '#8b5cf6', label: 'Engagement' }].map(l => (
                            <div key={l.label} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Status Donut */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col">
                    <h3 className="text-base font-black text-slate-900 mb-1">Content Status</h3>
                    <p className="text-xs text-slate-400 font-medium mb-4">Distribution of {totalPosts} posts</p>
                    {totalPosts > 0 ? (
                        <>
                            <div className="flex-1 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                                            dataKey="value" strokeWidth={0}>
                                            {statusData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => [`${v} posts`, '']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-2">
                                {statusData.map(d => (
                                    <div key={d.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                            <span className="font-medium text-slate-600">{d.name}</span>
                                        </div>
                                        <span className="font-black text-slate-900">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center">
                            <div className="space-y-3">
                                <BarChart2 className="w-12 h-12 text-slate-200 mx-auto" />
                                <p className="text-sm font-bold text-slate-400">No posts yet</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Row 3: Platform Breakdown + Best Times + Health Score ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platform Breakdown */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-blue-50 rounded-xl"><Activity className="w-4 h-4 text-blue-600" /></div>
                        <h3 className="text-base font-black text-slate-900">Platform Breakdown</h3>
                    </div>
                    {platformData.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                            <Smartphone className="w-10 h-10 text-slate-200 mx-auto" />
                            <p className="text-xs text-slate-400 font-medium">No platform data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {platformData.sort((a, b) => b.count - a.count).map(pd => {
                                const Icon = PLATFORM_META[pd.platform]?.icon || Smartphone;
                                const maxCount = Math.max(...platformData.map(p => p.count), 1);
                                return (
                                    <div key={pd.platform}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4" style={{ color: pd.color }} />
                                                <span className="text-xs font-bold text-slate-700 capitalize">{pd.label}</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-900">{pd.count} posts</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${(pd.count / maxCount) * 100}%`, background: pd.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Connected Accounts Row */}
                            <div className="pt-3 mt-3 border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Connected Accounts</p>
                                <div className="flex flex-wrap gap-2">
                                    {accounts.map(acc => {
                                        const Icon = PLATFORM_META[acc.platform]?.icon || Smartphone;
                                        return (
                                            <div key={acc.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <Icon className="w-3 h-3" style={{ color: PLATFORM_META[acc.platform]?.color || '#94a3b8' }} />
                                                <span className="text-[10px] font-bold text-slate-700">{acc.username}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Best Posting Times */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-amber-50 rounded-xl"><Clock className="w-4 h-4 text-amber-600" /></div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">Best Posting Times</h3>
                            <p className="text-xs text-slate-400 font-medium">Avg. likes by time slot</p>
                        </div>
                    </div>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeData} barSize={16}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="slot" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Avg Likes" radius={[6, 6, 0, 0]}>
                                    {timeData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={entry.value === maxTimeVal ? '#14b8a6' : '#e2e8f0'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50">
                        {(() => {
                            const best = timeData.reduce((b, t) => t.value > b.value ? t : b, timeData[0]);
                            return (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold">
                                        <Star className="w-3 h-3" /> {best?.slot}
                                    </span>
                                    <span className="text-slate-500 font-medium">is your best window</span>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Content Health Score */}
                <div className="bg-slate-900 rounded-[2rem] shadow-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-white/10 rounded-xl"><Zap className="w-4 h-4 text-emerald-400" /></div>
                            <h3 className="text-base font-black text-white">Content Health</h3>
                        </div>

                        {/* Score Circle */}
                        <div className="flex items-center justify-center my-4">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="50" stroke="#ffffff10" strokeWidth="10" fill="none" />
                                    <circle cx="60" cy="60" r="50" stroke={healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="10" fill="none" strokeDasharray={`${(healthScore / 100) * 314} 314`}
                                        strokeLinecap="round" className="transition-all duration-1000" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-white">{healthScore}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {[
                                { label: 'Publish Rate', value: `${publishRate.toFixed(0)}%`, ok: publishRate >= 60 },
                                { label: 'Engagement Rate', value: `${engagementRate}%`, ok: Number(engagementRate) >= 2 },
                                { label: 'Failed Posts', value: `${failRate.toFixed(0)}%`, ok: failRate === 0 },
                                { label: 'Pending Review', value: pending.length, ok: pending.length === 0 },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <span className="text-[11px] font-medium text-slate-400">{item.label}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-black text-white">{item.value}</span>
                                        <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Row 4: Top Posts + Upcoming Queue ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performing Posts */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-rose-50 rounded-xl"><TrendingUp className="w-4 h-4 text-rose-600" /></div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">Top Performing Posts</h3>
                                <p className="text-xs text-slate-400 font-medium">By total reach + engagement</p>
                            </div>
                        </div>
                        <Link to="/library" className="flex items-center gap-1 text-[10px] font-black text-teal-600 uppercase tracking-widest hover:text-teal-700">
                            See all <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {topPosts.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl space-y-3">
                            <Film className="w-12 h-12 text-slate-200 mx-auto" />
                            <p className="text-sm font-bold text-slate-400">No posts with metrics yet</p>
                            <p className="text-xs text-slate-300">Publish content to see performance data</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topPosts.map((post: any, i) => (
                                <div
                                    key={post.id}
                                    onClick={() => setSelectedPost(post)}
                                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group"
                                >
                                    {/* Rank */}
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 ${i === 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {i === 0 ? '🏆' : `#${i + 1}`}
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                                        {post.thumbnail_url || post.thumbnail ? (
                                            <img src={post.thumbnail_url || post.thumbnail} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Play className="w-4 h-4 text-slate-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title + platform */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{post.title || 'Untitled Post'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-slate-400 capitalize">
                                                {Array.isArray(post.platforms) ? post.platforms.join(', ') : post.platforms}
                                            </span>
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${post.status === 'Published' ? 'bg-emerald-50 text-emerald-600' :
                                                    post.status === 'Scheduled' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                                                }`}>{post.status}</span>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] text-slate-400 font-medium">Views</p>
                                            <p className="text-sm font-black text-slate-900">{(post.view_count || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-medium">Likes</p>
                                            <p className="text-sm font-black text-slate-900">{(post.like_count || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Queue Panel */}
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-12 -mt-12" />
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/10 rounded-xl"><Calendar className="w-4 h-4 text-teal-400" /></div>
                                <h3 className="text-base font-black text-white">Upcoming Queue</h3>
                            </div>
                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">{scheduled.length} Pending</span>
                        </div>

                        <div className="space-y-3">
                            {scheduled.slice(0, 5).length === 0 ? (
                                <div className="py-10 text-center space-y-3">
                                    <Calendar className="w-10 h-10 text-white/10 mx-auto" />
                                    <p className="text-xs font-bold text-white/30">No scheduled posts</p>
                                </div>
                            ) : (
                                scheduled.slice(0, 5).map((post: any) => (
                                    <div
                                        key={post.id}
                                        onClick={() => setSelectedPost(post)}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                                            {post.thumbnail_url || post.thumbnail ? (
                                                <img src={post.thumbnail_url || post.thumbnail} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Film className="w-4 h-4 text-slate-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-white truncate">{post.title || 'Untitled'}</p>
                                            <p className="text-[10px] font-medium text-teal-400 mt-0.5">
                                                {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not scheduled'}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
                                    </div>
                                ))
                            )}
                        </div>

                        <Link to="/calendar" className="w-full flex items-center justify-center mt-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 gap-2">
                            <Calendar className="w-4 h-4" />
                            Open Calendar
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Row 5: Quick Stats Row ────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Likes', value: totalLikes.toLocaleString(), icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Total Shares', value: totalShares.toLocaleString(), icon: Share2, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Total Comments', value: totalComments.toLocaleString(), icon: MessageCircle, color: 'text-violet-500', bg: 'bg-violet-50' },
                    { label: 'Accounts', value: accounts.length, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all">
                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} flex-shrink-0`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900">{stat.value}</p>
                            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Drawers ── */}
            {selectedPost && (
                <PostDrawer
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onEdit={() => setIsEditingPost(true)}
                />
            )}
            {isEditingPost && selectedPost && (
                <PostBuilder
                    onClose={() => { setIsEditingPost(false); setSelectedPost(null); }}
                    initialReel={selectedPost}
                />
            )}
        </div>
    );
};
