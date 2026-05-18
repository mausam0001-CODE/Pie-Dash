import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Smartphone, Globe, Save, Loader2, User, UserCircle, LogOut, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../features/auth/UserContext';

export const Settings = () => {
    const { session, isLoading: authLoading } = useAuth();
    const { refreshProfile } = useUser();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<any>({
        dashboard_title: 'Pie Social Pro',
        primary_color: 'teal',
        organization_website: 'https://pie.social',
        auto_posting: true,
        timezone: 'UTC',
        user_profile: {
            full_name: 'Pie Team',
            role: 'Pro Manager',
            avatar_url: ''
        }
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!session?.user) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (data) setSettings(data.settings);
            setLoading(false);
        };
        fetchSettings();
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

        if (error) alert('Error saving settings: ' + error.message);
        setSaving(false);
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Error logging out: ' + error.message);
        } else {
            window.location.href = '/login';
        }
    };

    if (loading) return <div className="p-8 md:p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs animate-pulse">Retrieving Preferences...</div>;

    return (
        <div className="max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">System Configuration</h2>
                    <p className="text-slate-500 text-[10px] md:text-sm mt-1 font-medium italic">Manage your team preferences and social API configurations.</p>
                </div>
                <div className="hidden sm:block">
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                        <Shield className="w-3 h-3" /> Secure Node
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm overflow-hidden border-b-4 border-b-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3">
                    {/* Sidebar / Tabs */}
                    <div className="p-4 md:p-6 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible scrollbar-hide">
                        {[
                            { id: 'general', icon: Globe, label: 'General' },
                            { id: 'profile', icon: User, label: 'Profile' },
                            { id: 'notifications', icon: Bell, label: 'Alerts' },
                            { id: 'devices', icon: Smartphone, label: 'Devices' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`shrink-0 md:w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white shadow-sm border border-slate-100 text-emerald-600' : 'text-slate-400 hover:bg-white/50'}`}
                            >
                                <span className="flex items-center gap-2 md:gap-3"><tab.icon className="w-4 h-4" /> {tab.label}</span>
                                {activeTab === tab.id && <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                            </button>
                        ))}
                        <div className="hidden md:block pt-4 mt-4 border-t border-slate-100">
                            <button
                                onClick={() => setActiveTab('danger')}
                                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'danger' ? 'bg-rose-50 text-rose-600' : 'text-rose-400 hover:bg-rose-50/50'}`}
                            >
                                <span className="flex items-center gap-3"><Shield className="w-4 h-4" /> Danger Zone</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full mt-2 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="md:col-span-2 p-6 md:p-10 space-y-8 md:space-y-10">
                        {activeTab === 'general' && (
                            <div className="space-y-6 md:space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Dashboard Title</label>
                                        <input
                                            type="text"
                                            value={settings.dashboard_title}
                                            onChange={(e) => setSettings({ ...settings, dashboard_title: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-500/20 rounded-2xl px-5 py-3 md:py-4 text-sm outline-none font-bold text-slate-700 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Time Zone (Scheduling)</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <select
                                                value={settings.timezone || 'UTC'}
                                                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-500/20 rounded-2xl pl-12 pr-5 py-3 md:py-4 text-sm outline-none font-bold text-slate-700 transition-all shadow-inner appearance-none cursor-pointer"
                                            >
                                                <option value="UTC">UTC (Universal Time)</option>
                                                <option value="Asia/Kolkata">IST (India Standard Time)</option>
                                                <option value="America/New_York">EST (Eastern Standard Time)</option>
                                                <option value="America/Chicago">CST (Central Standard Time)</option>
                                                <option value="America/Denver">MST (Mountain Standard Time)</option>
                                                <option value="America/Los_Angeles">PST (Pacific Standard Time)</option>
                                                <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                                                <option value="Europe/Paris">CET (Central European Time)</option>
                                                <option value="Asia/Tokyo">JST (Japan Standard Time)</option>
                                                <option value="Australia/Sydney">AEST (Australian Eastern Time)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Design Accent</label>
                                        <div className="flex items-center gap-4 pt-1">
                                            {['emerald', 'purple', 'rose'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setSettings({ ...settings, primary_color: c })}
                                                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-${c}-500 cursor-pointer transition-all ${settings.primary_color === c ? 'ring-4 ring-' + c + '-100 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                                ></button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Organization URL</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={settings.organization_website}
                                            onChange={(e) => setSettings({ ...settings, organization_website: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-500/20 rounded-2xl pl-12 pr-5 py-3 md:py-4 text-sm outline-none font-bold text-slate-700 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center justify-between p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all cursor-pointer ${settings.auto_posting ? 'bg-emerald-50/30 border-emerald-500/10' : 'bg-slate-50 border-transparent opacity-60'}`}
                                    onClick={() => setSettings({ ...settings, auto_posting: !settings.auto_posting })}
                                >
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className={`p-3 rounded-xl md:rounded-2xl ${settings.auto_posting ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400'}`}>
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] md:text-sm font-black text-slate-900 uppercase tracking-tight">Auto-Posting Engine</p>
                                            <p className="text-[9px] md:text-xs text-slate-500 font-medium">{settings.auto_posting ? 'Core tasks active' : 'Tasks paused'}</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-6 md:w-12 md:h-7 rounded-full relative transition-all ${settings.auto_posting ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-sm transition-all ${settings.auto_posting ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>

                                <div className="pt-6 md:pt-8 border-t border-slate-50 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                        Commit Settings
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-4 md:gap-6 p-6 md:p-8 bg-slate-50 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg shrink-0">
                                        {settings.user_profile?.avatar_url ? (
                                            <img src={settings.user_profile.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle className="w-10 h-10 md:w-12 md:h-12 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-lg md:text-xl font-black text-slate-900">{settings.user_profile?.full_name || 'Set Name'}</h4>
                                        <p className="text-xs md:text-sm text-slate-500 font-medium">{settings.user_profile?.role || 'Set Role'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={settings.user_profile?.full_name || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                user_profile: { ...settings.user_profile, full_name: e.target.value }
                                            })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-500/20 rounded-2xl px-5 py-3 md:py-4 text-sm outline-none font-bold text-slate-700 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Professional Role</label>
                                        <input
                                            type="text"
                                            value={settings.user_profile?.role || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                user_profile: { ...settings.user_profile, role: e.target.value }
                                            })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-500/20 rounded-2xl px-5 py-3 md:py-4 text-sm outline-none font-bold text-slate-700 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Avatar URL</label>
                                    <input
                                        type="text"
                                        value={settings.user_profile?.avatar_url || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            user_profile: { ...settings.user_profile, avatar_url: e.target.value }
                                        })}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-500/20 rounded-2xl px-5 py-3 md:py-4 text-sm outline-none font-bold text-slate-700 transition-all shadow-inner"
                                    />
                                </div>

                                <div className="pt-6 md:pt-8 border-t border-slate-50 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                        Commit Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'danger' && (
                            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="p-6 md:p-8 bg-rose-50 border border-rose-100 rounded-[1.5rem] md:rounded-[2rem]">
                                    <h4 className="font-black text-rose-900 uppercase text-xs tracking-widest">Delete Data</h4>
                                    <p className="text-xs md:text-sm text-rose-700/70 mt-2 font-medium">Permanently delete all posts, connections, and settings. This cannot be undone.</p>
                                    <button className="mt-6 w-full sm:w-auto px-6 py-3.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">Destroy Node</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-indigo-900 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 border border-white/10 shadow-inner">
                    <Shield className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="text-center md:text-left">
                    <h4 className="text-base md:text-lg font-black text-white tracking-tight uppercase">Security Cluster</h4>
                    <p className="text-[10px] md:text-sm text-indigo-200/80 mt-1 leading-relaxed font-medium">
                        Encryption: AES-256-CBC. OAuth tokens are secured by strict cluster policies.
                    </p>
                </div>
                <button className="md:ml-auto w-full md:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all whitespace-nowrap">
                    Logs
                </button>
            </div>
        </div >
    );
};
