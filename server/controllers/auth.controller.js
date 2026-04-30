const authService = require('../services/auth.service');

const handleFacebookCallback = async (req, res) => {
    const { code, state } = req.query;
    // state usually contains the userId or a nonce
    try {
        // Logic for exchanging code for token would go here
        // For simulation, we just succeed
        const mockToken = 'fb_mock_token_' + Date.now();
        const mockAccount = { id: 'fb_123', name: 'Pie Pro Fan Page' };

        await authService.saveSocialAccount(state || 'dev-user', 'facebook', mockToken, mockAccount);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/connections?status=connected`);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    handleFacebookCallback
};
