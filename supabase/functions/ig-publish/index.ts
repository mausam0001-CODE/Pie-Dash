import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { postId } = await req.json()
        if (!postId) throw new Error('No postId provided')

        // 1. Initialize Supabase Admin Client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Fetch Post and Account Data
        const { data: post, error: postErr } = await supabase
            .from('posts')
            .select('*, social_accounts(*)')
            .eq('id', postId)
            .single()

        if (postErr || !post) throw new Error('Post not found')
        const account = post.social_accounts

        if (!account) throw new Error('Linked social account not found')

        // 3. Instagram Graph API (2-Step Process)
        // Step A: Create Media Container
        const containerResp = await fetch(`https://graph.facebook.com/v18.0/${account.account_id}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_url: post.image_url,
                caption: post.content,
                access_token: account.access_token // Assuming token is ready (encryption logic can be added)
            })
        })
        const containerData = await containerResp.json()
        if (containerData.error) throw new Error(`Container error: ${containerData.error.message}`)

        // Step B: Publish Media Container
        const publishResp = await fetch(`https://graph.facebook.com/v18.0/${account.account_id}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                creation_id: containerData.id,
                access_token: account.access_token
            })
        })
        const publishData = await publishResp.json()
        if (publishData.error) throw new Error(`Publish error: ${publishData.error.message}`)

        // 4. Update Post Status
        await supabase.from('posts').update({ status: 'Published' }).eq('id', postId)

        return new Response(JSON.stringify({ status: 'success', ig_id: publishData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
