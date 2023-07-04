const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../index');
const db = require('../../database/dbconnection');
const { logger, jwtSecretKey } = require('../utils/utils');
require('tracer').setLevel('debug');
const jwt = require('jsonwebtoken');
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
/**
 * Voeg een user toe aan de database. Deze user heeft id 1.
 * Deze id kun je als foreign key gebruiken in de andere queries, bv insert meal.
 */
const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(1, "John", "Doe", "j.doe@gmail.com", "Secret123", "street", "city"),' +
    '(2, "Mo", "Doe", "M.doe@gmail.com", "Secret123", "street", "city");';
const INSERT_MEALS =
    'INSERT INTO `meal` (`id`,`name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
    "(1,'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(2,'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1),(3,'Meal B', 'description', 'image url', NOW(), 1, 6.50, 2);";
const INSERT_PARTTICIPANT =
    'INSERT INTO meal_participants_user (userId, mealId) VALUES' +
    ' (1, 2),' +
    ' (2, 3);';
const mealTest = {
    name: 'Meal A',
    description: 'description',
    isActive: false,
    isVega: false,
    isVegan: false,
    isToTakeHome: true,
    // dateTime: NOW(),
    imageUrl: 'image url',
    allergenes: '',
    maxAmountOfParticipants: 5,
    price: 6.5,
    cookId: 1,
};
describe('Meal API', () => {
    logger.trace('Meal API');
    beforeEach((done) => {
        db.getConnection(function (err, connection) {
            if (err) throw err;
            connection.query(
                CLEAR_DB + INSERT_USER,
                function (error, results, fields) {
                    if (error) throw error;
                    connection.query(INSERT_MEALS, function (error, results, fields) {
                        connection.release();
                        if (error) throw error;
                        connection.query(
                            INSERT_PARTTICIPANT,
                            function (error, results, fields) {
                                connection.release();
                                if (error) throw error;
                                done();
                            }
                        );
                    });
                }
            );
        });
    });
    describe('UC-301 | Create meal', () => {
        it('TC-301-1 | Required field is missing', (done) => {
            token = jwt.sign({ userId: 1 }, jwtSecretKey, {
                expiresIn: '1h',
            });
            let meal = {
                // Name missing
                description:
                    'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!',
                dateTime: '2022-04-26 12:33:51.000000',
                imageUrl:
                    'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg',
                maxAmountOfParticipants: 4,
                price: 12.75,
            };
            chai
                .request(app)
                .post('/api/meal/')
                .set('Authorization', `Bearer ${token}`)
                .send(meal)
                .end((err, res) => {
                    let { status, message } = res.body;
                    status.should.eql(400);
                    res.body.should.be.an('object');
                    res.body.should.have.property('data').to.be.empty;
                    message.should.be.a('string').eql('missing meal name');
                    done();
                });
        });
        it('TC-301-2 | Not logged in', (done) => {
            let meal = {
                name: 'Spaghetti Bolognese',
                description:
                    'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!',
                dateTime: '2022-04-26 12:33:51.000000',
                imageUrl:
                    'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg',
                maxAmountOfParticipants: 4,
                price: 12.75,
            };
            chai
                .request(app)
                .post('/api/meal')
                .send(meal)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(401);
                    message.should.be.a('string').eql('Authorization header missing!');
                    done();
                });
        });

        it('TC-301-3 | Meal successfully created', (done) => {
            let meal = {
                name: 'Spaghetti Bolognese',
                description:
                    'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!',
                dateTime: '2022-04-26 12:33:51.000000',
                imageUrl:
                    'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg',
                maxAmountOfParticipants: 4,
                price: 12.75,
            };
            chai
                .request(app)
                .post('/api/meal')
                .set('Authorization', `Bearer ${token}`)
                .send(meal)
                .end((err, res) => {
                    res.body.should.be.an('object');
                    let { status, message, data } = res.body;
                    status.should.eql(201);
                    message.should.be.a('string').eql('Meal successfully added.');
                    data.should.have.property('name').to.be.eql(meal.name);
                    data.should.have.property('description').to.be.eql(meal.description);
                    data.should.have.property('dateTime');
                    data.should.have.property('imageUrl').to.be.eql(meal.imageUrl);
                    data.should.have
                        .property('maxAmountOfParticipants')
                        .to.be.eql(meal.maxAmountOfParticipants);
                    data.should.have.property('price').to.equal(meal.price);
                    done();
                });
        });
    });
    describe('UC-302 | Update meal', () => {
        it('TC-302-1 | Required field name is missing', (done) => {
            let meal = {
                // Name is missing
                description:
                    'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!',
                isActive: true,
                isVega: true,
                isVegan: true,
                isToTakeHome: true,
                dateTime: '2022-04-26 12:33:51.000000',
                imageUrl:
                    'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg',
                allergenes: 'gluten,lactose',
                maxAmountOfParticipants: 4,
                price: 12.75,
            };
            chai
                .request(app)
                .put('/api/meal/1')
                .set('Authorization', `Bearer ${token}`)
                .send(meal)
                .end((err, res) => {
                    let { status, message, data } = res.body;
                    status.should.eql(400);
                    res.body.should.be.an('object');
                    res.body.should.have.property('data').to.be.empty;
                    message.should.be.a('string').eql('missing meal name');
                    done();
                });
        });

        it('TC-302-2 | Not logged in', (done) => {
            let meal = {
                name: 'Spaghetti Bolognese',
                description:
                    'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!',
                isActive: true,
                isVega: true,
                isVegan: true,
                isToTakeHome: true,
                dateTime: '2022-04-26 12:33:51.000000',
                imageUrl:
                    'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg',
                allergenes: 'gluten,lactose',
                maxAmountOfParticipants: 4,
                price: 12.75,
            };
            chai
                .request(app)
                .put('/api/meal/1')
                .send(meal)
                .end((err, res) => {
                    let { status, message } = res.body;
                    status.should.eql(401);
                    res.body.should.be.an('object');
                    res.body.should.have.property('data').to.be.empty;
                    message.should.be.a('string').eql('Authorization header missing!');
                    done();
                });
        });

        it('TC-302-3 | Not the owner of the data', (done) => {
            let meal = {
                name: 'Spaghetti Bolognese',
                description:
                    'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!',
                isActive: true,
                isVega: true,
                isVegan: true,
                isToTakeHome: true,
                dateTime: '2022-04-26 12:33:51.000000',
                imageUrl:
                    'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg',
                allergenes: 'gluten,lactose',
                maxAmountOfParticipants: 4,
                price: 12.75,
            };
            chai
                .request(app)
                .put('/api/meal/3')
                .set('Authorization', `Bearer ${token}`)
                .send(meal)
                .end((err, res) => {
                    let { status, message } = res.body;
                    status.should.eql(403);
                    res.body.should.be.an('object');
                    message.should.be
                        .a('string')
                        .eql('You can only update your own meals');
                    done();
                });
        });

        it('TC-302-4 | Meal does not exist', (done) => {
            let meal = {
                name: 'Spaghetti Bolognese',
                description:
                    'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!',
                isActive: true,
                isVega: true,
                isVegan: true,
                isToTakeHome: true,
                dateTime: '2022-04-26 12:33:51.000000',
                imageUrl:
                    'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg',
                allergenes: 'gluten,lactose',
                maxAmountOfParticipants: 4,
                price: 12.75,
            };
            chai
                .request(app)
                .put('/api/meal/0')
                .set('Authorization', `Bearer ${token}`)
                .send(meal)
                .end((err, res) => {
                    let { status, message } = res.body;
                    status.should.eql(404);
                    res.body.should.be.an('object');
                    message.should.be.a('string').eql('Meal not found');
                    done();
                });
        });

        it('TC-302-5 | Meal successfully updated', (done) => {
            let meal = {
                name: 'Spaghetti Bolognese',
                description:
                    'Een heerlijke klassieker! Altijd goed voor tevreden gesmikkel!',
                isActive: true,
                isVega: true,
                isVegan: true,
                isToTakeHome: true,
                dateTime: '2022-04-26 12:33:51.000000',
                imageUrl:
                    'https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg',
                allergenes: 'gluten,lactose',
                maxAmountOfParticipants: 4,
                price: 12.75,
            };
            chai
                .request(app)
                .put('/api/meal/1')
                .set('Authorization', `Bearer ${token}`)
                .send(meal)
                .end((err, res) => {
                    let { status, data } = res.body;
                    status.should.eql(200);
                    res.body.should.be.an('object');
                    data.should.have.property('name').to.be.eql(meal.name);
                    data.should.have.property('description').to.be.eql(meal.description);
                    data.should.have.property('isActive').to.be.eql(meal.isActive);
                    data.should.have.property('isVega').to.be.eql(meal.isVega);
                    data.should.have.property('isVegan').to.be.eql(meal.isVegan);
                    data.should.have
                        .property('isToTakeHome')
                        .to.be.eql(meal.isToTakeHome);
                    data.should.have.property('dateTime');
                    data.should.have.property('imageUrl').to.be.eql(meal.imageUrl);
                    data.should.have.property('allergenes').to.be.eql(meal.allergenes);
                    data.should.have
                        .property('maxAmountOfParticipants')
                        .to.be.eql(meal.maxAmountOfParticipants);
                    data.should.have.property('price').to.equal(meal.price);
                    done();
                });
        });
    });
    describe('UC-303 | Overview of meals', () => {
        it('TC-303-1 | List of meals returned', (done) => {
            chai
                .request(app)
                .get('/api/meal')
                .end((err, res) => {
                    res.body.should.be.a('object');
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    message.should.be.a('string').eql('Meal getAll endpoint');
                    data.should.be.a('array');
                    data.length.should.be.eql(3);
                    done();
                });
        });
    });
    describe('UC-304 | Retrieve details of a meal', () => {
        it('TC-304-1 | Meal does not exist', (done) => {
            chai
                .request(app)
                .get('/api/meal/0')
                .end((err, res) => {
                    let { status, message, data } = res.body;
                    status.should.eql(404);
                    res.body.should.be.an('object');
                    message.should.be.a('string').eql('Meal not found');
                    res.body.should.have.property('data').to.be.empty;
                    done();
                });
        });

        it('TC-304-2 | Returned details of meal', (done) => {
            chai
                .request(app)
                .get('/api/meal/1')
                .end((err, res) => {
                    let { status, data } = res.body;
                    status.should.eql(200);
                    res.body.should.be.an('object');
                    data.should.have.property('name').to.be.eql(mealTest.name);
                    data.should.have
                        .property('description')
                        .to.be.eql(mealTest.description);
                    data.should.have.property('isActive').to.be.eql(mealTest.isActive);
                    data.should.have.property('isVega').to.be.eql(mealTest.isVega);
                    data.should.have.property('isVegan').to.be.eql(mealTest.isVegan);
                    data.should.have
                        .property('isToTakeHome')
                        .to.be.eql(mealTest.isToTakeHome);
                    data.should.have.property('dateTime');
                    data.should.have.property('imageUrl').to.be.eql(mealTest.imageUrl);
                    data.should.have
                        .property('allergenes')
                        .to.be.eql(mealTest.allergenes);
                    data.should.have
                        .property('maxAmountOfParticipants')
                        .to.be.eql(mealTest.maxAmountOfParticipants);
                    data.should.have.property('price').to.equal(mealTest.price);
                    done();
                });
        });
    });
    describe('UC-305 | Delete a meal', () => {
        it('TC-305-2 | Not logged in', (done) => {
            chai
                .request(app)
                .delete('/api/meal/1')
                .end((err, res) => {
                    let { status, message, data } = res.body;
                    status.should.eql(401);
                    res.body.should.be.an('object');
                    message.should.be.a('string').eql('Authorization header missing!');
                    res.body.should.have.property('data').to.be.empty;
                    done();
                });
        });

        it('TC-305-3 | Logged in user is not the owner of the meal', (done) => {
            chai
                .request(app)
                .delete('/api/meal/3')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    let { status, message, data } = res.body;
                    status.should.eql(403);
                    res.body.should.be.an('object');
                    message.should.be
                        .a('string')
                        .eql('Not authorized to delete this meal');
                    res.body.should.have.property('data').to.be.empty;
                    done();
                });
        });

        it('TC-305-4 | Meal does not exist', (done) => {
            chai
                .request(app)
                .delete('/api/meal/0')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    let { status, message, data } = res.body;
                    status.should.eql(404);
                    res.body.should.be.an('object');
                    message.should.be.a('string').eql('Meal not found');
                    res.body.should.have.property('data').to.be.empty;
                    done();
                });
        });

        it('TC-305-5 | Meal successfully deleted', (done) => {
            chai
                .request(app)
                .delete('/api/meal/1')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                    let { status, message, data } = res.body;
                    status.should.eql(200);
                    res.body.should.be.an('object');
                    message.should.be.a('string').eql('Maaltijd met ID 1 is verwijderd');
                    res.body.should.have.property('data').to.be.empty;
                    done();
                });
        });
    });
})