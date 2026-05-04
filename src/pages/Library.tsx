import React, { useState } from 'react';
import { usePosts } from '../features/posts/usePosts';
import { PostCard } from '../components/PostCard';
import { PostDrawer } from '../components/PostDrawer';
import { PostBuilder } from '../components/PostBuilder';
import { Film } from 'lucide-react';

export const Library = ({ filter = 'All' }: { filter?: string }) => {
    const { data: posts = [], isLoading } = usePosts(filter);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);

    if (isLoading) return <div className="p-8 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Vault...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">Content Vault</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage and organize your social media assets</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                    <Film className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900">{posts.length} Items</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post: any) => (
                    <PostCard
                        key={post.id || post.post_id}
                        post={post}
                        onClick={() => setSelectedPost(post)}
                    />
                ))}
            </div>

            {posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Film className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No content found</h3>
                    <p className="text-sm text-slate-500 font-medium">Try changing your filters or create a new post</p>
                </div>
            )}

            {selectedPost && (
                <PostDrawer
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onEdit={(post) => {
                        setSelectedPost(null);
                        setIsBuilderOpen(true);
                    }}
                />
            )}

            {isBuilderOpen && (
                <PostBuilder
                    onClose={() => setIsBuilderOpen(false)}
                    initialReel={selectedPost}
                />
            )}
        </div>
    );
};
