import React, { useState, useEffect } from 'react';
import {
    Plus, Instagram, Youtube, Share2, ShieldCheck,
    Trash2, Loader2, Info, CheckCircle2, AlertCircle,
    Twitter, Linkedin, Globe
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface Account {
    id: string;
    platform: string;
    username: string;
}

const PLATFORMS = [
    { id: 'facebook', name: 'Facebook for Posts', icon: <Globe className="w-5 h-5 text-blue-600" />, color: 'text-blue-600' },
    { id: 'twitter', name: 'Twitter (X)', icon: <Twitter className="w-5 h-5 text-slate-900" />, color: 'text-slate-900' },
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-5 h-5 text-pink-600" />, color: 'text-pink-600' },
    { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-5 h-5 text-red-600" />, color: 'text-red-600' },
    { id: 'tiktok', name: 'TikTok', icon: <Share2 className="w-5 h-5 text-slate-900" />, color: 'text-slate-900' },
];

export const Connections = () => {
    const { session, isLoading: authLoading } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState<string | null>(null);

    const fetchAccounts = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('social_accounts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAccounts(data || []);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user?.id) {
            fetchAccounts();

            // Handle clean redirect from OAuth
            const params = new URLSearchParams(window.location.search);
            if (params.get('status') === 'connected') {
                // Clean the URL without reloading
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, [session?.user?.id]);

    const handleConnectClick = (platformId: string) => {
        if (platformId === 'instagram' || platformId === 'facebook') {
            setShowNotesModal(platformId);
        } else {
            // Placeholder for other platforms
            alert(`${platformId} connection coming soon!`);
        }
    };

    const confirmConnect = async () => {
        const appId = import.meta.env.VITE_FB_APP_ID;
        const redirectUri = `https://ivsytkzemjludwzhrdsu.supabase.co/functions/v1/ig-oauth`;
        const state = session?.user?.id || 'team-user';

        window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list&state=${state}`;
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;
        try {
            const { error } = await supabase.from('social_accounts').delete().eq('id', id);
            if (error) throw error;
            setAccounts(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col items-center text-center space-y-2 py-8">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Publishing to your Social Accounts</h2>
                <p className="text-slate-500 max-w-2xl text-sm leading-relaxed">
                    Connect one account for each social media platform to this calendar. If you need to connect multiple accounts for the same network, you can create another calendar.
                </p>
            </div>

            {/* Platform List Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <div className="col-span-5">Social Accounts</div>
                    <div className="col-span-4">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {PLATFORMS.map((platform) => {
                        const connected = accounts.filter(a => a.platform.toLowerCase() === platform.id);

                        return (
                            <div key={platform.id} className="grid grid-cols-12 px-8 py-5 items-center hover:bg-slate-50/50 transition-colors">
                                <div className="col-span-5 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                        {platform.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">
                                            {platform.name}
                                            {connected.length > 0 && <span className="ml-2 text-xs font-medium text-slate-400 italic">({connected[0].username})</span>}
                                        </h4>
                                    </div>
                                </div>
                                <div className="col-span-4">
                                    {authLoading || loading ? (
                                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Accounts...</p>
                                        </div>
                                    ) : connected.length > 0 ? (
                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Connected</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-medium text-slate-300 italic">No account connected</span>
                                    )}
                                </div>
                                <div className="col-span-3 text-right">
                                    {connected.length > 0 ? (
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                                <Plus className="w-5 h-5 rotate-45" />
                                            </button>
                                            <button onClick={() => handleDelete(connected[0].id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleConnectClick(platform.id)}
                                            className="px-6 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            Connect
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Loomly Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-[40px] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                                <div className="flex flex-col items-center gap-4 py-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-xl shadow-pink-500/10 flex items-center justify-center border border-slate-100">
                                        <Instagram className="w-8 h-8 text-pink-600" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xl font-bold text-slate-900">Instagram <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full ml-1 vertical-middle uppercase tracking-tighter">Beta</span></h4>
                                        <p className="text-sm text-slate-400 mt-1 max-w-xs">Connect your Instagram account to ideate, plan, and automatically publish content.</p>
                                    </div>
                                </div>

                                <div className="bg-white/60 p-4 rounded-xl border border-amber-100 flex gap-3 items-start">
                                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[13px] text-amber-800 font-medium">You must have an <strong>Instagram Professional account</strong> to post directly.</p>
                                </div>

                                <button
                                    onClick={confirmConnect}
                                    className="w-full py-4 bg-slate-950 text-white rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/10"
                                >
                                    <Plus className="w-4 h-4" /> Connect
                                </button>

                                <div className="space-y-4 pt-4 border-t border-slate-200/50">
                                    {[
                                        { label: 'Connector Type', value: 'App' },
                                        { label: 'Author', value: 'Pie Pro' },
                                        { label: 'UUID', value: 'PIE-PRO-OAUTH-V1', copyable: true },
                                        { label: 'Privacy Policy', value: 'View Policy', link: '#' },
                                    ].map((item) => (
                                        <div key={item.label} className="flex justify-between items-center text-[13px]">
                                            <span className="text-slate-400 font-medium">{item.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-700 font-bold">{item.value}</span>
                                                {item.copyable && <Share2 className="w-3.5 h-3.5 text-slate-300" />}
                                                {item.link && <Globe className="w-3.5 h-3.5 text-slate-300" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowNotesModal(null)}
                                className="w-full text-xs font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-colors py-2"
                            >
                                Close Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
