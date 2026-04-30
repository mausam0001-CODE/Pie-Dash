import React from 'react';
import { Film, CheckCircle, Send, TrendingUp } from 'lucide-react';
import { Reel } from '../hooks/useReelsData';

export const StatsSection = ({ data }: { data: Reel[] }) => {
    const published = data.filter(d => d.piePosted).length;

    const stats = [
        { label: 'Total Library Content', value: data.length.toLocaleString(), diff: '+12%', icon: Film, color: 'text-teal-600', bg: 'bg-teal-50', gradient: 'from-teal-500 to-emerald-400' },
        { label: 'Approved & Ready', value: data.filter(d => d.approved).length.toLocaleString(), diff: '+5%', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50', gradient: 'from-purple-500 to-indigo-400' },
        { label: 'Successfully Published', value: published.toLocaleString(), diff: '+18%', icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-500 to-green-400' },
        { label: 'Engagement Rate', value: '8.4%', diff: '+1.2%', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', gradient: 'from-blue-500 to-cyan-400' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <div key={i} className="group relative overflow-hidden bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(20,184,166,0.15)] transition-all duration-500 border border-slate-100 hover:border-teal-100">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-[0.03] rounded-bl-full group-hover:scale-150 group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none`}></div>

                    <div className="flex items-start justify-between relative z-10">
                        <div className={`p-4 rounded-[1.25rem] ${stat.bg} ${stat.color} transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
                            <stat.icon className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50/80 px-3 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-sm border border-teal-100">
                            {stat.diff}
                        </span>
                    </div>

                    <div className="mt-8 relative z-10">
                        <h3 className="text-[2.5rem] leading-none font-black text-slate-900 font-display tracking-tight group-hover:text-teal-600 transition-colors duration-300">
                            {stat.value}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                            {stat.label}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};
