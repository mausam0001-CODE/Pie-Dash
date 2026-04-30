const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { supabaseService } = require('./postService');
const router = express.Router();

// 1. Meta OAuth Config (Load from .env)
const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/auth/facebook/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef'; // 32-char hex

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Step 1: Redirect User to Meta Login
 * Frontend hits this: http://localhost:3000/api/auth/facebook
 */
router.get('/facebook', (req, res) => {
    // SIMULATION MODE: If no App ID is provided, simulate a successful redirect
    if (!FB_APP_ID || FB_APP_ID === 'PASTE_YOUR_ID_HERE') {
        console.log('⚠️ Meta App ID missing. Entering SIMULATION MODE for UI testing.');
        const mockCode = 'MOCK_CODE_' + Math.random().toString(36).substring(7);
        return res.redirect(`${REDIRECT_URI}?code=${mockCode}`);
    }

    const scope = [
        'public_profile',
        'email',
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement'
    ].join(',');

    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}&response_type=code`;
    res.redirect(url);
});

/**
 * Step 2: Callback Handler
 * Meta redirects back here: /api/auth/facebook/callback?code=...
 */
router.get('/facebook/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error || !code) {
        return res.redirect('http://localhost:5173/connections?error=access_denied');
    }

    try {
        // SIMULATION MODE
        if (!FB_APP_ID || FB_APP_ID === 'PASTE_YOUR_ID_HERE') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockToken = 'MOCK_LONG_LIVED_TOKEN_123456789';

            // Save to DB (Service Role needed)
            const { error: dbError } = await supabaseService.from('social_accounts').upsert({
                platform: 'facebook',
                username: 'Pie Pro Tester',
                access_token: encrypt(mockToken),
                expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
            });

            if (dbError) throw dbError;
            return res.redirect(`${FRONTEND_URL}/connections?status=connected`);
        }

        // Exchange Code for Short-Lived User Token (valid for 1-2 hours)
        const tokenResponse = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
            params: {
                client_id: FB_APP_ID,
                client_secret: FB_APP_SECRET,
                redirect_uri: REDIRECT_URI,
                code: code
            }
        });

        const shortToken = tokenResponse.data.access_token;

        // Exchange for LONG-LIVED User Token (valid for 60 days)
        const longTokenResponse = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: FB_APP_ID,
                client_secret: FB_APP_SECRET,
                fb_exchange_token: shortToken
            }
        });

        const longToken = longTokenResponse.data.access_token;

        // Save to DB with encryption
        const { error: dbError } = await supabaseService.from('social_accounts').upsert({
            platform: 'facebook',
            access_token: encrypt(longToken),
            expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        });

        if (dbError) throw dbError;

        res.redirect(`${FRONTEND_URL}/connections?status=connected`);
    } catch (err) {
        console.error('OAuth Callback Error:', err.response?.data || err.message);
        res.redirect('http://localhost:5173/connections?error=token_exchange_failed');
    }
});

module.exports = router;
