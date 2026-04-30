const prisma = require('./db');

const accountService = {
    async connectAccount(data) {
        return await prisma.socialAccount.create({
            data: {
                platform: data.platform,
                username: data.username,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            }
        });
    },

    async getAccountsByPlatform(platform) {
        return await prisma.socialAccount.findMany({
            where: { platform }
        });
    },

    async deleteAccount(id) {
        return await prisma.socialAccount.delete({
            where: { id }
        });
    }
};

module.exports = accountService;
