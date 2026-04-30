import React from 'react';
import { X, Play, Calendar, Hash, FileText, ExternalLink, Smartphone, MessageCircle, Heart, Share2 } from 'lucide-react';
import { Reel } from '../hooks/useReelsData';

interface PostDrawerProps {
    reel: Reel;
    onClose: () => void;
}

export const PostDrawer = ({ reel, onClose }: PostDrawerProps) => {
    return (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="w-[520px] bg-white h-full shadow-2xl relative animate-in slide-in-from-right duration-300 overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">{reel.id}</span>
                        <h3 className="font-bold text-slate-900 truncate max-w-[280px]">{reel.title}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Enhanced Mobile Preview (Loomly/Randolly Style) */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-[300px] h-[600px] bg-slate-950 rounded-[3rem] border-[8px] border-slate-900 overflow-hidden shadow-2xl ring-4 ring-slate-100">
                            {/* iPhone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>

                            {/* Content */}
                            <div className="absolute inset-0">
                                <img
                                    src={reel.thumbnail || 'https://via.placeholder.com/400x711?text=No+Thumbnail'}
                                    className="w-full h-full object-cover opacity-90"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>

                                {/* UI Overlays */}
                                <div className="absolute bottom-16 left-4 right-12 text-white space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-purple-500 border-2 border-white/20"></div>
                                        <span className="text-xs font-bold">@pie_social</span>
                                    </div>
                                    <p className="text-[10px] leading-relaxed line-clamp-2 opacity-90">{reel.caption}</p>
                                    <p className="text-[10px] font-bold text-teal-300">{reel.hashtags}</p>
                                </div>

                                {/* Interaction Buttons */}
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

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <a href={reel.videoLink} target="_blank" className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:scale-110 transition-all border border-white/20 shadow-xl">
                                        <Play className="fill-white w-5 h-5 ml-1" />
                                    </a>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Smartphone className="w-3 h-3" /> Live Mobile Preview
                        </p>
                    </div>

                    <div className="space-y-6 text-sm">
                        <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${reel.approved ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                {reel.status === 'Published' ? 'Published' : reel.approved ? '✔ Approved' : 'Pending'}
                            </span>
                            <span className="text-slate-400 font-medium">#{reel.category}</span>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-slate-50 rounded-lg"><Calendar className="w-4 h-4 text-slate-400" /></div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Scheduled For</label>
                                    <p className="font-semibold text-slate-700">{reel.piePosted || reel.charPosted || 'Not Scheduled'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-teal-500" /> Hook / Script
                                </label>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-600 leading-relaxed italic text-xs">
                                    "{reel.hook}"
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <Hash className="w-3.5 h-3.5 text-purple-500" /> Hashtags
                                </label>
                                <p className="text-teal-600 font-medium text-xs bg-teal-50/50 px-3 py-2 rounded-lg">{reel.hashtags}</p>
                            </div>
                        </div>

                        <a href={reel.script || '#'} target="_blank" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]">
                            Full Script <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
