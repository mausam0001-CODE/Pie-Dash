import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state') // userId:platform
        const platformParam = url.searchParams.get('targetPagePlatform');

        if (!code) throw new Error('No code provided')

        const [userId, targetPlatform] = (state && state.includes(':'))
            ? state.split(':')
            : [state || 'team-user', platformParam || 'facebook'];

        console.log('OAuth Callback Details:', { userId, targetPlatform, hasState: !!state, hasParam: !!platformParam });

        const isInstagram = targetPlatform === 'instagram';
        const FB_APP_ID = Deno.env.get(isInstagram ? 'INSTA_APP_ID' : 'FB_APP_ID') || Deno.env.get('FB_APP_ID');
        const FB_APP_SECRET = Deno.env.get(isInstagram ? 'INSTA_APP_SECRET' : 'FB_APP_SECRET') || Deno.env.get('FB_APP_SECRET');

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
        const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0]
        const REDIRECT_URI = projectRef
            ? `https://${projectRef}.supabase.co/functions/v1/ig-oauth`
            : "https://ivsytkzemjludwzhrdsu.supabase.co/functions/v1/ig-oauth"

        // 1. Exchange for Short Token
        let accessToken = '';
        if (isInstagram) {
            const shortResp = await fetch(`https://api.instagram.com/oauth/access_token`, {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: FB_APP_ID || '',
                    client_secret: FB_APP_SECRET || '',
                    grant_type: 'authorization_code',
                    redirect_uri: REDIRECT_URI,
                    code: code,
                })
            })
            const shortData = await shortResp.json()
            console.log('Short Token Data:', shortData);
            if (shortData.error_message) throw new Error(shortData.error_message)
            if (shortData.error) throw new Error(shortData.error.message)
            accessToken = shortData.access_token;
        } else {
            const shortResp = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${code}`)
            const shortData = await shortResp.json()
            if (shortData.error) throw new Error(shortData.error.message)
            accessToken = shortData.access_token;
        }

        // 2. Exchange for Long Token
        let longToken = accessToken;
        if (isInstagram) {
            const longResp = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${FB_APP_SECRET}&access_token=${accessToken}`)
            const longData = await longResp.json()
            if (longData.error) throw new Error(longData.error.message)
            longToken = longData.access_token || accessToken;
        } else {
            const longResp = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`)
            const longData = await longResp.json()
            if (longData.error) throw new Error(longData.error.message)
            longToken = longData.access_token || accessToken;
        }

        // 3. Get Profile Details
        let accountId = '';
        let username = '';
        let avatarUrl = '';

        if (isInstagram) {
            // Get Instagram user details
            const profResp = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longToken}`)
            const profData = await profResp.json()
            if (profData.error) throw new Error(profData.error.message)
            accountId = profData.id;
            username = profData.username;
        } else {
            // Facebook/Meta Graph API variant (Used for both FB Pages and IG Business via Page)
            const pagesResp = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longToken}`)
            const pagesData = await pagesResp.json()
            if (pagesData.error) throw new Error(pagesData.error.message)

            const page = pagesData.data?.[0]

            if (targetPlatform === 'instagram') {
                // If the user wants to connect Instagram, we MUST find a Page + Linked IG Business Account
                if (!page) throw new Error('No Facebook Page found. Instagram Business accounts must be linked to a Facebook Page.')

                const igResp = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${longToken}`)
                const igData = await igResp.json()
                const igBusinessAccount = igData.instagram_business_account
                if (!igBusinessAccount) throw new Error('No Instagram Business Account linked to this Facebook Page.')

                const igProfResp = await fetch(`https://graph.facebook.com/v18.0/${igBusinessAccount.id}?fields=id,username,profile_picture_url&access_token=${longToken}`)
                const igProfData = await igProfResp.json()
                accountId = igProfData.id;
                username = igProfData.username;
                avatarUrl = igProfData.profile_picture_url;
            } else {
                // Target is Facebook
                if (page) {
                    accountId = page.id;
                    username = page.name;
                    // For Pages, the ID can be used to get the picture
                    avatarUrl = `https://graph.facebook.com/v18.0/${page.id}/picture?type=square&access_token=${longToken}`;
                } else {
                    // Fallback to personal profile if no Page is found
                    const userResp = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${longToken}`)
                    const userData = await userResp.json()
                    if (userData.error) throw new Error(userData.error.message)
                    accountId = userData.id;
                    username = userData.name;
                    avatarUrl = userData.picture?.data?.url;
                }
            }
        }

        // 4. Save to DB
        const supabase = createClient(
            SUPABASE_URL,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: savedAccount, error } = await supabase
            .from('social_accounts')
            .upsert({
                user_id: userId,
                platform: targetPlatform,
                access_token: longToken,
                account_id: accountId,
                username: username,
                avatar_url: avatarUrl,
                expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single()

        if (error) throw error;

        // 5. Seed Initial Data (Followers & Recent Posts)
        try {
            if (targetPlatform === 'instagram') {
                // Get Follower Count
                const igMetricsResp = await fetch(`https://graph.facebook.com/v18.0/${accountId}?fields=followers_count&access_token=${longToken}`)
                const igMetrics = await igMetricsResp.json()
                if (igMetrics.followers_count !== undefined) {
                    await supabase.from('account_metrics').upsert({
                        social_account_id: savedAccount.id,
                        follower_count: igMetrics.followers_count,
                        month: new Date().toISOString().split('T')[0].substring(0, 7) + '-01'
                    })
                }

                // Get Recent Posts
                const mediaResp = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media?fields=id,caption,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=10&access_token=${longToken}`)
                const mediaData = await mediaResp.json()
                if (mediaData.data) {
                    const postsToInsert = mediaData.data.map((m: any) => ({
                        social_account_id: savedAccount.id,
                        title: m.caption?.substring(0, 50) || 'Untitled Post',
                        caption: m.caption || '',
                        media_url: m.media_url || m.thumbnail_url,
                        platforms: 'instagram',
                        status: 'Published',
                        view_count: m.like_count * 15, // Simplified estimation
                        like_count: m.like_count || 0,
                        scheduled_at: m.timestamp,
                        created_at: m.timestamp
                    }))
                    await supabase.from('posts').upsert(postsToInsert)
                }
            } else if (targetPlatform === 'facebook') {
                // Get Page Follower Count
                const fbMetricsResp = await fetch(`https://graph.facebook.com/v18.0/${accountId}?fields=fan_count&access_token=${longToken}`)
                const fbMetrics = await fbMetricsResp.json()
                if (fbMetrics.fan_count !== undefined) {
                    await supabase.from('account_metrics').upsert({
                        social_account_id: savedAccount.id,
                        follower_count: fbMetrics.fan_count,
                        month: new Date().toISOString().split('T')[0].substring(0, 7) + '-01'
                    })
                }

                // Get Recent Feed Posts
                const feedResp = await fetch(`https://graph.facebook.com/v18.0/${accountId}/feed?fields=id,message,full_picture,created_time&limit=10&access_token=${longToken}`)
                const feedData = await feedResp.json()
                if (feedData.data) {
                    const postsToInsert = feedData.data.map((f: any) => ({
                        social_account_id: savedAccount.id,
                        title: f.message?.substring(0, 50) || 'Facebook Post',
                        caption: f.message || '',
                        media_url: f.full_picture,
                        platforms: 'facebook',
                        status: 'Published',
                        scheduled_at: f.created_time,
                        created_at: f.created_time
                    }))
                    await supabase.from('posts').upsert(postsToInsert)
                }
            }
        } catch (seedError) {
            console.error('Error seeding initial data:', seedError)
            // We don't throw here to avoid failing the whole connection if just seeding fails
        }

        // 6. Redirect back to app
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://pie-dash.vercel.app'
        return Response.redirect(`${frontendUrl}/connections?status=connected`)

    } catch (error) {
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
