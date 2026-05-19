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
    console.log('Querying Supabase REST API...');
    const resp = await fetch(`${url}/rest/v1/posts?select=id,title,status,error_message,created_at&order=created_at.desc&limit=5`, {
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
    console.table(data);
}

check();
