import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(serviceAccount: any) {
    const { client_email, private_key } = serviceAccount;
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
        iss: client_email,
        scope: "https://www.googleapis.com/auth/drive.readonly",
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
        const accessToken = await getAccessToken(serviceAccount)
        console.log('Access token acquired successfully')

        // 1. List files in the folder
        const listResp = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,thumbnailLink,webContentLink,createdTime)&pageSize=100`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
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
