import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state') // userId:platform:loginMethod
        const errorParam = url.searchParams.get('error')

        if (errorParam) {
            throw new Error(`OAuth denied: ${url.searchParams.get('error_description') || errorParam}`)
        }
        if (!code) throw new Error('No code provided')

        // State format: userId:platform:loginMethod (loginMethod = 'ig' | 'fb')
        const parts = (state || '').split(':')
        const userId = parts[0] || 'team-user'
        const targetPlatform = parts[1] || 'instagram'
        const loginMethod = parts[2] || 'fb' // 'ig' = Instagram Login, 'fb' = Facebook Login

        console.log('OAuth Callback:', { userId, targetPlatform, loginMethod })

        const FB_APP_ID = Deno.env.get('FB_APP_ID') || '1247702890719706'
        const FB_APP_SECRET = Deno.env.get('FB_APP_SECRET')
        // NEW: Dedicated Instagram App ID for the direct IG Login flow
        const IG_APP_ID = Deno.env.get('IG_APP_ID') || '997891079244802'
        const IG_APP_SECRET = Deno.env.get('IG_APP_SECRET') || FB_APP_SECRET

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
        const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0]
        const REDIRECT_URI = projectRef
            ? `https://${projectRef}.supabase.co/functions/v1/ig-oauth`
            : "https://ivsytkzemjludwzhrdsu.supabase.co/functions/v1/ig-oauth"

        let accessToken = ''
        let accountId = ''
        let username = ''
        let avatarUrl = ''

        // ---------------------------------------------------------------
        // PATH A: Instagram Login (graph.instagram.com) — No Facebook Page
        // ---------------------------------------------------------------
        if (loginMethod === 'ig') {
            console.log('Using Instagram Login API (no Facebook Page required)')
            console.log('Using Client ID:', IG_APP_ID)

            // 1. Exchange code for short-lived token via Instagram
            const shortResp = await fetch('https://api.instagram.com/oauth/access_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: IG_APP_ID!,
                    client_secret: IG_APP_SECRET!,
                    grant_type: 'authorization_code',
                    redirect_uri: REDIRECT_URI,
                    code: code,
                }).toString()
            })
            const shortData = await shortResp.json()
            console.log('IG Short Token Resp:', JSON.stringify(shortData))
            if (shortData.error_type || shortData.error_message || shortData.error) {
                throw new Error(shortData.error_message || shortData.error?.message || 'Failed to get short-lived token')
            }
            const shortToken = shortData.access_token
            const igUserId = shortData.user_id

            // 2. Exchange for long-lived token
            const longResp = await fetch(
                `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${IG_APP_SECRET}&access_token=${shortToken}`
            )
            const longData = await longResp.json()
            console.log('IG Long Token:', JSON.stringify(longData))
            if (longData.error) throw new Error(longData.error.message || 'Failed to get long-lived token')
            accessToken = longData.access_token || shortToken

            // 3. Get Instagram profile using graph.instagram.com
            const profResp = await fetch(
                `https://graph.instagram.com/v25.0/me?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`
            )
            const profData = await profResp.json()
            console.log('IG Profile:', JSON.stringify(profData))
            if (profData.error) throw new Error(profData.error.message)
            accountId = profData.id || String(igUserId)
            username = profData.username || 'instagram_user'
            avatarUrl = profData.profile_picture_url || ''

            // 4. Save account to DB
            const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
            const { data: savedAccount, error: saveError } = await supabase
                .from('social_accounts')
                .upsert({
                    user_id: userId,
                    platform: 'instagram',
                    access_token: accessToken,
                    account_id: String(accountId),
                    username: username,
                    avatar_url: avatarUrl,
                    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
                }, { onConflict: 'user_id,platform,account_id' })
                .select()
                .single()
            if (saveError) throw saveError

            // 5. Seed initial data using graph.instagram.com
            try {
                if (profData.followers_count !== undefined) {
                    await supabase.from('account_metrics').upsert({
                        social_account_id: savedAccount.id,
                        follower_count: profData.followers_count,
                        month: new Date().toISOString().substring(0, 7) + '-01'
                    })
                }
                // Get recent media
                const mediaResp = await fetch(
                    `https://graph.instagram.com/v25.0/me/media?fields=id,caption,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=10&access_token=${accessToken}`
                )
                const mediaData = await mediaResp.json()
                if (mediaData.data?.length) {
                    const postsToInsert = mediaData.data.map((m: any) => ({
                        social_account_id: savedAccount.id,
                        external_id: m.id,
                        title: m.caption?.substring(0, 50) || 'Untitled Post',
                        caption: m.caption || '',
                        media_url: m.media_url || m.thumbnail_url,
                        platforms: 'instagram',
                        status: 'Published',
                        like_count: m.like_count || 0,
                        scheduled_at: m.timestamp,
                        created_at: m.timestamp
                    }))
                    await supabase.from('posts').upsert(postsToInsert, { onConflict: 'social_account_id,external_id' })
                }
            } catch (seedError) {
                console.error('Seeding error (non-fatal):', seedError)
            }

            // ---------------------------------------------------------------
            // PATH B: Facebook Login (graph.facebook.com) — Requires FB Page
            // ---------------------------------------------------------------
        } else {
            console.log('Using Facebook Login API')

            // 1. Exchange code for short token
            const shortResp = await fetch(
                `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${code}`
            )
            const shortData = await shortResp.json()
            console.log('FB Short Token:', JSON.stringify(shortData))
            if (shortData.error) throw new Error(shortData.error.message)
            let shortToken = shortData.access_token

            // 2. Exchange for long-lived token
            const longResp = await fetch(
                `https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${shortToken}`
            )
            const longData = await longResp.json()
            if (longData.error) throw new Error(longData.error.message)
            let longToken = longData.access_token || shortToken

            if (targetPlatform === 'instagram') {
                // Get Facebook Pages
                const pagesResp = await fetch(`https://graph.facebook.com/v25.0/me/accounts?access_token=${longToken}`)
                const pagesData = await pagesResp.json()
                if (pagesData.error) throw new Error(pagesData.error.message)
                const page = pagesData.data?.[0]
                if (!page) throw new Error('No Facebook Page found. Your Instagram Business Account must be linked to a Facebook Page. (Use "Connect via Instagram" for accounts without a Facebook Page)')

                // Get Instagram Business Account from Page
                const igResp = await fetch(`https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account&access_token=${longToken}`)
                const igData = await igResp.json()
                if (!igData.instagram_business_account) throw new Error('No Instagram Business Account linked to your Facebook Page.')

                // Get Profile
                const profResp = await fetch(`https://graph.facebook.com/v25.0/${igData.instagram_business_account.id}?fields=id,username,profile_picture_url&access_token=${longToken}`)
                const profData = await profResp.json()
                if (profData.error) throw new Error(profData.error.message)
                accountId = profData.id
                username = profData.username
                avatarUrl = profData.profile_picture_url
                accessToken = longToken
            } else {
                // Facebook Page
                const pagesResp = await fetch(`https://graph.facebook.com/v25.0/me/accounts?access_token=${longToken}`)
                const pagesData = await pagesResp.json()
                if (pagesData.error) throw new Error(pagesData.error.message)
                const page = pagesData.data?.[0]
                if (page) {
                    accountId = page.id
                    username = page.name
                    avatarUrl = `https://graph.facebook.com/v25.0/${page.id}/picture?type=square&access_token=${longToken}`
                } else {
                    const userResp = await fetch(`https://graph.facebook.com/v25.0/me?fields=id,name,picture&access_token=${longToken}`)
                    const userData = await userResp.json()
                    if (userData.error) throw new Error(userData.error.message)
                    accountId = userData.id
                    username = userData.name
                    avatarUrl = userData.picture?.data?.url
                }
                accessToken = longToken
            }

            // Save to DB
            const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
            const { data: savedAccount, error: saveError } = await supabase
                .from('social_accounts')
                .upsert({
                    user_id: userId,
                    platform: targetPlatform,
                    access_token: accessToken,
                    account_id: accountId,
                    username: username,
                    avatar_url: avatarUrl,
                    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
                }, { onConflict: 'user_id,platform,account_id' })
                .select()
                .single()
            if (saveError) throw saveError

            // Seed data
            try {
                if (targetPlatform === 'instagram') {
                    const igMetricsResp = await fetch(`https://graph.facebook.com/v25.0/${accountId}?fields=followers_count&access_token=${accessToken}`)
                    const igMetrics = await igMetricsResp.json()
                    if (igMetrics.followers_count !== undefined) {
                        await supabase.from('account_metrics').upsert({
                            social_account_id: savedAccount.id,
                            follower_count: igMetrics.followers_count,
                            month: new Date().toISOString().substring(0, 7) + '-01'
                        })
                    }
                    const mediaResp = await fetch(`https://graph.facebook.com/v25.0/${accountId}/media?fields=id,caption,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=10&access_token=${accessToken}`)
                    const mediaData = await mediaResp.json()
                    if (mediaData.data) {
                        const postsToInsert = mediaData.data.map((m: any) => ({
                            social_account_id: savedAccount.id,
                            external_id: m.id,
                            title: m.caption?.substring(0, 50) || 'Untitled Post',
                            caption: m.caption || '',
                            media_url: m.media_url || m.thumbnail_url,
                            platforms: 'instagram',
                            status: 'Published',
                            like_count: m.like_count || 0,
                            scheduled_at: m.timestamp,
                            created_at: m.timestamp
                        }))
                        await supabase.from('posts').upsert(postsToInsert, { onConflict: 'social_account_id,external_id' })
                    }
                } else {
                    const fbMetricsResp = await fetch(`https://graph.facebook.com/v25.0/${accountId}?fields=fan_count&access_token=${accessToken}`)
                    const fbMetrics = await fbMetricsResp.json()
                    if (fbMetrics.fan_count !== undefined) {
                        await supabase.from('account_metrics').upsert({
                            social_account_id: savedAccount.id,
                            follower_count: fbMetrics.fan_count,
                            month: new Date().toISOString().substring(0, 7) + '-01'
                        })
                    }
                }
            } catch (seedError) {
                console.error('Seeding error (non-fatal):', seedError)
            }
        }

        // Redirect back to app
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://pie-dash.vercel.app'
        return Response.redirect(`${frontendUrl}/connections?status=connected`)

    } catch (err) {
        const error = err as Error
        const url = new URL(req.url)
        return new Response(JSON.stringify({
            error: error.message,
            receivedUrl: req.url,
            receivedState: url.searchParams.get('state')
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
