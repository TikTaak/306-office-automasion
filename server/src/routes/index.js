const express = require('express');
const userRoutes = require('./user.routes');
const messageRoutes = require('./messages.routes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/messages', messageRoutes);

module.exports = router;
