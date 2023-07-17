const express = require('express');
const userRouter = require('./user.router');
const router = express.Router();

// colocar las rutas aquí
router.use('/users', userRouter)

require('crypto').randomBytes(64).toString('hex')
module.exports = router;