const express = require('express');
const authRouter = express.Router();
const authController = require('../controller/Auth');

// UC 101
authRouter.post('/login', authController.validateLogin, authController.login);

module.exports = authRouter;
