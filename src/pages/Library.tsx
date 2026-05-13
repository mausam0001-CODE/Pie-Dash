import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '../features/posts/usePosts';
import { PostCard } from '../components/PostCard';
import { PostDrawer } from '../components/PostDrawer';
import { PostBuilder } from '../components/PostBuilder';
import { Film, Tag, Folder, X, ExternalLink, Search, ChevronRight } from 'lucide-react';

// ── Predefined smart folders (tags → groups) ──────────────────────────
const SMART_FOLDERS = [
    { label: 'Sales Videos', tags: ['sales', 'product', 'offer'], emoji: '💰' },
    { label: 'Tax Tips', tags: ['tax', 'finance', 'accounting', 'tips'], emoji: '🧾' },
    { label: 'Education', tags: ['education', 'tutorial', 'how-to', 'learn'], emoji: '📚' },
    { label: 'Behind the Scenes', tags: ['bts', 'team', 'behind-the-scenes'], emoji: '🎬' },
    { label: 'Trending Hooks', tags: ['trending', 'viral', 'hook'], emoji: '🔥' },
    { label: 'Client Stories', tags: ['client', 'testimonial', 'case-study'], emoji: '⭐' },
];

// ── Derive all unique tags from posts ─────────────────────────────────
function extractTags(posts: any[]): string[] {
    const set = new Set<string>();
    posts.forEach(p => {
        const rawTags: string[] = Array.isArray(p.tags) ? p.tags : (p.category ? [p.category] : []);
        rawTags.forEach(t => t && set.add(t.toLowerCase().trim()));
    });
    return Array.from(set).sort();
}

// ── Ghost GDrive link pill ─────────────────────────────────────────────
const GDriveChip = ({ url }: { url?: string }) => {
    if (!url) return null;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
        >
            <ExternalLink className="w-2.5 h-2.5" />
            GDrive
        </a>
    );
};

export const Library = () => {
    const [searchParams] = useSearchParams();
    const statusFilter = searchParams.get('status') || 'All';
    const { data: posts = [], isLoading } = usePosts(statusFilter);

    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [activeFolder, setActiveFolder] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'folders'>('grid');

    const allTags = useMemo(() => extractTags(posts), [posts]);

    // ── Filter posts by active tag / folder / search ──────────────────
    const filteredPosts = useMemo(() => {
        let result = posts;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((p: any) =>
                (p.title || '').toLowerCase().includes(q) ||
                (p.caption || '').toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q)
            );
        }

        if (activeFolder) {
            const folder = SMART_FOLDERS.find(f => f.label === activeFolder);
            if (folder) {
                result = result.filter((p: any) => {
                    const postTags = (Array.isArray(p.tags) ? p.tags : [p.category || '']).map((t: string) => t.toLowerCase());
                    return folder.tags.some(ft => postTags.some((pt: string) => pt.includes(ft)));
                });
            }
        }

        if (activeTag) {
            result = result.filter((p: any) => {
                const postTags = (Array.isArray(p.tags) ? p.tags : [p.category || '']).map((t: string) => t.toLowerCase());
                return postTags.includes(activeTag);
            });
        }

        return result;
    }, [posts, activeTag, activeFolder, searchQuery]);

    const clearFilters = () => {
        setActiveTag(null);
        setActiveFolder(null);
        setSearchQuery('');
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Vault...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900">Content Vault</h2>
                    <p className="text-xs text-slate-500 mt-1">Organize, tag, and find your best content instantly</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        <button onClick={() => setView('grid')} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Grid</button>
                        <button onClick={() => setView('folders')} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${view === 'folders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Folders</button>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <Film className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-900">{filteredPosts.length} Items</span>
                    </div>
                </div>
            </div>

            {/* Search + Active Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search titles, captions, categories..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
                    />
                </div>
                {(activeTag || activeFolder || searchQuery) && (
                    <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors shrink-0">
                        <X className="w-3 h-3" /> Clear Filters
                    </button>
                )}
            </div>

            {/* Folders View */}
            {view === 'folders' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {SMART_FOLDERS.map(folder => {
                            const count = posts.filter((p: any) => {
                                const postTags = (Array.isArray(p.tags) ? p.tags : [p.category || '']).map((t: string) => t.toLowerCase());
                                return folder.tags.some(ft => postTags.some((pt: string) => pt.includes(ft)));
                            }).length;
                            const active = activeFolder === folder.label;
                            return (
                                <button
                                    key={folder.label}
                                    onClick={() => { setActiveFolder(active ? null : folder.label); setActiveTag(null); setView('grid'); }}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center ${active ? 'border-teal-300 bg-teal-50 shadow-md' : 'border-slate-100 bg-white hover:border-teal-200 hover:shadow-sm'}`}
                                >
                                    <span className="text-2xl">{folder.emoji}</span>
                                    <p className="text-[10px] font-bold text-slate-900 leading-tight">{folder.label}</p>
                                    <span className="text-[8px] text-slate-400 font-medium">{count} items</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tag Cloud */}
                    {allTags.length > 0 && (
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Tag className="w-4 h-4 text-slate-400" />
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">All Tags</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => { setActiveTag(activeTag === tag ? null : tag); setView('grid'); }}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${activeTag === tag ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex gap-6">
                    {/* Tag Sidebar (desktop only) */}
                    <aside className="hidden lg:flex flex-col gap-3 w-48 shrink-0">
                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Folder className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Folders</p>
                            </div>
                            {SMART_FOLDERS.map(folder => {
                                const count = posts.filter((p: any) => {
                                    const postTags = (Array.isArray(p.tags) ? p.tags : [p.category || '']).map((t: string) => t.toLowerCase());
                                    return folder.tags.some(ft => postTags.some((pt: string) => pt.includes(ft)));
                                }).length;
                                return (
                                    <button
                                        key={folder.label}
                                        onClick={() => { setActiveFolder(activeFolder === folder.label ? null : folder.label); setActiveTag(null); }}
                                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all ${activeFolder === folder.label ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span>{folder.emoji} {folder.label}</span>
                                        <span className="text-[8px] text-slate-400">{count}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {allTags.length > 0 && (
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tags</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {allTags.slice(0, 12).map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold text-left transition-all ${activeTag === tag ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <ChevronRight className="w-2.5 h-2.5 opacity-50" />
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Content Grid */}
                    <div className="flex-1 min-w-0">
                        {(activeFolder || activeTag) && (
                            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-500">
                                <span>Filtered by:</span>
                                {activeFolder && <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{activeFolder}</span>}
                                {activeTag && <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">#{activeTag}</span>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {filteredPosts.map((post: any) => (
                                <div key={post.id || post.post_id} className="relative">
                                    <PostCard post={post} onClick={() => setSelectedPost(post)} />
                                    {/* Google Drive link overlay */}
                                    {post.google_drive_link && (
                                        <div className="absolute top-2 right-2">
                                            <GDriveChip url={post.google_drive_link} />
                                        </div>
                                    )}
                                    {/* Historic posting record */}
                                    {post.status === 'Published' && post.scheduled_at && (
                                        <div className="mt-1 px-1">
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                Published {new Date(post.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {filteredPosts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Film className="w-7 h-7 text-slate-300" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900">No content found</h3>
                                <p className="text-xs text-slate-500 mt-1">Try a different filter or create a new post</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedPost && (
                <PostDrawer
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onEdit={() => { setSelectedPost(null); setIsBuilderOpen(true); }}
                />
            )}
            {isBuilderOpen && (
                <PostBuilder onClose={() => setIsBuilderOpen(false)} initialReel={selectedPost} />
            )}
        </div>
    );
};
