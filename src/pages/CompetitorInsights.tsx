import React, { useState } from 'react';
import { TrendingUp, MessageSquare, Eye, Copy, Zap, Plus, Trash2, AlertTriangle, CheckCircle2, ExternalLink, BarChart2, Search } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
interface CompetitorPost {
    id: string;
    competitor: string;
    platform: string;
    title: string;
    url: string;
    views: number;
    comments: number;
    avgViews: number;
    transcription?: string;
    addedAt: string;
}

// ── Mock seed data ─────────────────────────────────────────────────────
const SEED: CompetitorPost[] = [
    { id: '1', competitor: 'CompanyA', platform: 'Instagram', title: '5 Tax Tips Every Business Owner Needs', url: 'https://instagram.com/p/example1', views: 84000, comments: 312, avgViews: 20000, addedAt: '2026-05-01', transcription: '' },
    { id: '2', competitor: 'FinanceGuru', platform: 'TikTok', title: 'How I Saved £12k on Tax This Year', url: 'https://tiktok.com/@financeguru/video/1234', views: 210000, comments: 890, avgViews: 15000, addedAt: '2026-05-03', transcription: 'Hey guys, so in this video I\'m going to walk you through exactly how I saved £12,000 on tax...' },
    { id: '3', competitor: 'CompanyA', platform: 'Instagram', title: 'Client spotlight: 3x revenue in 6 months', url: 'https://instagram.com/p/example3', views: 18000, comments: 55, avgViews: 20000, addedAt: '2026-05-05', transcription: '' },
    { id: '4', competitor: 'MoneyMindset', platform: 'TikTok', title: 'The ONLY 3 accounts you need as a business', url: 'https://tiktok.com/@moneymindset/video/5678', views: 430000, comments: 1200, avgViews: 25000, addedAt: '2026-05-06', transcription: '' },
];

// ── Helpers ────────────────────────────────────────────────────────────
function isOutlier(post: CompetitorPost) {
    return post.views > post.avgViews * 2;
}

function isTrending(post: CompetitorPost) {
    return post.views > post.avgViews;
}

function fmtNum(n: number) {
    return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
}

