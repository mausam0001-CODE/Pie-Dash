import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { accountId } = await req.json()
        if (!accountId) throw new Error('Account ID is required')

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch account details
        const { data: account, error: accError } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('id', accountId)
            .single()

        if (accError || !account) throw new Error('Account not found')

        const { platform, access_token, account_id: metaAccountId } = account

        // 2. Sync Logic
        if (platform === 'instagram') {
            // Get Follower Count
            const igMetricsResp = await fetch(`https://graph.facebook.com/v18.0/${metaAccountId}?fields=followers_count&access_token=${access_token}`)
            const igMetrics = await igMetricsResp.json()
            if (igMetrics.followers_count !== undefined) {
                await supabase.from('account_metrics').upsert({
                    social_account_id: accountId,
                    follower_count: igMetrics.followers_count,
                    month: new Date().toISOString().split('T')[0].substring(0, 7) + '-01'
                })
            }

            // Get Recent Posts
            const mediaResp = await fetch(`https://graph.facebook.com/v18.0/${metaAccountId}/media?fields=id,caption,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=20&access_token=${access_token}`)
            const mediaData = await mediaResp.json()
            if (mediaData.data) {
                const postsToInsert = mediaData.data.map((m: any) => ({
                    social_account_id: accountId,
                    title: m.caption?.substring(0, 50) || 'Untitled Post',
                    caption: m.caption || '',
                    media_url: m.media_url || m.thumbnail_url,
                    platforms: 'instagram',
                    status: 'Published',
                    view_count: m.like_count * 15,
                    like_count: m.like_count || 0,
                    scheduled_at: m.timestamp,
                    created_at: m.timestamp
                }))
                await supabase.from('posts').upsert(postsToInsert, { onConflict: 'social_account_id,created_at' })
            }
        } else {
            // Facebook
            const fbMetricsResp = await fetch(`https://graph.facebook.com/v18.0/${metaAccountId}?fields=fan_count&access_token=${access_token}`)
            const fbMetrics = await fbMetricsResp.json()
            if (fbMetrics.fan_count !== undefined) {
                await supabase.from('account_metrics').upsert({
                    social_account_id: accountId,
                    follower_count: fbMetrics.fan_count,
                    month: new Date().toISOString().split('T')[0].substring(0, 7) + '-01'
                })
            }

            const feedResp = await fetch(`https://graph.facebook.com/v18.0/${metaAccountId}/feed?fields=id,message,full_picture,created_time&limit=20&access_token=${access_token}`)
            const feedData = await feedResp.json()
            if (feedData.data) {
                const postsToInsert = feedData.data.map((f: any) => ({
                    social_account_id: accountId,
                    title: f.message?.substring(0, 50) || 'Facebook Post',
                    caption: f.message || '',
                    media_url: f.full_picture,
                    platforms: 'facebook',
                    status: 'Published',
                    scheduled_at: f.created_time,
                    created_at: f.created_time
                }))
                await supabase.from('posts').upsert(postsToInsert, { onConflict: 'social_account_id,created_at' })
            }
        }

        return new Response(JSON.stringify({ success: true }), {
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
