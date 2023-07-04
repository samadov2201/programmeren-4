
let database = {
    users: [
        {
            id: 0,
            firstname: 'Koen',
            lastname: 'Van Steen',
            emailaddress: 'koensteen@gmail.com',
            street: 'lovendijkstraat 61',
            city: 'Rotterdam',
            password: 'shampoo1!',
            phonenumber: '0612345678',
        },
        {
            id: 1,
            firstname: 'Muhammad',
            lastname: 'Samadov',
            emailaddress: 'muhammadsamadov@gmail.com',
            street: 'korenaarddwarstraat 16',
            city: 'Rotterdam',
            password: 'shampoo1!',
            phonenumber: '0612345678',
        },
        {
            id: 2,
            firstname: 'Ammar',
            lastname: 'Almiflani',
            emailaddress: 'ammar@gmail.com',
            street: 'lovendijkstraat',
            city: 'Breda',
            password: 'shampoo1!',
            phonenumber: '0612345678',
        },
    ],
};
let meal_database = {
    meals: [
        {
            id: 4,
            isActive: false,
            isVega: false,
            isVegan: false,
            isToTakeHome: true,
            dateTime: '2023-04-03T11:09:42.000Z',
            createDate: '2023-04-03T11:11:26.785Z',
            updateDate: '2023-04-03T11:12:14.000Z',
            name: 'Zuurkool met spekjes',
            description: "Heerlijke zuurkoolschotel, dé winterkost bij uitstek.",
            maxAmountOfParticipants: 6,
            price: '4',
            imageUrl:
                'https://static.ah.nl/static/recepten/img_063387_890x594_JPG.jpg',
            allergenes: [],
            cook: {
                roles: [],
                isActive: true,
                id: 0,
                firstname: 'Koen',
                lastname: 'van steen',
                emailaddress: 'koensteen@gmail.com',
                street: 'lovendijkstraat 61',
                phonenumber: '0612345678',
            },
            participants: [
                {
                    roles: [],
                    isActive: true,
                    id: 2,
                    firstname: 'Ammar',
                    lastname: 'Almiflani',
                    emailaddress: 'ammar@gmail.com',
                    street: 'lovendijkstraat',
                    phonenumber: '0612345678',
                },
            ],
        },
    ],
};

module.exports = { database, meal_database };