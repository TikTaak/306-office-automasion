const prisma = require('../db/prismaClient');

async function getAllUsers() {
    return await prisma.user.findMany();
}

async function createUser(name) {
    return await prisma.user.create({
        data: { name },
    });
}

async function deleteUser(id) {
    return await prisma.user.delete({
        where: { id: Number(id) },
    });
}

async function getUserById(id) {
    return await prisma.user.findUnique({
        where: { id: Number(id) },
    });
}

module.exports = { getAllUsers, createUser, deleteUser, getUserById };
