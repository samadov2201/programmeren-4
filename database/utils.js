module.exports = {
    logger: require('tracer').console({
        level: process.env.LOGLEVEL || 'debug',
        format: '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})',
        dateformat: 'HH:MM:ss.L',
        preprocess: function (data) {
            data.title = data.title.toUpperCase();
        }
    }),

    jwtSecretKey: process.env.JWT_SECRET || 'shampoo'
};