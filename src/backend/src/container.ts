import type { Router } from 'express';

// Repositories
import { MongooseCampgroundRepository } from './adapters/outbound/persistence';
import { MongooseReviewRepository } from './adapters/outbound/persistence';
import { MongooseUserRepository } from './adapters/outbound/persistence';

// Outbound adapters
import { MapboxGeocoderAdapter } from './adapters/outbound/geocoding/MapboxGeocoderAdapter';
import { CloudinaryImageAdapter } from './adapters/outbound/image/CloudinaryImageAdapter';

// Services
import { CampgroundService } from './services/campground.service';
import { ReviewService } from './services/review.service';
import { UserService } from './services/user.service';

// Middleware factories
import { createIsAuthor, createIsReviewAuthor } from './middleware/auth.middleware';

// Route factories
import { createCampgroundRoutes } from './adapters/inbound/http/campgrounds.routes';
import { createReviewRoutes } from './adapters/inbound/http/reviews.routes';
import { createUserRoutes } from './adapters/inbound/http/users.routes';
import { createHomeRoutes } from './adapters/inbound/http/home.routes';

export interface AppContainer {
  campgroundRoutes: Router;
  reviewRoutes: Router;
  userRoutes: Router;
  homeRoutes: Router;
}

export function createContainer(): AppContainer {
  // Repositories
  const campgroundRepo = new MongooseCampgroundRepository();
  const reviewRepo = new MongooseReviewRepository();
  const userRepo = new MongooseUserRepository();

  // Outbound adapters
  const geocoder = new MapboxGeocoderAdapter();
  const imageStorage = new CloudinaryImageAdapter();

  // Services
  const campgroundService = new CampgroundService(campgroundRepo);
  const reviewService = new ReviewService(reviewRepo, campgroundRepo);
  const userService = new UserService(userRepo);

  // Middleware
  const isAuthor = createIsAuthor(campgroundRepo);
  const isReviewAuthor = createIsReviewAuthor(reviewRepo);

  // Routes
  const campgroundRoutes = createCampgroundRoutes({
    campgroundService,
    campgroundRepo,
    geocoder,
    imageStorage,
    isAuthor,
  });

  const reviewRoutes = createReviewRoutes({
    reviewService,
    isReviewAuthor,
  });

  const userRoutes = createUserRoutes({ userService });

  const homeRoutes = createHomeRoutes({
    campgroundService,
    reviewService,
    userService,
  });

  return { campgroundRoutes, reviewRoutes, userRoutes, homeRoutes };
}
