const prisma = require('../db/prismaClient');

async function createMessage(data) {
    const fromUser = await prisma.user.findUnique({
        where: { id: data.fromUserId },
    });
    const toUser = await prisma.user.findUnique({ where: { id: data.toUserId } });

    if (!fromUser || !toUser) {
        throw new Error('Invalid user id');
    }

    return await prisma.message.create({
        data: data,
    });
}

module.exports = { createMessage };
