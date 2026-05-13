import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAccountContext } from './AccountContext';

export interface AccountMetric {
    id: string;
    social_account_id: string;
    follower_count: number;
    month: string;
}

export function useMetrics() {
    const { activeAccount } = useAccountContext();

    return useQuery({
        queryKey: ['account_metrics', activeAccount?.id],
        queryFn: async () => {
            if (!activeAccount) return [];

            const { data, error } = await supabase
                .from('account_metrics')
                .select('*')
                .eq('social_account_id', activeAccount.id)
                .order('month', { ascending: true });

            if (error) throw error;
            return data as AccountMetric[];
        },
        enabled: !!activeAccount,
    });
}
