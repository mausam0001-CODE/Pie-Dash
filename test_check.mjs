import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
    console.log("Checking social_accounts...");
    const { data: accounts, error: err1 } = await supabase.from('social_accounts').select('*');
    console.log("social_accounts:", accounts, err1);

    console.log("Checking posts...");
    const { data: posts, error: err2 } = await supabase.from('posts').select('*').limit(5);
    console.log("posts:", posts, err2);
}

check();
