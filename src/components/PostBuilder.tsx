import React, { useState, useEffect, useRef } from 'react';
import {
    X, Instagram, Facebook, Smartphone, Youtube,
    Calendar, Image as ImageIcon, Send, Clock,
    Plus, ChevronRight, ChevronLeft, Globe,
    Settings, Save, Check, Sparkles, Hash,
    Trash2, Edit3, Monitor, Shield, Zap, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePosts, useCreatePost, useUpdatePost } from '../features/posts/usePosts';
import { useAccountContext } from '../features/accounts/AccountContext';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Reuse Post type but with updated fields
interface PostData {
    title: string;
    caption: string;
    mediaUrl: string;
    mediaType: 'IMAGE' | 'VIDEO';
    thumbnailUrl: string;
    scheduledAt: string;
    hashtags: string;
    category: string;
    visibility: string;
}

interface SocialAccount {
    id: string;
    platform: string;
    username: string;
    avatar_url?: string;
}

interface PostBuilderProps {
    onClose: () => void;
    initialReel?: any;
}

const steps = [
    { id: 1, title: 'Destinations', sub: 'Where should this live?' },
    { id: 2, title: 'Essentials', sub: 'Naming and categorization' },
    { id: 3, title: 'Creation Hub', sub: 'Design your masterpiece' },
    { id: 4, title: 'Channel Sync', sub: 'Fine-tune per platform' },
    { id: 5, title: 'Optimization', sub: 'Metadata and reach' },
    { id: 6, title: 'Final Review', sub: 'Quality assurance' },
    { id: 7, title: 'The Launch', sub: 'Schedule or post now' },
];

