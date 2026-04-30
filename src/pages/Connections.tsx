import React, { useState, useEffect } from 'react';
import {
    Plus, Instagram, Youtube, Share2, ShieldCheck,
    Trash2, Loader2, Info, CheckCircle2, AlertCircle,
    Twitter, Linkedin, Globe
} from 'lucide-react';
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
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNotesModal, setShowNotesModal] = useState<string | null>(null);

    const fetchAccounts = async () => {
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
        fetchAccounts();

        // Handle clean redirect from OAuth
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'connected') {
            fetchAccounts();
            // Clean the URL without reloading
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleConnectClick = (platformId: string) => {
        if (platformId === 'instagram' || platformId === 'facebook') {
            setShowNotesModal(platformId);
        } else {
            // Placeholder for other platforms
            alert(`${platformId} connection coming soon!`);
        }
    };

    const confirmConnect = () => {
        // In a real app, this redirects to our backend OAuth route
        window.location.href = `http://localhost:3000/api/auth/facebook`;
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
                                    {connected.length > 0 ? (
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
                            <h3 className="text-2xl font-bold text-slate-900 leading-tight">Important Notes:</h3>

                            <ul className="space-y-4">
                                <li className="flex gap-4">
                                    <div className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0" />
                                    <p className="text-slate-600 text-[15px] leading-relaxed">
                                        Instagram Direct Publishing requires an <strong>Instagram Business or Creator Account</strong>.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0" />
                                    <p className="text-slate-600 text-[15px] leading-relaxed">
                                        Your Instagram Account needs to be <strong>connected to a Facebook Page</strong> and you need to be an administrator of that Facebook Page.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0" />
                                    <p className="text-slate-600 text-[15px] leading-relaxed">
                                        Once you click the Connect button below, you will be redirected to Facebook: make sure you accept all permissions requested by Facebook.
                                    </p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0" />
                                    <p className="text-slate-600 text-[15px] leading-relaxed">
                                        Once you have accepted all permissions, you will be redirected back to Pie Pro, where you will be able to select the Facebook Page associated with your Instagram.
                                    </p>
                                </li>
                            </ul>

                            <p className="text-slate-400 text-sm">
                                If you don't have a Facebook Page associated with your account, please click here instead.
                            </p>

                            <div className="pt-4 flex gap-4">
                                <button
                                    onClick={() => setShowNotesModal(null)}
                                    className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmConnect}
                                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
                                >
                                    Connect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
