import session from 'express-session';
import MongoStore from 'connect-mongo';

/**
 * Extract database name from MongoDB connection string
 */
const extractDatabaseName = (dbUrl: string): string => {
  // Match database name in connection string
  // Format: mongodb+srv://.../databaseName?...
  const match = dbUrl.match(/\/([^/?]+)(\?|$)/);
  if (match && match[1]) {
    return match[1];
  }
  // Fallback: try to parse URL
  try {
    const url = new URL(dbUrl.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    const pathname = url.pathname;
    if (pathname && pathname.length > 1) {
      return pathname.substring(1); // Remove leading slash
    }
  } catch {
    // If parsing fails, return default
  }
  throw new Error('Could not extract database name from DB_URL');
};

/**
 * Session configuration
 */
export const createSessionConfig = (dbUrl: string): session.SessionOptions => {
  const secret = process.env.SECRET;

  if (!secret) {
    throw new Error('SECRET environment variable is not set');
  }

  const dbName = extractDatabaseName(dbUrl);

  const store = MongoStore.create({
    mongoUrl: dbUrl,
    dbName,
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
