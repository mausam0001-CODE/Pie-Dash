import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon, Bell, Shield, Smartphone, Globe, Save, Loader2,
    User, UserCircle, LogOut, Clock, Link2, CreditCard, Share2,
    Download, Trash2, Plus, Info, RefreshCw, Layers, Key, CheckCircle2,
    Calendar as CalendarIcon, Instagram, Youtube, Facebook, Twitter, Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../features/auth/UserContext';
import { useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../context/NotificationContext';

export const Settings = () => {
    const { session, isLoading: authLoading } = useAuth();
    const { refreshProfile } = useUser();
    const { notify } = useNotification();
    const queryClient = useQueryClient();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Social Accounts State
    const [accounts, setAccounts] = useState<any[]>([]);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [showNotesModal, setShowNotesModal] = useState<string | null>(null);
    const [exportAccount, setExportAccount] = useState<string>('all');

    const [settings, setSettings] = useState<any>({
        first_name: '',
        last_name: '',
        company_name: '',
        company_type: 'Freelancer',
        timezone: 'UTC',
        time_format: '12h',
        first_day_of_week: 'Sunday',
        dashboard_title: 'Pie Social Pro',
        primary_color: 'emerald',
        organization_website: 'https://pie.social',
        auto_posting: true,
        user_profile: {
            full_name: 'Pie Team',
            role: 'Pro Manager',
            avatar_url: ''
        }
    });

    const fetchAccounts = async () => {
        if (!session?.user?.id) return;
        const { data } = await supabase
            .from('social_accounts')
            .select('*')
            .order('created_at', { ascending: false });
        setAccounts(data || []);
        queryClient.invalidateQueries({ queryKey: ['social_accounts'] });
    };

    useEffect(() => {
        const fetchSettings = async () => {
            if (!session?.user) return;
            setLoading(true);
            const { data } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (data?.settings) setSettings((prev: any) => ({ ...prev, ...data.settings }));
            setLoading(false);
        };
        fetchSettings();
        fetchAccounts();
    }, [session]);

    const handleSave = async () => {
        if (!session?.user) return;
        setSaving(true);
        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: session.user.id,
                settings,
                updated_at: new Date().toISOString()
            });

        if (error) {
            alert('Error saving settings: ' + error.message);
        } else {
            notify('Settings saved successfully', 'success');
            refreshProfile();
        }
        setSaving(false);
    };

    // Social Account Handlers
    const confirmConnect = async (loginMethod: 'ig' | 'fb' = 'fb') => {
        const platformId = showNotesModal;
        const fbAppId = import.meta.env.VITE_FB_APP_ID || '1247702890719706';
        const igAppId = '997891079244802';
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
        const redirectUri = projectRef
            ? `https://${projectRef}.supabase.co/functions/v1/ig-oauth`
            : "https://ivsytkzemjludwzhrdsu.supabase.co/functions/v1/ig-oauth";

        const state = `${session?.user?.id || 'team-user'}:${platformId}:${loginMethod}`;
        let oauthUrl = '';

        if (platformId === 'instagram' && loginMethod === 'ig') {
            const scope = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments';
            oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${igAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;
        } else {
            const scope = platformId === 'instagram'
                ? 'instagram_basic,pages_show_list,public_profile'
                : 'pages_show_list,pages_read_engagement,public_profile';
            oauthUrl = `https://www.facebook.com/v25.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`;
        }

        const width = 600, height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const popup = window.open(oauthUrl, 'MetaOAuth', `width=${width},height=${height},left=${left},top=${top}`);

        setShowNotesModal(null);
        const timer = setInterval(() => {
            if (popup?.closed) {
                clearInterval(timer);
                fetchAccounts();
            }
        }, 800);
    };

    const handleSync = async (id: string) => {
        setSyncingId(id);
        notify('Sync started...', 'info');
        try {
            const { error } = await supabase.functions.invoke('sync-account', { body: { accountId: id } });
            if (error) throw error;
            notify('Sync completed!', 'success');
        } catch (error: any) {
            notify(`Sync failed: ${error.message}`, 'error');
        } finally {
            setSyncingId(null);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;
        const { error } = await supabase.from('social_accounts').delete().eq('id', id);
        if (!error) {
            setAccounts(prev => prev.filter(a => a.id !== id));
            queryClient.invalidateQueries({ queryKey: ['social_accounts'] });
            notify('Account disconnected', 'success');
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        let query = supabase.from('posts').select('*');
        if (exportAccount !== 'all') {
            // Wait, we need to filter posts where the 'platforms' array contains the platform,
            // but in this schema, is platform an array or string? We'll fetch all and filter client side to be safe.
        }

        const { data: allPosts } = await query;
        if (!allPosts) return;

        const posts = exportAccount === 'all'
            ? allPosts
            : allPosts.filter((p: any) => p.platforms?.includes(exportAccount));

        const content = format === 'csv'
            ? 'Title,Platform,Status,Reach,Likes,Date\n' + posts.map((p: any) => `"${p.title}","${p.platforms}","${p.status}",${p.view_count || 0},${p.like_count || 0},"${p.scheduled_at}"`).join('\n')
            : JSON.stringify(posts, null, 2);

        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `social-data-export.${format}`;
        a.click();
        notify(`Data exported as ${format.toUpperCase()}`, 'success');
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'accounts', label: 'Social Accounts', icon: Link2 },
        { id: 'users', label: 'Users', icon: UserCircle },
        { id: 'groups', label: 'Calendar Groups', icon: Layers },
        { id: 'branding', label: 'Custom Branding', icon: Smartphone },
        { id: 'export', label: 'Export', icon: Download },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    if (loading) return <div className="p-8 md:p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs animate-pulse">Retrieving Preferences...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="text-center py-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h2>
            </div>

            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-8 min-w-max">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <span className="flex items-center gap-2">
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </span>
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 animate-in fade-in duration-300" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                <div className="p-6 md:p-12">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <section className="space-y-8">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest pb-4 border-b border-slate-50">Profile Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">First Name</label>
                                        <input
                                            type="text"
                                            value={settings.first_name}
                                            onChange={(e) => setSettings({ ...settings, first_name: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 rounded-xl px-5 py-4 text-sm font-bold text-slate-700 transition-all outline-none"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={settings.last_name}
                                            onChange={(e) => setSettings({ ...settings, last_name: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 rounded-xl px-5 py-4 text-sm font-bold text-slate-700 transition-all outline-none"
                                            placeholder="Doe"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Company Name</label>
                                        <input
                                            type="text"
                                            value={settings.company_name}
                                            onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 rounded-xl px-5 py-4 text-sm font-bold text-slate-700 transition-all outline-none"
                                            placeholder="Your Brand"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Company Type</label>
                                        <select
                                            value={settings.company_type}
                                            onChange={(e) => setSettings({ ...settings, company_type: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 rounded-xl px-5 py-4 text-sm font-bold text-slate-700 transition-all outline-none cursor-pointer"
                                        >
                                            <option>Freelancer</option>
                                            <option>Agency</option>
                                            <option>E-commerce</option>
                                            <option>Brand</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 italic text-slate-400 text-sm font-medium">
                                        <Mail className="w-4 h-4" /> {session?.user?.email}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium pl-1 mt-1">To change your email address, please contact support or disable single sign-on.</p>
                                </div>
                            </section>

                            <section className="space-y-8 pt-8 border-t border-slate-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">Account Time Zone <Info className="w-3 h-3 text-slate-300" /></label>
                                        <select
                                            value={settings.timezone || 'UTC'}
                                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                            className="w-full bg-slate-50/50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 rounded-xl px-5 py-4 text-sm font-bold text-slate-700 transition-all outline-none cursor-pointer"
                                        >
                                            <option value="UTC">UTC (Universal Time)</option>
                                            <option value="Asia/Kolkata">IST (India Standard Time)</option>
                                            <option value="America/New_York">EST (Eastern Standard Time)</option>
                                            <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                                        </select>
                                        <p className="text-[9px] text-rose-400 font-bold uppercase tracking-tighter">Separate from your calendar time zone</p>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Time Format</label>
                                        <div className="flex flex-col gap-3">
                                            {['12-Hour Format', '24-Hour Format'].map(f => (
                                                <label key={f} className="flex items-center gap-3 cursor-pointer group">
                                                    <div onClick={() => setSettings({ ...settings, time_format: f.includes('12') ? '12h' : '24h' })} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${settings.time_format === (f.includes('12') ? '12h' : '24h') ? 'border-emerald-500' : 'border-slate-200 group-hover:border-slate-300'}`}>
                                                        {settings.time_format === (f.includes('12') ? '12h' : '24h') && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-in zoom-in-50" />}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600">{f}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="pt-12 flex justify-start">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Profile Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Accounts Tab */}
                    {activeTab === 'accounts' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Linked Destinations</h3>
                                <button onClick={() => setShowNotesModal('instagram')} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/10 transition-all">
                                    <Plus className="w-4 h-4" /> Add Destination
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {accounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                                {acc.platform === 'instagram' && <Instagram className="w-6 h-6 text-pink-500" />}
                                                {acc.platform === 'youtube' && <Youtube className="w-6 h-6 text-red-600" />}
                                                {acc.platform === 'facebook' && <Facebook className="w-6 h-6 text-blue-600" />}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm">{acc.username}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-full">{acc.platform}</span>
                                                    <span className="flex items-center gap-1 text-[10px] text-teal-600 font-bold"><CheckCircle2 className="w-3 h-3" /> Connected</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleSync(acc.id)} className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                                                <RefreshCw className={`w-4 h-4 ${syncingId === acc.id ? 'animate-spin' : ''}`} />
                                            </button>
                                            <button onClick={() => handleDeleteAccount(acc.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {accounts.length === 0 && (
                                    <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem] space-y-4">
                                        <Link2 className="w-12 h-12 text-slate-200 mx-auto" />
                                        <p className="text-slate-400 font-bold text-sm">No social destinations linked yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Export Tab */}
                    {activeTab === 'export' && (
                        <div className="max-w-2xl mx-auto space-y-12 py-12 animate-in zoom-in-95 duration-500 text-center">
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto shadow-inner">
                                    <Download className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Data Portability</h3>
                                <p className="text-sm text-slate-500 font-medium">Download your strategic analytics and content history into open formats for advanced reporting.</p>

                                <div className="max-w-xs mx-auto space-y-2 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Filter by Account</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all cursor-pointer"
                                        id="export-account-filter"
                                        value={exportAccount}
                                        onChange={(e) => setExportAccount(e.target.value)}
                                    >
                                        <option value="all">All Accounts</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.platform}>{acc.username} ({acc.platform})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleExport('csv')}
                                    className="p-8 bg-slate-50 border-2 border-transparent hover:border-emerald-500/20 hover:bg-white rounded-[2rem] transition-all group"
                                >
                                    <Layers className="w-10 h-10 text-slate-300 group-hover:text-emerald-500 mx-auto mb-4" />
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Excel / CSV</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Best for spreadsheet analysis</p>
                                </button>
                                <button
                                    onClick={() => handleExport('json')}
                                    className="p-8 bg-slate-50 border-2 border-transparent hover:border-indigo-500/20 hover:bg-white rounded-[2rem] transition-all group"
                                >
                                    <Smartphone className="w-10 h-10 text-slate-300 group-hover:text-indigo-500 mx-auto mb-4" />
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Developer JSON</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Best for data engineering</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Placeholders for other tabs */}
                    {['security', 'notifications', 'users', 'groups', 'branding', 'billing'].includes(activeTab) && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 opacity-40">
                            <Layers className="w-16 h-16 text-slate-200" />
                            <div>
                                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">{activeTab} section</h3>
                                <p className="text-xs font-bold text-slate-300 mt-1 italic uppercase tracking-tighter">Enterprise core module coming soon</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* OAuth Connection Manager */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                                <div className="flex flex-col items-center gap-4 py-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100">
                                        <Instagram className="w-8 h-8 text-pink-500" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xl font-bold text-slate-900">Connect Instagram</h4>
                                        <p className="text-sm text-slate-400 mt-1 max-w-xs">Link your professional account to enable auto-posting and real-time analytics.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={() => confirmConnect('ig')} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-pink-500/20">
                                        <Instagram className="w-4 h-4" /> Direct Connect Business Account
                                    </button>
                                    <button onClick={() => confirmConnect('fb')} className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                                        <Facebook className="w-4 h-4 text-blue-600" /> Connect via Facebook Page
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => setShowNotesModal(null)} className="w-full py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-colors">Close Portal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
