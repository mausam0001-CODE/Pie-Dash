import React from 'react';
import { usePosts } from '../features/posts/usePosts';
import { useAccountContext } from '../features/accounts/AccountContext';
import { TrendingUp, Clock, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PostDrawer } from '../components/PostDrawer';

export const Dashboard = () => {
    const { activeAccount } = useAccountContext();
    const { data: posts = [], isLoading } = usePosts();
    const [selectedPost, setSelectedPost] = React.useState<any>(null);

    const chartData = React.useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map(day => ({ name: day, posts: 0, engagement: 0 }));

        posts.forEach((post: any) => {
            const date = new Date(post.scheduled_at || post.created_at);
            const dayName = days[date.getDay()];
            const dayData = data.find(d => d.name === dayName);
            if (dayData) {
                dayData.posts += 1;
                dayData.engagement += (post.view_count || 0) + (post.like_count || 0) + (post.share_count || 0);
            }
        });

        // Ensure consistent order starting from current day or fixed Mon-Sun
        return data;
    }, [posts]);

    const stats = [
        { label: 'Published', value: posts.filter((p: any) => (p.status === 'Published' || p.piePosted || p.charPosted)).length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Scheduled', value: posts.filter((p: any) => (p.status === 'Scheduled' || (p.scheduled_at && !p.piePosted))).length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Pending Approval', value: posts.filter((p: any) => !p.approved).length, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Failed', value: posts.filter((p: any) => p.status === 'Failed').length, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    if (isLoading) return <div className="animate-pulse flex flex-col gap-8">
        <div className="h-32 bg-slate-200 rounded-3xl w-full" />
        <div className="h-64 bg-slate-200 rounded-3xl w-full" />
    </div>;

    if (!activeAccount) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center">
                <PlusCircle className="w-10 h-10 text-teal-500" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-black text-slate-900">Connect your first account</h2>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    To start seeing your performance insights and managing your posts, you need to connect a social media account.
                </p>
            </div>
            <Link
                to="/connections"
                className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
                Connect account
            </Link>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat: any) => (
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
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                    <h3 className="text-white font-black text-lg mb-4 relative">Upcoming Queue</h3>
                    <div className="space-y-3 relative">
                        {posts.filter((p: any) => (p.status === 'Scheduled' || (p.scheduled_at && !p.piePosted))).slice(0, 4).map((post: any) => (
                            <div
                                key={post.id}
                                onClick={() => setSelectedPost(post)}
                                className="flex items-center gap-4 p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden shrink-0">
                                    <img src={post.thumbnail_url || post.thumbnail} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{post.title}</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString() : 'Not set'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/calendar" className="w-full flex items-center justify-center mt-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/20">View Calendar</Link>
                </div>
            </div>

            {selectedPost && (
                <PostDrawer
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </div>
    );
};
