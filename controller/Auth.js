const JToken = require('jsonwebtoken');
const db = require('../database/dbconnection');
const { logger, jwtSecretKey } = require('../database/utils');
const tools = require('../tools');
const bcrypt = require('bcrypt');

const authController = {
    login(req, res, next) {
        logger.trace('login called');
        logger.debug(`Request Method: ${req.method}`);
        logger.debug(`Request Body: ${JSON.stringify(req.body)}`);

        const credentials = {
            emailAdress: req.body.emailAdress,
            password: req.body.password,
        };

        if (!credentials.emailAdress || !credentials.password) {
            return res.status(400).json({
                status: 400,
                message: 'Email or Password are missing!',
                data: {},
            });
        }

        db.getConnection((err, connection) => {
            if (err) {
                logger.error('Database connection not succesfull:', err);
                return res.status(500).json({
                    status: 500,
                    message: err.message,
                    data: {},
                });
            }

            const { emailAdress, password } = credentials;

            connection.query(
                'SELECT * FROM user WHERE emailAdress = ?',
                [emailAdress],
                function (error, results, fields) {
                    connection.release();
                    logger.trace(
                        'Connection query returned succesfull results'
                    );
                    logger.debug('emailAdress: ' + emailAdress);
                    if (error) {
                        logger.error('Database query error:', error);
                        return res.status(500).json({
                            status: 500,
                            message: error.message,
                            data: {},
                        });
                    } else if (!results.length) {
                        res
                            .status(404)
                            .json({ status: 404, message: 'User not found', data: {} });
                    } else {
                        let user = results[0];
                        bcrypt.compare(password, user.password, function (err, result) {
                            if (result) {
                                const payload = {
                                    userId: user.id,
                                };
                                logger.debug('user id:', user.id);
                                logger.debug('Password matches, generating JWT...');
                                user = tools.convertIsActiveToBoolean(user);
                                const { password, ...userInfo } = user;

                                JToken.sign(
                                    payload,
                                    jwtSecretKey,
                                    { expiresIn: '2d' },
                                    (err, token) => {
                                        if (err) {
                                            logger.error('Error signing JWT:', err);
                                            return res.status(500).json({
                                                status: 500,
                                                message: err.message,
                                                data: {},
                                            });
                                        }
                                        if (token) {
                                            logger.info('JWT generated:', token);
                                            res.status(200).json({
                                                status: 200,
                                                message: 'Authentication successful!',
                                                data: {
                                                    ...userInfo,
                                                    token,
                                                },
                                            });
                                        }
                                    }
                                );
                            } else {
                                res
                                    .status(401)
                                    .json({ status: 401, message: 'Invalid password', data: {} });
                            }
                        });
                    }
                }
            );
        });
    },

    /**
     * Validatie functie voor /api/login,
     * valideert of de vereiste body aanwezig is.
     */
    validateLogin(req, res, next) {
        // Log request method and body
        logger.debug(`Request Method: ${req.method}`);
        logger.debug(`Request Body: ${JSON.stringify(req.body)}`);

        // Check if emailAdress exists, is a string, is not an empty string, and passes email validation
        if (
            !req.body.emailAdress ||
            typeof req.body.emailAdress !== 'string' ||
            req.body.emailAdress.trim() === '' ||
            !tools.validateEmail(req.body.emailAdress)
        ) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid email address.',
                data: {},
            });
        }

        // Check if password exists, is a string, is not an empty string, and passes password validation
        if (
            !req.body.password ||
            typeof req.body.password !== 'string' ||
            req.body.password.trim() === '' ||
            !tools.validatePassword(req.body.password)
        ) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid password.',
                data: {},
            });
        }

        // If both checks pass, proceed to the next middleware function
        next();
    },

    validateToken(req, res, next) {
        logger.trace('validateToken called');
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            next({
                status: 401,
                message: 'Authorization header missing!',
                data: {},
            });
        } else {
            const token = authHeader.split(' ')[1]; // Extract token from 'Bearer [token]'
            JToken.verify(token, jwtSecretKey, (err, payload) => {
                if (err) {
                    next({
                        status: 401,
                        message: 'Invalid token.',
                        data: {},
                    });
                } else {
                    req.userId = payload.userId; // Attach userId from payload to request object
                    next();
                }
            });
        }
    },
};
module.exports = authController;
