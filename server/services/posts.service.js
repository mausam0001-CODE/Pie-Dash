const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const getPosts = async () => {
    // For internal team dashboard, we fetch all posts across the team
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data;
};

const updatePostStatus = async (postId, status, errorLog = null) => {
    const { data, error } = await supabase
        .from('posts')
        .update({
            status,
            error_log: errorLog,
            published_at: status === 'Published' ? new Date().toISOString() : null
        })
        .eq('id', postId);

    if (error) throw error;
    return data;
};

const publishToFacebook = async (post) => {
    // Logic from legacy postService.publishToSocial
    console.log(`Publishing post ${post.id} to Facebook: ${post.title}`);

    // Simulation mode check
    if (process.env.SIMULATION_MODE === 'true') {
        return { success: true, platform_id: 'sim_' + Date.now() };
    }

    // Actual FB Graph API call logic would go here
    // For now, we simulate success for demo purposes if not explicitly erroring
    return { success: true, platform_id: 'fb_' + post.id };
};

module.exports = {
    getPosts,
    updatePostStatus,
    publishToFacebook
};
