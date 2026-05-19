import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(serviceAccount: any) {
    const { client_email, private_key } = serviceAccount;

    if (!private_key) {
        console.error('Sync - Service Account JSON is missing "private_key" field');
        throw new Error('Google Service Account JSON is malformed: missing "private_key"');
    }
    if (!client_email) {
        console.error('Sync - Service Account JSON is missing "client_email" field');
        throw new Error('Google Service Account JSON is malformed: missing "client_email"');
    }

    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
        iss: client_email,
        scope: "https://www.googleapis.com/auth/drive",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedClaimSet = btoa(JSON.stringify(claimSet));
    const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

    const pemContents = private_key.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const key = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedToken));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsignedToken}.${encodedSignature}` }),
    });

    const data = await resp.json();
    return data.access_token;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
        const serviceAccountRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
        const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')

        console.log('Folder ID:', folderId)
        console.log('Service Account configured:', !!serviceAccountRaw)

        if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is missing from Supabase Secrets')
        if (!serviceAccountRaw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing from Supabase Secrets')

        const serviceAccount = JSON.parse(serviceAccountRaw)
        console.log(`Sync - Project ID: ${serviceAccount.project_id}`)
        console.log(`Sync - Service Account Email: ${serviceAccount.client_email}`)

        const accessToken = await getAccessToken(serviceAccount)
        console.log('Sync - Access token acquired successfully')

        // 0. Verify Visibility (Check if it's a Folder or a Shared Drive)
        console.log(`Sync - Checking visibility for ID: ${folderId}`)
        let resourceName = `files/${folderId}`
        let checkUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name&supportsAllDrives=true`

        let folderCheck = await fetch(checkUrl, { headers: { Authorization: `Bearer ${accessToken}` } })

        // If not found as a file, try as a Drive
        if (folderCheck.status === 404) {
            console.log('Sync - Not found as a file, trying as a Drive ID...')
            checkUrl = `https://www.googleapis.com/drive/v3/drives/${folderId}`
            folderCheck = await fetch(checkUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
            if (folderCheck.status === 200) resourceName = `drives/${folderId}`
        }

        if (folderCheck.status !== 200) {
            const err = await folderCheck.json()
            console.error('Visibility Check Failed:', JSON.stringify(err, null, 2))
            throw new Error(`Cannot see resource (${folderId}): ${err.error?.message || 'Check ID and Permissions'}`)
        }

        const resourceMeta = await folderCheck.json()
        console.log(`Sync - Resource found: "${resourceMeta.name}" (${resourceName})`)

        // 1. List files
        const isDrive = resourceName.startsWith('drives')
        const query = isDrive ? "trashed=false" : `'${folderId}'+in+parents+and+trashed=false`
        const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,thumbnailLink,webContentLink,createdTime)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true${isDrive ? `&driveId=${folderId}&corpora=drive` : ''}`

        const listResp = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
        const listData = await listResp.json()

        if (listData.error) {
            console.error('Drive API Error:', listData.error)
            throw new Error(`Drive List Error: ${listData.error.message}`)
        }

        const driveFiles = listData.files || []
        const imported = []

        for (const file of driveFiles) {
            if (!file.mimeType.startsWith('video/')) continue;

            // Check if already in DB
            const { data: existing } = await supabase.from('posts').select('id').eq('externalId', file.id).single()

            if (!existing) {
                const { data: newPost, error: insertErr } = await supabase.from('posts').insert({
                    title: file.name,
                    caption: `Imported from Google Drive: ${file.name}`,
                    mediaUrl: file.webContentLink.replace('&export=download', ''),
                    thumbnailUrl: file.thumbnailLink,
                    mediaType: 'VIDEO',
                    externalId: file.id,
                    status: 'Published',
                    category: 'Reel',
                    platforms: 'google_drive',
                }).select().single()

                if (!insertErr) imported.push(newPost)
            }
        }

        return new Response(JSON.stringify({ success: true, count: imported.length, imported }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
