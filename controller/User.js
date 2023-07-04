const tools = require('../tools');
const logger = require('../database/utils').logger;
const dbCon = require('../database/dbconnection');
// userController handles the routes for creating, updating, deleting, and retrieving user data
const userController = {
    // getAllUsers retrieves all users from the database
    getAllUsers: (req, res, next) => {
        logger.trace('Get all users');
        const { error, sqlStatement, params } = tools.buildSqlStatement(req.query);
        if (error) {
            res.status(400).json({ status: 400, message: error, data: {} });
            return;
        }

        dbCon.getConnection(function (err, conn) {
            if (err) {
                logger.error('Database connection error:', err);
                return res.status(500).json({
                    status: 500,
                    message: err.message,
                    data: {},
                });
            }
            if (conn) {
                conn.query(sqlStatement, params, function (err, results, fields) {
                    if (err) {
                        logger.error('Database query error:', err);
                        return res.status(500).json({
                            status: 500,
                            message: err.message,
                            data: {},
                        });
                    }
                    if (results) {
                        logger.info('Found', results.length, 'results');
                        for (let i = 0; i < results.length; i++) {
                            results[i] = tools.convertIsActiveToBoolean(results[i]);
                        }
                        res.status(200).json({
                            status: 200,
                            message: 'Get All Users.',
                            data: results,
                        });
                    }
                });
                dbCon.releaseConnection(conn);
            }
        });
    },
    validateUser: (req, res, next) => {
        let user = req.body;
        logger.info('Validating user');

        const requiredFields = [
            'firstName',
            'lastName',
            'password',
            'street',
            'city',
            'emailAdress',
        ];
        const fieldTypes = {
            firstName: 'string',
            lastName: 'string',
            password: 'string',
            street: 'string',
            city: 'string',
            emailAdress: 'string',
        };

        for (let field of requiredFields) {
            if (!user[field]) {
                return next({ status: 400, message: `${field} is missing.`, data: {} });
            }
            if (typeof user[field] !== fieldTypes[field]) {
                return next({
                    status: 400,
                    message: `${field} must be a ${fieldTypes[field]}.`,
                    data: {},
                });
            }
            if (typeof user[field] === 'string' && user[field].trim() === '') {
                return next({
                    status: 400,
                    message: `${field} must not be blank.`,
                    data: {},
                });
            }
            if (field === 'password' && !tools.validatePassword(user[field])) {
                return next({ status: 400, message: 'Invalid password.', data: {} });
            }
            if (field === 'emailAdress' && !tools.validateEmail(user[field])) {
                return next({
                    status: 400,
                    message: 'Invalid email address.',
                    data: {},
                });
            }
        }

        if (!tools.validatePhoneNumber(user.phoneNumber)) {
            return next({ status: 400, message: 'Invalid phone number.', data: {} });
        }

        next();
    },
    // CreateUser creates a new user and adds it to the database
    createUser: (req, res) => {
        logger.trace('Create User');
        const newUser = ({
            firstName,
            lastName,
            emailAdress,
            password,
            street,
            city,
        } = req.body);
        logger.debug('user = ', newUser);

        tools.hashPassword(newUser.password, function (err, hash) {
            if (err) {
                logger.error('Bcrypt hashing error:', err);
                return res.status(500).json({
                    status: 500,
                    message: err.message,
                    data: {},
                });
            }
            newUser.password = hash;
            dbCon.getConnection(function (err, connection) {
                if (err) {
                    logger.error('Database connection error:', err);
                    return res.status(500).json({
                        status: 500,
                        message: err.message,
                        data: {},
                    });
                }

                // Use the connection
                const sql = `
        INSERT INTO user (
          firstName, lastName, emailAdress, password,
          phoneNumber, street, city
        ) VALUES ( ?, ?, ?, ?, ?, ?, ?)
      `;
                const values = [
                    newUser.firstName,
                    newUser.lastName,
                    newUser.emailAdress,
                    newUser.password,
                    newUser.phoneNumber || '',
                    newUser.street,
                    newUser.city,
                ];
                connection.query(sql, values, function (error, results, fields) {
                    // When done with the connection, release it.
                    if (error) {
                        if (error.code === 'ER_DUP_ENTRY') {
                            // Send a custom error message to the user
                            res.status(403).json({
                                status: 403,
                                message: 'A user already exists with this email address.',
                                data: {},
                            });
                        } else {
                            // Send the original error message if it is another error
                            logger.info('#affectedRows= ', results.affectedRows);
                            logger.error('Database query error:', err);
                            return res.status(500).json({
                                status: 500,
                                message: err.message,
                                data: {},
                            });
                        }
                    } else {
                        let user_id = results.insertId;

                        // New SQL query to fetch the user data from the database
                        const fetchSql = 'SELECT * FROM user WHERE id = ?';
                        connection.query(
                            fetchSql,
                            [user_id],
                            function (fetchError, fetchResults, fetchFields) {
                                // Release the connection
                                connection.release();

                                // Handle error after the release
                                if (fetchError) {
                                    logger.error('Database query error:', fetchError);
                                    return res.status(500).json({
                                        status: 500,
                                        message: fetchError.message,
                                        data: {},
                                    });
                                }

                                // Send the fetched user data to the client
                                res.status(201).json({
                                    status: 201,
                                    message: 'User successfully registered.',
                                    data: tools.convertIsActiveToBoolean(fetchResults[0]), // assuming the query returns an array
                                });
                                connection.release();
                            }
                        );
                    }
                });
            });
        });
    },
    validateUpdate: (req, res, next) => {
        let user = req.body;
        logger.info('Validating update for user with id: ', req.userId);

        // Check if firstName exists, is a string, and is not an empty string
        if (
            !user.firstName ||
            typeof user.firstName !== 'string' ||
            user.firstName.trim() === ''
        ) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid first name.',
                data: {},
            });
        }

        // Check if lastName exists, is a string, and is not an empty string
        if (
            !user.lastName ||
            typeof user.lastName !== 'string' ||
            user.lastName.trim() === ''
        ) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid last name.',
                data: {},
            });
        }

        // Check if password exists, is a string, is not an empty string, and passes password validation
        if (
            !user.password ||
            typeof user.password !== 'string' ||
            user.password.trim() === '' ||
            !tools.validatePassword(user.password)
        ) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid password.',
                data: {},
            });
        }

        // Check if street exists, is a string, and is not an empty string
        if (
            !user.street ||
            typeof user.street !== 'string' ||
            user.street.trim() === ''
        ) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid street.',
                data: {},
            });
        }

        // Check if city exists, is a string, and is not an empty string
        if (
            !user.city ||
            typeof user.city !== 'string' ||
            user.city.trim() === ''
        ) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid city.',
                data: {},
            });
        }

        // Check if emailAdress exists, is a string, is not an empty string, and passes email validation
        if (
            !user.emailAdress ||
            typeof user.emailAdress !== 'string' ||
            user.emailAdress.trim() === '' ||
            !tools.validateEmail(user.emailAdress)
        ) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid email address.',
                data: {},
            });
        }

        //Check if phoneNumber exists, is a string, is not an empty string, and passes phone number validation
        if (!tools.validatePhoneNumber(user.phoneNumber)) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid phone number.',
                data: {},
            });
        }

        // If all checks pass, proceed to the next middleware function
        next();
    },
    // deleteUser deletes a user from the database
    deleteUser: (req, res, next) => {
        let id = req.params.id;
        let userId = req.userId;
        logger.info('Start deleteUser method');
        logger.debug('Deleting user with id: ', id);

        dbCon.getConnection(function (error, connection) {
            logger.debug('Attempting to get database connection');
            if (error) {
                logger.error('Database connection error:', error);
                return res.status(500).json({
                    status: 500,
                    message: error.message,
                    data: {},
                });
            }
            logger.debug('Database connection successful');
            logger.debug('Attempting to select user with id: ', id);

            connection.query(
                'SELECT * FROM user WHERE id = ?',
                [id],
                function (error, results, fields) {
                    if (error) {
                        connection.release();
                        logger.error('Database query error:', error);
                        return res.status(500).json({
                            status: 500,
                            message: error.message,
                            data: {},
                        });
                    }
                    logger.debug('User select results:', results);
                    if (results.length > 0) {
                        logger.debug(
                            'User found, checking if logged in user is allowed to delete'
                        );
                        if (userId == id) {
                            logger.debug(
                                'Logged in user is allowed to delete, proceeding to delete'
                            );
                            connection.query(
                                `DELETE  FROM user WHERE id = ?`,
                                [id],
                                function (error, results, fields) {
                                    if (error) {
                                        connection.release();
                                        logger.error('Database query error:', error);
                                        return res.status(500).json({
                                            status: 500,
                                            message: error.message,
                                            data: {},
                                        });
                                    }
                                    logger.debug('User delete query complete');
                                    logger.debug('Database connection released');
                                    if (results.affectedRows > 0) {
                                        logger.info('User successfully deleted');
                                        res.status(200).json({
                                            status: 200,
                                            message: `Gebruiker met ID ${userId} is verwijderd`,
                                            data: {},
                                        });
                                    }
                                }
                            );
                        } else {
                            logger.error('Logged in user is not allowed to delete this user');
                            connection.release();
                            const error = {
                                status: 403,
                                message: 'Logged in user is not allowed to delete this user.',
                                data: {},
                            };
                            next(error);
                        }
                    } else {
                        logger.error('User not found');
                        connection.release();
                        const error = {
                            status: 404,
                            message: 'User not found',
                            data: {},
                        };
                        next(error);
                    }
                }
            );
        });
    },

    // updateUser updates a user's information in the database
    updateUser: (req, res, next) => {
        let id = req.params.id;
        let userId = req.userId;
        const userToUpdate = req.body;
        logger.debug('userPasswordToUpdate: ', userToUpdate.password);
        tools.hashPassword(userToUpdate.password, function (err, hash) {
            if (err) {
                logger.error('Bcrypt hashing error:', err);
                return res.status(500).json({
                    status: 500,
                    message: err.message,
                    data: {},
                });
            }
            userToUpdate.password = hash;
            logger.debug('userPasswordToUpdateHash: ', userToUpdate.password);
            dbCon.getConnection(function (err, connection) {
                if (err) {
                    logger.error('Database connection error:', err);
                    return res.status(500).json({
                        status: 500,
                        message: err.message,
                        data: {},
                    });
                }

                // Use the connection
                connection.query(
                    'SELECT * FROM user WHERE id = ?',
                    [id],
                    function (error, results, fields) {
                        if (error) {
                            logger.error('Database query error:', error);
                            return res.status(500).json({
                                status: 500,
                                message: error.message,
                                data: {},
                            });
                        }

                        // Check if user exists
                        if (results.length === 0) {
                            return res.status(404).json({
                                status: 404,
                                message: 'User not found',
                                data: {},
                            });
                        }

                        // Check if user is updating their own profile
                        if (id != userId) {
                            return res.status(403).json({
                                status: 403,
                                message: 'You can only update your own profile',
                                data: {},
                            });
                        }

                        const sql = `
          UPDATE user 
          SET firstName = ?, lastName = ?, isActive = ?, emailAdress = ?, password = ?, phoneNumber = ?, street = ?, city = ?
          WHERE id = ?
          `;
                        const values = [
                            userToUpdate.firstName,
                            userToUpdate.lastName,
                            userToUpdate.isActive,
                            userToUpdate.emailAdress,
                            userToUpdate.password,
                            userToUpdate.phoneNumber,
                            userToUpdate.street,
                            userToUpdate.city,
                            id,
                        ];

                        connection.query(sql, values, function (error, results, fields) {
                            if (error) {
                                logger.error('Database query error:', error);
                                return res.status(500).json({
                                    status: 500,
                                    message: error.message,
                                    data: {},
                                });
                            }

                            // Get the updated user details
                            connection.query(
                                'SELECT * FROM user WHERE id = ?',
                                [id],
                                function (error, results, fields) {
                                    if (error) throw error;

                                    // User was updated successfully
                                    res.status(200).json({
                                        status: 200,
                                        message: `User successfully updated`,
                                        data: tools.convertIsActiveToBoolean(results[0]),
                                    });

                                    connection.release();
                                }
                            );
                        });
                    }
                );
            });
        });
    },
    // getUserProfile retrieves a user's profile information based on their email and password
    getUserProfile: (req, res, next) => {
        let id = req.userId;
        logger.info('Getting profile for user with id: ', id);

        if (id) {
            dbCon.getConnection(function (err, connection) {
                if (err) {
                    logger.error('Database connection error:', err);
                    return res.status(500).json({
                        status: 500,
                        message: err.message,
                        data: {},
                    });
                }

                connection.query(
                    'SELECT * FROM user WHERE id = ?;',
                    [id],
                    function (error, results, fields) {
                        connection.release();
                        if (error) {
                            logger.error('Database query error:', error);
                            return res.status(500).json({
                                status: 500,
                                message: error.message,
                                data: {},
                            });
                        }

                        if (results.length > 0) {
                            res.status(200).json({
                                status: 200,
                                message: 'User profile retrieved successfully',
                                data: tools.convertIsActiveToBoolean(results[0]),
                            });
                        } else {
                            const err = {
                                status: 404,
                                message: 'User not found',
                                data: {},
                            };
                            next(err);
                        }
                    }
                );
            });
        } else {
            const error = {
                status: 401,
                message: 'No user logged in',
                data: {},
            };
            next(error);
        }
    },
    // getUserById retrieves a user's public information and associated meals based on their user ID
    getUserById: (req, res, next) => {
        let requestedUserId = req.params.id;
        logger.info('Requested user id: ', requestedUserId);

        dbCon.getConnection(function (err, connection) {
            if (err) {
                logger.error('Database connection error:', err);
                return res.status(500).json({
                    status: 500,
                    message: err.message,
                    data: {},
                });
            }

            const userQuery =
                'SELECT firstName, lastName, emailAdress, phoneNumber, city, street,isActive,roles FROM user WHERE id = ?;';
            connection.query(
                userQuery,
                [requestedUserId],
                function (error, userResults, fields) {
                    if (error) {
                        logger.error('Database query error:', error);
                        return res.status(500).json({
                            status: 500,
                            message: error.message,
                            data: {},
                        });
                    }
                    // TODO: meals die active zijn
                    if (userResults.length > 0) {
                        const mealsQuery = 'SELECT * FROM meal WHERE cookId = ?';
                        connection.query(
                            mealsQuery,
                            [requestedUserId],
                            function (mealError, mealResults, mealFields) {
                                if (mealError) {
                                    logger.error('Database query error:', mealError);
                                    return res.status(500).json({
                                        status: 500,
                                        message: mealError.message,
                                        data: {},
                                    });
                                }
                                for (let i = 0; i < mealResults.length; i++) {
                                    mealResults[i] = tools.convertMealProperties(mealResults[i]);
                                }
                                res.status(200).json({
                                    status: 200,
                                    message: 'User found',
                                    data: {
                                        ...tools.convertIsActiveToBoolean(userResults[0]),
                                        meals: mealResults,
                                    },
                                });
                            }
                        );
                    } else {
                        const error = {
                            status: 404,
                            message: 'User not found',
                            data: {},
                        };
                        next(error);
                    }

                    connection.release();
                }
            );
        });
    },

    // getTableLength retrieves the length of a table from the database
    getTableLength: (tableName, callback) => {
        dbCon.getConnection((err, connection) => {
            if (err) throw err; // not connected!

            // Use the connection
            connection.query(
                `SELECT COUNT(*) as count FROM ${tableName}`,
                (error, results, fields) => {
                    // When done with the connection, release it.
                    connection.release();
                    // Handle error after the release.
                    if (error) throw error;

                    // Don't use the connection here, it has been returned to the pool.
                    const tableLength = results[0].count;

                    callback(null, tableLength);
                }
            );
        });
    },
};
// Export the userController object, making its methods available for use in other modules
module.exports = userController;
