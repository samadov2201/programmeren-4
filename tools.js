const bcrypt = require('bcrypt');

function validateEmail(email) {
    const regex = /^[a-z]{1}\.[a-z]{2,}@[a-z]{2,}\.[a-z]{2,3}$/i;
    return regex.test(email);
}

function validatePassword(password) {
    const regex = /^(?=.*\d)(?=.*[A-Z]).{8,}$/;
    return regex.test(password);
}

function validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) {
        return true;
    }
    const regex = /^06[-\s]?\d{8}$/;
    return regex.test(phoneNumber);
}

function convertIsActiveToBoolean(user) {
    if (!user) {
        return user;
    }
    return {
        ...user,
        isActive: user.isActive === 1,
    };
}

function convertMealProperties(meal) {
    if (!meal) {
        return meal;
    }
    return {
        ...meal,
        isActive: meal.isActive === 1,
        isVega: meal.isVega === 1,
        isVegan: meal.isVegan === 1,
        isToTakeHome: meal.isToTakeHome === 1,
        price: parseFloat(meal.price),
    };
}

function buildSqlStatement(queryField) {
    const invalidFieldName = Object.keys(queryField).find(field => !VALID_FIELDS.includes(field));

    if (invalidFieldName) {
        return { error: `Invalid field in filter: ${invalidFieldName}.` };
    }

    const conditions = [];
    const params = [];

    for (const field in queryField) {
        const value = queryField[field];

        if (!value) continue;

        let condition = '';

        if (value.toLowerCase() === 'true') {
            params.push(1);
        } else if (value.toLowerCase() === 'false') {
            params.push(0);
        } else {
            params.push(value);
        }

        condition = `\`${field}\` = ?`;
        conditions.push(condition);
    }

    let sqlStatement = 'SELECT id, firstName, lastName, emailAdress, password, phoneNumber, city, street, isActive, roles FROM `user`';

    if (conditions.length > 0) {
        sqlStatement += ' WHERE ' + conditions.slice(0, 2).join(' AND ');
    }

    return { sqlStatement, params };
}

function hashPassword(password, callback) {
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, callback);
}

function getRandomEmail() {
    const randomString = Math.random().toString(36).substring(2, 7);
    return `john.doe${randomString}@example.com`;
}

const VALID_FIELDS = [
    'id',
    'firstName',
    'lastName',
    'emailAdress',
    'phoneNumber',
    'city',
    'street',
    'isActive',
    'roles',
];

module.exports = {
    validateEmail,
    validatePassword,
    validatePhoneNumber,
    getRandomEmail,
    convertIsActiveToBoolean,
    convertMealProperties,
    buildSqlStatement,
    hashPassword,
};
