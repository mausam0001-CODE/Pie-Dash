import React, { useState, useEffect } from 'react';
import {
    Plus, Instagram, Youtube, Share2, ShieldCheck,
    Trash2, Loader2, Info, CheckCircle2, AlertCircle,
    Twitter, Linkedin, Globe, RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useNotification } from '../context/NotificationContext';

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
    const { notify } = useNotification();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncingId, setSyncingId] = useState<string | null>(null);
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
        const platformId = showNotesModal;
        // Always use VITE_FB_APP_ID - a single verified Meta App handles both IG and FB.
        // NEVER use VITE_INSTA_APP_ID - that old app ID is invalid/unconfigured.
        const appId = import.meta.env.VITE_FB_APP_ID || '1247702890719706';

        console.log('Final Meta App ID used:', appId);
        console.log('Platform:', platformId);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
        const redirectUriBase = projectRef
            ? `https://${projectRef}.supabase.co/functions/v1/ig-oauth`
            : "https://ivsytkzemjludwzhrdsu.supabase.co/functions/v1/ig-oauth";

        // Meta requires the redirect_uri to be an EXACT match. Do not add dynamic query params.
        const redirectUri = redirectUriBase;
        const state = `${session?.user?.id || 'team-user'}:${platformId}`;

        // Per official Meta docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/get-started/
        // Only instagram_basic + pages_show_list are required to start the connection.
        // Advanced permissions (publishing, insights) require App Review and are added separately.
        const scope = platformId === 'instagram'
            ? 'instagram_basic,pages_show_list,public_profile'
            : 'pages_show_list,pages_read_engagement,public_profile';

        window.location.href = `https://www.facebook.com/v25.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`;
    };

    const handleSync = async (id: string) => {
        setSyncingId(id);
        notify('Sync started...', 'info');
        try {
            const { data, error } = await supabase.functions.invoke('sync-account', {
                body: { accountId: id }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            notify('Sync completed! Your data is now up to date.', 'success');
        } catch (error: any) {
            console.error('Sync error:', error);
            notify(`Sync failed: ${error.message || 'Meta API error'}`, 'error');
        } finally {
            setSyncingId(null);
        }
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
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Social Account Manager</h2>
                <p className="text-slate-500 max-w-2xl text-sm leading-relaxed">
                    Connect and manage multiple accounts for each platform. Data for each account is kept strictly separate to prevent mixing content.
                </p>
            </div>

            {/* Platform List Card */}
            <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
                <div className="hidden md:grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <div className="col-span-4">Platform</div>
                    <div className="col-span-5">Connected Accounts</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {PLATFORMS.map((platform) => {
                        const connectedAccounts = accounts.filter(a => a.platform.toLowerCase() === platform.id);

                        return (
                            <div key={platform.id} className="flex flex-col md:grid md:grid-cols-12 px-4 md:px-8 py-6 items-start hover:bg-slate-50/50 transition-colors gap-6 md:gap-0">
                                <div className="md:col-span-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                                        {platform.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{platform.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                            {connectedAccounts.length} Account{connectedAccounts.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="md:col-span-5 space-y-3 w-full">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase md:hidden mb-1">Connected Accounts</p>
                                    {connectedAccounts.length > 0 ? (
                                        connectedAccounts.map(acc => (
                                            <div key={acc.id} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-xl shadow-sm group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center text-[10px] font-bold">
                                                        {acc.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{acc.username}</span>
                                                </div>
                                                <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-all">
                                                    <button
                                                        onClick={() => handleSync(acc.id)}
                                                        disabled={syncingId === acc.id}
                                                        className={`p-1.5 rounded-lg transition-all ${syncingId === acc.id ? 'bg-slate-100 text-slate-400 animate-spin' : 'text-slate-300 hover:text-teal-600 hover:bg-teal-50'}`}
                                                        title="Sync data from Meta"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(acc.id)}
                                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Disconnect account"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-xs font-medium text-slate-300 italic">No accounts linked</span>
                                    )}
                                </div>
                                <div className="md:col-span-3 md:text-right w-full md:w-auto">
                                    <button
                                        onClick={() => handleConnectClick(platform.id)}
                                        className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                    >
                                        <Plus className="w-3 h-3" /> Connect{connectedAccounts.length > 0 ? ' Another' : ''}
                                    </button>
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
                                    <div className={`w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 ${showNotesModal === 'instagram' ? 'shadow-pink-500/10' : 'shadow-blue-500/10'}`}>
                                        {PLATFORMS.find(p => p.id === showNotesModal)?.icon}
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xl font-bold text-slate-900">{PLATFORMS.find(p => p.id === showNotesModal)?.name} <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full ml-1 vertical-middle uppercase tracking-tighter">Beta</span></h4>
                                        <p className="text-sm text-slate-400 mt-1 max-w-xs">{showNotesModal === 'instagram' ? 'Connect your Instagram account to ideate, plan, and automatically publish content.' : 'Connect your Facebook Page to manage posts and engagement.'}</p>
                                    </div>
                                </div>

                                <div className="bg-white/60 p-4 rounded-xl border border-amber-100 flex gap-3 items-start">
                                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[13px] text-amber-800 font-medium">You must have an <strong>Instagram Professional account</strong> to post directly.</p>
                                </div>

                                <div className="text-[10px] text-slate-400 font-mono text-center mb-[-16px]">
                                    DEBUG ID: {import.meta.env.VITE_FB_APP_ID || '1247702890719706'}
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
