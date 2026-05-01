import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export const useAuth = () => {
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        // Initial fetch
        supabase.auth.getSession().then(({ data: { session: currentSession } }: { data: { session: any } }) => {
            setSession(currentSession);
            setIsLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, currentSession: any) => {
            setSession(currentSession);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return { session, isLoading };
};
