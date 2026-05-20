import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';

export interface SocialAccount {
    id: string;
    platform: string;
    username: string;
    avatar_url?: string;
}

export function useAccounts() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['social_accounts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('social_accounts')
                .select('id, platform, username, avatar_url')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as SocialAccount[];
        },
    });

    // Real-time updates for account status/data
    useEffect(() => {
        const channel = supabase
            .channel('accounts-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'social_accounts' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['social_accounts'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return query;
}
