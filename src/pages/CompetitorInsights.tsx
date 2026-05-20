import React from 'react';
import { Search, Sparkles, Clock, Rocket, BarChart3, Globe } from 'lucide-react';

export const CompetitorInsights = () => {
    return (
        <div className="h-[calc(100vh-120px)] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
                {/* Icon Cluster */}
                <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
                    <div className="relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-2xl shadow-purple-500/10">
                        <Search className="w-16 h-16 text-purple-600 animate-bounce duration-[3000ms]" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 rounded-full border border-purple-100">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Coming Soon</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Deep Dive into <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Competitor DNA</span>
                    </h1>

                    <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                        We're building an advanced AI engine to track, analyze, and reverse-engineer your competitors' high-performing content in real-time.
                    </p>
                </div>

                {/* Features Preview */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-xl mx-auto">
                    {[
                        { icon: BarChart3, label: 'Trend Analysis' },
                        { icon: Rocket, label: 'Outlier Alerts' },
                        { icon: Globe, label: 'Global Benchmarks' },
                    ].map((f) => (
                        <div key={f.label} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group border-b-2 hover:border-b-purple-500">
                            <f.icon className="w-5 h-5 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{f.label}</p>
                        </div>
                    ))}
                </div>

                <div className="pt-6">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all cursor-wait">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-widest">Arriving Late Q2</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