export const PostBuilder = ({ onClose, initialReel }: PostBuilderProps) => {
    const { session } = useAuth();
    const { accounts, activeAccount } = useAccountContext();
    const createPost = useCreatePost();
    const updatePost = useUpdatePost();
    const isSubmittingRef = useRef(false);

    const [currentStep, setCurrentStep] = useState(1);
    const [publishNow, setPublishNow] = useState(false);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
        initialReel?.social_account_id ? [initialReel.social_account_id] :
            activeAccount?.id ? [activeAccount.id] : []
    );
    const [isDirty, setIsDirty] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [publishingPosts, setPublishingPosts] = useState<any[]>([]);
    const [showPublishingOverlay, setShowPublishingOverlay] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [toasts, setToasts] = useState<any[]>([]);

    const [postData, setPostData] = useState<PostData>({
        title: initialReel?.title || '',
        caption: initialReel?.caption || '',
        mediaUrl: initialReel?.media_url || '',
        mediaType: initialReel?.media_type || 'IMAGE',
        thumbnailUrl: initialReel?.thumbnail_url || '',
        scheduledAt: initialReel?.scheduled_at || new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        hashtags: initialReel?.tags?.map((t: string) => `#${t}`).join(' ') || '',
        category: initialReel?.category || 'Uncategorized',
        visibility: initialReel?.visibility || 'Public',
    });

    const [accountSettings, setAccountSettings] = useState<Record<string, any>>({});
    const [labels, setLabels] = useState(['Uncategorized', 'Marketing', 'Announcement', 'Promo', 'Hiring', 'Event']);
    const [titleError, setTitleError] = useState('');

    const addToast = (message: string, type: 'success' | 'error' | 'info' | 'draft') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    const handleClose = () => {
        if (isDirty) setShowCloseConfirm(true);
        else onClose();
    };

    const buildTagsArr = (hashtags: string) =>
        hashtags.split(/[ ,]+/).filter(Boolean).map(t => t.startsWith('#') ? t.substring(1).toLowerCase() : t.toLowerCase());

    const handleSaveDraft = async () => {
        if (isSubmittingRef.current) return;
        if (!session?.user) return;
        isSubmittingRef.current = true;
        setIsSavingDraft(true);
        try {
            const payload = {
                user_id: session.user.id,
                title: postData.title || 'Untitled Draft',
                caption: postData.caption,
                media_url: postData.mediaUrl,
                media_type: postData.mediaType,
                thumbnail_url: postData.thumbnailUrl,
                category: postData.category,
                tags: buildTagsArr(postData.hashtags),
                visibility: postData.visibility,
                status: 'Draft',
            };

            if (initialReel?.id) {
                const acc = accounts.find((a: SocialAccount) => a.id === selectedAccounts[0]);
                await updatePost.mutateAsync({
                    id: initialReel.id,
                    updates: { ...payload, social_account_id: acc?.id, platforms: acc?.platform ? [acc.platform] : [] }
                });
            } else {
                const acc = accounts.find((a: SocialAccount) => a.id === selectedAccounts[0]);
                await createPost.mutateAsync({
                    ...payload,
                    social_account_id: selectedAccounts[0],
                    platforms: acc?.platform ? [acc.platform] : []
                });
            }
            setIsDirty(false);
            addToast('Draft saved successfully', 'draft');
            onClose();
        } catch (err: any) {
            addToast('Error saving draft: ' + err.message, 'error');
        } finally {
            setIsSavingDraft(false);
            isSubmittingRef.current = false;
        }
    };

    const handleSchedule = async () => {
        if (isSubmittingRef.current) return;
        if (!session?.user) return;
        if (selectedAccounts.length === 0) {
            addToast('Please select at least one account.', 'error');
            return;
        }

        isSubmittingRef.current = true;
        setIsScheduling(true);
        try {
            const basePayload = {
                user_id: session.user.id,
                title: postData.title,
                caption: postData.caption,
                media_url: postData.mediaUrl,
                media_type: postData.mediaType,
                thumbnail_url: postData.thumbnailUrl,
                scheduled_at: publishNow ? new Date().toISOString() : new Date(postData.scheduledAt).toISOString(),
                status: 'Scheduled', // Always start as Scheduled, let worker/function move to Published
                category: postData.category,
                tags: buildTagsArr(postData.hashtags),
                visibility: postData.visibility
            };

            const promises = selectedAccounts.map(accountId => {
                const account = accounts.find((a: SocialAccount) => a.id === accountId);
                const settings = accountSettings[accountId] || {};
                const payload = {
                    ...basePayload,
                    media_type: settings.type || basePayload.media_type,
                    social_account_id: accountId,
                    platforms: account?.platform ? [account.platform] : []
                };
                return initialReel?.id && selectedAccounts.length === 1
                    ? updatePost.mutateAsync({ id: initialReel.id, updates: payload })
                    : createPost.mutateAsync(payload);
            });

            const posts = await Promise.all(promises);
            const postIds = posts.map(p => p?.id).filter(Boolean) as string[];

            if (publishNow && postIds.length > 0) {
                setPublishingPosts(posts);
                const promises = postIds.map(async (id) => {
                    try {
                        const { data, error } = await supabase.functions.invoke('ig-publish', {
                            body: { postId: id }
                        });
                        if (error) throw error;
                        return { id, ...data };
                    } catch (err) {
                        console.error('Invoke error:', err);
                        return { id, success: false, error: err };
                    }
                });

                const results = await Promise.all(promises);
                // Update publishingPosts with container status if needed
                setPublishingPosts(current => current.map(p => {
                    const res = results.find(r => r.id === p.id);
                    return res ? { ...p, ...res } : p;
                }));
            } else {
                addToast(`Successfully scheduled for ${selectedAccounts.length} channel${selectedAccounts.length > 1 ? 's' : ''}!`, 'success');
                setIsDirty(false);
                onClose();
            }
        } catch (error: any) {
            addToast('Error: ' + error.message, 'error');
        } finally {
            setIsScheduling(false);
            isSubmittingRef.current = false;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <StepAccounts accounts={accounts} selected={selectedAccounts} onToggle={(id) => { setIsDirty(true); setSelectedAccounts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }} />;
            case 2: return <StepBasicInfo value={postData.title} onChange={(v) => { setIsDirty(true); setPostData(d => ({ ...d, title: v })); }} labels={labels} selectedLabel={postData.category} onLabelSelect={(l) => setPostData(d => ({ ...d, category: l }))} onAddLabel={(l) => setLabels(prev => [...prev, l])} error={titleError} />;
            case 3: return <StepCreation caption={postData.caption} onCaptionChange={(v) => { setIsDirty(true); setPostData(d => ({ ...d, caption: v })); }} mediaUrl={postData.mediaUrl} mediaType={postData.mediaType} onMediaUpload={(url, type, thumb) => { setIsDirty(true); setPostData(d => ({ ...d, mediaUrl: url, mediaType: type as 'IMAGE' | 'VIDEO', thumbnailUrl: thumb || url })); }} addToast={addToast} />;
            case 4: return <StepFineTune accounts={accounts.filter((a: SocialAccount) => selectedAccounts.includes(a.id))} postData={postData} settings={accountSettings} onSettingChange={(id, key, val) => setAccountSettings(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }))} />;
            case 5: return <StepOptimization hashtags={postData.hashtags} onHashtagsChange={(v) => { setIsDirty(true); setPostData(d => ({ ...d, hashtags: v })); }} visibility={postData.visibility} onVisibilityChange={(v) => setPostData(d => ({ ...d, visibility: v }))} />;
            case 6: return <StepReview data={postData} accounts={accounts.filter((a: SocialAccount) => selectedAccounts.includes(a.id))} />;
            case 7: return <StepLaunch value={postData.scheduledAt} onChange={(v) => { setIsDirty(true); setPostData(d => ({ ...d, scheduledAt: v })); }} publishNow={publishNow} onPublishNowChange={setPublishNow} />;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden font-sans animate-in fade-in duration-500">

            {/* Toast Container */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-md pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={cn(
                        "pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 font-bold border",
                        t.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                            t.type === 'error' ? "bg-red-50 border-red-100 text-red-800" :
                                "bg-white border-slate-100 text-slate-800"
                    )}>
                        {t.type === 'success' && <Check className="w-5 h-5 text-emerald-500" />}
                        {t.type === 'error' && <X className="w-5 h-5 text-red-500" />}
                        {t.message}
                    </div>
                ))}
            </div>

            {/* Confirm Modal */}
            {showCloseConfirm && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                    <div className="bg-white rounded-[2.5rem] p-10 relative z-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
                            <Save className="w-10 h-10 text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Save Progress?</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">You have unsaved changes. Keep as a draft before leaving?</p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => { setShowCloseConfirm(false); onClose(); }} className="flex-1 py-4 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-all active:scale-95">Discard</button>
                            <button onClick={handleSaveDraft} className="flex-1 py-4 rounded-2xl text-sm font-black bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl active:scale-95">Save Draft</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Builder UI */}
            <div className="relative w-full flex-1 bg-[#f7f9fb] flex flex-col overflow-hidden">
                {/* Header (Bento Style) */}
                <div className="p-8 border-b border-slate-200/50 bg-white/50 backdrop-blur-md flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#006c49] to-[#10b981] rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Plus className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Build New Post</h2>
                                {isDirty && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Unsaved</span>}
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Channel Distribution</p>
                        </div>
                    </div>

                    {/* Stepper (Minimalist) */}
                    <div className="hidden lg:flex items-center gap-3">
                        {steps.map(s => (
                            <div key={s.id} className="flex items-center">
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 font-black text-sm border-2",
                                    currentStep === s.id ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-110" :
                                        currentStep > s.id ? "bg-emerald-500 border-emerald-500 text-white" :
                                            "bg-white border-slate-100 text-slate-300"
                                )}>
                                    {currentStep > s.id ? <Check className="w-5 h-5" /> : s.id}
                                </div>
                                {s.id < 7 && <div className={cn("w-6 h-1 rounded-full mx-1", currentStep > s.id ? "bg-emerald-200" : "bg-slate-100")} />}
                            </div>
                        ))}
                    </div>

                    <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-12 scroll-smooth">
                    <div className="max-w-6xl mx-auto h-full">
                        {renderStep()}
                    </div>
                </div>

                {/* Footer (Floating Style) */}
                <div className="p-8 pb-10 border-t border-slate-200/50 bg-white/50 backdrop-blur-md flex items-center justify-between shrink-0">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center gap-3 px-8 py-5 rounded-[2rem] font-black text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-0 disabled:pointer-events-none group"
                    >
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
                        Previous
                    </button>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleSaveDraft}
                            disabled={isSavingDraft}
                            className="hidden sm:flex items-center gap-3 px-8 py-5 rounded-[2rem] border-2 border-slate-200 font-black text-slate-600 hover:border-slate-400 hover:bg-white transition-all active:scale-95"
                        >
                            <Save className={cn("w-5 h-5", isSavingDraft && "animate-spin")} />
                            {initialReel ? 'Save Changes' : 'Save as Draft'}
                        </button>

                        {currentStep < 7 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-3 px-12 py-5 rounded-[2rem] bg-gradient-to-br from-[#006c49] to-[#10b981] text-white font-black shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 hover:shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)] transition-all group lg:min-w-[200px] justify-center"
                            >
                                Continue
                                <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSchedule}
                                disabled={isScheduling || !postData.title}
                                className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm flex items-center gap-3 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all active:scale-95"
                            >
                                {isScheduling ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    publishNow ? <Send className="w-5 h-5" /> : <Clock className="w-5 h-5" />
                                )}
                                {publishNow ? 'Publish Now' : 'Schedule Post'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showPublishingOverlay && publishingPosts && publishingPosts.length > 0 && (
                <PublishingOverlay posts={publishingPosts} onClose={onClose} />
            )}
        </div>
    );

    function nextStep() {
        if (currentStep === 2 && !postData.title.trim()) {
            setTitleError('Project name is required.');
            return;
        }
        setTitleError('');
        setCurrentStep(s => Math.min(s + 1, 7));
    }

    function prevStep() {
        setCurrentStep(s => Math.max(s - 1, 1));
    }
};

