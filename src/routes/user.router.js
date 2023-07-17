const { getAll, create, getOne, remove, update, Login, verifyCode, getLoggedUser, resetPasswordRequest, resetPassword } = require('../controllers/user.controllers');
const express = require('express');
const verifyJWT = require('../utils/verifyJWT');

const userRouter = express.Router();

userRouter.route('/')
    .get(verifyJWT, getAll)
    .post(create);
    
userRouter.route('/verify/:code')
    .get(verifyCode);

userRouter.route('/login')
    .post(Login);
    
userRouter.route('/me')
    .get(verifyJWT, getLoggedUser);

userRouter.route('/reset_password')
    .post(resetPasswordRequest);

userRouter.route('/reset_password/:code')
    .post(resetPassword);

userRouter.route('/:id')
    .get(verifyJWT, getOne)
    .delete(verifyJWT, remove)
    .put(verifyJWT, update);

module.exports = userRouter;