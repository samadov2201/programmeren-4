const express = require('express');
const app = express();
require('dotenv').config();
const port = 3000;
const userRouter = require('./route/Auth');
const mealRouter = require('./route/Meal');
const authRouter = require('./route/Auth');
const logger = require('./database/utils').logger;

const input = {
    "status": 200,
    "message": 'hoi',
    "data": {
        users: [

            { name: 'muhammad', email: 'muhammad@samadov.nl' },
            { name: 'hoi', email: 'muhammad@samadov.nl' }
        ]
    }

};
// Parse JSON requests
app.use(express.json());

app.use((req, res, next) => {
    console.log(
        `${new Date().toISOString()} - ${req.method} Request: ${req.url}`
    );

    logger.debug(`Request Method: ${req.method}`);
    logger.debug(`Request URL: ${req.url}`);

    next();
});

// Catch all routes and log their method and URL
app.use('*', (req, res, next) => {
    const method = req.method;
    const url = req.originalUrl;
    logger.trace(`methode ${method} is aangeroepen for URL: ${url}`);
    next();
});
// Route: welcome message
app.get('/', (req, res) => {
    res.send('welcome to server API van de share a meal');
});

// Define a route for server info
app.get('/api/info', (req, res) => {
    res.status(200).json({
        status: 200,
        message: 'server info-endpoint',
        data: {
            studentName: 'Muhammad Samadov',
            studentNumber: 22089266,
            description: 'welcome to share a meal API!',
        },
    });
});

// Refer to routes defined in userRouter
app.use('/api/user', userRouter);
app.use('/api/meal', mealRouter);
app.use('/api/', authRouter);

// Catch all other routes that do not match any endpoints
app.use('*', (req, res) => {
    logger.warn('Invalid endpoint called: ', req.path);
    res.status(404).json({
        status: 404,
        message: 'Endpoint not found',
        data: {},
    });
});

// Express error handler
app.use((error, req, res, next) => {
    logger.error(error.status, error.message);
    res.status(error.status).json({
        status: error.status,
        message: error.message,
        data: {},
    });
});
// Start the server on the specified port
app.listen(port, () => {
    logger.info(` Server API van de share a meal listening on port ${port}`);
});
// Export the server for use in tests
module.exports = app;
