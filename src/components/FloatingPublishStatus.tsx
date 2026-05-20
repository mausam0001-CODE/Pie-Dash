import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Check, X, Instagram, Globe } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const FloatingPublishStatus = () => {
    const { session } = useAuth();
    const { notify } = useNotification();
    const [activePosts, setActivePosts] = useState<any[]>([]);

    useEffect(() => {
        if (!session?.user?.id) return;

        // 1. Initial fetch of processing posts
        const fetchProcessing = async () => {
            const { data } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('status', 'Processing');
            setActivePosts(data || []);
        };
        fetchProcessing();

        // 2. Real-time sub for state changes
        const channel = supabase
            .channel('global-publishing-status')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts',
                    filter: `user_id=eq.${session.user.id}`
                },
                (payload: any) => {
                    const post = payload.new;
                    const oldPost = payload.old;

                    if (post.status === 'Processing') {
                        setActivePosts(prev => {
                            if (prev.find(p => p.id === post.id)) {
                                return prev.map(p => p.id === post.id ? post : p);
                            }
                            return [...prev, post];
                        });
                    } else if (post.status === 'Published' || post.status === 'Failed') {
                        setActivePosts(prev => {
                            const existing = prev.find(p => p.id === post.id);
                            if (existing) {
                                // Trigger notification on completion
                                if (post.status === 'Published') {
                                    notify(`Successfully published "${post.title || 'Post'}"`, 'success');
                                } else {
                                    notify(`Failed to publish "${post.title || 'Post'}": ${post.error_message || 'Unknown Error'}`, 'error');
                                }
                                return prev.filter(p => p.id !== post.id);
                            }
                            return prev;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id, notify]);

    if (activePosts.length === 0) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
            {activePosts.map(post => (
                <div
                    key={post.id}
                    className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 animate-in slide-in-from-right-8 duration-500 w-80"
                >
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                        {post.platforms?.[0] === 'instagram' ? <Instagram className="w-5 h-5 text-pink-500" /> : <Globe className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate tracking-tight">{post.title || 'Untitled'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Publishing...</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
