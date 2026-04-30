import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';

export function usePosts(statusFilter?: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['posts', statusFilter],
        queryFn: async () => {
            let q = supabase
                .from('posts')
                .select('*')
                .order('scheduled_at', { ascending: false });

            if (statusFilter && statusFilter !== 'All') {
                q = q.eq('status', statusFilter);
            }

            const { data, error } = await q;
            if (error) throw error;
            return data || [];
        }
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
