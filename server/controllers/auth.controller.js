const authService = require('../services/auth.service');

const redirectToFacebook = (req, res) => {
    const appId = process.env.FB_APP_ID;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;
    const scopes = [
        'public_profile',
        'email',
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=dev-user`;

    res.redirect(authUrl);
};

const handleFacebookCallback = async (req, res) => {
    const { code, state } = req.query;
    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/connections?error=denied`);
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;

    try {
        const { accessToken, account } = await authService.exchangeFacebookCode(code, redirectUri);

        await authService.saveSocialAccount(state || 'team-user', 'facebook', accessToken, account);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/connections?status=connected`);
    } catch (error) {
        console.error('Meta OAuth Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to connect to Meta. Please check your credentials in .env.local' });
    }
};

module.exports = {
    redirectToFacebook,
    handleFacebookCallback
};
