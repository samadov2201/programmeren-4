const express = require('express');
const userRouter = express.Router();
const userController = require('../controller/User');
const authController = require('../controller/Auth');
// UC 201
userRouter.post('', userController.validateUser, userController.createUser);
// UC 202
userRouter.get('', userController.getAllUsers);
// UC 203
userRouter.get(
    '/profile',
    authController.validateToken,
    userController.getUserProfile
);
// UC 204
userRouter.get(
    '/:id',
    authController.validateToken,
    userController.getUserById
);
// UC 205
userRouter.put(
    '/:id',
    authController.validateToken,
    userController.validateUpdate,
    userController.updateUser
);
// UC 206
userRouter.delete(
    '/:id',
    authController.validateToken,
    userController.deleteUser
);
module.exports = userRouter;
