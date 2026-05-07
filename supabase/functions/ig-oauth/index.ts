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
            // Get Instagram user details (Basic Display / Graph API variant)
            const profResp = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${longToken}`)
            const profData = await profResp.json()
            if (profData.error) throw new Error(profData.error.message)
            accountId = profData.id;
            username = profData.username;
        } else {
            // Facebook/IG-via-Facebook logic
            const pagesResp = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longToken}`)
            const pagesData = await pagesResp.json()
            if (pagesData.error) throw new Error(pagesData.error.message)
            const page = pagesData.data?.[0]
            if (!page) throw new Error('No Facebook Page found linked to this account')

            const igResp = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${longToken}`)
            const igData = await igResp.json()
            const igBusinessAccount = igData.instagram_business_account
            if (!igBusinessAccount) throw new Error('No Instagram Business Account linked to this Facebook Page')

            const igProfResp = await fetch(`https://graph.facebook.com/v18.0/${igBusinessAccount.id}?fields=id,username,profile_picture_url&access_token=${longToken}`)
            const igProfData = await igProfResp.json()
            accountId = igProfData.id;
            username = igProfData.username;
            avatarUrl = igProfData.profile_picture_url;
        }

        // 4. Save to DB
        const supabase = createClient(
            SUPABASE_URL,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error } = await supabase
            .from('social_accounts')
            .upsert({
                user_id: userId,
                platform: targetPlatform,
                access_token: longData.access_token,
                account_id: accountId,
                username: username,
                expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
            })

        if (error) throw error

        // 5. Redirect back to Frontend
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://pie-dash.vercel.app'
        return new Response(null, {
            status: 302,
            headers: { ...corsHeaders, 'Location': `${frontendUrl}/connections?status=connected` }
        })

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
