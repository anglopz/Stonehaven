import session from 'express-session';
import MongoStore from 'connect-mongo';

/**
 * Session configuration
 */
export const createSessionConfig = (dbUrl: string): session.SessionOptions => {
  const secret = process.env.SECRET;

  if (!secret) {
    throw new Error('SECRET environment variable is not set');
  }

  const store = MongoStore.create({
    mongoUrl: dbUrl,
    dbName: 're-camp',
    collectionName: 'sessions',
    touchAfter: 24 * 60 * 60, // 24 hours
    crypto: {
      secret,
    },
  });

  return {
    store,
    name: 'mainCookie',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  };
};
