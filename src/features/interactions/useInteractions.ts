import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAccountContext } from '../accounts/AccountContext';

export interface Interaction {
    id: string;
    user_name: string;
    user_avatar: string;
    content: string;
    platform: 'instagram' | 'facebook' | 'twitter';
    status: 'Open' | 'Resolved';
    created_at: string;
    social_account_id: string;
}

export function useInteractions() {
    const queryClient = useQueryClient();
    const { activeAccount } = useAccountContext();

    const query = useQuery({
        queryKey: ['interactions', activeAccount?.id],
        queryFn: async () => {
            let q = supabase
                .from('interactions')
                .select('*')
                .order('created_at', { ascending: false });

            if (activeAccount) {
                q = q.eq('social_account_id', activeAccount.id);
            }

            const { data, error } = await q;

            if (error) throw error;
            return (data as Interaction[]) || [];
        },
        enabled: !!activeAccount
    });

    const resolveMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('interactions')
                .update({ status: 'Resolved' })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interactions'] });
        }
    });

    const sendReply = useMutation({
        mutationFn: async ({ parentId, content }: { parentId: string; content: string }) => {
            // In a real app, this would trigger an Edge Function or API call
            console.log('Sending reply to', parentId, ':', content);
            // For now, let's just mark the interaction as resolved since we replied
            const { error } = await supabase
                .from('interactions')
                .update({ status: 'Resolved' })
                .eq('id', parentId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interactions'] });
        }
    });

    return {
        ...query,
        resolve: resolveMutation.mutate,
        sendReply: sendReply.mutate,
        isResolving: resolveMutation.isPending,
        isSending: sendReply.isPending
    };
}
