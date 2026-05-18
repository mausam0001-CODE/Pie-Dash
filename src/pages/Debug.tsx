import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const Debug = () => {
    const { session } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);

    const forceSync = async (accountId: string) => {
        setSyncing(accountId);
        try {
            const { data: account } = await supabase.from('social_accounts').select('*').eq('id', accountId).single();
            if (!account) throw new Error('Account not found');

            console.log('Initiating Direct Sync for:', account.username);

            // ── STEP 1: Get profile info using graph.instagram.com/me ──
            // This is the CORRECT endpoint for Instagram Login tokens (not Facebook Page tokens)
            const meUrl = `https://graph.instagram.com/v25.0/me?fields=id,username,followers_count,media_count,profile_picture_url&access_token=${account.access_token}`;
            console.log('Fetching profile via /me endpoint...');
            const meResp = await fetch(meUrl);
            const meData = await meResp.json();
            console.log('Profile Response:', JSON.stringify(meData));

            // Save follower count to metrics table
            if (meData.followers_count !== undefined) {
                const { error: metricErr } = await supabase.from('account_metrics').upsert({
                    social_account_id: account.id,
                    user_id: session?.user?.id,
                    follower_count: meData.followers_count,
                    month: new Date().toISOString().substring(0, 7) + '-01'
                });
                if (metricErr) console.warn('Metric upsert error:', metricErr);
                else console.log('Follower count saved:', meData.followers_count);
            }

            // ── STEP 2: Fetch media via graph.instagram.com/me/media ──
            const mediaUrl = `https://graph.instagram.com/v25.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=25&access_token=${account.access_token}`;
            console.log('Fetching media...');
            const mediaResp = await fetch(mediaUrl);
            const mediaData = await mediaResp.json();
            console.log('Media Response (first item):', JSON.stringify(mediaData?.data?.[0]));

            const posts = mediaData.data || [];

            if (posts.length > 0) {
                // ── STEP 3: Enrich each video post with play count insights ──
                const enriched = await Promise.all(posts.map(async (m: any) => {
                    let playCount = 0;
                    if (m.media_type === 'VIDEO' || m.media_type === 'REEL') {
                        try {
                            const insightUrl = `https://graph.instagram.com/v25.0/${m.id}/insights?metric=plays&access_token=${account.access_token}`;
                            const insightResp = await fetch(insightUrl);
                            const insightData = await insightResp.json();
                            playCount = insightData?.data?.[0]?.values?.[0]?.value || insightData?.data?.[0]?.value || 0;
                        } catch {
                            // insights may not be available for all account types
                        }
                    }
                    return {
                        social_account_id: account.id,
                        user_id: session?.user?.id,
                        external_id: m.id,
                        title: m.caption?.substring(0, 50) || 'Untitled Post',
                        caption: m.caption || '',
                        media_url: m.media_url || m.thumbnail_url,
                        thumbnail_url: m.thumbnail_url || m.media_url,
                        permalink: m.permalink,
                        platforms: ['instagram'],
                        status: 'Published',
                        like_count: m.like_count || 0,
                        comments_count: m.comments_count || 0,
                        view_count: playCount,
                        scheduled_at: m.timestamp,
                        created_at: m.timestamp
                    };
                }));

                const { error: insertErr } = await supabase
                    .from('posts')
                    .upsert(enriched, { onConflict: 'social_account_id,external_id' });
                if (insertErr) throw insertErr;

                const msg = [
                    `✅ SYNC SUCCESS!`,
                    `Followers: ${meData.followers_count ?? 'N/A'}`,
                    `Posts saved: ${enriched.length}`,
                    meData.error ? `⚠️ Profile Error: ${JSON.stringify(meData.error)}` : ''
                ].filter(Boolean).join('\n');
                alert(msg);
                window.location.reload();
            } else {
                alert(`No media found.\nProfile: ${JSON.stringify(meData)}\nMedia Error: ${JSON.stringify(mediaData)}`);
            }
        } catch (err: any) {
            console.error('Direct Sync failed:', err);
            alert('Direct Sync failed: ' + err.message);
        } finally {
            setSyncing(null);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            if (!session?.user?.id) return;

            const results: any = {
                userId: session.user.id,
                email: session.user.email,
            };

            // Check accounts
            const { data: accounts } = await supabase.from('social_accounts').select('*');
            results.accounts = accounts;

            // Check posts
            const { data: posts } = await supabase.from('posts').select('id, user_id, social_account_id, title, view_count, like_count').limit(5);
            results.postsSample = posts;

            const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
            results.totalPostsVisible = postsCount;

            // Check metrics
            const { count: metricsCount } = await supabase.from('account_metrics').select('*', { count: 'exact', head: true });
            results.totalMetricsVisible = metricsCount;

            setStats(results);
            setLoading(false);
        };

        fetchStats();
    }, [session]);

    if (loading) return <div className="p-10">Loading debug data...</div>;

    return (
        <div className="p-10 space-y-8 max-w-4xl mx-auto bg-white rounded-3xl mt-10 shadow-xl border border-slate-100">
            <h1 className="text-2xl font-black text-slate-900 border-b pb-4">System Diagnostic</h1>

            <section className="space-y-2">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Authentication</h2>
                <div className="bg-slate-50 p-4 rounded-2xl font-mono text-xs break-all">
                    <p><strong>Current User ID:</strong> {stats.userId}</p>
                    <p><strong>Email:</strong> {stats.email}</p>
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Connected Accounts</h2>
                <div className="space-y-2">
                    {stats.accounts?.map((acc: any) => (
                        <div key={acc.id} className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-xs">
                            <p><strong>ID:</strong> {acc.id}</p>
                            <p><strong>Username:</strong> {acc.username} (@{acc.platform})</p>
                            <p><strong>User ID in DB:</strong> {acc.user_id}</p>
                            <p className={acc.user_id === stats.userId ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                                {acc.user_id === stats.userId ? "✓ User ID Matches" : "✗ User ID Mismatch!"}
                            </p>
                            <button
                                onClick={() => forceSync(acc.id)}
                                disabled={!!syncing}
                                className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-[10px] hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {syncing === acc.id ? 'Syncing...' : 'Direct Sync (Frontend)'}
                            </button>
                        </div>
                    ))}
                    {stats.accounts?.length === 0 && <p className="text-slate-400 text-sm italic">No accounts visible to this user.</p>}
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Database Content</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-2xl font-bold">{stats.totalPostsVisible}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Posts Visible</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-2xl font-bold">{stats.totalMetricsVisible}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Metrics Visible</p>
                    </div>
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Post Samples (with engagement)</h2>
                <div className="bg-slate-50 p-4 rounded-2xl font-mono text-[10px] overflow-auto max-h-40">
                    <pre>{JSON.stringify(stats.postsSample, null, 2)}</pre>
                </div>
            </section>

            <div className="pt-4 text-center">
                <p className="text-[10px] text-slate-300 font-medium">This page is for diagnostic purposes only.</p>
            </div>
        </div>
    );
};
