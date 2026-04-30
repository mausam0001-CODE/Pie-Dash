import React from 'react';

const pulse = 'animate-pulse bg-slate-100 rounded-xl';

/** Base shimmer block */
export const SkeletonBlock = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
    <div className={`${pulse} ${className}`} style={style} />
);

/** Dashboard stat card skeleton */
export const StatCardSkeleton = () => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
            <SkeletonBlock className="w-10 h-10 !rounded-2xl" />
            <SkeletonBlock className="w-16 h-5 !rounded-full" />
        </div>
        <SkeletonBlock className="w-2/3 h-4" />
        <SkeletonBlock className="w-1/2 h-8" />
    </div>
);

/** Post/library card skeleton */
export const PostCardSkeleton = () => (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <SkeletonBlock className="w-full h-40 !rounded-none" />
        <div className="p-4 space-y-3">
            <SkeletonBlock className="w-3/4 h-4" />
            <SkeletonBlock className="w-1/2 h-3" />
            <div className="flex items-center justify-between pt-2">
                <SkeletonBlock className="w-16 h-5 !rounded-full" />
                <SkeletonBlock className="w-12 h-4" />
            </div>
        </div>
    </div>
);

/** Analytics chart area skeleton */
export const ChartSkeleton = () => (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <SkeletonBlock className="w-40 h-5" />
            <SkeletonBlock className="w-24 h-8 !rounded-xl" />
        </div>
        <div className="flex items-end gap-3 h-48">
            {[60, 80, 50, 90, 70, 100, 65, 85, 55, 75, 95, 45].map((h, i) => (
                <SkeletonBlock key={i} className="flex-1" style={{ height: `${h}%` }} />
            ))}
        </div>
    </div>
);

/** Kanban column skeleton */
export const KanbanColumnSkeleton = () => (
    <div className="flex-shrink-0 w-80">
        <div className="flex items-center gap-3 mb-4 px-2">
            <SkeletonBlock className="w-8 h-8 !rounded-xl" />
            <SkeletonBlock className="w-32 h-4" />
            <SkeletonBlock className="w-6 h-5 !rounded-full" />
        </div>
        <div className="bg-slate-100/50 rounded-3xl p-4 space-y-4 min-h-[200px]">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-start gap-3">
                        <SkeletonBlock className="w-12 h-12 !rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <SkeletonBlock className="w-full h-3" />
                            <SkeletonBlock className="w-2/3 h-3" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="flex -space-x-1">
                            <SkeletonBlock className="w-5 h-5 !rounded-full" />
                            <SkeletonBlock className="w-5 h-5 !rounded-full" />
                        </div>
                        <SkeletonBlock className="w-16 h-3" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/** Table row skeleton */
export const TableRowSkeleton = () => (
    <tr>
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <SkeletonBlock className="w-10 h-10 !rounded-xl shrink-0" />
                <div className="space-y-2">
                    <SkeletonBlock className="w-32 h-3" />
                    <SkeletonBlock className="w-20 h-2" />
                </div>
            </div>
        </td>
        <td className="px-6 py-4"><SkeletonBlock className="w-16 h-4" /></td>
        <td className="px-6 py-4"><SkeletonBlock className="w-12 h-4" /></td>
        <td className="px-6 py-4"><SkeletonBlock className="w-20 h-6 !rounded-full" /></td>
    </tr>
);

/** Dashboard: full-page skeleton */
export const DashboardSkeleton = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartSkeleton />
            <ChartSkeleton />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <SkeletonBlock className="w-40 h-5" />
            </div>
            <table className="w-full">
                <tbody className="divide-y divide-slate-50">
                    {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} />)}
                </tbody>
            </table>
        </div>
    </div>
);
