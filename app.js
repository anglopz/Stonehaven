if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
};

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const Campground = require('./models/campground');
const Review = require('./models/review');

const helmet = require('helmet');
const sanitizeV5 = require('./utils/mongoSanitizeV5');

const homeRoutes = require('./routes/home');
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const dbUrl = process.env.DB_URL;
const MongoStore = require('connect-mongo');

if (!dbUrl) {
    throw new Error('DB_URL environment variable is not set');
}

mongoose.connect(dbUrl)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();
app.set('query parser', 'extended');

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(sanitizeV5({ replaceWith: '_' }));

// MongoStore configuration
if (!process.env.SECRET) {
    throw new Error('SECRET environment variable is not set');
}

const store = MongoStore.create({
    mongoUrl: dbUrl,
    dbName: 're-camp',
    collectionName: 'sessions',
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: process.env.SECRET
    }
});

const sessionConfig = {
    store,
    name: 'mainCookie',
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}


app.use(session(sessionConfig))
app.use(flash());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://cdn.jsdelivr.net",
          "https://api.mapbox.com",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", 
          "https://cdn.jsdelivr.net",
          "https://api.mapbox.com",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],
        connectSrc: [
          "'self'",
          "https://api.mapbox.com",
          "https://events.mapbox.com",
          "https://cdn.jsdelivr.net",
          "https://*.tiles.mapbox.com",        // AÑADIDO
          "https://*.mapbox.com"              //  AÑADIDO
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://images.unsplash.com",
          "https://res.cloudinary.com",
          "https://api.mapbox.com",
          "https://*.mapbox.com"              // AÑADIDO
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net"
        ],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["blob:"],
        frameSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', homeRoutes);
app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);


app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError('Page not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong';

    res.status(statusCode).render('error', {
        err,
        nodeEnv: process.env.NODE_ENV,
        requestInfo: process.env.NODE_ENV === 'development' ? {
            method: req.method,
            originalUrl: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        } : null
    });
});

app.listen(3000, () => {
    console.log('Serving on port 3000')
})



