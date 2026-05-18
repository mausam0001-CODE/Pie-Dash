import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const Debug = () => {
    const { session } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
            const { data: posts } = await supabase.from('posts').select('id, user_id, social_account_id, title').limit(5);
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
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Post Samples</h2>
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
