import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface UserProfile {
    full_name: string;
    role: string;
    avatar_url: string;
}

interface UserContextType {
    profile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useAuth();
    const user = session?.user;
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('settings')
                .eq('user_id', user.id)
                .single();

            if (data?.settings?.user_profile) {
                setProfile(data.settings.user_profile);
            } else {
                setProfile({
                    full_name: 'Pie Team',
                    role: 'Pro Manager',
                    avatar_url: ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    return (
        <UserContext.Provider value={{ profile, loading, refreshProfile: fetchProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
