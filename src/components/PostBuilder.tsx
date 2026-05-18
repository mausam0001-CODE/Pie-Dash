import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Globe, FileText, Image as ImageIcon, Smartphone, Settings, CheckCircle, Instagram, Twitter, Facebook, Youtube, Plus, Save, Send, Eye, Sparkles, Calendar, Clock, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { usePostMutations } from '../features/posts/usePostMutations';
import { useAccountContext } from '../features/accounts/AccountContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PostBuilderProps {
    onClose: () => void;
    initialReel?: any;
}

const STEPS = [
    'Connect',
    'Basic Info',
    'Generic',
    'Fine-Tune',
    'Post Settings',
    'Review',
    'Schedule'
];

const PLATFORM_POST_TYPES: Record<string, string[]> = {
    instagram: ['REEL', 'POST', 'STORY'],
    facebook: ['REEL', 'POST'],
    tiktok: ['VIDEO'],
    youtube: ['SHORT', 'VIDEO'],
    twitter: ['POST'],
    linkedin: ['POST']
};

export const PostBuilder = ({ onClose, initialReel }: PostBuilderProps) => {
    const { session } = useAuth();
    const { createPost, updatePost } = usePostMutations();
    const { activeAccount } = useAccountContext();
    const [currentStep, setCurrentStep] = useState(1);
    const [isScheduling, setIsScheduling] = useState(false);
    const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [labels, setLabels] = useState(['Product', 'Education', 'Vlog', 'Tutorial']);
    const [postData, setPostData] = useState({
        title: initialReel?.title || '',
        caption: initialReel?.caption || '',
        mediaUrl: initialReel?.media_url || '',
        mediaType: initialReel?.media_type || 'IMAGE',
        thumbnailUrl: initialReel?.thumbnail_url || '',
        category: initialReel?.category || 'Post',
        hashtags: initialReel?.hashtags || '',
        visibility: 'Public (Recommended)',
        scheduledAt: initialReel?.scheduled_at ? new Date(initialReel.scheduled_at).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16),
        status: initialReel?.status || 'Draft'
    });
    const [accountSettings, setAccountSettings] = useState<Record<string, any>>({});
    const [userSettings, setUserSettings] = useState<any>(null);

    useEffect(() => {
        // Initialize default types when accounts are selected
        const newSettings = { ...accountSettings };
        selectedAccounts.forEach(id => {
            if (!newSettings[id]) {
                const account = connectedAccounts.find(a => a.id === id);
                const platform = account?.platform || 'instagram';
                newSettings[id] = {
                    type: PLATFORM_POST_TYPES[platform]?.[0] || 'POST',
                    shareToFeed: true,
                    addToGrid: false
                };
            }
        });
        setAccountSettings(newSettings);
    }, [selectedAccounts, connectedAccounts]);

    // Dynamic Reach Calculation: Based on selected accounts' follower counts
    const estimatedReach = connectedAccounts
        .filter(a => selectedAccounts.includes(a.id))
        .reduce((sum, a) => sum + (a.followers_count || 1000) * 0.85, 0);

    const formatReach = (num: number) => {
        if (num >= 1000000) return `~ ${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `~ ${(num / 1000).toFixed(1)}k`;
        return `~ ${Math.floor(num)}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) return;
            const { data, error } = await supabase
                .from('social_accounts')
                .select('*')
                .eq('user_id', session.user.id);

            if (!error && data) {
                setConnectedAccounts(data);

                if (initialReel?.social_account_id) {
                    setSelectedAccounts([initialReel.social_account_id]);
                } else if (activeAccount) {
                    setSelectedAccounts([activeAccount.id]);
                } else {
                    setSelectedAccounts(data.length > 0 ? [data[0].id] : []);
                }
            }

            // Fetch user settings
            const { data: settingsData } = await supabase
                .from('user_settings')
                .select('settings')
                .eq('user_id', session.user.id)
                .single();

            if (settingsData) {
                setUserSettings(settingsData.settings);
            }
        };
        fetchData();
    }, [session?.user, activeAccount, initialReel]);

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 7));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSchedule = async () => {
        if (!session?.user) return;
        if (selectedAccounts.length === 0) {
            alert('Please select at least one account.');
            return;
        }

        setIsScheduling(true);
        try {
            const basePayload = {
                user_id: session.user.id,
                title: postData.title,
                caption: postData.caption,
                media_url: postData.mediaUrl,
                media_type: postData.mediaType,
                thumbnail_url: postData.thumbnailUrl,
                scheduled_at: new Date(postData.scheduledAt).toISOString(),
                status: 'Scheduled',
                category: postData.category,
                hashtags: postData.hashtags,
                visibility: postData.visibility
            };

            if (initialReel?.id) {
                // If editing, we only update the specific record
                const account = connectedAccounts.find(a => a.id === selectedAccounts[0]);
                await updatePost.mutateAsync({
                    id: initialReel.id,
                    updates: {
                        ...basePayload,
                        social_account_id: account?.id,
                        platforms: account?.platform
                    }
                });
                alert('Post updated successfully!');
            } else {
                // If new, create one post entry per selected account for proper segregation
                const promises = selectedAccounts.map(accountId => {
                    const account = connectedAccounts.find(a => a.id === accountId);
                    const settings = accountSettings[accountId] || {};
                    return createPost.mutateAsync({
                        ...basePayload,
                        media_type: settings.type || basePayload.media_type,
                        social_account_id: accountId,
                        platforms: account?.platform
                    });
                });
                await Promise.all(promises);
                alert(`Successfully scheduled to ${selectedAccounts.length} account${selectedAccounts.length > 1 ? 's' : ''}!`);
            }

            onClose();
        } catch (error: any) {
            console.error('Error saving post:', error);
            alert('Error saving post: ' + error.message);
        } finally {
            setIsScheduling(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <StepAccounts accounts={connectedAccounts} selected={selectedAccounts} onToggle={(id) => setSelectedAccounts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} />;
            case 2: return <StepBasicInfo value={postData.title} onChange={(v) => setPostData(d => ({ ...d, title: v }))} labels={labels} selectedLabel={postData.category} onLabelSelect={(l) => setPostData(d => ({ ...d, category: l }))} onAddLabel={(l) => setLabels(prev => [...prev, l])} />;
            case 3: return <StepGenericContent caption={postData.caption} onCaptionChange={(v) => setPostData(d => ({ ...d, caption: v }))} mediaUrl={postData.mediaUrl} mediaType={postData.mediaType} onMediaUpload={(url, type) => setPostData(d => ({ ...d, mediaUrl: url, mediaType: type, thumbnailUrl: url }))} />;
            case 4: return <StepFineTune accounts={connectedAccounts.filter(a => selectedAccounts.includes(a.id))} postData={postData} settings={accountSettings} onSettingChange={(id, key, val) => setAccountSettings(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }))} />;
            case 5: return <StepSettings hashtags={postData.hashtags} onHashtagsChange={(v) => setPostData(d => ({ ...d, hashtags: v }))} visibility={postData.visibility} onVisibilityChange={(v) => setPostData(d => ({ ...d, visibility: v }))} />;
            case 6: return <StepReview data={postData} accounts={connectedAccounts.filter(a => selectedAccounts.includes(a.id))} reach={formatReach(estimatedReach)} />;
            case 7: return <StepSchedule value={postData.scheduledAt} timezone={userSettings?.timezone} onChange={(v) => setPostData(d => ({ ...d, scheduledAt: v }))} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={onClose}></div>

            <div className="bg-slate-50 w-full h-full max-w-[1200px] sm:max-h-[92vh] sm:rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.15)] relative flex flex-col overflow-hidden ring-1 ring-slate-200">
                {/* Header with Progress Bar */}
                <div className="p-4 sm:p-8 border-b border-slate-200/60 bg-white sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-4 sm:mb-8">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-500 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-200 shrink-0">
                                <Plus className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight truncate">Build New Post</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">Multi-Channel Distribution</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 sm:p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between relative px-1 sm:px-2">
                        {/* Progress Line Background */}
                        <div className="absolute top-[16px] sm:top-[18px] left-0 right-0 h-1 bg-slate-100 -z-10 rounded-full mx-6 sm:mx-12"></div>
                        {/* Progress Line Active */}
                        <div
                            className="absolute top-[16px] sm:top-[18px] left-0 h-1 bg-teal-500 -z-10 transition-all duration-500 ease-out rounded-full mx-6 sm:mx-12"
                            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        ></div>

                        {STEPS.map((step, i) => {
                            const stepNum = i + 1;
                            const isActive = currentStep === stepNum;
                            const isPast = currentStep > stepNum;

                            return (
                                <div key={step} className="flex flex-col items-center gap-2 sm:gap-3 relative">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-[10px] sm:text-sm font-black transition-all duration-300 ${isActive ? 'bg-teal-500 text-white shadow-xl shadow-teal-200 scale-110 ring-4 ring-teal-50' :
                                        isPast ? 'bg-teal-50 text-teal-600' :
                                            'bg-white text-slate-300 border-2 border-slate-100'
                                        }`}>
                                        {isPast ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : stepNum}
                                    </div>
                                    <span className={cn(
                                        "text-[8px] sm:text-[10px] font-bold uppercase tracking-tighter",
                                        isActive ? 'text-teal-600' : 'text-slate-400',
                                        !isActive && "hidden xs:inline-block" // Hide labels for inactive steps on mobile
                                    )}>{step}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-8 md:p-12">
                    {renderStep()}
                </div>

                {/* Footer Navigation */}
                <div className="p-4 sm:p-8 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between sticky bottom-0 z-20">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={cn(
                            "flex items-center gap-2 px-3 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all text-sm",
                            currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        )}
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Back to {STEPS[currentStep - 2]}</span>
                        <span className="sm:hidden">Back</span>
                    </button>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            disabled={isScheduling}
                            className="px-3 sm:px-8 py-3 sm:py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all text-xs sm:text-sm"
                        >
                            <span className="hidden sm:inline">Save as Draft</span>
                            <span className="sm:hidden">Draft</span>
                        </button>
                        <button
                            onClick={currentStep === 7 ? handleSchedule : nextStep}
                            disabled={isScheduling}
                            className={cn(
                                "flex items-center gap-2 px-5 sm:px-10 py-3 sm:py-4 bg-teal-500 text-white rounded-xl sm:rounded-[1.5rem] font-black hover:bg-teal-600 transition-all shadow-lg active:scale-95 text-xs sm:text-base shrink-0",
                                isScheduling ? 'opacity-50 cursor-not-allowed' : ''
                            )}
                        >
                            {isScheduling ? '...' : currentStep === 7 ? 'Schedule' : (
                                <>
                                    <span className="hidden sm:inline">Next: {STEPS[currentStep]}</span>
                                    <span className="sm:hidden">Next</span>
                                </>
                            )}
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepAccounts = ({ accounts, selected, onToggle }: { accounts: any[], selected: string[], onToggle: (id: string) => void }) => {
    const groupedAccounts = accounts.reduce((acc, current) => {
        if (!acc[current.platform]) acc[current.platform] = [];
        acc[current.platform].push(current);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h3 className="text-xl md:text-3xl font-black text-slate-900">Select Accounts</h3>
                <p className="text-sm text-slate-500 font-medium">Choose where you want to publish this content.</p>
            </div>

            {accounts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic">No social accounts connected yet. Please connect an account in the Connections tab.</div>
            ) : (
                <div className="max-w-5xl mx-auto space-y-10 pb-8">
                    {Object.entries(groupedAccounts).map(([platform, platformAccounts]: [string, any]) => (
                        <div key={platform} className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                    {platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                                    {platform === 'facebook' && <Facebook className="w-4 h-4 text-blue-600" />}
                                    {platform === 'tiktok' && <Smartphone className="w-4 h-4 text-slate-900" />}
                                    {platform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                                    {!['instagram', 'facebook', 'tiktok', 'youtube'].includes(platform) && <Globe className="w-4 h-4 text-slate-400" />}
                                </div>
                                <h4 className="text-sm md:text-base font-black text-slate-900 capitalize uppercase tracking-widest">{platform} <span className="text-slate-400 font-bold ml-1">({platformAccounts.length})</span></h4>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {platformAccounts.map((acc: any) => {
                                    const isSelected = selected.includes(acc.id);
                                    return (
                                        <button
                                            key={acc.id}
                                            onClick={() => onToggle(acc.id)}
                                            className={`p-4 xl:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 sm:gap-4 group ${isSelected ? 'border-teal-500 bg-teal-50 ring-4 ring-teal-500/10 shadow-xl' : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-teal-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300 group-hover:text-slate-400'
                                                }`}>
                                                {acc.platform === 'instagram' && <Instagram className="w-5 h-5 sm:w-8 sm:h-8" />}
                                                {acc.platform === 'facebook' && <Facebook className="w-5 h-5 sm:w-8 sm:h-8" />}
                                                {acc.platform === 'tiktok' && <Smartphone className="w-5 h-5 sm:w-8 sm:h-8" />}
                                                {acc.platform === 'youtube' && <Youtube className="w-5 h-5 sm:w-8 sm:h-8" />}
                                                {!['instagram', 'facebook', 'tiktok', 'youtube'].includes(acc.platform) && <Globe className="w-5 h-5 sm:w-8 sm:h-8" />}
                                            </div>
                                            <span className={`font-black text-[10px] sm:text-xs uppercase tracking-widest truncate w-full ${isSelected ? 'text-teal-700' : 'text-slate-400'}`}>
                                                {acc.username || acc.platform}
                                            </span>
                                            <div className={`w-5 h-5 sm:w-6 sm:h-6 flex shrink-0 items-center justify-center rounded-full border-2 transition-all ${isSelected ? 'border-teal-500 bg-teal-500 text-white shadow-md' : 'border-slate-200'
                                                }`}>
                                                {isSelected && <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 active:scale-90 transition-transform" />}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const StepBasicInfo = ({ value, onChange, labels, selectedLabel, onLabelSelect, onAddLabel }: { value: string, onChange: (v: string) => void, labels: string[], selectedLabel: string, onLabelSelect: (l: string) => void, onAddLabel: (l: string) => void }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newLabel, setNewLabel] = useState('');

    const handleAdd = () => {
        if (newLabel.trim()) {
            onAddLabel(newLabel.trim());
            onLabelSelect(newLabel.trim());
            setNewLabel('');
            setIsAdding(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-slate-900">Post Definitions</h3>
                <p className="text-slate-500 font-medium">Set an internal name and category for this post.</p>
            </div>
            <div className="space-y-6 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Post Name (Internal)</label>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="e.g., Summer Campaign - Reel 1"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500/20"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Labels</label>
                    <div className="flex flex-wrap gap-2">
                        {labels.map(l => (
                            <button
                                key={l}
                                onClick={() => onLabelSelect(l)}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl border-2 text-sm font-bold transition-all",
                                    selectedLabel === l ? 'border-teal-500 bg-teal-50 text-teal-600 shadow-sm' : 'border-slate-100 text-slate-500 hover:border-teal-200'
                                )}
                            >{l}</button>
                        ))}
                        {isAdding ? (
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    className="px-4 py-2 text-sm bg-slate-50 border border-teal-200 rounded-xl outline-none font-bold"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                                <button onClick={handleAdd} className="p-2 bg-teal-500 text-white rounded-lg"><Plus className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="px-5 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 flex items-center gap-2 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-500 transition-all"
                            ><Plus className="w-4 h-4" /> Add Label</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepGenericContent = ({ caption, onCaptionChange, mediaUrl, mediaType, onMediaUpload }: { caption: string, onCaptionChange: (v: string) => void, mediaUrl: string, mediaType: string, onMediaUpload: (url: string, type: string) => void }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `post_media/${fileName}`;
            const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('media').getPublicUrl(filePath);
            onMediaUpload(data.publicUrl, type);
        } catch (error: any) {
            console.error('Error uploading media:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6 md:space-y-8">
                <div className="space-y-2">
                    <h3 className="text-xl md:text-3xl font-black text-slate-900">Core Content</h3>
                    <p className="text-sm text-slate-500 font-medium">This will be the default copy for all selected platforms.</p>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4 md:space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4 text-teal-500" /> Master Caption
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => onCaptionChange(e.target.value)}
                            placeholder="Write your primary message here..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-6 text-sm outline-none focus:ring-4 focus:ring-teal-500/5 min-h-[150px] md:min-h-[200px] leading-relaxed font-medium"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] md:text-[11px] font-bold text-slate-400">
                        <span className="flex items-center gap-2 text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg"><Sparkles className="w-3 h-3" /> AI Optimized</span>
                        <span>{caption.length} / 2200 characters</span>
                    </div>
                </div>
            </div>
            <div className="space-y-6 md:space-y-8">
                <div className="space-y-2">
                    <h3 className="text-xl md:text-3xl font-black text-slate-900">Main Assets</h3>
                    <p className="text-sm text-slate-500 font-medium">Upload the primary video or images.</p>
                </div>
                <div className="bg-white border-4 border-dashed border-slate-100 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 h-[300px] md:h-[400px] group hover:border-teal-200 transition-all relative overflow-hidden">
                    {mediaUrl ? (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl bg-slate-900 flex items-center justify-center">
                            {mediaType === 'VIDEO' ? (
                                <video src={mediaUrl} className="w-full h-full object-contain" autoPlay muted loop />
                            ) : (
                                <img src={mediaUrl} className="w-full h-full object-cover" />
                            )}
                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl"><ImageIcon className="w-4 h-4" /> Change</span>
                                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleUpload} disabled={isUploading} />
                            </label>
                            {isUploading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer relative z-10">
                            {isUploading ? (
                                <div className="space-y-4 flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-500"></div>
                                    <p className="text-slate-500 font-bold animate-pulse">Uploading Media...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:bg-teal-50 group-hover:text-teal-500 transition-all mb-4 mt-4">
                                        <Upload className="w-8 h-8 md:w-10 md:h-10" />
                                    </div>
                                    <div className="mb-6 px-4">
                                        <p className="text-base md:text-lg font-black text-slate-900">Drag & Drop Media</p>
                                        <p className="text-xs text-slate-400 mt-1">Videos up to 2GB or high-res images.</p>
                                    </div>
                                    <span className="bg-slate-900 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl text-xs sm:text-sm">Browse Files</span>
                                </>
                            )}
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleUpload} disabled={isUploading} />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};

const StepFineTune = ({ accounts, postData, settings, onSettingChange }: { accounts: any[], postData: any, settings: Record<string, any>, onSettingChange: (id: string, key: string, val: any) => void }) => {
    const [selectedId, setSelectedId] = useState(accounts[0]?.id);

    const activeSettings = settings[selectedId] || { type: 'REEL', shareToFeed: true, addToGrid: false };

    return (
        <div className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-8">
            <div className="text-center space-y-2">
                <h3 className="text-xl md:text-3xl font-black text-slate-900">Fine-Tune by Channel</h3>
                <p className="text-sm text-slate-500 font-medium">Customise descriptions and media for each social network.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                <div className="w-full lg:w-64 space-y-2 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
                    {accounts.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 italic font-medium text-sm">Please select accounts first.</div>
                    ) : accounts.map(a => (
                        <button
                            key={a.id}
                            onClick={() => setSelectedId(a.id)}
                            className={`flex shrink-0 lg:w-full items-center justify-between p-3 md:p-4 border rounded-xl md:rounded-[1.5rem] shadow-sm transition-all text-left group ${selectedId === a.id ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-100 hover:shadow-md'} mr-2 lg:mr-0`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${selectedId === a.id ? 'bg-teal-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600'}`}>
                                    {a.platform === 'instagram' && <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    {a.platform === 'facebook' && <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    {a.platform === 'tiktok' && <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    {a.platform === 'youtube' && <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                </div>
                                <span className={`text-xs sm:text-sm font-black capitalize ${selectedId === a.id ? 'text-teal-900' : 'text-slate-700'}`}>{a.username || a.platform}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 hidden lg:block ${selectedId === a.id ? 'text-teal-400' : 'text-slate-300'}`} />
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col min-h-[400px] md:min-h-[500px]">
                    {accounts.length === 0 ? (
                        <div className="flex items-center justify-center flex-1 text-slate-400 italic">No account selected for fine-tuning.</div>
                    ) : (
                        <div className="p-6 md:p-10 flex-1 grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-base md:text-lg font-black text-slate-900">Version Content</h4>
                                    <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-lg">
                                        {(PLATFORM_POST_TYPES[accounts.find(a => a.id === selectedId)?.platform || 'instagram'] || ['POST']).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => onSettingChange(selectedId, 'type', t)}
                                                className={cn(
                                                    "px-3 py-2 shadow-sm rounded-md text-[9px] md:text-[10px] font-black uppercase transition-all",
                                                    activeSettings.type === t ? "bg-white text-teal-600" : "text-slate-400"
                                                )}
                                            >{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    className="w-full h-[150px] md:h-[250px] bg-slate-50/50 border border-slate-100 rounded-2xl p-4 md:p-6 text-sm font-medium outline-none focus:ring-4 focus:ring-teal-500/5 shadow-inner"
                                    placeholder="Version specific caption..."
                                    defaultValue={postData.caption}
                                />
                                <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Specifics</p>
                                    {selectedId && accounts.find(a => a.id === selectedId)?.platform === 'instagram' && activeSettings.type === 'STORY' ? (
                                        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            <p className="text-[10px] font-bold text-amber-700">Stories are temporary and visible for 24h.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div
                                                    onClick={() => onSettingChange(selectedId, 'shareToFeed', !activeSettings.shareToFeed)}
                                                    className={cn("w-10 h-5 rounded-full relative transition-all", activeSettings.shareToFeed ? "bg-teal-500" : "bg-slate-200")}
                                                >
                                                    <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all", activeSettings.shareToFeed ? "right-0.5" : "left-0.5")} />
                                                </div>
                                                <span className="text-[10px] md:text-xs font-bold text-slate-700">Share to Feed</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div
                                                    onClick={() => onSettingChange(selectedId, 'addToGrid', !activeSettings.addToGrid)}
                                                    className={cn("w-10 h-5 rounded-full relative transition-all", activeSettings.addToGrid ? "bg-teal-500" : "bg-slate-200")}
                                                >
                                                    <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all", activeSettings.addToGrid ? "right-0.5" : "left-0.5")} />
                                                </div>
                                                <span className="text-[10px] md:text-xs font-bold text-slate-700">Add to Profile Grid</span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 p-6 md:p-8">
                                <div className={cn(
                                    "w-[200px] h-[350px] md:w-[280px] md:h-[500px] bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border-[4px] md:border-[6px] border-white relative overflow-hidden ring-4 ring-slate-100 shrink-0",
                                    activeSettings.type === 'STORY' && "ring-purple-500/20"
                                )}>
                                    <div className="absolute top-0 left-0 right-0 h-10 md:h-12 bg-gradient-to-b from-black/20 to-transparent z-10 flex items-center justify-between px-4 md:px-6">
                                        <div className="flex items-center gap-2"><div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-200" /><span className="text-[8px] md:text-[10px] text-white font-bold">Your Store</span></div>
                                        <Instagram className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                                    </div>
                                    <div className="w-full h-full bg-slate-200 overflow-hidden relative">
                                        {postData.mediaUrl ? (
                                            postData.mediaType === 'VIDEO' ? (
                                                <video src={postData.mediaUrl} className="w-full h-full object-cover" muted />
                                            ) : (
                                                <img src={postData.mediaUrl} className="w-full h-full object-cover" />
                                            )
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center italic text-slate-400 text-[10px] md:text-xs bg-slate-100 underline decoration-dotted">Feed Preview Placeholder</div>
                                        )}
                                        {postData.caption && (
                                            <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/10 shadow-2xl">
                                                <p className="text-[8px] md:text-[10px] text-white/90 font-medium line-clamp-2 leading-relaxed">{postData.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smartphone className="w-3.5 h-3.5" /> Mobile Feed Preview</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StepSettings = ({ hashtags, onHashtagsChange, visibility, onVisibilityChange }: { hashtags: string, onHashtagsChange: (v: string) => void, visibility: string, onVisibilityChange: (v: string) => void }) => (
    <div className="max-w-3xl mx-auto space-y-8 md:space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-4">
        <div className="text-center space-y-2">
            <h3 className="text-xl md:text-3xl font-black text-slate-900">Posting Settings</h3>
            <p className="text-sm text-slate-500 font-medium">Fine-tune the technical metadata for your social posts.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 space-y-4 md:space-y-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-50 rounded-xl md:rounded-2xl flex items-center justify-center text-teal-600"><Globe className="w-5 h-5 md:w-6 md:h-6" /></div>
                <div className="space-y-4">
                    <h4 className="font-black text-slate-900 text-sm md:text-base">Visibility Settings</h4>
                    <div className="space-y-3">
                        {['Public (Recommended)', 'Team Only', 'Private Draft'].map(o => (
                            <label key={o} onClick={() => onVisibilityChange(o)} className={cn("flex items-center gap-3 p-3 md:p-4 rounded-xl cursor-pointer transition-all border", visibility === o ? "bg-teal-50 border-teal-200 ring-2 ring-teal-500/10" : "bg-slate-50 border-transparent hover:bg-slate-100")}>
                                <div className={cn("w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all", visibility === o ? 'border-teal-500' : 'border-slate-200')}>
                                    {visibility === o && <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-teal-500 rounded-full animate-in zoom-in-50" />}
                                </div>
                                <span className={cn("text-[10px] md:text-xs font-bold transition-colors", visibility === o ? "text-teal-700" : "text-slate-700")}>{o}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 space-y-4 md:space-y-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 rounded-xl md:rounded-2xl flex items-center justify-center text-purple-600"><Settings className="w-5 h-5 md:w-6 md:h-6" /></div>
                <div className="space-y-4">
                    <h4 className="font-black text-slate-900 text-sm md:text-base">Optimization</h4>
                    <div className="space-y-4">
                        <label className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hashtags</span>
                            <textarea
                                value={hashtags}
                                onChange={(e) => onHashtagsChange(e.target.value)}
                                placeholder="#socialmedia #marketing"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 md:p-4 text-xs font-bold outline-none focus:ring-4 focus:ring-purple-500/5 shadow-inner"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-xl mt-2">
                            <span className="text-[10px] md:text-xs font-bold text-slate-700">Auto-Suggest Hashtags</span>
                            <div className="w-9 h-4.5 md:w-10 md:h-5 bg-purple-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-white rounded-full shadow-sm"></div></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const StepReview = ({ data, accounts, reach }: { data: any, accounts: any[], reach: string }) => (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-8">
        <div className="text-center space-y-2">
            <h3 className="text-xl md:text-3xl font-black text-slate-900">Final Review</h3>
            <p className="text-sm text-slate-500 font-medium">Verify all platform versions before commitment.</p>
        </div>
        <div className="bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-50">
                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-center sm:text-left">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-lg border border-slate-200 shrink-0 flex items-center justify-center">
                        {data.mediaUrl ? (
                            data.mediaType === 'VIDEO' ? (
                                <video src={data.mediaUrl} className="w-full h-full object-cover" muted />
                            ) : (
                                <img src={data.mediaUrl} className="w-full h-full object-cover" />
                            )
                        ) : (
                            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 italic text-[9px] md:text-[10px]"><ImageIcon className="w-5 h-5 md:w-6 md:h-6 mb-1 text-slate-300" />No Asset</div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-lg md:text-2xl font-black text-slate-900 leading-tight">{data.title || 'Untitled Post'}</h4>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                            {accounts.length ? accounts.map(a => (
                                <span key={a.id} className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-slate-50 text-slate-600 border border-slate-200 text-[9px] md:text-[10px] font-black rounded-lg uppercase tracking-widest shadow-sm">
                                    {a.platform === 'instagram' && <Instagram className="w-3 h-3 text-pink-500" />}
                                    {a.platform === 'facebook' && <Facebook className="w-3 h-3 text-blue-600" />}
                                    {a.platform === 'tiktok' && <Smartphone className="w-3 h-3 text-slate-900" />}
                                    {a.platform === 'youtube' && <Youtube className="w-3 h-3 text-red-500" />}
                                    {a.username || a.platform}
                                </span>
                            )) : <span className="text-slate-400 text-xs italic font-medium">No accounts selected</span>}
                        </div>
                    </div>
                </div>
                <div className="text-center sm:text-right shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Reach</p>
                    <p className="text-2xl md:text-3xl font-black text-teal-500">{reach}</p>
                </div>
            </div>
            <div className="space-y-6">
                <div className="p-4 md:p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 relative shadow-sm">
                    <span className="absolute top-0 right-8 -translate-y-1/2 bg-white px-2 text-[9px] md:text-[10px] font-black text-slate-400 tracking-widest uppercase">Caption</span>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{data.caption || 'No caption provided.'}</p>
                    {data.hashtags && <p className="mt-4 text-[10px] md:text-xs font-bold text-teal-600">{data.hashtags}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-1 md:space-y-2">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Publish Date</p>
                        <p className="text-xs md:text-sm font-bold text-slate-900">{new Date(data.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-1 md:space-y-2">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                        <p className="text-xs md:text-sm font-bold text-slate-900">{new Date(data.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-1 md:space-y-2">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Approval</p>
                        <p className="text-xs md:text-sm font-bold text-orange-500">Auto-Post Mode</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const StepSchedule = ({ value, timezone, onChange }: { value: string, timezone?: string, onChange: (v: string) => void }) => (
    <div className="max-w-2xl mx-auto space-y-8 md:space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-12">
        <div className="text-center space-y-2">
            <h3 className="text-xl md:text-3xl font-black text-slate-900">Set Schedule</h3>
            <p className="text-sm text-slate-500 font-medium">When should this post go live across the world?</p>
        </div>
        <div className="bg-white p-6 md:p-12 rounded-[1.5rem] md:rounded-[3rem] shadow-2xl border border-slate-100 space-y-8 md:space-y-10">
            <div className="grid grid-cols-1 gap-6 md:gap-10">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Publish Date & Time ({timezone || 'UTC'})</label>
                    <div className="relative">
                        <Calendar className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-green-500" />
                        <input
                            type="datetime-local"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 md:pl-16 pr-4 md:pr-6 py-4 md:py-5 text-xs md:text-sm font-black outline-none focus:ring-4 focus:ring-green-500/5 shadow-inner"
                        />
                    </div>
                </div>
            </div>
            <div className="p-4 md:p-8 bg-green-50 border border-green-100 rounded-[1.5rem] md:rounded-[2rem] flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shrink-0"><Clock className="w-6 md:w-7 h-6 md:h-7" /></div>
                <div className="text-center sm:text-left">
                    <h5 className="text-base md:text-lg font-black text-green-900">Optimal Time ({timezone || 'UTC'})</h5>
                    <p className="text-[10px] md:text-sm font-medium text-green-600">Engagement peaks at **09:00 AM**.</p>
                </div>
                <button className="sm:ml-auto w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-xl font-black text-[10px] md:text-xs hover:bg-green-700 shadow-lg">Use Optimal</button>
            </div>
        </div>
    </div>
);
