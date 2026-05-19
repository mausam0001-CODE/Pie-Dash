import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/debug-errors`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    const data = await resp.json();
    console.log(JSON.stringify(data, null, 2));
}

run();
