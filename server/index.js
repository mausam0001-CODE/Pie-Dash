require('dotenv').config({ path: '../.env.local' });
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const postService = require('./postService');
const authService = require('./authService');
const rateLimit = require('express-rate-limit');

// Environment Validation
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const encrypt = process.env.ENCRYPTION_KEY;

if (!url || !key || !encrypt) {
    console.error(`\n❌ CRITICAL ERROR: Missing required environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, or ENCRYPTION_KEY).`);
    console.error('The server cannot start without these for security reasons.\n');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// 1. Server Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const authMiddleware = require('./middleware/auth.middleware');

const postRoutes = require('./routes/posts.routes');
const authRoutes = require('./routes/auth.routes');

// 2. Auth Routes
app.use('/api/auth/facebook', authRoutes);

// 3. Protected API Routes
app.use('/api/posts', postRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'operational', timestamp: new Date() });
});

// 3. Start Server
app.listen(PORT, () => {
    console.clear();
    console.log(`🚀 [Pie Pro] Hybrid Server/Worker Active`);
    console.log(`📡 API Listening on: http://localhost:${PORT}`);
    console.log(`⏳ Polling for scheduled content every 60 seconds...\n`);
});

const postsService = require('./services/posts.service');

// Background Worker: Post Scheduler (Runs every minute)
cron.schedule('* * * * *', async () => {
    console.log('--- Post Scheduler Heartbeat ---');
    try {
        const posts = await postsService.getPosts();
        const now = new Date();

        const duePosts = posts.filter(p =>
            p.status === 'Scheduled' &&
            new Date(p.scheduled_at) <= now
        );

        console.log(`Found ${duePosts.length} posts due for publishing.`);

        for (const post of duePosts) {
            try {
                console.log(`Attempting to publish post: ${post.title}`);
                const result = await postsService.publishToFacebook(post);

                if (result.success) {
                    await postsService.updatePostStatus(post.id, 'Published');
                    console.log(`Successfully published post ${post.id}`);
                } else {
                    throw new Error(result.error || 'Unknown publishing error');
                }
            } catch (postError) {
                console.error(`Failed to publish post ${post.id}:`, postError);
                // Simple retry: if not failed more than 3 times, keep as Scheduled but log error
                // For now, mark as Failed to avoid infinite loops without a retry count column
                await postsService.updatePostStatus(post.id, 'Failed', postError.message);
            }
        }
    } catch (err) {
        console.error('Scheduler Error:', err);
    }
});
