import React, { useState } from 'react';
import { ExternalLink, Download, Search, LayoutList } from 'lucide-react';
import { Reel } from '../hooks/useReelsData';

export const ReelsTable = ({ data, onRowClick }: { data: Reel[], onRowClick: (reel: Reel) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const filteredData = data.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-50/30">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl hidden sm:block">
                        <LayoutList className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-2xl font-display tracking-tight">Content Pipeline ({data.length})</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">Manage, approve, and track your active strategy</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, keyword..."
                            className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[1rem] text-sm font-medium focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none w-full md:w-64 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-[1rem] text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95">
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80">
                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 min-w-[120px]">Post ID</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">Title & Topic</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 hidden md:table-cell">Hook Preview</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 text-center">Status</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 hidden sm:table-cell">Publish Date</th>
                            <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 text-right">Review</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {currentItems.map((row) => (
                            <tr
                                key={row.id}
                                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                onClick={() => onRowClick(row)}
                            >
                                <td className="px-8 py-6">
                                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-[0.5rem] tracking-wide inline-block group-hover:bg-teal-100 group-hover:-translate-y-0.5 transition-all">{row.id}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-base font-bold text-slate-900 truncate max-w-[280px] font-display">{row.title}</p>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">{row.category}</p>
                                </td>
                                <td className="px-8 py-6 hidden md:table-cell">
                                    <p className="text-sm text-slate-500 font-medium truncate max-w-[240px] leading-relaxed group-hover:text-slate-700 transition-colors">{row.hook}</p>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <StatusBadge approved={row.approved} posted={!!(row.piePosted || row.charPosted)} />
                                </td>
                                <td className="px-8 py-6 text-sm font-bold text-slate-500 hidden sm:table-cell">
                                    {row.piePosted || row.charPosted ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            {row.piePosted || row.charPosted}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 hover:shadow-sm transition-all active:scale-95 inline-flex items-center justify-center">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {currentItems.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-8 py-12 text-center">
                                    <p className="text-slate-500 font-medium">No results found for "{searchTerm}"</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30 rounded-b-[2.5rem]">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Showing {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={`px-4 py-2 flex items-center justify-center rounded-[0.75rem] border border-slate-200 text-sm font-bold transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-white text-slate-600 hover:bg-slate-50 active:scale-95 shadow-sm'}`}
                        disabled={currentPage === 1}
                    >Previous</button>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={`px-6 py-2 flex items-center justify-center rounded-[0.75rem] border border-slate-200 text-sm font-bold transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : 'bg-white text-slate-600 hover:bg-slate-50 active:scale-95 shadow-sm'}`}
                        disabled={currentPage === totalPages}
                    >Next</button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ approved, posted }: { approved: boolean, posted: boolean }) => {
    if (posted) return <span className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm">Published</span>;
    if (approved) return <span className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest bg-purple-50 border border-purple-100 text-purple-600 shadow-sm">Approved</span>;
    return <span className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest bg-slate-100 border border-slate-200 text-slate-500 shadow-sm">Draft</span>;
};
