const express = require('express');
const app = express();
const port = 3000;
const userRouter = require('./route/Auth');
const mealRouter = require('./route/Meal');
const authRouter = require('./route/Auth');
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
app.get('/', (req, res) => {
    res.send('welcome to share a meal API!');
});



app.get('/api/info', (req, res) => {

    res.status(200).json(
        {
            status: 200,
            message: 'Server info-endpoint',
            data: {
                naam: 'Muhammad Samadov'
            }
        });
});

app.use('*', (req, res) => {
    const method = req.method;
    console.log(`methode ${method} is aangeroepen`);
    next();
})
app.use('/api/user', userRouter);
app.use('/api/meal', mealRouter);
app.use('/api/', authRouter);
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(req.body);
    res.end();





});
app.post('/api/login', (req, res) => {
    res.send('add a user');
    const body = req.body;
    const StringifiedBody = body.json()

});

app.use('*', (req, res) => {
    res.status(404).json({
        status: 404,
        message: '404 error'
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
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});

module.exports = app;