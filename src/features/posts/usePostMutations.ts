import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function usePostMutations() {
    const queryClient = useQueryClient();

    const createPost = useMutation({
        mutationFn: async (post: any) => {
            const { data, error } = await supabase
                .from('posts')
                .insert([post])
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
