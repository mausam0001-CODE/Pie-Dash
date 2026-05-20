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
        const action = body.action; // 'create', 'check'
        const publishId = body.publishId; // For TikTok, we call it publish_id

        if (!postId && !publishId) throw new Error('Missing postId or publishId')

        // 1. Initialize Supabase
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

        // --- ACTION: CHECK STATUS ---
        if (action === 'check' && publishId) {
            console.log(`Checking status for TikTok publish_id ${publishId}...`);
            const resp = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ publish_id: publishId })
            });
            const data = await resp.json();

            if (data.error) throw new Error(`TikTok Status Error: ${data.error.message}`);

            const status = data.data?.status; // SUCCESS, PROCESSING, FAILED, etc.

            if (status === 'SUCCESS') {
                if (postId) {
                    await supabase.from('posts').update({
                        status: 'Published',
                        external_id: publishId,
                        permalink: data.data?.public_url || null,
                        error_message: null
                    }).eq('id', postId)
                }
            } else if (status === 'FAILED') {
                if (postId) {
                    await supabase.from('posts').update({
                        status: 'Failed',
                        error_message: data.data?.fail_reason || 'TikTok processing failed'
                    }).eq('id', postId)
                }
            }

            return new Response(JSON.stringify({ success: true, status_code: status, ...data.data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- DEFAULT: CREATE (PHASE 1) ---
        console.log(`Initializing TikTok publish for post ${postId}...`);

        const payload = {
            post_info: {
                caption: postRecord.caption || '',
                privacy_level: "PUBLIC_TO_EVERYONE",
                disable_comment: false,
                disable_duet: false,
                disable_stitch: false,
                video_ad_tag: false
            },
            source_info: {
                source: "PULL_FROM_URL",
                video_url: postRecord.media_url
            },
            post_mode: "DIRECT_POST" // Can be "MEDIA_UPLOAD" for drafts
        }

        const initResp = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        const initData = await initResp.json()
        if (initData.error) throw new Error(`TikTok Init Error: ${initData.error.message}`);

        const newPublishId = initData.data?.publish_id;

        // Update DB
        await supabase.from('posts').update({
            status: 'Processing',
            container_id: newPublishId // We reuse container_id column for TikTok's publish_id
        }).eq('id', postId);

        return new Response(JSON.stringify({
            success: true,
            status: 'PROCESSING',
            publish_id: newPublishId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('tk-publish error:', error.message)
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
