import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';

// In production (e.g. Render), use only platform env vars — never load .env
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  const possiblePaths = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  let envLoaded = false;
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
      envLoaded = true;
      break;
    }
  }
  if (!envLoaded) {
    dotenv.config({ override: false });
  }
}
import methodOverride from 'method-override';
import ejsMate from 'ejs-mate';
import session from 'express-session';
import flash from 'connect-flash';
import passport from 'passport';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

import { connectDatabase } from './config/database';
import { configurePassport } from './config/passport';
import { createSessionConfig } from './config/session';
import { helmetConfig } from './config/helmet';
import { campgroundsRoutes, reviewsRoutes, usersRoutes, homeRoutes } from './api/routes';
import { ExpressError } from './utils';

/**
 * Main application entry point
 */
const startServer = async (): Promise<void> => {
  // Connect to database
  await connectDatabase();

  // Initialize Express app
  const app = express();

  // Set query parser
  app.set('query parser', 'extended');

  // View engine setup — use cwd so path works from repo root (local and Render)
  const projectRoot = process.cwd();
  const viewsDir = path.join(projectRoot, 'archive', 'legacy', 'views');
  const publicDir = path.join(projectRoot, 'archive', 'legacy', 'public');
  app.engine('ejs', ejsMate);
  app.set('view engine', 'ejs');
  app.set('views', viewsDir);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Other middleware
  app.use(methodOverride('_method'));
  app.use(express.static(publicDir));
  app.use(mongoSanitize({ replaceWith: '_' }));

  // Session configuration
  const dbUrl = process.env.DB_URL!;
  const sessionConfig = createSessionConfig(dbUrl);
  app.use(session(sessionConfig));

  // Flash messages
  app.use(flash());

  // Security middleware
  app.use(helmet(helmetConfig));

  // Passport configuration
  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // Global middleware for locals
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
  });

  // Routes
  app.use('/', homeRoutes);
  app.use('/', usersRoutes);
  app.use('/campgrounds', campgroundsRoutes);
  app.use('/campgrounds/:id/reviews', reviewsRoutes);

  // 404 handler (Express 5: '*' is invalid; use regex catch-all)
  app.all(/(.*)/, (_req: Request, _res: Response, next: NextFunction) => {
    next(new ExpressError('Page not Found', 404));
  });

  // Error handler
  app.use((err: ExpressError, req: Request, res: Response, _next: NextFunction) => {
    const { statusCode = 500, message = 'Something Went Wrong' } = err;

    res.status(statusCode).render('error', {
      err: { ...err, message },
      nodeEnv: process.env.NODE_ENV,
      requestInfo:
        process.env.NODE_ENV === 'development'
          ? {
              method: req.method,
              originalUrl: req.originalUrl,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
            }
          : null,
    });
  });

  // Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Start the server
startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
