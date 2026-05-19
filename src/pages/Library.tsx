import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '../features/posts/usePosts';
import { PostCard } from '../components/PostCard';
import { PostDrawer } from '../components/PostDrawer';
import { PostBuilder } from '../components/PostBuilder';
import { Film, Tag, Folder, X, ExternalLink, Search, ChevronRight, Plus, Loader2, Video, Image, LayoutGrid } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// ── Predefined smart folders (tags → groups) ──────────────────────────
const DEFAULT_SMART_FOLDERS: any[] = [];

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
    const [view, setView] = useState<'grid' | 'folders' | 'list'>('grid');
    const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'video' | 'image' | 'reel'>('all');

    const { session } = useAuth();
    const [folders, setFolders] = useState<any[]>(DEFAULT_SMART_FOLDERS);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newFolder, setNewFolder] = useState({ label: '', emoji: '📁', tags: '' });
    const [isSavingFolder, setIsSavingFolder] = useState(false);
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');

    React.useEffect(() => {
        if (!session?.user?.id) return;

        const loadSettings = async () => {
            const { data } = await supabase.from('user_settings').select('settings').eq('user_id', session.user.id).single();
            if (data?.settings?.folders) setFolders(data.settings.folders);
            if (Array.isArray(data?.settings?.customTags)) setCustomTags(data.settings.customTags);
        };

        loadSettings();

        // Real-time synchronization for user settings (folders/tags)
        const channel = supabase
            .channel('user_settings_sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_settings',
                    filter: `user_id=eq.${session.user.id}`
                },
                (payload: any) => {
                    const settings = payload.new?.settings;
                    if (settings) {
                        if (settings.folders) setFolders(settings.folders);
                        if (Array.isArray(settings.customTags)) setCustomTags(settings.customTags);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id]);

    const handleSaveTag = async () => {
        const tag = newTagInput.replace(/^#+/, '').trim().toLowerCase();
        if (!tag || customTags.includes(tag)) { setNewTagInput(''); setIsAddingTag(false); return; }
        const updated = [...customTags, tag];
        setCustomTags(updated);
        setNewTagInput('');
        setIsAddingTag(false);
        try {
            const { data: curr } = await supabase.from('user_settings').select('settings').eq('user_id', session?.user?.id).single();
            const s = curr?.settings || {};
            await supabase.from('user_settings').update({ settings: { ...s, customTags: updated } }).eq('user_id', session?.user?.id);
        } catch (e) { console.error('Failed to save tag', e); }
    };

    const handleSaveFolder = async () => {
        if (!newFolder.label || !newFolder.tags) return;
        setIsSavingFolder(true);
        const tagsObj = newFolder.tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        const newFolderObj = { label: newFolder.label, emoji: newFolder.emoji, tags: tagsObj };
        const updatedFolders = [...folders, newFolderObj];
        setFolders(updatedFolders);

        try {
            const { data: currentSettings } = await supabase.from('user_settings').select('settings').eq('user_id', session?.user?.id).single();
            const settingsObj = currentSettings?.settings || {};
            await supabase.from('user_settings').update({ settings: { ...settingsObj, folders: updatedFolders } }).eq('user_id', session?.user?.id);
            setNewFolder({ label: '', emoji: '📁', tags: '' });
            setIsFolderModalOpen(false);
        } catch (e) {
            console.error('Failed to save folder', e);
        } finally {
            setIsSavingFolder(false);
        }
    };

    React.useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null) {
            setSearchQuery(q);
        }
    }, [searchParams]);

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
            const folder = folders.find(f => f.label === activeFolder);
            if (folder) {
                result = result.filter((p: any) => {
                    const postTags = (Array.isArray(p.tags) ? p.tags : [p.category || '']).map((t: string) => t.toLowerCase());
                    return folder.tags.some((ft: string) => postTags.some((pt: string) => pt.includes(ft)));
                });
            }
        }

        if (activeTag) {
            result = result.filter((p: any) => {
                const postTags = (Array.isArray(p.tags) ? p.tags : [p.category || '']).map((t: string) => t.toLowerCase());
                return postTags.includes(activeTag);
            });
        }

        // Media type filter
        if (mediaTypeFilter !== 'all') {
            result = result.filter((p: any) => {
                const mt = (p.media_type || '').toLowerCase();
                const title = (p.title || '').toLowerCase();
                const caption = (p.caption || '').toLowerCase();
                if (mediaTypeFilter === 'video') return mt === 'video' || mt === 'mp4';
                if (mediaTypeFilter === 'image') return mt === 'image' || mt === 'photo' || mt === 'jpg' || mt === 'png';
                if (mediaTypeFilter === 'reel') return mt === 'reel' || title.includes('reel') || caption.includes('reel');
                return true;
            });
        }

        return result;
    }, [posts, activeTag, activeFolder, searchQuery, mediaTypeFilter]);

    const clearFilters = () => {
        setActiveTag(null);
        setActiveFolder(null);
        setSearchQuery('');
        setMediaTypeFilter('all');
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
                        <button onClick={() => setView('list')} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>List</button>
                        <button onClick={() => setView('folders')} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${view === 'folders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Folders</button>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <Film className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-900">{filteredPosts.length} Items</span>
                    </div>
                </div>
            </div>

            {/* Media Type Filter Pill Bar */}
            <div className="flex items-center gap-2 flex-wrap">
                {[
                    { id: 'all', label: 'All Content', icon: LayoutGrid },
                    { id: 'video', label: 'Videos', icon: Video },
                    { id: 'image', label: 'Images', icon: Image },
                    { id: 'reel', label: 'Reels', icon: Film },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setMediaTypeFilter(id as any)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${mediaTypeFilter === id
                                ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-600'
                            }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}

                <div className="ml-auto flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                    <Film className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-900">{filteredPosts.length} Items</span>
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
                {(activeTag || activeFolder || searchQuery || mediaTypeFilter !== 'all') && (
                    <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors shrink-0">
                        <X className="w-3 h-3" /> Clear Filters
                    </button>
                )}
            </div>

            {/* Folders View */}
            {view === 'folders' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <button
                            onClick={() => setIsFolderModalOpen(true)}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-200 transition-all text-center text-slate-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50"
                        >
                            <Plus className="w-8 h-8" />
                            <p className="text-[10px] font-black uppercase tracking-widest">New Folder</p>
                        </button>
                        {folders.map(folder => {
                            const count = posts.filter((p: any) => {
                                const postTags = (Array.isArray(p.tags) ? p.tags : [p.category || '']).map((t: string) => t.toLowerCase());
                                return folder.tags.some((ft: string) => postTags.some((pt: string) => pt.includes(ft)));
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
                    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm h-fit">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Folder className="w-4 h-4 text-slate-400" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Folders</p>
                            </div>
                            <div className="space-y-1">
                                {folders.map(folder => {
                                    const count = posts.filter((p: any) => {
                                        const postTags = (Array.isArray(p.tags) ? p.tags : [p.category || '']).map((t: string) => t.toLowerCase());
                                        return folder.tags.some((ft: string) => postTags.some((pt: string) => pt.includes(ft)));
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
                            <button onClick={() => setIsFolderModalOpen(true)} className="w-full flex items-center gap-2 px-2 py-2 mt-3 rounded-xl text-[10px] font-bold text-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition-colors uppercase tracking-widest justify-center">
                                <Plus className="w-3.5 h-3.5" /> Add Folder
                            </button>
                        </div>

                        <div className="pt-5 mt-5 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-slate-400" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tags</p>
                                </div>
                                <button onClick={() => setIsAddingTag(true)} className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {[...new Set([...customTags, ...allTags])].slice(0, 15).map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${activeTag === tag ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
                                    >
                                        <ChevronRight className="w-3 h-3 opacity-50" />
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                            {isAddingTag && (
                                <div className="flex items-center gap-1.5 mt-3">
                                    <span className="text-slate-400 text-sm font-bold">#</span>
                                    <input
                                        autoFocus
                                        value={newTagInput}
                                        onChange={e => setNewTagInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveTag(); if (e.key === 'Escape') { setIsAddingTag(false); setNewTagInput(''); } }}
                                        placeholder="new tag"
                                        className="flex-1 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-400"
                                    />
                                    <button onClick={handleSaveTag} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => { setIsAddingTag(false); setNewTagInput(''); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            {[...new Set([...customTags, ...allTags])].length === 0 && !isAddingTag && (
                                <p className="text-[10px] text-slate-400 italic text-center py-2">No tags yet. Click + to add one.</p>
                            )}
                        </div>
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

                        <div className={view === 'list' ? "flex flex-col gap-4" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"}>
                            {filteredPosts.map((post: any) => (
                                <div key={post.id || post.post_id} className="relative">
                                    <PostCard post={post} onClick={() => setSelectedPost(post)} mode={view === 'list' ? 'list' : 'grid'} />
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

            {isFolderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFolderModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-black text-slate-900">Create Vault Folder</h3>
                            <button onClick={() => setIsFolderModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Folder Name <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <input
                                        maxLength={2}
                                        value={newFolder.emoji}
                                        onChange={e => setNewFolder({ ...newFolder, emoji: e.target.value })}
                                        className="w-14 text-center text-xl bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                    <input
                                        placeholder="e.g. Sales Vids"
                                        value={newFolder.label}
                                        onChange={e => setNewFolder({ ...newFolder, label: e.target.value })}
                                        className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Tracked Tags <span className="text-red-500">*</span></label>
                                <input
                                    placeholder="e.g. sales, outreach, product..."
                                    value={newFolder.tags}
                                    onChange={e => setNewFolder({ ...newFolder, tags: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                />
                                <p className="text-[9px] font-bold text-slate-400 mt-1.5 flex items-center gap-1"><Tag className="w-3 h-3" /> Content with these tags will appear here.</p>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <button onClick={() => setIsFolderModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                            <button
                                onClick={handleSaveFolder}
                                disabled={!newFolder.label || !newFolder.tags || isSavingFolder}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSavingFolder && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Save Folder
                            </button>
                        </div>
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
