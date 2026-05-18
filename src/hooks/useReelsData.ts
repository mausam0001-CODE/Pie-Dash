import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Reel {
    id: string;
    title: string;
    description: string;
    media_url: string;
    thumbnail_url: string;
    status: string;
    approved: boolean;
    piePosted: boolean;
    charPosted: boolean;
    created_at: string;
    // Analytics
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    // Metadata
    category?: string;
    hook?: string;
    hashtags?: string[];
    scheduled_at?: string;
    videoLink?: string;
    script?: string;
    thumbnail?: string;
    caption?: string;
    platforms?: string[];
    social_account_id?: string;
}

export const useReelsData = () => {
    const [data, setData] = useState<Reel[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: reels, error } = await supabase
                .from('reels')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && reels) {
                setData(reels);
            }
        } catch (error) {
            console.error('Error fetching reels:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const velocityData = [
        ...Object.entries(data.reduce((acc, r) => {
            const cat = r.category || 'Other';
            const currentCount = acc[cat] ?? 0;
            acc[cat] = currentCount + 1;
            return acc;
        }, {} as Record<string, number>)).map(([name, posts]) => ({ name, posts }))
    ];

    return { data, loading, refetch: fetchData, velocityData };
};
