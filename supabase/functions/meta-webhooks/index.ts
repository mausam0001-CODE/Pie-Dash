import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Utility to convert hex string to ArrayBuffer
function hexToUint8Array(hex: string) {
    const view = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return view;
}

serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const url = new URL(req.url)

    // 2. Webhook Verification (GET request from Meta)
    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode')
        const token = url.searchParams.get('hub.verify_token')
        const challenge = url.searchParams.get('hub.challenge')

        const verifyToken = Deno.env.get('META_VERIFY_TOKEN') || 'my_verification_token'

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('Webhook Verified Successfully')
            return new Response(challenge, { status: 200 })
        }
        return new Response('Verification failed', { status: 403 })
    }

    // 3. Webhook Events (POST request from Meta)
    if (req.method === 'POST') {
        try {
            const rawBody = await req.text()
            const signature = req.headers.get('x-hub-signature-256')
            const appSecret = Deno.env.get('FB_APP_SECRET')

            // Security: Verify HMAC Signature if secret is available
            if (signature && appSecret) {
                const [algo, hash] = signature.split('=')
                if (algo === 'sha256') {
                    const encoder = new TextEncoder()
                    const key = await crypto.subtle.importKey(
                        'raw',
                        encoder.encode(appSecret),
                        { name: 'HMAC', hash: 'SHA-256' },
                        false,
                        ['verify']
                    )

                    const isVerified = await crypto.subtle.verify(
                        'HMAC',
                        key,
                        hexToUint8Array(hash),
                        encoder.encode(rawBody)
                    )

                    if (!isVerified) {
                        console.error('Webhook Signature Verification Failed')
                        return new Response('Invalid signature', { status: 401 })
                    }
                }
            }

            const body = JSON.parse(rawBody)
            console.log('Meta Webhook Event Received (Validated):', JSON.stringify(body, null, 2))

            // Logic to handle specific events:
            // - body.entry[].changes[] for Instagram/Page updates
            // - Update the DB using service role key if needed

            return new Response(JSON.stringify({ status: 'received' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        } catch (error: any) {
            console.error('Error processing webhook:', error.message)
            return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }
    }

    return new Response('Method Not Allowed', { status: 405 })
})
