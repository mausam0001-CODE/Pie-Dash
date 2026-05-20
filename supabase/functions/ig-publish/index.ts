import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    let postId: string | undefined;

    try {
        const body = await req.json()
        postId = body.postId;
        const action = body.action; // 'create', 'check', or 'publish'
        const containerId = body.containerId;

        if (!postId && !containerId) throw new Error('Missing postId or containerId')

        // 1. Initialize Supabase Client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Fetch Post and Account info
        let postRecord: any = null;
        if (postId) {
            const { data: post, error: postError } = await supabase
                .from('posts')
                .select('*, social_accounts(*)')
                .eq('id', postId)
                .single()

            if (postError || !post) throw new Error(`Post not found: ${postError?.message}`)
            postRecord = post;
        }

        const account = postRecord?.social_accounts || {};
        const accessToken = account.access_token;
        if (!accessToken) throw new Error('No access token found for account');

        const v = 'v21.0';
        // Logic for determining API host based on token type
        const apiHost = accessToken.startsWith('IGQ') ? 'graph.instagram.com' : 'graph.facebook.com';

        // --- ACTION: CHECK STATUS ---
        if (action === 'check' && containerId) {
            console.log(`Checking status for container ${containerId}...`);
            const resp = await fetch(`https://${apiHost}/${v}/${containerId}?fields=status_code,status&access_token=${accessToken}`);
            const data = await resp.json();
            return new Response(JSON.stringify({ success: true, ...data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- ACTION: PUBLISH ---
        if (action === 'publish' && containerId) {
            console.log(`Publishing container ${containerId}...`);
            const igId = account.account_id;
            const publishResp = await fetch(`https://${apiHost}/${v}/${igId}/media_publish?access_token=${accessToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creation_id: containerId })
            })
            const publishData = await publishResp.json()
            if (publishData.error) throw new Error(`Publish error: ${publishData.error.message}`);

            // Update DB
            if (postId) {
                await supabase.from('posts').update({
                    status: 'Published',
                    external_id: publishData.id,
                    permalink: `https://www.instagram.com/p/${publishData.id}/`,
                    error_message: null
                }).eq('id', postId)
            }

            return new Response(JSON.stringify({ success: true, ig_id: publishData.id }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- DEFAULT: CREATE (PHASE 1) ---
        console.log(`Creating container for post ${postId}...`);
        const isVideo = postRecord.media_type?.toUpperCase() === 'VIDEO'
        const mediaUrl = postRecord.media_url
        const caption = postRecord.caption || ''

        const containerBody: any = { caption }
        if (isVideo) {
            containerBody.media_type = 'REELS'
            containerBody.video_url = mediaUrl
        } else {
            containerBody.image_url = mediaUrl
        }

        const createUrl = `https://${apiHost}/${v}/${account.account_id}/media?access_token=${accessToken}`;
        const createResp = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(containerBody)
        })
        const containerData = await createResp.json()
        if (containerData.error) throw new Error(`Container Error: ${containerData.error.message}`);

        // If it's a video, update status and return early for client-side polling
        if (isVideo) {
            await supabase.from('posts').update({ status: 'Processing' }).eq('id', postId);

            return new Response(JSON.stringify({
                success: true,
                status: 'PROCESSING',
                container_id: containerData.id
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // If it's an image, we can just finish the job in one go
        console.log(`Publishing image container ${containerData.id}...`);
        const publishResp = await fetch(`https://${apiHost}/${v}/${account.account_id}/media_publish?access_token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: containerData.id })
        })
        const publishData = await publishResp.json()
        if (publishData.error) throw new Error(`Immediate Publish Error: ${publishData.error.message}`);

        await supabase.from('posts').update({
            status: 'Published',
            external_id: publishData.id,
            permalink: `https://www.instagram.com/p/${publishData.id}/`,
            error_message: null
        }).eq('id', postId)

        return new Response(JSON.stringify({ success: true, ig_id: publishData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('ig-publish error:', error.message)
        if (postId) {
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )
            await supabase.from('posts').update({ status: 'Failed', error_message: error.message }).eq('id', postId)
        }
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
