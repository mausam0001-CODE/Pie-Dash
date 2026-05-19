import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(5);
    console.log(data.map(p => ({
        title: p.title,
        status: p.status,
        platforms: p.platforms,
        error: p.error_message
    })));
}
check();