// --- Step Components (High-Fidelity Bento Style) ---

const StepAccounts = ({ accounts, selected, onToggle }: { accounts: any[], selected: string[], onToggle: (id: string) => void }) => (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center max-w-2xl mx-auto space-y-4">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Choose Distribution</h3>
            <p className="text-lg font-medium text-slate-500 leading-relaxed">Select the social channels where your content will be pushed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {accounts.map(acc => (
                <div
                    key={acc.id}
                    onClick={() => onToggle(acc.id)}
                    className={cn(
                        "group relative bg-white rounded-[2.5rem] p-8 border-2 transition-all cursor-pointer hover:shadow-2xl active:scale-95",
                        selected.includes(acc.id) ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-transparent hover:border-slate-200 shadow-sm"
                    )}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg",
                            acc.platform === 'instagram' ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" :
                                acc.platform === 'facebook' ? "bg-blue-600" :
                                    acc.platform === 'tiktok' ? "bg-slate-900" : "bg-red-600"
                        )}>
                            {acc.platform === 'instagram' && <Instagram className="w-8 h-8" />}
                            {acc.platform === 'facebook' && <Facebook className="w-8 h-8" />}
                            {acc.platform === 'tiktok' && <Smartphone className="w-8 h-8" />}
                            {acc.platform === 'youtube' && <Youtube className="w-8 h-8" />}
                        </div>
                        <div className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                            selected.includes(acc.id) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-100"
                        )}>
                            {selected.includes(acc.id) && <Check className="w-5 h-5" />}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xl font-black text-slate-900 tracking-tight capitalize">{acc.username || acc.platform}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{acc.platform} Account</p>
                    </div>
                    {selected.includes(acc.id) && (
                        <div className="absolute top-4 right-4 animate-in zoom-in-50 duration-300">
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Ready</span>
                        </div>
                    )}
                </div>
            ))}
            {accounts.length === 0 && (
                <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-200 rounded-[3rem] space-y-4">
                    <Shield className="w-16 h-16 text-slate-300 mx-auto" />
                    <p className="text-slate-500 font-bold">No accounts connected. Go to settings to link platforms.</p>
                </div>
            )}
        </div>
    </div>
);

