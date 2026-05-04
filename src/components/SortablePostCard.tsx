import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortablePostCardProps {
    post: any;
    onClick?: () => void;
}

export const SortablePostCard = ({ post, onClick }: SortablePostCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: post.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
        >
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                    <img src={post.thumbnail_url || post.media_url} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors uppercase tracking-tight line-clamp-2">{post.title || 'Untitled'}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium uppercase tracking-wider">{post.category || 'Post'}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-emerald-400"></div>
                    <div className="w-5 h-5 rounded-full border-2 border-white bg-purple-400 shadow-sm"></div>
                </div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString() : 'Draft'}
                </div>
            </div>
        </div>
    );
};
