import React from 'react';
import { Share2, Heart, MessageCircle, BarChart2, Calendar, CheckCircle2, Instagram, Facebook, Smartphone, Youtube, Globe, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
    post: any;
    onClick?: () => void;
    mode?: 'grid' | 'list';
}

export const PostCard = ({ post, onClick, mode = 'grid' }: PostCardProps) => {
    const navigate = useNavigate();
    const isFailed = post.status?.toLowerCase() === 'failed';
    const isAuthError = post.error_message?.includes('AUTH_ERROR_190');
    const getDriveThumbnail = (url: string) => {
        if (!url) return null;
        const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/files\/([^?]+)/);
        if (match && (url.includes('drive.google.com') || url.includes('googleapis.com/drive'))) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        }
        return url;
    };

    const mediaUrl = post.thumbnail_url || getDriveThumbnail(post.media_url);

    if (mode === 'list') {
        return (
            <div
                className="group flex flex-col sm:flex-row items-center gap-4 bg-white rounded-[2rem] p-4 border border-slate-100 hover:border-emerald-100 hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.15)] transition-all duration-300 cursor-pointer"
                onClick={onClick}
            >
                <div className="w-full sm:w-28 h-28 shrink-0 rounded-[1.5rem] overflow-hidden bg-slate-100 relative aspect-video sm:aspect-square">
                    {mediaUrl ? (
                        <img src={mediaUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs">No Preview</div>
                    )}
                </div>
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${post.status?.toLowerCase() === 'published' ? 'bg-emerald-50 text-emerald-600' :
                            post.status?.toLowerCase() === 'failed' ? 'bg-red-50 text-red-600' :
                                'bg-orange-50 text-orange-600'
                            }`}>
                            {post.status}
                        </span>
                        {post.status?.toLowerCase() === 'failed' && (
                            <span className="text-[10px] font-bold text-red-400 truncate max-w-[200px]" title={post.error_message || 'Unknown Error'}>
                                {post.error_message || 'Publishing Failed'}
                            </span>
                        )}
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{post.category || 'Reel'}</span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <div className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Draft'}</span>
                        </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors mb-4">{post.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-500">
                        <div className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /><span className="text-xs font-bold">{post.likes?.toLocaleString() || '1.2k'}</span></div>
                        <div className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /><span className="text-xs font-bold">{post.comments?.toLocaleString() || '48'}</span></div>
                        <div className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /><span className="text-xs font-bold">{post.views?.toLocaleString() || '12.4k'}</span></div>
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-end gap-3 shrink-0 pl-6 border-l border-slate-100">
                    <div className="flex items-center">
                        {post.social_accounts && (
                            <div className="w-10 h-10 rounded-[1rem] bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                                {post.social_accounts.platform === 'instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
                                {post.social_accounts.platform === 'facebook' && <Facebook className="w-5 h-5 text-blue-600" />}
                                {post.social_accounts.platform === 'tiktok' && <Smartphone className="w-5 h-5 text-slate-900" />}
                                {post.social_accounts.platform === 'youtube' && <Youtube className="w-5 h-5 text-red-500" />}
                                {!['instagram', 'facebook', 'tiktok', 'youtube'].includes(post.social_accounts.platform) && <Globe className="w-5 h-5 text-slate-400" />}
                            </div>
                        )}
                    </div>
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-colors">Details →</button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="group relative bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:border-emerald-100 hover:shadow-[0_20px_50px_-20px_rgba(16,185,129,0.15)] transition-all duration-500 flex flex-col cursor-pointer"
            onClick={onClick}
        >
            {/* Media Preview */}
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                {mediaUrl ? (
                    (post.media_type?.toUpperCase() === 'VIDEO' || post.media_url?.match(/\.(mp4|webm|ogg|mov)$ /i)) ? (
                        <video
                            src={post.media_url}
                            poster={mediaUrl}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            muted
                            autoPlay
                            loop
                            playsInline
                        />
                    ) : (
                        <img
                            src={mediaUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-xs">No Preview</div>
                )}
                {post.media_type?.toUpperCase() === 'VIDEO' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                            <Share2 className="w-6 h-6 text-white fill-white rotate-90" /> {/* Using share icon as a makeshift play icon for now or I could use Play if I import it */}
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60"></div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${post.status?.toLowerCase() === 'published' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        post.status?.toLowerCase() === 'failed' ? 'bg-red-500/20 text-red-500 border-red-500/30 pt-[5px]' :
                            'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }`}>
                        {post.status}
                    </span>
                    {isFailed && (
                        <div className="flex flex-col gap-1.5 items-end">
                            <div className="px-2 py-1 bg-red-500/90 backdrop-blur-md text-white border border-red-500/50 rounded-lg text-[9px] font-bold max-w-[180px] line-clamp-3 text-right shadow-lg leading-tight">
                                {post.error_message || 'Check Instagram API logs'}
                            </div>
                            {isAuthError && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate('/settings?tab=social');
                                    }}
                                    className="bg-white text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-red-50 transition-all flex items-center gap-1.5 border border-red-200"
                                >
                                    <RefreshCcw className="w-2.5 h-2.5" />
                                    Reconnect Account
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Metrics Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-white" />
                            <span className="text-[10px] font-bold">{post.likes?.toLocaleString() || '1.2k'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 fill-white" />
                            <span className="text-[10px] font-bold">{post.comments?.toLocaleString() || '48'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md border border-white/10">
                        <BarChart2 className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{post.views?.toLocaleString() || '12.4k'}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{post.category || 'Reel'}</span>
                    <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase">{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Draft'}</span>
                    </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-3 flex-1 group-hover:text-emerald-600 transition-colors">
                    {post.title}
                </h3>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                    <div className="flex -space-x-1.5 items-center">
                        {post.social_accounts && (
                            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden mr-2">
                                {post.social_accounts.platform === 'instagram' && <Instagram className="w-3.5 h-3.5 text-pink-500" />}
                                {post.social_accounts.platform === 'facebook' && <Facebook className="w-3.5 h-3.5 text-blue-600" />}
                                {post.social_accounts.platform === 'tiktok' && <Smartphone className="w-3.5 h-3.5 text-slate-900" />}
                                {post.social_accounts.platform === 'youtube' && <Youtube className="w-3.5 h-3.5 text-red-500" />}
                                {!['instagram', 'facebook', 'tiktok', 'youtube'].includes(post.social_accounts.platform) && <Globe className="w-3.5 h-3.5 text-slate-400" />}
                            </div>
                        )}
                        <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center overflow-hidden">
                            <Share2 className="w-2.5 h-2.5 text-white" />
                        </div>
                    </div>
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-colors">
                        Details →
                    </button>
                </div>
            </div>
        </div>
    );
};