const StepBasicInfo = ({ value, onChange, labels, selectedLabel, onLabelSelect, onAddLabel, error }: { value: string, onChange: (v: string) => void, labels: string[], selectedLabel: string, onLabelSelect: (v: string) => void, onAddLabel: (v: string) => void, error: string }) => {
    const [newLabel, setNewLabel] = useState('');
    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Core Essentials</h3>
                <p className="text-lg font-medium text-slate-500 leading-relaxed">Name your campaign and file it correctly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-8">
                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Project Name</label>
                        <input
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="e.g., Summer Launch 2026"
                            className={cn(
                                "w-full bg-[#f7f9fb] border-2 rounded-2xl p-6 text-xl font-bold outline-none transition-all placeholder:text-slate-300",
                                error ? "border-red-100 focus:border-red-200" : "border-transparent focus:border-emerald-500 ring-emerald-500/5 focus:ring-8"
                            )}
                        />
                        {error && <p className="text-red-500 text-xs font-bold pl-2">{error}</p>}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-8">
                    <div className="space-y-6">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Post Category</label>
                        <div className="flex flex-wrap gap-3">
                            {labels.map(l => (
                                <button
                                    key={l}
                                    onClick={() => onLabelSelect(l)}
                                    className={cn(
                                        "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                        selectedLabel === l ? "bg-slate-900 text-white shadow-lg scale-105" : "bg-[#f7f9fb] text-slate-400 hover:bg-slate-100"
                                    )}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                placeholder="New category..."
                                className="flex-1 bg-[#f7f9fb] border-transparent border-2 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                            />
                            <button
                                onClick={() => { if (newLabel) { onAddLabel(newLabel); setNewLabel(''); } }}
                                className="bg-white border-2 border-slate-100 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 px-4 rounded-xl font-black transition-all"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const StepCreation = ({ caption, onCaptionChange, mediaUrl, mediaType, onMediaUpload, addToast }: { caption: string, onCaptionChange: (v: string) => void, mediaUrl: string, mediaType: string, onMediaUpload: (url: string, type: string, thumb?: string) => void, addToast: (m: string, t: any) => void }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const { openPicker } = useGoogleDrive();

    const handleFile = async (file: File) => {
        setIsUploading(true);
        try {
            const isVideo = file.type.startsWith('video');
            const type = isVideo ? 'VIDEO' : 'IMAGE';

            let finalUrl = '';
            let thumbnailUrl = '';

            if (isVideo) {
                // Upload to Google Drive Bucket via Edge Function
                const formData = new FormData();
                formData.append('file', file);

                const { data, error } = await supabase.functions.invoke('gdrive-upload', {
                    body: formData,
                });

                if (error) {
                    const body = await error.context?.json().catch(() => null);
                    throw new Error(body?.error || error.message);
                }
                finalUrl = data.url;
                thumbnailUrl = data.thumbnailUrl;
            } else {
                // Upload to Supabase Storage for Images
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `post_media/${fileName}`;

                const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('media').getPublicUrl(filePath);
                finalUrl = data.publicUrl;
                thumbnailUrl = data.publicUrl;
            }

            onMediaUpload(finalUrl, type, thumbnailUrl);
            addToast(`${type} uploaded to ${isVideo ? 'Google Drive' : 'Vault'}!`, 'success');
        } catch (error: any) {
            addToast('Upload failed: ' + error.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-8 lg:space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Creation Hub</h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Left side: Assets */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600"><Plus className="w-4 h-4" /></div>
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Media Assets</h4>
                        </div>
                        {mediaUrl && (
                            <button onClick={() => onMediaUpload('', 'IMAGE')} className="text-xs font-bold text-red-500 flex items-center gap-1.5 hover:bg-red-50 px-3 py-1 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                        )}
                    </div>

                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                        className={cn(
                            "relative bg-white border-4 border-dashed rounded-[3rem] p-12 h-[500px] flex flex-col items-center justify-center transition-all group overflow-hidden shadow-sm",
                            dragActive ? "border-emerald-500 bg-emerald-50/30" : "border-slate-100 hover:border-emerald-200"
                        )}
                    >
                        {mediaUrl ? (
                            <div className="absolute inset-4 rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 group/media">
                                {mediaType === 'VIDEO' ? (
                                    <video src={mediaUrl} className="w-full h-full object-contain" autoPlay muted loop />
                                ) : (
                                    <img src={mediaUrl} className="w-full h-full object-contain" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                                    <label className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xl">
                                        <Edit3 className="w-5 h-5" /> Change Media
                                        <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center gap-6 cursor-pointer">
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-emerald-500 font-black animate-pulse">Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all cursor-pointer">
                                                Browse Media
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Globe className="w-3 h-3 text-emerald-500" /> Videos stored in Google Drive
                                            </p>
                                        </div>
                                    </>
                                )}
                                <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={isUploading} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Right side: Editor */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><Edit3 className="w-4 h-4" /></div>
                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Caption & Hook</h4>
                    </div>

                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-6 h-[500px] flex flex-col">
                        <textarea
                            value={caption}
                            onChange={(e) => onCaptionChange(e.target.value)}
                            placeholder="Write a caption that moves people..."
                            className="flex-1 w-full bg-[#f7f9fb] border-transparent border-2 focus:border-emerald-500 rounded-[2rem] p-8 text-lg font-medium leading-relaxed resize-none outline-none transition-all placeholder:text-slate-300"
                        />
                        <div className="flex items-center justify-between pb-2">
                            <div className="flex gap-4">
                                <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Sparkles className="w-5 h-5" /></button>
                                <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Hash className="w-5 h-5" /></button>
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                caption.length > 2000 ? "text-red-500" : "text-slate-400"
                            )}>{caption.length} / 2200</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const StepFineTune = ({ accounts, postData, settings, onSettingChange }: { accounts: any[], postData: any, settings: Record<string, any>, onSettingChange: (id: string, key: string, val: any) => void }) => {
    const [selectedId, setSelectedId] = useState(accounts[0]?.id);
    const activeSettings = settings[selectedId] || { type: 'REEL', shareToFeed: true };

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 pb-10">
            <div className="text-center space-y-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Channel Tuning</h3>
                <p className="text-lg font-medium text-slate-500">Perfect your post for each social algorithm.</p>
            </div>

            <div className="flex flex-col xl:flex-row gap-10">
                {/* Channel List */}
                <div className="w-full xl:w-80 flex xl:flex-col gap-4 overflow-x-auto pb-4 xl:pb-0 scrollbar-hide">
                    {accounts.map(acc => (
                        <button
                            key={acc.id}
                            onClick={() => setSelectedId(acc.id)}
                            className={cn(
                                "shrink-0 xl:w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all",
                                selectedId === acc.id ? "bg-white border-emerald-500 shadow-xl" : "bg-white border-transparent text-slate-500 hover:border-slate-200"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                                    acc.platform === 'instagram' ? "bg-gradient-to-tr from-pink-500 to-purple-600" : "bg-slate-900"
                                )}>
                                    {acc.platform === 'instagram' ? <Instagram className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                                </div>
                                <span className={cn("font-black tracking-tight", selectedId === acc.id ? "text-slate-900" : "text-slate-400")}>{acc.username}</span>
                            </div>
                            {selectedId === acc.id && <ChevronRight className="w-5 h-5 text-emerald-500" />}
                        </button>
                    ))}
                </div>

                {/* Options Bento */}
                <div className="flex-1 bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">Format Settings</h4>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select your post style</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['POST', 'REEL', 'STORY', 'SHORTS'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => onSettingChange(selectedId, 'type', type)}
                                    className={cn(
                                        "p-5 rounded-2xl border-2 font-black transition-all text-xs tracking-widest uppercase",
                                        activeSettings.type === type ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-[#f7f9fb] border-transparent text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">Post Properties</h4>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Visibility and feed controls</p>
                        </div>
                        <div className="space-y-4">
                            {[
                                { k: 'shareToFeed', l: 'Share to Grid/Feed' },
                                { k: 'allowRemix', l: 'Enable Remixing' },
                                { k: 'hideLikeCount', l: 'Hide Like Count' }
                            ].map(opt => (
                                <button
                                    key={opt.k}
                                    onClick={() => onSettingChange(selectedId, opt.k, !activeSettings[opt.k])}
                                    className="w-full flex items-center justify-between p-5 bg-[#f7f9fb] rounded-2xl hover:bg-slate-100 transition-all border-2 border-transparent hover:border-slate-200"
                                >
                                    <span className="text-sm font-bold text-slate-700">{opt.l}</span>
                                    <div className={cn(
                                        "w-12 h-6 rounded-full relative transition-all duration-300",
                                        activeSettings[opt.k] ? "bg-emerald-500" : "bg-slate-300"
                                    )}>
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                                            activeSettings[opt.k] ? "right-1" : "left-1"
                                        )} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const StepOptimization = ({ hashtags, onHashtagsChange, visibility, onVisibilityChange }: { hashtags: string, onHashtagsChange: (v: string) => void, visibility: string, onVisibilityChange: (v: string) => void }) => (
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Post Strategy</h3>
            <p className="text-lg font-medium text-slate-500">Fine-tune discoverability and privacy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-8">
                <div className="w-16 h-16 bg-purple-50 rounded-[1.5rem] flex items-center justify-center text-purple-600"><Zap className="w-8 h-8" /></div>
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-slate-900">Visibility</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Who can see this post?</p>
                    </div>
                    <div className="space-y-3">
                        {['Public', 'Close Friends', 'Team Only', 'Private Draft'].map(v => (
                            <button
                                key={v}
                                onClick={() => onVisibilityChange(v)}
                                className={cn(
                                    "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                                    visibility === v ? "bg-white border-emerald-500 shadow-lg" : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                <span className={cn("text-sm font-bold", visibility === v ? "text-slate-900" : "text-slate-600")}>{v}</span>
                                {visibility === v && <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white animate-in zoom-in-50"><Check className="w-4 h-4" /></div>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-8">
                <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600"><Hash className="w-8 h-8" /></div>
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-slate-900">Tag Strategy</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Boost discoverability</p>
                    </div>
                    <textarea
                        value={hashtags}
                        onChange={(e) => onHashtagsChange(e.target.value)}
                        placeholder="#summer #vibes #marketing"
                        className="w-full h-48 bg-[#f7f9fb] border-transparent border-2 focus:border-emerald-500 rounded-2xl p-6 text-sm font-bold resize-none outline-none transition-all"
                    />
                    <button className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> Smart Suggest Tags
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const StepReview = ({ data, accounts }: { data: any, accounts: any[] }) => (
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Quality Assurance</h3>
            <p className="text-lg font-medium text-slate-500">Verification before distribution.</p>
        </div>

        <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Media Preview Bento */}
                <div className="w-full lg:w-80 space-y-6">
                    <div className="aspect-[4/5] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative ring-8 ring-slate-50">
                        {data.mediaUrl ? (
                            data.mediaType === 'VIDEO' ? (
                                <video src={data.mediaUrl} className="w-full h-full object-cover" muted autoPlay loop />
                            ) : (
                                <img src={data.mediaUrl} className="w-full h-full object-cover" />
                            )
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 italic"><ImageIcon className="w-10 h-10 mb-2 opacity-20" /> No assets</div>
                        )}
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                            <span className="text-[10px] text-white font-black uppercase tracking-tighter">{data.category}</span>
                        </div>
                    </div>
                </div>

                {/* Summary Bento */}
                <div className="flex-1 space-y-10">
                    <div className="space-y-3">
                        <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{data.title || 'Untitled Post'}</h4>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600">
                                    {acc.platform === 'instagram' && <Instagram className="w-3.5 h-3.5 text-pink-500" />}
                                    {acc.platform === 'tiktok' && <Smartphone className="w-3.5 h-3.5 text-slate-900" />}
                                    {acc.username}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-[2.5rem] p-10 space-y-6 border border-slate-100">
                        <p className="text-lg font-medium text-slate-600 leading-relaxed italic">"{data.caption}"</p>
                        {data.hashtags && <p className="text-sm font-black text-emerald-600 tracking-tight">{data.hashtags}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Launch Date</p>
                            <p className="text-sm font-bold text-slate-900">{new Date(data.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">T-Minus</p>
                            <p className="text-sm font-bold text-slate-900">Scheduled</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Scale</p>
                            <p className="text-sm font-bold text-slate-900">High Feed Priority</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const StepLaunch = ({ value, onChange, publishNow, onPublishNowChange }: { value: string, onChange: (v: string) => void, publishNow: boolean, onPublishNowChange: (v: boolean) => void }) => (
    <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700 pb-16">
        <div className="text-center space-y-4">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">The Launch</h3>
            <p className="text-lg font-medium text-slate-500">Seal the date your content goes live across the world.</p>

            <div className="flex items-center justify-center gap-4 pt-4">
                <button
                    onClick={() => onPublishNowChange(true)}
                    className={cn(
                        "px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-2",
                        publishNow ? "bg-slate-900 text-white shadow-xl scale-105" : "bg-white text-slate-400 hover:bg-slate-50"
                    )}
                >
                    <Zap className={cn("w-4 h-4", publishNow ? "text-yellow-400" : "text-slate-300")} /> Post Now
                </button>
                <button
                    onClick={() => onPublishNowChange(false)}
                    className={cn(
                        "px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-2",
                        !publishNow ? "bg-slate-900 text-white shadow-xl scale-105" : "bg-white text-slate-400 hover:bg-slate-50"
                    )}
                >
                    <Clock className={cn("w-4 h-4", !publishNow ? "text-blue-400" : "text-slate-300")} /> Schedule Later
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className={cn("bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-8 transition-all", publishNow && "opacity-40 grayscale pointer-events-none")}>
                <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600"><Calendar className="w-8 h-8" /></div>
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-slate-900">Distribution Window</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select date and time</p>
                    </div>
                    <input
                        type="datetime-local"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full bg-[#f7f9fb] border-2 border-transparent focus:border-emerald-500 rounded-2xl p-6 text-xl font-black outline-none transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className={cn("bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-8 transition-all", publishNow && "opacity-40 grayscale pointer-events-none")}>
                <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600"><Monitor className="w-8 h-8" /></div>
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-slate-900">Optimal Time Peak</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Suggested Window</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
                        <div>
                            <p className="text-emerald-800 font-black text-lg tracking-tight">Today 7:45 PM</p>
                            <p className="text-emerald-600/70 text-[10px] font-bold uppercase tracking-widest mt-1">High audience intent</p>
                        </div>
                        <button className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Use Optimal</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const PublishingOverlay = ({ posts: initialPosts, onClose }: { posts: any[], onClose: () => void }) => {
    const [posts, setPosts] = useState(initialPosts);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const postIds = initialPosts.map(p => p.id).filter(Boolean);
        if (postIds.length === 0) return;

        const channel = supabase
            .channel('publishing-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'posts',
                    filter: `id=in.(${postIds.map(id => `'${id}'`).join(',')})`
                },
                (payload: any) => {
                    setPosts(current => current.map(p => p.id === payload.new.id ? { ...p, ...payload.new, error_message: payload.new.error_message } : p));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [initialPosts]);

    useEffect(() => {
        const allFinished = posts.every(p => p.status === 'Published' || p.status === 'Failed');
        if (allFinished && posts.length > 0) {
            setIsComplete(true);
        }
    }, [posts]);

    const overallProgress = (posts.filter(p => p.status === 'Published').length / posts.length) * 100;
    const isFailed = posts.some(p => p.status === 'Failed');

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" />

            <div className="relative bg-white rounded-[3.5rem] w-full max-w-2xl shadow-[0_32px_128px_-12px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-white/20">
                <div className="p-10 sm:p-16 space-y-10 text-center">
                    <div className="relative mx-auto w-32 h-32">
                        <div className="absolute inset-0 rounded-full border-8 border-slate-100" />
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={351.85}
                                strokeDashoffset={351.85 - (351.85 * (overallProgress || 5)) / 100}
                                className={cn(
                                    "transition-all duration-1000",
                                    isFailed ? "text-red-500" : "text-emerald-500"
                                )}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {isComplete ? (
                                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in duration-500", isFailed ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500")}>
                                    {isFailed ? <X className="w-8 h-8" /> : <Check className="w-8 h-8" />}
                                </div>
                            ) : (
                                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                            {isComplete ? (isFailed ? "Issues Detected" : "Pure Gold!") : "Going Live..."}
                        </h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                            {isComplete
                                ? (isFailed ? "Some channels failed to receive your content. Check details below." : "Your post is now live across the world. Time to celebrate!")
                                : "We're currently relaying your media through our high-speed secure cloud to Meta's servers."}
                        </p>
                    </div>

                    <div className="space-y-3 pt-4">
                        {posts.map((post, idx) => (
                            <div key={post.id || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                                        {post.platforms?.[0] === 'instagram' ? <Instagram className="w-5 h-5 text-pink-600" /> : <Globe className="w-5 h-5 text-slate-400" />}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-slate-900 capitalize">{post.platforms?.[0] || 'Social'} Channel</p>
                                        <p className={cn(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            post.status === 'Published' ? "text-emerald-500" :
                                                post.status === 'Failed' ? "text-red-500" :
                                                    post.status === 'Processing' ? "text-blue-500 animate-pulse" : "text-slate-400"
                                        )}>
                                            {post.status || 'Scheduled'}
                                        </p>
                                        {post.status === 'Failed' && post.error_message && (
                                            <p className="text-[10px] text-red-400/80 mt-1 max-w-[200px] leading-tight font-medium">
                                                {post.error_message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {post.status === 'Published' ? (
                                    <Check className="w-5 h-5 text-emerald-500" />
                                ) : post.status === 'Failed' ? (
                                    <X className="w-5 h-5 text-red-500" />
                                ) : (
                                    <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                                )}
                            </div>
                        ))}
                    </div>

                    {!isComplete && (
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            Work in Background
                        </button>
                    )}

                    {isComplete && (
                        <button
                            onClick={onClose}
                            className={cn(
                                "w-full py-6 rounded-[2rem] text-lg font-black tracking-tight transition-all active:scale-95 shadow-xl",
                                isFailed ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                            )}
                        >
                            {isFailed ? "I'll Check It Out" : "Awesome, Got It!"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
