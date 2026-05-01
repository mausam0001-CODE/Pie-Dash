import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase credentials missing. Check Vercel Environment Variables.");
}

// Only create client if we have a URL to avoid fatal "Supabase URL is required" error
export const supabase = supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any; 
