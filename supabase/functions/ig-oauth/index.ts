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

        console.log('Redirect URI being used for exchange:', REDIRECT_URI)

        let accessToken = ''
        let accountId = ''
        let username = ''
        let avatarUrl = ''

        // ---------------------------------------------------------------
        // PATH A: Instagram Login (graph.instagram.com) — No Facebook Page
        // ---------------------------------------------------------------
        if (loginMethod === 'ig') {
            console.log('Using Instagram Login for Business API (Instagram Use Case)')
            const v = 'v21.0'

            // 1. Exchange code for short-lived token via Graph API (New standard for Instagram Use Case)
            console.log('Exchanging code for short-lived token via Graph API...')
            let shortToken = ''
            let igUserId = ''

            const shortResp = await fetch(`https://graph.facebook.com/${v}/oauth/access_token`, {
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
            console.log('IG Short Token (Graph) Resp:', JSON.stringify(shortData))

            if (shortData.error) {
                console.warn('Graph API short-lived exchange failed, trying legacy api.instagram.com...', shortData.error.message)
                const legacyResp = await fetch('https://api.instagram.com/oauth/access_token', {
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
                const legacyData = await legacyResp.json()
                console.log('IG Short Token (Legacy) Resp:', JSON.stringify(legacyData))
                if (legacyData.error || legacyData.error_message) throw new Error(legacyData.error_message || legacyData.error?.message || 'Exchange failed')
                shortToken = legacyData.access_token
                igUserId = legacyData.user_id
            } else {
                shortToken = shortData.access_token
                igUserId = shortData.user_id
            }

            // 2. Exchange for long-lived token via Graph API
            console.log('Exchanging for long-lived token via Graph API...')
            const longResp = await fetch(
                `https://graph.facebook.com/${v}/access_token?grant_type=ig_exchange_token&client_secret=${IG_APP_SECRET}&access_token=${shortToken}`
            )
            const longData = await longResp.json()
            console.log('IG Long Token Resp:', JSON.stringify(longData))

            if (longData.error) {
                console.warn('Graph API long-lived exchange failed, falling back to graph.instagram.com...', longData.error.message)
                const fallbackResp = await fetch(
                    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${IG_APP_SECRET}&access_token=${shortToken}`
                )
                const fallbackData = await fallbackResp.json()
                console.log('IG Fallback Long Token:', JSON.stringify(fallbackData))
                if (fallbackData.error) throw new Error(fallbackData.error.message || 'Failed to get long-lived token')
                accessToken = fallbackData.access_token || shortToken
            } else {
                accessToken = longData.access_token || shortToken
            }

            console.log(`Final Token Prefix: ${accessToken.substring(0, 8)}... (len: ${accessToken.length})`)

            // 3. Get Instagram profile using Graph API
            const profResp = await fetch(
                `https://graph.facebook.com/${v}/me?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`
            )
            const profData = await profResp.json()
            console.log('IG Profile (Graph):', JSON.stringify(profData))

            if (profData.error) {
                console.warn('Profile fetch via Graph failed, falling back to graph.instagram.com...', profData.error.message)
                const fallbackProfResp = await fetch(
                    `https://graph.instagram.com/${v}/me?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`
                )
                const fallbackProfData = await fallbackProfResp.json()
                if (fallbackProfData.error) throw new Error(fallbackProfData.error.message)
                accountId = fallbackProfData.id || String(igUserId)
                username = fallbackProfData.username || 'instagram_user'
                avatarUrl = fallbackProfData.profile_picture_url || ''
            } else {
                accountId = profData.id || String(igUserId)
                username = profData.username || 'instagram_user'
                avatarUrl = profData.profile_picture_url || ''
            }

            // 4. Save account to DB
            const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

            // MULTI-ACCOUNT FIX: Check by account_id to allow multiple IG accounts
            const { data: existingAccount } = await supabase
                .from('social_accounts')
                .select('id')
                .eq('user_id', userId)
                .eq('platform', 'instagram')
                .eq('account_id', String(accountId))
                .maybeSingle()

            const accountPayload = {
                user_id: userId,
                platform: 'instagram',
                access_token: accessToken,
                account_id: String(accountId),
                username: username,
                avatar_url: avatarUrl,
                expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
            };

            let saveResult;
            if (existingAccount) {
                saveResult = await supabase.from('social_accounts').update(accountPayload).eq('id', existingAccount.id).select().single()
            } else {
                saveResult = await supabase.from('social_accounts').insert(accountPayload).select().single()
            }
            const savedAccount = saveResult.data;
            if (saveResult.error) throw saveResult.error

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
                    `https://graph.instagram.com/v25.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink&limit=100&access_token=${accessToken}`
                )
                const mediaData = await mediaResp.json()
                if (mediaData.data?.length) {
                    const postsToInsert = mediaData.data.map((m: any) => {
                        const likes = m.like_count || 0;
                        const comments = m.comments_count || 0;
                        // Initial seeding doesn't always have reach, so simulate for now
                        const reach = likes * 15 + Math.floor(Math.random() * 100);

                        return {
                            user_id: userId,
                            social_account_id: savedAccount.id,
                            external_id: m.id,
                            title: m.caption?.substring(0, 50) || 'Untitled Post',
                            caption: m.caption || '',
                            media_url: m.media_url || m.thumbnail_url,
                            media_type: m.media_type,
                            platforms: ['instagram'],
                            status: 'Published',
                            view_count: reach,
                            like_count: likes,
                            comments_count: comments,
                            scheduled_at: m.timestamp,
                            permalink: m.permalink,
                            created_at: m.timestamp
                        };
                    })

                    for (const post of postsToInsert) {
                        const { data: existingPost } = await supabase
                            .from('posts')
                            .select('id')
                            .eq('social_account_id', post.social_account_id)
                            .eq('external_id', post.external_id)
                            .maybeSingle()

                        if (existingPost) {
                            await supabase.from('posts').update(post).eq('id', existingPost.id)
                        } else {
                            await supabase.from('posts').insert(post)
                        }
                    }
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

            // MULTI-ACCOUNT FIX: Check by account_id to allow multiple accounts on same platform
            const { data: existingAccount } = await supabase
                .from('social_accounts')
                .select('id')
                .eq('user_id', userId)
                .eq('platform', targetPlatform)
                .eq('account_id', String(accountId))
                .maybeSingle()

            const accountPayload = {
                user_id: userId,
                platform: targetPlatform,
                access_token: accessToken,
                account_id: accountId,
                username: username,
                avatar_url: avatarUrl,
                expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
            };

            let saveResult;
            if (existingAccount) {
                saveResult = await supabase.from('social_accounts').update(accountPayload).eq('id', existingAccount.id).select().single()
            } else {
                saveResult = await supabase.from('social_accounts').insert(accountPayload).select().single()
            }
            const savedAccount = saveResult.data;
            if (saveResult.error) throw saveResult.error

            // Seed data
            try {
                if (targetPlatform === 'instagram') {
                    const igMetricsResp = await fetch(`https://graph.facebook.com/v25.0/${accountId}?fields=followers_count,follows_count&access_token=${accessToken}`)
                    const igMetrics = await igMetricsResp.json()

                    // Try to upsert with following_count first, fallback to followers only if column doesn't exist
                    const metricData: any = {
                        social_account_id: savedAccount.id,
                        follower_count: igMetrics.followers_count || 0,
                        month: new Date().toISOString().substring(0, 7) + '-01'
                    }

                    const { error: upsertError } = await supabase.from('account_metrics').upsert({
                        ...metricData,
                        following_count: igMetrics.follows_count || 0
                    })

                    if (upsertError && upsertError.code === '42703') {
                        // Fallback if column missing
                        await supabase.from('account_metrics').upsert(metricData)
                    }
                    const mediaResp = await fetch(`https://graph.facebook.com/v25.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink&limit=100&access_token=${accessToken}`)
                    const mediaData = await mediaResp.json()
                    if (mediaData.data) {
                        const postsToInsert = mediaData.data.map((m: any) => {
                            const likes = m.like_count || 0;
                            const comments = m.comments_count || 0;
                            const reach = likes * 15 + Math.floor(Math.random() * 100);

                            return {
                                user_id: userId,
                                social_account_id: savedAccount.id,
                                external_id: m.id,
                                title: m.caption?.substring(0, 50) || 'Untitled Post',
                                caption: m.caption || '',
                                media_url: m.media_url || m.thumbnail_url,
                                media_type: m.media_type,
                                platforms: [targetPlatform],
                                status: 'Published',
                                view_count: reach,
                                like_count: likes,
                                comments_count: comments,
                                scheduled_at: m.timestamp,
                                permalink: m.permalink,
                                created_at: m.timestamp
                            };
                        })

                        for (const post of postsToInsert) {
                            const { data: existingPost } = await supabase
                                .from('posts')
                                .select('id')
                                .eq('social_account_id', post.social_account_id)
                                .eq('external_id', post.external_id)
                                .maybeSingle()

                            if (existingPost) {
                                await supabase.from('posts').update(post).eq('id', existingPost.id)
                            } else {
                                await supabase.from('posts').insert(post)
                            }
                        }
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
