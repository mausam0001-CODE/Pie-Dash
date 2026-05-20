import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const url = new URL(req.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state') // Format is userId:platform

        if (!code || !state) {
            return new Response("Missing code or state", { status: 400 })
        }

        const [userId, platform] = state.split(':')
        const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
        const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
        // We reuse the same redirect logic as IG but pointing to tk-oauth
        const redirectUri = `${url.origin}${url.pathname}`

        console.log(`Exchanging code for TikTok token... for user ${userId}`);

        // 1. Exchange code for access_token
        const tokenResp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey!,
                client_secret: clientSecret!,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            })
        })

        const tokenData = await tokenResp.json()
        if (tokenData.error) throw new Error(`TikTok Token Error: ${tokenData.error_description || tokenData.error}`)

        const accessToken = tokenData.access_token
        const refreshToken = tokenData.refresh_token
        const expiresIn = tokenData.expires_in
        const openId = tokenData.open_id

        // 2. Get User Info
        const userResp = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        const userData = await userResp.json()
        const user = userData.data?.user || {}
        const username = user.display_name || user.username || openId

        // 3. Store in Supabase
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error: dbError } = await supabase
            .from('social_accounts')
            .upsert({
                user_id: userId,
                platform: 'tiktok',
                username: username,
                account_id: openId,
                access_token: accessToken,
                refresh_token: refreshToken,
                token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
            }, { onConflict: 'user_id,platform,account_id' })

        if (dbError) throw dbError

        // Redirect back to the app
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
        return new Response(null, {
            status: 302,
            headers: { Location: `${frontendUrl}/connections?status=connected&platform=tiktok` }
        })

    } catch (error: any) {
        console.error('TikTok OAuth Error:', error.message)
        return new Response(error.message, { status: 500 })
    }
})
