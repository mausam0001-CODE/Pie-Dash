import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface Interaction {
    id: string;
    user_name: string;
    user_avatar: string;
    content: string;
    platform: 'instagram' | 'facebook' | 'twitter';
    status: 'Open' | 'Resolved';
    created_at: string;
}

export function useInteractions() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['interactions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('interactions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data as Interaction[]) || [];
        }
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
