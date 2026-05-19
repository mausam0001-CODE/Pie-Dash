import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';
import { useAccountContext } from '../accounts/AccountContext';

export function usePosts(statusFilter?: string) {
    const queryClient = useQueryClient();
    const { activeAccount } = useAccountContext();

    const query = useQuery({
        queryKey: ['posts', statusFilter, activeAccount?.id],
        queryFn: async () => {
            let q = supabase
                .from('posts')
                .select('*, social_accounts(*)')
                .order('scheduled_at', { ascending: false });

            if (activeAccount) {
                q = q.eq('social_account_id', activeAccount.id);
            }

            if (statusFilter && statusFilter !== 'All') {
                const dbStatus = statusFilter === 'Drafts' ? 'Draft' : statusFilter;
                q = q.eq('status', dbStatus);
            }

            const { data, error } = await q;
            if (error) throw error;
            return data || [];
        },
        enabled: !!activeAccount
    });

    // Real-time updates
    useEffect(() => {
        const channel = supabase
            .channel('posts-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return query;
}

export function useCreatePost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newPost: any) => {
            const { data, error } = await supabase
                .from('posts')
                .insert([newPost])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
}

export function useUpdatePost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
            const { data, error } = await supabase
                .from('posts')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
}
