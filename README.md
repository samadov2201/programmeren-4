
Welcome to the Share-a-Meal API Server manual for deploying it on the Railway platform. This server enables users to share meals with others in their local area. It is built using Node.js and Express, with MySQL as the database.

Prerequisites
Ensure you have the following dependencies installed before proceeding with the deployment:
Node.js
Express.js
MySQL

Installation Steps
Step 1: Clone the Repository
Start by cloning the Share-a-Meal API Server repository using the following command:

```
(https://github.com/samadov2201/programmeren-4.git)
```

Step 2: Install Dependencies
Navigate to the project folder and install the required packages:

```
cd share_a_meal
npm install
```

Step 3: Import Database Structure
Create a new MySQL database for your Share-a-Meal project and import the necessary tables and structures using the `share-a-meal.sql` file:

```bash
mysql -u <your_database_user> -p <your_database_name> < share-a-meal.sql
```

or, if you prefer using the MySQL shell:

```sql
mysql -u root
CREATE DATABASE your_database_name;
USE your_database_name;
SOURCE share-a-meal.sql;
```

Step 4: Configure Environment Variables
Create a `.env` file in the root folder of the project and define the following variables with your specific values:

```
DB_HOST=<your_database_host>
DB_PORT=<your_database_port>
DB_USER=<your_database_user>
DB_PASSWORD=<your_database_password>
DB_DATABASE=<your_database_name>
```
 Step 5: Start the Database
Start your MySQL database. If you are using a local development environment like XAMPP, make sure the MySQL service is running.

🚀 Step 6: Start the API Server
Launch the Share-a-Meal API Server by running the following command:

```
npm run dev
```

The server should now be running at http://localhost:3000 or the port you specified in your `.env` file.

🔬 Running Tests
To run tests for this project, Mocha is used as the test framework and Chai for assertions. Execute the following command to run the tests:

```
npm run test
```

🔗 API Endpoints
Here are the available API endpoints for the Share-a-Meal API Server:

Server Information:
- GET /api/info : Retrieve server information

Users:
- POST /api/login: Log in with email and password.
- GET /api/user: Get all users.
- GET /api/user/profile: Get an existing user based on a valid token.
- GET /api/user/:id: Get a user by ID (requires a valid token).
- POST /api/user: Create a new user.
- PUT /api/user/:id: Update an existing user based on a valid token.
- DELETE /api/user/:id: Delete a user based on a valid token.

The following endpoints require a request body:

POST /api/login: Log in with email and password.
```json
{
    "emailAdress": "j.doe@example.com",
    "password": "Secret12"
}
```

POST /api/user: Create a new user (fields with an asterisk are required)
```json
{
    "firstName": "John", 
    "lastName": "Doe", 
    "emailAdress": "j.doe@example.com", 
    "password": "Abcd@123",
Meals
POST/api/meal: Create a new meal
GET/api/meal: Get all meals.
GET/api/meal/:mealId: Retrieve a specific meal by its ID (requires a valid token).
DELETE/api/meal/:mealId:Delete a specific meal by its ID (requires a valid token).
PUT/api/meal/:id: Update a specific meal by its ID (requires a valid token).
POST/api/meal/:mealId/participate:Sign up a user to participate in a specific meal (requires a valid token).
DELETE/api/meal/:mealId/participate: Cancels a user's participation in a specified meal (requires a valid token).
GET/api/meal/:mealId/participants: Retrieve a list of all participants for a specific meal (requires a valid token).
GET/api/meal/:mealId/participants/:participantId:Retrieve the details of a specific participant for a specific meal (requires a valid token).
The following endpoints require a request body:

POST /api/meal: Create a new meal
 {
"name":"Spaghetti Bolognese",
"description":"Dé pastaklassieker bij uitstek.",
"dateTime":"2023-05-22 17:35:00",
"imageUrl":"https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
"maxAmountOfParticipants":20,
"price":6.75
}
PUT/api/meal/:id: Update an existing meal based on a valid token.
  {
"name":"Spaghetti Bolognese",
"description":"Dé pastaklassieker bij uitstek.",
"isActive":true,
"isVega":true,
"isVegan":true,
"isToTakeHome":true,
"dateTime":"2023-05-22 17:35:00",
"imageUrl":"https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
"allergenes":["gluten","noten","lactose"],
"maxAmountOfParticipants":20,
"price":6.75
}