// ── Add Competitor Modal ───────────────────────────────────────────────
const AddModal = ({ onAdd, onClose }: { onAdd: (p: Omit<CompetitorPost, 'id' | 'transcription'>) => void; onClose: () => void }) => {
    const [form, setForm] = useState({ competitor: '', platform: 'Instagram', title: '', url: '', views: '', comments: '', avgViews: '' });
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            ...form,
            views: Number(form.views),
            comments: Number(form.comments),
            avgViews: Number(form.avgViews),
            addedAt: new Date().toISOString().split('T')[0],
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-lg font-bold text-slate-900">Track Competitor Content</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Competitor</label>
                            <input required value={form.competitor} onChange={e => set('competitor', e.target.value)} placeholder="e.g. FinanceGuru" className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/30" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</label>
                            <select value={form.platform} onChange={e => set('platform', e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                                {['Instagram', 'TikTok', 'YouTube', 'Facebook'].map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Title / Hook</label>
                        <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Video hook or title" className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/30" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL</label>
                        <input value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/30" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[['Views', 'views'], ['Comments', 'comments'], ['Avg Views', 'avgViews']].map(([label, key]) => (
                            <div key={key}>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                                <input required type="number" min="0" value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder="0" className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/30" />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-black transition-all">Add to Tracker</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main Page ──────────────────────────────────────────────────────────
export const CompetitorInsights = () => {
    const [posts, setPosts] = useState<CompetitorPost[]>(SEED);
    const [showAdd, setShowAdd] = useState(false);
    const [activeTab, setActiveTab] = useState<'outliers' | 'trending' | 'all'>('outliers');
    const [transcribing, setTranscribing] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const handleAdd = (data: Omit<CompetitorPost, 'id' | 'transcription'>) => {
        setPosts(prev => [{ ...data, id: Date.now().toString(), transcription: '' }, ...prev]);
    };

    const handleDelete = (id: string) => setPosts(p => p.filter(x => x.id !== id));

    // Simulate transcription fetch
    const handleTranscribe = async (post: CompetitorPost) => {
        setTranscribing(post.id);
        await new Promise(r => setTimeout(r, 1800));
        setPosts(prev => prev.map(p => p.id === post.id
            ? { ...p, transcription: `[Auto-transcription of "${post.title}"] \n\nOpening hook: "If you're a business owner and you're not doing this, you're leaving money on the table..."\n\nKey points covered:\n• Strategy 1: ...\n• Strategy 2: ...\n• Call to action: "Follow for more tips"\n\n[Transcription powered by Pie AI — edit and adapt this content for your brand]` }
            : p
        ));
        setTranscribing(null);
    };

    const handleCopy = (post: CompetitorPost) => {
        navigator.clipboard.writeText(post.transcription || post.title);
        setCopied(post.id);
        setTimeout(() => setCopied(null), 2000);
    };

    const outliers = posts.filter(isOutlier);
    const trending = posts.filter(p => isTrending(p) && !isOutlier(p));
    const displayed = activeTab === 'outliers' ? outliers : activeTab === 'trending' ? trending : posts;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
                        <Search className="w-7 h-7 text-purple-500" />
                        Competitor Insights
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Track, analyse, and adapt high-performing competitor content</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Track Content
                </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Outliers', value: outliers.length, color: 'text-orange-600 bg-orange-50', icon: AlertTriangle, desc: '>2× avg views' },
                    { label: 'Trending', value: trending.length, color: 'text-purple-600 bg-purple-50', icon: TrendingUp, desc: '>avg views' },
                    { label: 'Total Tracked', value: posts.length, color: 'text-teal-600 bg-teal-50', icon: BarChart2, desc: 'across all competitors' },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${s.color}`}>
                            <s.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900">{s.value}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {(['outliers', 'trending', 'all'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-[10px] font-bold rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab === 'outliers' ? '🔥 Outliers' : tab === 'trending' ? '📈 Trending' : '📋 All'}
                    </button>
                ))}
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
                {displayed.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                        <Eye className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-600">No {activeTab} content yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Add competitor content above to start tracking.</p>
                    </div>
                )}

                {displayed.map(post => {
                    const outlier = isOutlier(post);
                    const performanceRatio = post.avgViews > 0 ? (post.views / post.avgViews).toFixed(1) : '—';
                    return (
                        <div key={post.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                            {/* Top Row */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{post.competitor}</span>
                                        <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{post.platform}</span>
                                        {outlier && <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> OUTLIER</span>}
                                        {!outlier && isTrending(post) && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" /> TRENDING</span>}
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 leading-snug">{post.title}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Tracked {post.addedAt}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {post.url && (
                                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                    <button onClick={() => handleDelete(post.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Metrics Row */}
                            <div className="flex gap-4 flex-wrap">
                                {[
                                    { label: 'Views', value: fmtNum(post.views), icon: Eye, color: 'text-blue-600' },
                                    { label: 'Comments', value: fmtNum(post.comments), icon: MessageSquare, color: 'text-teal-600' },
                                    { label: 'Avg Views', value: fmtNum(post.avgViews), icon: BarChart2, color: 'text-slate-400' },
                                    { label: 'Performance', value: `${performanceRatio}×`, icon: TrendingUp, color: outlier ? 'text-orange-600' : 'text-slate-600' },
                                ].map(m => (
                                    <div key={m.label} className="flex items-center gap-1.5">
                                        <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                                        <span className="text-xs font-bold text-slate-900">{m.value}</span>
                                        <span className="text-[9px] text-slate-400">{m.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Transcription Section */}
                            {post.transcription ? (
                                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Transcription Ready</p>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(post)}
                                            className={`flex items-center gap-1 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${copied === post.id ? 'bg-teal-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <Copy className="w-3 h-3" />
                                            {copied === post.id ? 'Copied!' : '1-Click Copy'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">{post.transcription}</p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleTranscribe(post)}
                                    disabled={transcribing === post.id}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${transcribing === post.id ? 'border-purple-200 text-purple-400 bg-purple-50 animate-pulse' : 'border-slate-200 text-slate-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50'}`}
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    {transcribing === post.id ? 'Transcribing...' : '1-Click Transcribe & Copy'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {showAdd && <AddModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
        </div>
    );
};
