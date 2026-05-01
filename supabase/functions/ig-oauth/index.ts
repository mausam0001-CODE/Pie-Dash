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
        const state = url.searchParams.get('state') // userId

        if (!code) throw new Error('No code provided')

        const FB_APP_ID = Deno.env.get('FB_APP_ID')
        const FB_APP_SECRET = Deno.env.get('FB_APP_SECRET')
        const REDIRECT_URI = `${url.origin}${url.pathname}`

        // 1. Exchange for Short Token
        const shortResp = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`)
        const shortData = await shortResp.json()
        if (shortData.error) throw new Error(shortData.error.message)

        // 2. Exchange for Long Token
        const longResp = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${shortData.access_token}`)
        const longData = await longResp.json()

        // 3. Get Profile
        const profResp = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${longData.access_token}`)
        const profile = await profResp.json()

        // 4. Save to DB (Using Service Role client to bypass RLS for this system action)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error } = await supabase
            .from('social_accounts')
            .upsert({
                user_id: state || 'team-user',
                platform: 'facebook',
                access_token: longData.access_token, // In a real production setup, encrypt this here using ENCRYPTION_KEY secret
                account_id: profile.id,
                account_name: profile.name,
                expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
            })

        if (error) throw error

        // 5. Redirect back to Frontend
        return new Response(null, {
            status: 302,
            headers: { ...corsHeaders, 'Location': 'http://localhost:5173/connections?status=connected' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
