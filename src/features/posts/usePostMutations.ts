import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAccountContext } from '../accounts/AccountContext';

export function usePostMutations() {
    const queryClient = useQueryClient();
    const { activeAccount } = useAccountContext();

    const createPost = useMutation({
        mutationFn: async (post: any) => {
            const hasAccountId = !!post.social_account_id;
            if (!hasAccountId && !activeAccount) throw new Error('No active account selected');

            const postWithAccount = {
                ...post,
                social_account_id: post.social_account_id || activeAccount?.id
            };

            const { data, error } = await supabase
                .from('posts')
                .insert([postWithAccount])
                .select();
            if (error) throw error;
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
    });

    const updatePost = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
            const { data, error } = await supabase
                .from('posts')
                .update(updates)
                .eq('id', id)
                .select();
            if (error) throw error;
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
    });

    const deletePost = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
    });

    return {
        createPost,
        updatePost,
        deletePost
    };
}
