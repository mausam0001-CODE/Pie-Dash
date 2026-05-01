import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Globe, FileText, Image as ImageIcon, Smartphone, Settings, CheckCircle, Instagram, Twitter, Facebook, Youtube, Plus, Save, Send, Eye, Sparkles, Calendar, Clock } from 'lucide-react';
import { Reel } from '../hooks/useReelsData';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface PostBuilderProps {
    onClose: () => void;
    initialReel?: Reel;
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

export const PostBuilder = ({ onClose, initialReel }: PostBuilderProps) => {
    const { session } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isScheduling, setIsScheduling] = useState(false);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
    const [postData, setPostData] = useState({
        title: initialReel?.title || '',
        caption: initialReel?.description || '',
        mediaUrl: initialReel?.media_url || '',
        category: initialReel?.category || 'Reel',
        hashtags: Array.isArray(initialReel?.hashtags) ? initialReel?.hashtags : (initialReel?.hashtags ? [initialReel.hashtags] : []),
        scheduledAt: new Date().toISOString().substring(0, 16), // Format for datetime-local
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 7));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSchedule = async () => {
        if (!session?.user) return;
        setIsScheduling(true);
        try {
            const { error } = await supabase.from('posts').insert([{
                user_id: session.user.id,
                title: postData.title,
                caption: postData.caption,
                media_url: postData.mediaUrl,
                platforms: selectedPlatforms.join(','),
                scheduled_at: new Date(postData.scheduledAt).toISOString(),
                status: 'Scheduled'
            }]);

            if (error) throw error;

            alert('Post scheduled successfully via Supabase!');
            onClose();
        } catch (error: any) {
            console.error('Error scheduling post:', error);
            alert('Error scheduling post: ' + error.message);
        } finally {
            setIsScheduling(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <StepAccounts selected={selectedPlatforms} onToggle={(p) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} />;
            case 2: return <StepBasicInfo value={postData.title} onChange={(v) => setPostData(d => ({ ...d, title: v }))} />;
            case 3: return <StepGenericContent caption={postData.caption} onCaptionChange={(v) => setPostData(d => ({ ...d, caption: v }))} initialMedia={postData.mediaUrl} />;
            case 4: return <StepFineTune platforms={selectedPlatforms} />;
            case 5: return <StepSettings />;
            case 6: return <StepReview data={postData} platforms={selectedPlatforms} />;
            case 7: return <StepSchedule value={postData.scheduledAt} onChange={(v) => setPostData(d => ({ ...d, scheduledAt: v }))} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={onClose}></div>

            <div className="bg-slate-50 border border-slate-200/50 w-full h-full max-w-[1400px] max-h-[92vh] rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.15)] relative flex flex-col overflow-hidden">
                {/* Header with Progress Bar */}
                <div className="p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Build New Post</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Multi-Channel Distribution</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between px-2 relative">
                        {/* Progress Line Background */}
                        <div className="absolute top-[18px] left-0 right-0 h-1 bg-slate-100 -z-10 rounded-full mx-12"></div>
                        {/* Progress Line Active */}
                        <div
                            className="absolute top-[18px] left-0 h-1 bg-green-500 -z-10 transition-all duration-500 ease-out rounded-full mx-12"
                            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        ></div>

                        {STEPS.map((step, i) => {
                            const stepNum = i + 1;
                            const isActive = currentStep === stepNum;
                            const isPast = currentStep > stepNum;

                            return (
                                <div key={step} className="flex flex-col items-center gap-3 relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${isActive ? 'bg-green-500 text-white shadow-xl shadow-green-200 scale-110 ring-4 ring-green-50' :
                                        isPast ? 'bg-green-100 text-green-600' :
                                            'bg-white text-slate-300 border-2 border-slate-100'
                                        }`}>
                                        {isPast ? <CheckCircle className="w-5 h-5" /> : stepNum}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'text-green-600' : 'text-slate-400'}`}>{step}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-12">
                    {renderStep()}
                </div>

                {/* Footer Navigation */}
                <div className="p-8 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between sticky bottom-0 z-20">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${currentStep === 1 ? 'opacity-0' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" /> Back to {STEPS[currentStep - 2]}
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            disabled={isScheduling}
                            className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            Save as Draft
                        </button>
                        <button
                            onClick={currentStep === 7 ? handleSchedule : nextStep}
                            disabled={isScheduling}
                            className={`flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-teal-500 to-emerald-400 text-white rounded-[1.5rem] font-black hover:from-teal-600 hover:to-emerald-500 transition-all shadow-[0_8px_30px_-4px_rgba(20,184,166,0.25)] active:scale-95 ${isScheduling ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isScheduling ? 'Scheduling...' : currentStep === 7 ? 'Schedule Post' : `Next: ${STEPS[currentStep] || 'Finish'}`} <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepAccounts = ({ selected, onToggle }: { selected: string[], onToggle: (p: string) => void }) => (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
            <h3 className="text-3xl font-black text-slate-900">Select Accounts</h3>
            <p className="text-slate-500 font-medium">Choose where you want to publish this content.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {['instagram', 'tiktok', 'facebook', 'youtube'].map(p => (
                <button
                    key={p}
                    onClick={() => onToggle(p)}
                    className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 group ${selected.includes(p) ? 'border-green-500 bg-green-50 ring-4 ring-green-500/5 shadow-xl' : 'border-slate-100 bg-white hover:border-slate-300'
                        }`}
                >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${selected.includes(p) ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-50 text-slate-300 group-hover:text-slate-400'
                        }`}>
                        {p === 'instagram' && <Instagram className="w-8 h-8" />}
                        {p === 'tiktok' && <Smartphone className="w-8 h-8" />}
                        {p === 'facebook' && <Facebook className="w-8 h-8" />}
                        {p === 'youtube' && <Youtube className="w-8 h-8" />}
                    </div>
                    <span className={`font-black text-sm uppercase tracking-widest ${selected.includes(p) ? 'text-green-700' : 'text-slate-400'}`}>
                        {p.toUpperCase()}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected.includes(p) ? 'border-green-500 bg-green-500 text-white' : 'border-slate-100'
                        }`}>
                        {selected.includes(p) && <CheckCircle className="w-4 h-4" />}
                    </div>
                </button>
            ))}
        </div>
    </div>
);

const StepBasicInfo = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
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
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-lg font-bold outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500/20"
                />
            </div>
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Labels</label>
                <div className="flex flex-wrap gap-2">
                    {['Product', 'Education', 'Vlog', 'Tutorial'].map(l => (
                        <button key={l} className="px-5 py-2.5 rounded-xl border-2 border-slate-100 text-sm font-bold text-slate-500 hover:border-green-500 hover:text-green-600 transition-all">{l}</button>
                    ))}
                    <button className="px-5 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 flex items-center gap-2 hover:bg-slate-50"><Plus className="w-4 h-4" /> Add Label</button>
                </div>
            </div>
        </div>
    </div>
);

const StepGenericContent = ({ caption, onCaptionChange, initialMedia }: { caption: string, onCaptionChange: (v: string) => void, initialMedia?: string }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-8">
            <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900">Core Content</h3>
                <p className="text-slate-500 font-medium">This will be the default copy for all selected platforms.</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-500" /> Master Caption
                    </label>
                    <textarea
                        value={caption}
                        onChange={(e) => onCaptionChange(e.target.value)}
                        placeholder="Write your primary message here..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm outline-none focus:ring-4 focus:ring-green-500/5 min-h-[200px] leading-relaxed font-medium"
                    />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg"><Sparkles className="w-3 h-3" /> Optimize for engagement</span>
                    <span>120 / 2200 characters</span>
                </div>
            </div>
        </div>
        <div className="space-y-8">
            <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900">Main Assets</h3>
                <p className="text-slate-500 font-medium">Upload the primary video or images.</p>
            </div>
            <div className="bg-white border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-6 h-[400px] group hover:border-green-200 transition-all">
                {initialMedia ? (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl">
                        <img src={initialMedia} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl"><ImageIcon className="w-4 h-4" /> Change Asset</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:bg-green-50 group-hover:text-green-500 transition-all">
                            <ImageIcon className="w-10 h-10" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900">Drag & Drop Media</p>
                            <p className="text-sm text-slate-400 mt-1">Videos up to 2GB or high-res images.</p>
                        </div>
                        <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl">Browse Files</button>
                    </>
                )}
            </div>
        </div>
    </div>
);

const StepFineTune = ({ platforms }: { platforms: string[] }) => (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
            <h3 className="text-3xl font-black text-slate-900">Fine-Tune by Channel</h3>
            <p className="text-slate-500 font-medium">Customise descriptions and media for each social network.</p>
        </div>

        <div className="flex gap-8">
            {/* Platform Selector Sidebar */}
            <div className="w-64 space-y-2">
                {platforms.map(p => (
                    <button key={p} className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all text-left group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-green-50 group-hover:text-green-600">
                                {p === 'instagram' && <Instagram className="w-4 h-4" />}
                                {p === 'facebook' && <Facebook className="w-4 h-4" />}
                            </div>
                            <span className="text-sm font-black text-slate-700 capitalize">{p}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-10 flex-1 grid grid-cols-1 xl:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-black text-slate-900">Instagram Version</h4>
                            <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-lg">
                                <button className="p-2 bg-white shadow-sm rounded-md text-[10px] font-black uppercase text-green-600">Reel</button>
                                <button className="p-2 text-[10px] font-black uppercase text-slate-400">Post</button>
                            </div>
                        </div>
                        <textarea className="w-full h-[250px] bg-slate-50/50 border border-slate-100 rounded-2xl p-6 text-sm font-medium outline-none focus:ring-4 focus:ring-green-500/5 shadow-inner" placeholder="Instagram caption..." />
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Specifics</p>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="w-10 h-5 bg-green-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                                <span className="text-xs font-bold text-slate-700">Share to Feed</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="w-10 h-5 bg-slate-200 rounded-full relative"><div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                                <span className="text-xs font-bold text-slate-700">Add to Profile Grid</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border border-slate-100 p-8">
                        <div className="w-[280px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border-[6px] border-white relative overflow-hidden ring-4 ring-slate-100">
                            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/20 to-transparent z-10 flex items-center justify-between px-6">
                                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200" /><span className="text-[10px] text-white font-bold">Your Store</span></div>
                                <Instagram className="w-4 h-4 text-white" />
                            </div>
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center italic text-slate-400 text-xs">IG Preview</div>
                        </div>
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smartphone className="w-3.5 h-3.5" /> Mobile Feed Preview</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const StepSettings = () => (
    <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
            <h3 className="text-3xl font-black text-slate-900">Posting Settings</h3>
            <p className="text-slate-500 font-medium">Fine-tune the technical metadata for your social ports.</p>
        </div>
        <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600"><Globe className="w-6 h-6" /></div>
                <div className="space-y-4">
                    <h4 className="font-black text-slate-900">Visibility Settings</h4>
                    <div className="space-y-3">
                        {['Public (Recommended)', 'Team Only', 'Private Draft'].map(o => (
                            <label key={o} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-teal-50/50 transition-all border border-transparent hover:border-teal-100">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${o.includes('Public') ? 'border-teal-500' : 'border-slate-200'}`}>
                                    {o.includes('Public') && <div className="w-2.5 h-2.5 bg-teal-500 rounded-full" />}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{o}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600"><Settings className="w-6 h-6" /></div>
                <div className="space-y-4">
                    <h4 className="font-black text-slate-900">Optimization</h4>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <span className="text-xs font-bold text-slate-700">Auto-Hashtags</span>
                            <div className="w-10 h-5 bg-purple-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                        </label>
                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <span className="text-xs font-bold text-slate-700">AI Hook Analysis</span>
                            <div className="w-10 h-5 bg-slate-200 rounded-full relative"><div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const StepReview = ({ data, platforms }: { data: any, platforms: string[] }) => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
            <h3 className="text-3xl font-black text-slate-900">Final Review</h3>
            <p className="text-slate-500 font-medium">Verify all platform versions before commitment.</p>
        </div>
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-50">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-slate-100 rounded-[2rem] overflow-hidden shadow-lg">
                        {data.mediaUrl ? <img src={data.mediaUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 italic text-[10px]">Asset</div>}
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900">{data.title || 'Untitled Post'}</h4>
                        <div className="flex gap-2 mt-2">
                            {platforms.map(p => (
                                <span key={p} className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg uppercase">{p}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Reach</p>
                    <p className="text-3xl font-black text-slate-900">~ 12.4k</p>
                </div>
            </div>
            <div className="space-y-6">
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-3">{data.caption || 'No caption provided.'}</p>
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Publish Date</p>
                        <p className="text-sm font-bold text-slate-900">Oct 12, 2026</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                        <p className="text-sm font-bold text-slate-900">09:00 AM (EST)</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approval</p>
                        <p className="text-sm font-bold text-orange-500">Auto-Post Mode</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const StepSchedule = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
            <h3 className="text-3xl font-black text-slate-900">Set Schedule</h3>
            <p className="text-slate-500 font-medium">When should this post go live across the world?</p>
        </div>
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 space-y-10">
            <div className="grid grid-cols-1 gap-10">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Publish Date & Time</label>
                    <div className="relative">
                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        <input
                            type="datetime-local"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-6 py-5 text-sm font-black outline-none focus:ring-4 focus:ring-green-500/5 shadow-inner"
                        />
                    </div>
                </div>
            </div>
            <div className="p-8 bg-green-50 border border-green-100 rounded-[2rem] flex items-center gap-6">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg"><Clock className="w-7 h-7" /></div>
                <div>
                    <h5 className="text-lg font-black text-green-900">Optimal Time Detected</h5>
                    <p className="text-sm font-medium text-green-600">Based on your followers, **09:00 AM** gets 2x engagement.</p>
                </div>
                <button className="ml-auto bg-green-600 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-green-700 shadow-lg">Use Optimal</button>
            </div>
        </div>
    </div>
);
