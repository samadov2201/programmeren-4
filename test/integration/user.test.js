const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../index');
const dbconnection = require('../../database/dbconnection');
const { getTableLength } = require('../../controller/user.controller');
const logger = require('../utils/utils').logger;
require('tracer').setLevel('debug');
const bcrypt = require('bcrypt');
chai.should();
chai.use(chaiHttp);
let token = '';
/**
 * Db queries to clear and fill the test database before each test.
 *
 * LET OP: om via de mysql2 package meerdere queries in één keer uit te kunnen voeren,
 * moet je de optie 'multipleStatements: true' in de database config hebben staan.
 */

const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;';
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;';
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;';
const CLEAR_DB =
    CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;
const emailAdress_test = 'j.doe@gmail.com';
const password_test = 'Secret123';
/**
 * Voeg een user toe aan de database. Deze user heeft id 1.
 * Deze id kun je als foreign key gebruiken in de andere queries, bv insert meal.
 */
let INSERT_USER = '';

const INSERT_MEALS =
    'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
    "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);";
bcrypt.hash('Secret123', 10, function (err, hash) {
    INSERT_USER =
        'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
        '(1, "John", "Doe", "j.doe@gmail.com", "' +
        hash +
        '", "street", "city"),' +
        '(2, "Mo", "Doe", "M.doe@gmail.com", "' +
        hash +
        '", "street", "city");';
});
describe('User API', () => {
    logger.trace('User API');
    beforeEach((done) => {
        dbconnection.getConnection(function (err, connection) {
            if (err) throw err;
            connection.query(
                CLEAR_DB + INSERT_USER,
                function (error, results, fields) {
                    connection.release();

                    if (error) throw error;
                    done();
                }
            );
        });
    });
    // afterEach((done) => {
    //   dbconnection.getConnection(function (err, connection) {
    //     if (err) throw err;
    //     connection.query(
    //       CLEAR_DB + INSERT_USER,
    //       INSERT_MEALS,
    //       function (error, results, fields) {
    //         connection.release();

    //         if (error) throw error;
    //         done();
    //       }
    //     );
    //   });
    // });
    describe('UC-101 | Login', () => {
        it('TC-101-1 | Required field is missing', (done) => {
            chai
                .request(app)
                .post('/api/login')
                .send({
                    // Emailaddress is missing
                    password: password_test,
                })
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { data, message, status } = res.body;
                    status.should.equal(400);
                    message.should.be.a('string').eql('Invalid email address.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-101-2 | Invalid e-mail address', (done) => {
            chai
                .request(app)
                .post('/api/login')
                .send({
                    emailAdress: 'john@gmail',
                    password: 'Secret123',
                })
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { data, message, status } = res.body;
                    status.should.equal(400);
                    message.should.be.a('string').equal('Invalid email address.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-101-3 | Invalid password', (done) => {
            let user = {
                emailAdress: emailAdress_test,
                password: 'se',
            };
            chai
                .request(app)
                .post('/api/login')
                .send(user)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.equal(400);
                    message.should.be.a('string').equal(`Invalid password.`);
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-101-4 | User does not exist', (done) => {
            let user = {
                emailAdress: 'n.oneexistuser@example.com',
                password: 'Secret123',
            };
            chai
                .request(app)
                .post('/api/login')
                .send(user)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(404);
                    message.should.be.a('string').eql('User not found');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-101-5 | User successfully logged in', (done) => {
            chai
                .request(app)
                .post('/api/login')
                .send({
                    emailAdress: 'j.doe@gmail.com',
                    password: 'Secret123',
                })
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.be.equal(200);
                    message.should.be.equal('Authentication successful!');
                    data.should.be.an('object');
                    data.should.have.property('firstName');
                    data.should.have.property('lastName');
                    data.should.have.property('isActive');
                    data.should.have.property('emailAdress');
                    data.should.have.property('phoneNumber');
                    data.should.have.property('roles');
                    data.should.have.property('street');
                    data.should.have.property('city');
                    data.should.have.property('token');
                    token = data.token;
                    done();
                });
        });
    });
    describe('UC-201 | Register as a new user', () => {
        it('TC-201-1 | Required field is missing', (done) => {
            let user = {
                firstName: 'John',
                lastName: 'Doe',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                // Password missing
                emailAdress: 'johndoe@gmail.com',
            };
            chai
                .request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(400);
                    message.should.be.a('string').eql('password is missing.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-201-2 | Invalid e-mail address', (done) => {
            let user = {
                firstName: 'John',
                lastName: 'Doe',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                password: 'Secret123',
                emailAdress: 'invalidEmail',
            };
            chai
                .request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    res.body.should.be.a('object');
                    let { status, message, data } = res.body;
                    status.should.eql(400);
                    message.should.be.a('string').eql('Invalid email address.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-201-3 | Invalid password', (done) => {
            let user = {
                firstName: 'John',
                lastName: 'Doe',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                password: 'se',
                emailAdress: 'john.doe@gmail.com',
            };
            chai
                .request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(400);
                    message.should.be.a('string').eql('Invalid password.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-201-4 | User already exists', (done) => {
            let user = {
                firstName: 'John',
                lastName: 'Doe',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                password: 'Secret123',
                emailAdress: 'j.doe@gmail.com',
            };
            chai
                .request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    res.body.should.be.a('object');
                    let { status, message, data } = res.body;
                    status.should.eql(403);
                    message.should.be
                        .a('string')
                        .eql('A user already exists with this email address.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-201-5 | User successfully registered', (done) => {
            let user = {
                firstName: 'John',
                lastName: 'Beton',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                password: 'Secret123',
                emailAdress: 'j.ohnbeton@gmail.com',
            };
            chai
                .request(app)
                .post('/api/user')
                .send(user)
                .end((err, res) => {
                    res.body.should.be.a('object');
                    let { status, message, data } = res.body;
                    status.should.eql(201);
                    message.should.be.a('string').eql('User successfully registered.');
                    data.should.be.a('object');
                    done();
                });
        });
    });
    describe('UC-202 | Overview of users', () => {
        it('TC-202-1 | Show 2 users', (done) => {
            chai
                .request(app)
                .get('/api/user')
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be.a('string').eql('Get All Users.');
                    data.should.be.an('array');
                    data.length.should.be.eql(2);
                    done();
                });
        });

        it('TC-202-3 | Show users with search term on non existing name', (done) => {
            chai
                .request(app)
                .get('/api/user?firstName=Kees')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be.a('string').eql('Get All Users.');
                    data.should.be.an('array');
                    data.length.should.be.eql(0);
                    done();
                });
        });

        it('TC-202-4 | Show users with search term on the field isActive=false', (done) => {
            chai
                .request(app)
                .get('/api/user?isActive=false')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be.a('string').eql('Get All Users.');
                    data.should.be.an('array');
                    data.length.should.be.eql(0);
                    done();
                });
        });

        it('TC-202-5 | Show users with search term on the field isActive=true', (done) => {
            chai
                .request(app)
                .get('/api/user?isActive=1')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be.a('string').eql('Get All Users.');
                    data.should.be.an('array');
                    data.length.should.be.eql(2);
                    done();
                });
        });

        it('TC-202-6 | Show users with search term on existing name', (done) => {
            chai
                .request(app)
                .get('/api/user?firstName=John')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be.a('string').eql('Get All Users.');
                    data.should.be.an('array');
                    data.length.should.be.eql(1);
                    done();
                });
        });
    });
    describe('UC-203 | get personal profile', () => {
        it('TC-203-1 | Invalid token', (done) => {
            chai
                .request(app)
                .get('/api/user/profile')
                .set('Authorization', 'Bearer invalidToken')
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(401);
                    message.should.be.a('string').eql('Invalid token.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-203-2 | token and user is Valid', (done) => {
            chai
                .request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be
                        .a('string')
                        .eql('User profile retrieved successfully');
                    data.should.be.a('object');
                    data.should.have.property('id');
                    data.should.have.property('firstName');
                    data.should.have.property('lastName');
                    data.should.have.property('isActive');
                    data.should.have.property('emailAdress');
                    data.should.have.property('phoneNumber');
                    data.should.have.property('roles');
                    data.should.have.property('street');
                    data.should.have.property('city');
                    done();
                });
        });
    });
    describe('UC-204 | Details of user', () => {
        it('TC-204-1 | Invalid token', (done) => {
            chai
                .request(app)
                .get('/api/user/1')
                .set('Authorization', 'Bearer invalidToken')
                .end((err, res) => {
                    res.should.be.a('object');
                    let { status, message, data } = res.body;
                    status.should.eql(401);
                    message.should.be.a('string').eql('Invalid token.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-204-2 | User ID does not exist', (done) => {
            chai
                .request(app)
                .get('/api/user/0')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    console.log(res.body);
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(404);
                    message.should.be.a('string').eql('User not found');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-204-3 | User ID exists', (done) => {
            chai
                .request(app)
                .get('/api/user/1')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be.a('string').eql('User found');
                    data.should.have.property('firstName');
                    data.should.have.property('lastName');
                    data.should.have.property('emailAdress');
                    data.should.have.property('phoneNumber');
                    data.should.have.property('roles');
                    data.should.have.property('street');
                    data.should.have.property('city');
                    data.should.have.property('meals').that.is.an('array');
                    done();
                });
        });
    });
    describe('UC-205 | Update user', () => {
        it('TC-205-1 | Required field e-mail address is missing', (done) => {
            let user = {
                firstName: 'John',
                lastName: 'Beton',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                // Email is missing
                password: 'Secret123',
                phoneNumber: '0612425475',
            };
            chai
                .request(app)
                .put('/api/user/1')
                .set('Authorization', `Bearer ${token}`)
                .send(user)
                .end((err, res) => {
                    res.should.be.a('object');
                    let { status, message, data } = res.body;
                    status.should.eql(400);
                    message.should.be.a('string').eql('Invalid email address.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });
        it('TC-205-2 | User does not own the data', (done) => {
            let user = {
                firstName: 'John',
                lastName: 'Beton',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                emailAdress: 'j.doe@gmail.com',
                password: 'Secret123',
                phoneNumber: '0612425475',
            };
            chai
                .request(app)
                .put('/api/user/2')
                .set('Authorization', `Bearer ${token}`)
                .send(user)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(403);
                    message.should.be
                        .a('string')
                        .eql('You can only update your own profile');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });
        it('TC-205-3 | Invalid phone number', (done) => {
            let user = {
                firstName: 'John',
                lastName: 'Beton',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                emailAdress: 'j.doe@gmail.com',
                password: 'Secret123',
                phoneNumber: 'invalidPhoneNumber',
            };
            chai
                .request(app)
                .put('/api/user/1')
                .set('Authorization', `Bearer ${token}`)
                .send(user)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(400);
                    message.should.be.a('string').eql('Invalid phone number.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-205-4 | User does not exist', (done) => {
            let user = {
                firstName: 'John',
                lastName: 'Beton',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                emailAdress: 'j.doe@gmail.com',
                password: 'Secret123',
                phoneNumber: '0612425475',
            };
            chai
                .request(app)
                .put('/api/user/0')
                .set('Authorization', `Bearer ${token}`)
                .send(user)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(404);
                    message.should.be.a('string').eql('User not found');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-205-5 | Not logged in', (done) => {
            let user = {
                id: 1,
                firstName: 'John',
                lastName: 'Beton',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                emailAdress: 'j.doe@gmail.com',
                password: 'Secret123',
                phoneNumber: '0612425475',
            };
            chai
                .request(app)
                .put('/api/user/1')
                .send(user)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(401);
                    message.should.be.a('string').eql('Authorization header missing!');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-205-6 | User successfully updated', (done) => {
            let user = {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                street: 'Lovensdijkstraat 61',
                city: 'Breda',
                emailAdress: 'j.doe@server.com',
                password: 'Secret123',
                phoneNumber: '0612425475',
                isActive: false,
                roles: 'editor',
            };
            chai
                .request(app)
                .put('/api/user/1')
                .set('Authorization', `Bearer ${token}`)
                .send(user)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be.a('string').eql('User successfully updated');
                    data.should.have.property('id');
                    data.should.have.property('firstName');
                    data.should.have.property('lastName');
                    data.should.have.property('isActive');
                    data.should.have.property('emailAdress');
                    data.should.have.property('phoneNumber');
                    data.should.have.property('roles');
                    data.should.have.property('street');
                    data.should.have.property('city');
                    done();
                });
        });
    });
    describe('UC-206 | Delete user', () => {
        it('TC-206-1 | User does not exist', (done) => {
            chai
                .request(app)
                .delete('/api/user/0')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(404);
                    message.should.be.a('string').eql('User not found');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-206-2 | Not logged in', (done) => {
            chai
                .request(app)
                .delete('/api/user/1')
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(401);
                    message.should.be.a('string').eql('Authorization header missing!');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });

        it('TC-206-3 | Logged in user is not allowed to delete the user', (done) => {
            chai
                .request(app)
                .delete('/api/user/2')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(403);
                    message.should.be
                        .a('string')
                        .eql('Logged in user is not allowed to delete this user.');
                    Object.keys(data).length.should.be.equal(0);
                    done();
                });
        });
        it('TC-206-4 | User successfully deleted', (done) => {
            chai
                .request(app)
                .delete('/api/user/1')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    logger.trace('Received response:', res.body);
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be.a('string').eql('Gebruiker met ID 1 is verwijderd');
                    Object.keys(data).length.should.be.equal(0);
                    logger.trace('Calling done()');
                    done();
                });
        });
    });
});
