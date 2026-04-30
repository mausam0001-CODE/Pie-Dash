const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const encrypt = (text) => {
    if (!ENCRYPTION_KEY) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text) => {
    if (!ENCRYPTION_KEY) return text;
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

const saveSocialAccount = async (userId, platform, accessToken, accountData) => {
    const encryptedToken = encrypt(accessToken);
    const { data, error } = await supabase
        .from('social_accounts')
        .upsert({
            user_id: userId,
            platform,
            access_token: encryptedToken,
            account_name: accountData.name,
            account_id: accountData.id,
            updated_at: new Date().toISOString()
        })
        .select();

    if (error) throw error;
    return data;
};

const getSocialAccount = async (userId, platform) => {
    // For internal team use, we look for the shared corporate account for this platform
    const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('platform', platform)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) return null;
    if (data) {
        data.access_token = decrypt(data.access_token);
    }
    return data;
};

module.exports = {
    saveSocialAccount,
    getSocialAccount,
    encrypt,
    decrypt
};
