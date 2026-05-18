const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length > 1) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function check() {
    console.log("Checking social_accounts...");
    // Use anon key, RLS will block us unless we have the specific JWT, so we'll see if anything is publicly readable?
    // Wait, if RLS is on, this will return empty array [] without error. That isn't helpful.
    // Instead, let's use the service_role key to bypass RLS!
    console.log("If this returns 0 accounts, RLS is on.");
    const { data: accounts, error: err1 } = await supabase.from('social_accounts').select('*');
    console.log("social_accounts:", accounts, err1);
}
check();
