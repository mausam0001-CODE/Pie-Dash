import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(serviceAccount: any) {
    const { client_email, private_key } = serviceAccount;

    if (!private_key) {
        console.error('Service Account JSON is missing "private_key" field');
        throw new Error('Google Service Account JSON is malformed: missing "private_key"');
    }
    if (!client_email) {
        console.error('Service Account JSON is missing "client_email" field');
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

    // Import the private key for signing
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = private_key.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        new TextEncoder().encode(unsignedToken)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const jwt = `${unsignedToken}.${encodedSignature}`;

    const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    const data = await resp.json();
    return data.access_token;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const serviceAccountRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
        const folderId = formData.get('folderId') as string || Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')

        console.log('Upload - Folder ID:', folderId)
        console.log('Upload - Service Account configured:', !!serviceAccountRaw)

        if (!file) throw new Error('No file provided')
        if (!serviceAccountRaw) throw new Error('Google Service Account not configured in Supabase Secrets')

        console.log(`Uploading file: ${file.name} (${file.size} bytes)`)

        const serviceAccount = JSON.parse(serviceAccountRaw)
        console.log(`Upload - Project ID: ${serviceAccount.project_id}`)
        console.log(`Upload - Service Account Email: ${serviceAccount.client_email}`)

        const accessToken = await getAccessToken(serviceAccount)
        console.log('Upload - Access token acquired successfully')

        if (folderId) {
            console.log(`Upload - Checking visibility for ID: ${folderId}`)
            let resourceName = `files/${folderId}`
            let checkUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name&supportsAllDrives=true`

            let folderCheck = await fetch(checkUrl, { headers: { Authorization: `Bearer ${accessToken}` } })

            if (folderCheck.status === 404) {
                console.log('Upload - Not found as a file, trying as a Drive ID...')
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
            console.log(`Upload - Target resource confirmed: "${resourceMeta.name}" (${resourceName})`)
        }

        // 1. Upload File Metadata
        const metadata = {
            name: file.name,
            parents: folderId ? [folderId] : []
        }

        console.log('Attempting Google Drive multipart upload...')
        const uploadResp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: createMultipartBody(metadata, file)
        })

        console.log('Upload response status:', uploadResp.status)

        const uploadData = await uploadResp.json()
        if (uploadData.error) {
            console.error('Google Upload Error details:', JSON.stringify(uploadData.error, null, 2))
            throw new Error(`Upload error: ${uploadData.error.message}`)
        }

        // 2. Set Public Permissions (Anyone with link can view - required for publishing)
        await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions?supportsAllDrives=true`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: 'reader',
                type: 'anyone'
            })
        })

        // 3. Get Direct Link
        const fileInfoResp = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}?fields=webContentLink&supportsAllDrives=true`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        const fileInfo = await fileInfoResp.json()

        if (!fileInfo.webContentLink) {
            console.error('No webContentLink received:', fileInfo)
            // Fallback to a constructed preview link if needed
        }

        return new Response(JSON.stringify({
            success: true,
            id: uploadData.id,
            url: (fileInfo.webContentLink || '').replace('&export=download', '') // Web content link for preview
        }), {
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

function createMultipartBody(metadata: any, file: File) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelimiter = "\r\n--" + boundary + "--";

    // Use a simpler approach for multipart in Deno
    const metadataPart = 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata);
    // Note: This simple concatenation might not be efficient for very large files > 10MB
    // but for reels it should be okay.
    return new Blob([
        delimiter,
        metadataPart,
        delimiter,
        'Content-Type: ' + file.type + '\r\n\r\n',
        file,
        closeDelimiter
    ], { type: 'multipart/related; boundary=' + boundary });
}
