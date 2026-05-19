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

async function check(column) {
    const resp = await fetch(`${url}/rest/v1/posts?select=${column}&limit=1`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    return resp.ok;
}

async function audit() {
    const columns = ['error_message', 'external_id', 'permalink', 'thumbnail_url', 'category', 'tags'];
    console.log('Auditing columns...');
    for (const col of columns) {
        const exists = await check(col);
        console.log(`${col}: ${exists ? 'EXISTS ✅' : 'MISSING ❌'}`);
    }
}

audit();
