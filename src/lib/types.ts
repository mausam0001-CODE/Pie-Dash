// Shared types based on Supabase Database Schema

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'x';
export type PostStatus = 'Draft' | 'Scheduled' | 'Published' | 'Failed';

export interface Post {
    id: string;
    user_id?: string;
    title: string;
    caption: string | null;
    media_url: string | null;
    platforms: Platform[]; // Need to parse from JSON on fetch
    scheduled_at: string | null;
    status: PostStatus;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface SocialAccount {
    id: string;
    user_id?: string;
    platform: Platform;
    username: string;
    access_token: string;
    refresh_token: string | null;
    token_expires_at: string | null;
    created_at: string;
    updated_at: string;
}
