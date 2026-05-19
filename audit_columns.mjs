import fs from 'fs';

// Read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.includes('='))
        .map(line => {
            const index = line.indexOf('=');
            return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
        })
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

async function check() {
    console.log('Querying Supabase REST API for columns...');
    // We try to select everything to see what exists
    const resp = await fetch(`${url}/rest/v1/posts?select=*&limit=1`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });

    if (!resp.ok) {
        console.error('API Error:', await resp.text());
        return;
    }

    const data = await resp.json();
    if (data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]).join(', '));
    } else {
        console.log('No posts found to determine columns.');
    }
}

check();
