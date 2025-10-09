// userManager.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { app } = require('electron');

const userFile = path.join(app.getPath('userData'), 'user.json');

let user = null; // In-memory user object

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} host
 */

/**
 * Initialize the user by reading from file if it exists
 * @returns {User|null}
 */
function init() {
    if (fs.existsSync(userFile)) {
        user = JSON.parse(fs.readFileSync(userFile, 'utf8'));
    }
    console.log(user);

    return user;
}

/**
 * Get the current user from memory
 * @returns {User|null}
 */
function getUser() {
    return user;
}

/**
 * Save user to server and store in local file
 * @param {string} name - User's name
 * @param {string} host - host endpoint to register user
 * @returns {Promise<User|null>}
 */
async function saveUser({ name, host }) {
    try {
        const res = await axios.post(
            `${host}/api/users`,
            { name },
            {
                proxy: false,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        user = {
            id: res.data.id,
            name: res.data.name,
            host: host,
        };
        await fs.writeFileSync(userFile, JSON.stringify(user));

        return user;
    } catch (err) {
        console.error('Error saving user:', err);
        return null;
    }
}

/**
 * Delete user from server and remove local file
 * @returns {Promise<void>}
 */
async function deleteUser() {
    if (!user) return;
    try {
        /*
        await axios.delete(`${user.host}/api/users/${user.id}`, {
            proxy: false,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        */

        if (await fs.existsSync(userFile)) {
            await fs.unlinkSync(userFile);
        }
        user = null;
    } catch (err) {
        console.error('Error deleting user:', err);
    }
}

module.exports = { init, getUser, saveUser, deleteUser };
