import React from 'react';
import { usePosts } from '../features/posts/usePosts';
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortablePostCard } from '../components/SortablePostCard';
import { FileText, CheckCircle2, Clock, Send, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

const columns = [
    { id: 'Draft', title: 'Brainstorming', icon: FileText, color: 'text-slate-400', bg: 'bg-slate-50' },
    { id: 'Approved', title: 'Ready for Review', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Scheduled', title: 'In Queue', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'Published', title: 'Live on Feed', icon: Send, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Failed', title: 'Blocked', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
];

export const Workflow = () => {
    const { data: posts = [], isLoading } = usePosts();
    const queryClient = useQueryClient();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const postId = active.id as string;
        const overId = over.id as string;

        // Check if dropped on a column
        const column = columns.find(c => c.id === overId);
        if (column) {
            const post = posts.find((p: any) => p.id === postId);
            if (post && post.status !== column.id) {
                // Optimistic update
                queryClient.setQueryData(['posts'], (old: any) =>
                    old.map((p: any) => p.id === postId ? { ...p, status: column.id } : p)
                );

                const { error } = await supabase
                    .from('posts')
                    .update({ status: column.id })
                    .eq('id', postId);

                if (error) {
                    console.error('Failed to update status:', error);
                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                }
            }
        }
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-[10px]">Connecting Pipeline...</div>;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-8 animate-in fade-in duration-700 h-[calc(100vh-10rem)] flex flex-col">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">Deployment Pipeline</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Track asset progression from concept to live</p>
                </div>

                <div className="flex-1 flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                    {columns.map((column) => {
                        const columnPosts = posts.filter((p: any) => p.status === column.id);
                        return (
                            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${column.bg} ${column.color}`}>
                                            <column.icon className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm whitespace-nowrap">{column.title}</h3>
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{columnPosts.length}</span>
                                    </div>
                                </div>

                                <SortableContext
                                    id={column.id}
                                    items={columnPosts.map((p: any) => p.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div
                                        className="flex-1 bg-slate-100/50 rounded-3xl p-4 gap-4 flex flex-col overflow-y-auto min-h-[100px]"
                                    >
                                        {columnPosts.map((post: any) => (
                                            <SortablePostCard key={post.id} post={post} />
                                        ))}

                                        {column.id === 'Draft' && (
                                            <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-center gap-2 group">
                                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold uppercase tracking-widest">New Post</span>
                                            </button>
                                        )}
                                    </div>
                                </SortableContext>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DndContext>
    );
};
