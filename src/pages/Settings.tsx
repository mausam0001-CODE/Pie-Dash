import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Smartphone, Globe, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const Settings = () => {
    const { session, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        dashboard_title: 'Pie Social Pro',
        primary_color: 'teal',
        organization_website: 'https://pie.social',
        auto_posting: true
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

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Retrieving Preferences...</div>;

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Configuration</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Manage your team preferences and social API configurations.</p>
                </div>
                <div className="hidden sm:block">
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                        <Shield className="w-3 h-3" /> Secure Node
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden border-b-4 border-b-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3">
                    {/* Sidebar */}
                    <div className="p-6 bg-slate-50/50 border-r border-slate-100 space-y-2">
                        <button className="w-full flex items-center justify-between px-5 py-3.5 bg-white shadow-sm border border-slate-100 rounded-2xl text-xs font-black text-emerald-600 uppercase tracking-widest">
                            <span className="flex items-center gap-3"><Globe className="w-4 h-4" /> General</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        </button>
                        <button className="w-full flex items-center gap-3 px-5 py-3.5 text-slate-400 hover:bg-white/50 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
                            <Bell className="w-4 h-4" /> Notifications
                        </button>
                        <button className="w-full flex items-center gap-3 px-5 py-3.5 text-slate-400 hover:bg-white/50 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
                            <Smartphone className="w-4 h-4" /> Devices
                        </button>
                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <button className="w-full flex items-center gap-3 px-5 py-3.5 text-rose-500 hover:bg-rose-50 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
                                <Shield className="w-4 h-4" /> Danger Zone
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="md:col-span-2 p-10 space-y-10">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Dashboard Title</label>
                                    <input
                                        type="text"
                                        value={settings.dashboard_title}
                                        onChange={(e) => setSettings({ ...settings, dashboard_title: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-500/20 rounded-2xl px-5 py-4 text-sm outline-none font-bold text-slate-700 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Design Accent</label>
                                    <div className="flex items-center gap-4 pt-1">
                                        <button
                                            onClick={() => setSettings({ ...settings, primary_color: 'emerald' })}
                                            className={`w-10 h-10 rounded-full bg-emerald-500 cursor-pointer transition-all ${settings.primary_color === 'emerald' ? 'ring-4 ring-emerald-100 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                        ></button>
                                        <button
                                            onClick={() => setSettings({ ...settings, primary_color: 'purple' })}
                                            className={`w-10 h-10 rounded-full bg-purple-500 cursor-pointer transition-all ${settings.primary_color === 'purple' ? 'ring-4 ring-purple-100 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                        ></button>
                                        <button
                                            onClick={() => setSettings({ ...settings, primary_color: 'rose' })}
                                            className={`w-10 h-10 rounded-full bg-rose-500 cursor-pointer transition-all ${settings.primary_color === 'rose' ? 'ring-4 ring-rose-100 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                        ></button>
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
                                        className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-emerald-500/20 rounded-2xl pl-12 pr-5 py-4 text-sm outline-none font-bold text-slate-700 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div
                                className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${settings.auto_posting ? 'bg-emerald-50/30 border-emerald-500/10' : 'bg-slate-50 border-transparent opacity-60'}`}
                                onClick={() => setSettings({ ...settings, auto_posting: !settings.auto_posting })}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${settings.auto_posting ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400'}`}>
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Auto-Posting Engine</p>
                                        <p className="text-xs text-slate-500 font-medium">{settings.auto_posting ? 'Core background tasks are active' : 'All scheduled tasks are paused'}</p>
                                    </div>
                                </div>
                                <div className={`w-12 h-7 rounded-full relative transition-all ${settings.auto_posting ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${settings.auto_posting ? 'right-1' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                Commit Preferences
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-900 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
                <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-white shrink-0 border border-white/10 shadow-inner">
                    <Shield className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="text-lg font-black text-white tracking-tight uppercase">High-Security Cluster</h4>
                    <p className="text-sm text-indigo-200/80 mt-1 leading-relaxed font-medium">
                        Your OAuth access tokens are encrypted using AES-256-CBC before storage.
                        Multi-factor authentication is recommended for all administrator accounts.
                    </p>
                </div>
                <button className="sm:ml-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all whitespace-nowrap">
                    Audit Logs
                </button>
            </div>
        </div>
    );
};
