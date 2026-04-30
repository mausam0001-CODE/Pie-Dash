const postsService = require('../services/posts.service');

const getAllPosts = async (req, res) => {
    try {
        const posts = await postsService.getPosts();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status, errorLog } = req.body;
    try {
        const data = await postsService.updatePostStatus(id, status, errorLog);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllPosts,
    updateStatus
};
