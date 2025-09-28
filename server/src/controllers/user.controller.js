const { getAllUsers } = require('../services/user.service')

async function getUsers(req, res) {
  const users = await getAllUsers()
  res.json(users)
}

module.exports = { getUsers }
