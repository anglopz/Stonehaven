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
import cors from 'cors';
import session from 'express-session';
import flash from 'connect-flash';
import passport from 'passport';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

import { connectDatabase } from './config/database';
import { configurePassport } from './config/passport';
import { createSessionConfig } from './config/session';
import { helmetConfig } from './config/helmet';
import { createContainer } from './container';
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

  // API-only backend for React frontend — no EJS
  app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride('_method'));
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

  // Wire up routes via composition root
  const container = createContainer();
  app.use('/', container.homeRoutes);
  app.use('/', container.userRoutes);
  app.use('/campgrounds', container.campgroundRoutes);
  app.use('/campgrounds/:id/reviews', container.reviewRoutes);

  // 404 handler (Express 5: '*' is invalid; use regex catch-all)
  app.all(/(.*)/, (_req: Request, _res: Response, next: NextFunction) => {
    next(new ExpressError('Not Found', 404));
  });

  // Error handler — JSON for API
  app.use((err: ExpressError, req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode ?? 500;
    const message = err.message || 'Something went wrong';
    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        request: { method: req.method, url: req.originalUrl },
      }),
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
