const express = require('express');
const mealRouter = express.Router();
const mealController = require('../controller/Meal');
const authController = require('../controller/Auth');
// UC 301
mealRouter.post(
    '',
    authController.validateToken,
    mealController.validateMeal,
    mealController.createMeal
);
// uc 302
mealRouter.put(
    '/:mealId',
    authController.validateToken,
    mealController.validateMeal,
    mealController.updateMeal
);
// UC 303
mealRouter.get('', mealController.getAllMeals);
// uc 304
mealRouter.get('/:mealId', mealController.getMealById);

// UC 305
mealRouter.delete(
    '/:mealId',
    authController.validateToken,
    mealController.deleteMeal
);

mealRouter.post(
    '',
    authController.validateToken,
    mealController.validateMeal,
    mealController.createMeal
);

mealRouter.post(
    '/:mealId/participate',
    authController.validateToken,
    mealController.participateInMeal
);


module.exports = mealRouter;
