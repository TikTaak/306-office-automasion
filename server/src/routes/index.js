const express = require('express');
const userRoutes = require('./user.routes');
const messageRoutes = require('./messages.routes');
const coreRoutes = require('./core.routes');

const router = express.Router();

router.use('/', coreRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes);

module.exports = router;
