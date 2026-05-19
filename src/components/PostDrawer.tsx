import React, { useState } from 'react';
import { X, Calendar, Hash, FileText, Smartphone, MessageCircle, Heart, Share2, Trash2, Edit, Instagram, Facebook, Youtube, Globe } from 'lucide-react';
import { usePostMutations } from '../features/posts/usePostMutations';

interface PostDrawerProps {
    post: any;
    onClose: () => void;
    onEdit?: (post: any) => void;
}

export const PostDrawer = ({ post, onClose, onEdit }: PostDrawerProps) => {
    const { deletePost, updatePost } = usePostMutations();
    const [newTag, setNewTag] = useState('');

    const handleAddTag = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTag.trim()) {
            const addedTag = newTag.trim().toLowerCase();
            const currentTags = Array.isArray(post.tags) ? post.tags : [];
            if (!currentTags.includes(addedTag)) {
                await updatePost.mutateAsync({ id: post.id, updates: { tags: [...currentTags, addedTag] } });
            }
            setNewTag('');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            await deletePost.mutateAsync(post.id);
            onClose();
        }
    };

    const statusStyles = post.status === 'Published'
        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
        : post.status === 'Scheduled'
            ? 'bg-teal-50 text-teal-600 border-teal-100'
            : 'bg-slate-50 text-slate-400 border-slate-100';

    const getDriveThumbnail = (url: string) => {
        if (!url) return null;
        const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/files\/([^?]+)/);
        if (match && (url.includes('drive.google.com') || url.includes('googleapis.com/drive'))) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        }
        return url;
    };

    const mediaUrl = post.thumbnail_url || getDriveThumbnail(post.media_url);

    return (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="w-full sm:w-[520px] bg-white h-full shadow-2xl relative animate-in slide-in-from-right duration-300 overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg uppercase tracking-tighter">ID: {post.id?.slice(0, 8)}</span>
                        <h3 className="font-black text-slate-900 truncate max-w-[280px] tracking-tight">{post.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDelete} className="p-2 hover:bg-rose-50 rounded-xl transition-all text-slate-400 hover:text-rose-500">
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Enhanced Mobile Preview */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-[300px] h-[580px] bg-slate-950 rounded-[3rem] border-[8px] border-slate-900 overflow-hidden shadow-2xl ring-4 ring-slate-100">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>

                            <div className="absolute inset-0">
                                {mediaUrl ? (
                                    (post.media_type?.toUpperCase() === 'VIDEO' || post.media_url?.match(/\.(mp4|webm|ogg|mov)$/i)) ? (
                                        <video
                                            src={post.media_url}
                                            poster={mediaUrl}
                                            className="w-full h-full object-cover opacity-90"
                                            muted
                                            autoPlay
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={mediaUrl}
                                            alt={post.title}
                                            className="w-full h-full object-cover opacity-90"
                                        />
                                    )
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 italic text-[10px]">No Media Uploaded</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>

                                <div className="absolute bottom-16 left-4 right-12 text-white space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-purple-500 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                                            {post.social_accounts?.platform === 'instagram' && <Instagram className="w-4 h-4 text-white" />}
                                            {post.social_accounts?.platform === 'facebook' && <Facebook className="w-4 h-4 text-white" />}
                                            {post.social_accounts?.platform === 'tiktok' && <Smartphone className="w-4 h-4 text-white" />}
                                            {post.social_accounts?.platform === 'youtube' && <Youtube className="w-4 h-4 text-white" />}
                                            {!['instagram', 'facebook', 'tiktok', 'youtube'].includes(post.social_accounts?.platform) && <Globe className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="text-xs font-bold font-['Outfit']">@{post.social_accounts?.username || 'pie_social'}</span>
                                    </div>
                                    <p className="text-[10px] leading-relaxed line-clamp-2 opacity-90 font-medium">{post.caption || 'No caption available'}</p>
                                    <p className="text-[10px] font-bold text-teal-300">{post.hashtags}</p>
                                </div>

                                <div className="absolute bottom-16 right-3 flex flex-col items-center gap-5 text-white">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-md"><Heart className="w-5 h-5" /></div>
                                        <span className="text-[8px] font-bold">12k</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-md"><MessageCircle className="w-5 h-5" /></div>
                                        <span className="text-[8px] font-bold">428</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-md"><Share2 className="w-5 h-5" /></div>
                                        <span className="text-[8px] font-bold">Share</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Smartphone className="w-3.5 h-3.5" /> Mobile Feed Preview
                        </p>
                    </div>

                    <div className="space-y-6 text-sm">
                        <div className="flex items-center justify-between">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusStyles}`}>
                                {post.status}
                            </span>
                            <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Type: {post.category || 'Post'}</span>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl"><Calendar className="w-5 h-5 text-slate-400" /></div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled For</label>
                                    <p className="font-black text-slate-900 text-lg tracking-tight">
                                        {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : 'As soon as possible'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-teal-500" /> Caption Context
                                </label>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed font-medium text-sm whitespace-pre-wrap">
                                    {post.caption || 'No caption has been written for this post yet.'}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Hash className="w-3.5 h-3.5 text-purple-500" /> Vault Categories
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(post.tags) && post.tags.map((t: string) => (
                                        <span key={t} className="text-slate-600 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                            #{t}
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="+ Add Tag"
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        className="text-xs bg-transparent border border-dashed border-slate-300 px-3 py-1.5 rounded-lg outline-none focus:border-purple-500 focus:bg-purple-50 w-28 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <button
                                onClick={() => onEdit?.(post)}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-2xl py-4 font-black transition-all hover:bg-slate-800 shadow-xl active:scale-95"
                            >
                                <Edit className="w-5 h-5" />
                                Edit Content
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
