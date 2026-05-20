import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Poll for media container status (videos need processing time)
async function waitForContainer(igUserId: string, containerId: string, accessToken: string): Promise<void> {
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 3000)); // wait 3 seconds
        const resp = await fetch(`https://graph.facebook.com/v18.0/${containerId}?fields=status_code,status&access_token=${accessToken}`);
        const data = await resp.json();
        console.log(`Container status check ${i + 1}:`, data.status_code);
        if (data.status_code === 'FINISHED') return;
        if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
            throw new Error(`Media container processing failed: ${data.status_code}`);
        }
    }
    throw new Error('Media container timed out after 60 seconds');
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    let postId: string | undefined;

    try {
        const body = await req.json()
        postId = body.postId;
        if (!postId) throw new Error('No postId provided')

        // 1. Initialize Supabase Admin Client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log(`Processing publish for post: ${postId}`);

        // Give Google Drive permissions a moment to propagate
        await new Promise(r => setTimeout(r, 2000));

        // 2. Fetch post + linked social account
        const { data: post, error: postErr } = await supabase
            .from('posts')
            .select(`*, social_accounts(*)`)
            .eq('id', postId)
            .single()

        if (postErr || !post) throw new Error(`Post not found: ${postErr?.message}`)

        // Update status to 'Processing' to signal to UI
        await supabase.from('posts').update({ status: 'Processing' }).eq('id', postId);
        const account = post.social_accounts
        if (!account) throw new Error('No linked social account found on this post')
        if (!account.access_token) throw new Error('Social account has no access token')

        const igUserId = account.account_id
        if (!igUserId) throw new Error('Social account missing account_id (Instagram User ID)')

        const isVideo = post.media_type?.toUpperCase() === 'VIDEO'
        const mediaUrl = post.media_url
        const caption = post.caption || ''

        if (!mediaUrl) throw new Error('Post has no media_url to publish')

        // 3. Helper to determine which API host to use
        // Tokens from "Instagram Login" (modern) often need graph.instagram.com
        // Tokens from "Facebook Login" (legacy) usually need graph.facebook.com
        const getApiHost = (token: string) => {
            if (token && token.startsWith('IGQ')) return 'graph.instagram.com';
            return 'graph.facebook.com';
        }

        const apiHost = getApiHost(account.access_token);
        const tokenPrefix = account.access_token ? account.access_token.substring(0, 10) : 'MISSING';
        const v = 'v21.0';

        const createContainer = async (host: string) => {
            const containerBody: Record<string, string> = {
                caption,
            }

            if (isVideo) {
                containerBody.media_type = 'REELS'
                containerBody.video_url = mediaUrl
            } else {
                containerBody.image_url = mediaUrl
            }

            console.log(`Creating container on ${host} [${v}] with token ${tokenPrefix}...`);

            const url = `https://${host}/${v}/${igUserId}/media`;
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${account.access_token}`
                },
                body: JSON.stringify(containerBody)
            })

            const respText = await resp.text();
            try {
                return JSON.parse(respText);
            } catch (e) {
                return { error: { message: `Non-JSON Response: ${respText.substring(0, 200)}`, code: 0 } };
            }
        }

        // 4. Create Media Container with Fallback logic
        let containerData = await createContainer(apiHost)

        // FALLBACK: If standard facebook.com fails, try instagram.com
        if (containerData.error && apiHost === 'graph.facebook.com') {
            console.log(`Initial attempt failed (${containerData.error.message}), trying fallback...`);
            const fallbackData = await createContainer('graph.instagram.com')
            if (!fallbackData.error) {
                containerData = fallbackData
            } else {
                console.error('Fallback also failed:', fallbackData.error);
            }
        }

        if (containerData.error) {
            const err = containerData.error;
            // Surface forensic info in the error message for the user to see
            const forensic = `[Host:${apiHost}|Token:${tokenPrefix}|Code:${err.code}]`;
            throw new Error(`${err.message} ${forensic}`)
        }
        if (!containerData.id) throw new Error('No container ID returned from Instagram')

        // 5. For videos: wait for processing to finish
        if (isVideo) {
            console.log('Waiting for video processing (checking every 10s, up to 5 mins)...')
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 10000)); // Check every 10 seconds
                const resp = await fetch(`https://${apiHost}/${v}/${containerData.id}?fields=status_code,status`, {
                    headers: { 'Authorization': `Bearer ${account.access_token}` }
                });
                const data = await resp.json();
                console.log(`Video Status [Check ${i + 1}/30]:`, data.status_code);

                if (data.status_code === 'FINISHED') break;
                if (data.status_code === 'ERROR') throw new Error(`Video processing failed: ${data.status_code}. Detail: ${data.status || 'unknown'}`);
                if (i === 29) throw new Error('Video processing timed out after 5 minutes. The Reel might still be processing on Instagram\'s end.');
            }
        }

        // 6. Publish the container
        console.log(`Publishing container:`, containerData.id)
        const publishResp = await fetch(`https://${apiHost}/${v}/${igUserId}/media_publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${account.access_token}`
            },
            body: JSON.stringify({ creation_id: containerData.id })
        })
        const publishData = await publishResp.json()

        if (publishData.error) throw new Error(`IG publish error: ${publishData.error.message} (code ${publishData.error.code})`)

        // 7. Update post to Published with the external IG media ID
        await supabase.from('posts').update({
            status: 'Published',
            external_id: publishData.id,
            permalink: `https://www.instagram.com/p/${publishData.id}/`,
            error_message: null
        }).eq('id', postId)

        return new Response(JSON.stringify({ success: true, ig_id: publishData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        let errorMessage = error instanceof Error ? error.message :
            (typeof error === 'string' ? error : JSON.stringify(error));

        // Handle Instagram Auth Expiration (Code 190)
        if (errorMessage.includes('code 190')) {
            errorMessage = `AUTH_ERROR_190: Your Instagram connection has expired or was revoked. Please go to Settings > Social Accounts and reconnect your account.`;
        }

        console.error('ig-publish error:', errorMessage)

        // Try to mark the post as Failed so the user knows
        try {
            if (postId) {
                const supabase = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                )
                await supabase.from('posts').update({
                    status: 'Failed',
                    error_message: errorMessage
                }).eq('id', postId)
            }
        } catch (_) { /* swallow secondary error */ }

        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
