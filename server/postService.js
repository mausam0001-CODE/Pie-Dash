const supabase = require('./supabaseClient');

const postService = {
    async createPost(data) {
        const { data: newPost, error } = await supabase
            .from('posts')
            .insert([{
                title: data.title,
                caption: data.caption,
                media_url: data.mediaUrl,
                platforms: data.platforms.join(','),
                scheduled_at: new Date(data.scheduledAt).toISOString(),
                status: 'Scheduled'
            }])
            .select()
            .single();

        if (error) throw error;
        return newPost;
    },

    async getScheduledPosts() {
        // Fetch posts where status is 'Scheduled' and scheduled_at is less than or equal to NOW
        const nowUtc = new Date().toISOString();
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('status', 'Scheduled')
            .lte('scheduled_at', nowUtc);

        if (error) {
            console.error('[Pie Pro Error] Fetching scheduled posts:', error);
            throw error;
        }
        return data || [];
    },

    async updateStatus(id, status) {
        const { data, error } = await supabase
            .from('posts')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[Pie Pro Error] Updating status for post ${id}:`, error);
            throw error;
        }
        return data;
    }
};

module.exports = postService;
