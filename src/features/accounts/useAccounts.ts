import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface SocialAccount {
    id: string;
    platform: string;
    username: string;
    avatar_url?: string;
}

export function useAccounts() {
    return useQuery({
        queryKey: ['social_accounts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('social_accounts')
                .select('id, platform, username')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as SocialAccount[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
