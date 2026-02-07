if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}

const mongoose = require('mongoose');
const cities = require('./cities');
const { campgroundThemes } = require('./seedThemes');
const Campground = require('../models/campground');
const User = require('../models/user');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/re-camp';
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Database connected");
});

// Función sample 
const sample = array => array[Math.floor(Math.random() * array.length)];

// Función para imágenes aleatorias del tema
const getRandomThemeImages = (theme, themeImages, count = 2) => {
    const allImages = themeImages[theme];
    // Mezclar array y tomar 'count' elementos
    const shuffled = [...allImages].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const seedDB = async () => {
    await Campground.deleteMany({});
    
    let author = await User.findOne({ username: 'seeduser' });
    if (!author) {
        author = new User({
            username: 'seeduser',
            email: 'seed@example.com',
        });
        await author.setPassword('password123');
        await author.save();
    }

    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        
        // Elegir tema aleatorio
        const theme = sample(campgroundThemes);
        const descriptor = sample(theme.descriptors);
        const place = sample(theme.places);
        
        const camp = new Campground({
            author: author._id,
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${descriptor} ${place}`,
            description: generateDescription(theme.theme),
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images: getRandomThemeImages(theme.theme, themeImages, 2) // 2 imágenes aleatorias del tema
        });
        await camp.save();
    }
}

// Función para descripciones temáticas
const generateDescription = (theme) => {
    const descriptions = {
        forest: "Nestled among ancient trees, this campground offers serene woodland views and abundant wildlife. Perfect for nature lovers and hikers seeking tranquility.",
        mountain: "Perched at high altitude with breathtaking panoramic views. Ideal for adventurous souls and sunrise enthusiasts.",
        lake: "Waterfront camping with crystal-clear waters and peaceful surroundings. Great for fishing, swimming, and water activities.",
        river: "Situated along a gentle flowing river, this spot offers the soothing sounds of water and excellent fishing opportunities."
    };
    return descriptions[theme] || "A beautiful campground offering unique natural experiences.";
};

// Objeto con TODAS las imágenes organizadas
const themeImages = {
    forest: [
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761743977/forest3_tn4oef.jpg',
            filename: 'ReCamp/forest/forest1'
        },
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761743972/forest2_ixb2ul.webp',
            filename: 'ReCamp/forest/forest2'
        },
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761743962/forest1_t8g5xd.webp',
            filename: 'ReCamp/forest/forest3'
        }
    ],
    mountain: [
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761744161/mountain3_gnkkh2.webp',
            filename: 'ReCamp/mountain/mountain1'
        },
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761744156/Mountain2_inh1yi.webp',
            filename: 'ReCamp/mountain/mountain2'
        },
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761744149/Mountain1_dlpi7x.webp',
            filename: 'ReCamp/mountain/mountain3'
        }
    ],
    lake: [
         {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761744293/lake3_rq8oej.jpg',
            filename: 'ReCamp/lake/lake1'
        },
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761744290/lake2_v7zmvi.png',
            filename: 'ReCamp/lake/lake2'
        },
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761744286/lake1_mfe0bj.jpg',
            filename: 'ReCamp/lake/lake3'
        }
    ],
    river: [
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761744394/river3_cjl02g.jpg',
            filename: 'ReCamp/river/river1'
        },
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761744390/river2_q2milp.jpg',
            filename: 'ReCamp/river/river2'
        },
        {
            url: 'https://res.cloudinary.com/dbjuk4qtw/image/upload/v1761744387/river1_wfncsc.jpg',
            filename: 'ReCamp/river/river3'
        }
    ]
};

seedDB().then(() => {
    console.log("Database seeded successfully!");
    mongoose.connection.close();
}).catch(err => {
    console.error("Seeding error:", err);
    mongoose.connection.close();
});