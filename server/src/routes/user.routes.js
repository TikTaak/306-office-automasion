const express = require('express')
const { getUsers, addUser, removeUser, findUser } = require('../controllers/user.controller')

const router = express.Router()

router.get('/', getUsers)
router.post('/', addUser)
router.delete('/:id', removeUser)
router.get('/:id', findUser)

module.exports = router
