import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Check, X, Instagram, Globe } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const FloatingPublishStatus = () => {
    const { session } = useAuth();
    const { notify } = useNotification();
    const [activePosts, setActivePosts] = useState<any[]>([]);
    const pollingRefs = useRef<Set<string>>(new Set());

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

    // ── NEW: Polling loop for active posts ───────────────────────────
    useEffect(() => {
        activePosts.forEach(async (post) => {
            // Only start polling if it's Processing and we haven't started yet
            if (post.status === 'Processing' && post.container_id && !pollingRefs.current.has(post.id)) {
                pollingRefs.current.add(post.id);
                console.log(`[Global Polling] Starting poll for post: ${post.title} (${post.id})`);

                let finished = false;
                let attempts = 0;
                const maxAttempts = 60; // 10 minutes (10s intervals)

                while (!finished && attempts < maxAttempts) {
                    attempts++;
                    await new Promise(r => setTimeout(r, 10000));

                    try {
                        // 1. Check status
                        const platform = post.platforms?.[0];
                        const functionName = platform === 'tiktok' ? 'tk-publish' : 'ig-publish';
                        const payload = platform === 'tiktok'
                            ? { action: 'check', publishId: post.container_id, postId: post.id }
                            : { action: 'check', containerId: post.container_id, postId: post.id };

                        const { data: checkData, error: checkError } = await supabase.functions.invoke(functionName, {
                            body: payload
                        });

                        if (checkError) throw checkError;

                        // TikTok returns 'SUCCESS', Instagram returns 'FINISHED'
                        const isFinished = checkData.status_code === 'FINISHED' || checkData.status_code === 'SUCCESS';

                        if (isFinished) {
                            finished = true;
                            console.log(`[Global Polling] Post ${post.id} ready!`);

                            // 2. Trigger final publish for IG (TikTok finishes automatically or via status check)
                            if (platform !== 'tiktok') {
                                console.log(`[Global Polling] Triggering publish for IG...`);
                                const { error: publishError } = await supabase.functions.invoke('ig-publish', {
                                    body: { action: 'publish', containerId: post.container_id, postId: post.id }
                                });
                                if (publishError) throw publishError;
                            }
                        } else if (checkData.status_code === 'ERROR' || checkData.status_code === 'FAILED') {
                            finished = true;
                            console.error(`[Global Polling] Error for post ${post.id}`);
                        }
                    } catch (err: any) {
                        console.error(`[Global Polling] Error:`, err);
                        finished = true;
                    }
                }

                // Cleanup ref after loop ends (either success or failure)
                // Note: The real-time listener will eventually remove the post from activePosts 
                // when the status in DB changes to Published or Failed.
                pollingRefs.current.delete(post.id);
            }
        });
    }, [activePosts]);

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
