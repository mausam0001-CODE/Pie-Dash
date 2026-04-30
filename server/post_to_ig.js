const axios = require('axios');

// Ported from Randolly-Base/api/lib/post_to_ig.js
async function postToInstagram(post) {
    const { accessToken, instagramId, mediaUrl, caption } = post;

    try {
        console.log(`[Instagram API] Initiating post for ${instagramId}...`);

        // 1. Create Media Container
        const container = await axios.post(`https://graph.facebook.com/v19.0/${instagramId}/media`, {
            image_url: mediaUrl,
            caption: caption,
            access_token: accessToken
        });

        const creationId = container.data.id;

        // 2. Publish Container
        const publish = await axios.post(`https://graph.facebook.com/v19.0/${instagramId}/media_publish`, {
            creation_id: creationId,
            access_token: accessToken
        });

        console.log(`[Instagram API] Post successful! ID: ${publish.data.id}`);
        return publish.data;
    } catch (error) {
        console.error(`[Instagram API] Failure: ${error.response?.data?.error?.message || error.message}`);
        throw error;
    }
}

module.exports = { postToInstagram };
