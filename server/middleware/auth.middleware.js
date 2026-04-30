const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware to protect routes using Supabase JWT
 */
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // For development, we can allow a bypass if an environment variable is set
        if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
            req.user = { id: 'dev-user-123', email: 'dev@piepro.io' };
            return next();
        }
        return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

module.exports = authMiddleware;
