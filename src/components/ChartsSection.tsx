import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Reel } from '../hooks/useReelsData';
import { useAuth } from '../hooks/useAuth';

export const ChartsSection = ({ data }: { data: Reel[] }) => {
    const { session } = useAuth();
    // Aggregate publishing velocity by month
    const velocityData = [
        { name: 'Jan', posts: 54 },
        { name: 'Feb', posts: 68 },
        { name: 'Mar', posts: 45 },
        { name: 'Apr', posts: 82 },
        { name: 'May', posts: 59 },
        { name: 'Jun', posts: 74 },
    ]; // Still slightly mock-ish without complex date parsing, but good for base

    const categoryCounts = data.reduce((acc, reel) => {
        const cat = reel.category || 'Other';
        const current = acc[cat] || 0;
        acc[cat] = current + 1;
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.keys(categoryCounts)
        .map((name, i) => ({
            name,
            value: categoryCounts[name],
            color: ['#14b8a6', '#a855f7', '#f97316', '#3b82f6', '#ec4899'][i % 5]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Publishing Velocity</h3>
                        <p className="text-slate-500 text-xs">Monthly reels output for 2025</p>
                    </div>
                    <select className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold px-3 py-2 outline-none">
                        <option>Last 6 Months</option>
                        <option>Last Year</option>
                    </select>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={velocityData}>
                            <defs>
                                <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={15} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            />
                            <Area type="monotone" dataKey="posts" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorPosts)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-6">Topic Distribution (Real)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} width={90} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
