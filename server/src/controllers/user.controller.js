const {
    getAllUsers,
    createUser,
    deleteUser,
    getUserById,
} = require('../services/user.service');

// GET /api/users
async function getUsers(req, res) {
    const users = await getAllUsers();
    res.json(users);
}

// POST /api/users
async function addUser(req, res) {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const user = await createUser(name);
        res.status(201).json(user);
    } catch (err) {
        console.error('❌ خطا در ایجاد کاربر:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function removeUser(req, res) {
    const { id } = req.params;
    try {
        const user = await deleteUser(id);
        res.json({ message: `User ${user.name} deleted successfully` });
    } catch (err) {
        console.error('❌ خطا در حذف کاربر:', err);
        res.status(404).json({ error: 'User not found' });
    }
}

// GET /api/users/:id
async function findUser(req, res) {
    const { id } = req.params;
    try {
        const user = await getUserById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('❌ خطا در پیدا کردن کاربر:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { getUsers, addUser, removeUser, findUser };
