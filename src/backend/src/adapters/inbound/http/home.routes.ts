import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import type { CampgroundService } from '../../../services/campground.service';
import type { ReviewService } from '../../../services/review.service';
import type { UserService } from '../../../services/user.service';
import { catchAsync } from '../../../utils';

export interface HomeRouteDeps {
  campgroundService: CampgroundService;
  reviewService: ReviewService;
  userService: UserService;
}

export function createHomeRoutes(deps: HomeRouteDeps): Router {
  const { campgroundService, reviewService, userService } = deps;
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
    });
  });

  router.get(
    '/',
    catchAsync(async (_req: Request, res: Response) => {
      try {
        const featuredCampgrounds = await campgroundService.getFeaturedCampgrounds(3);
        const campgroundsCount = await campgroundService.getCampgroundCount();
        const reviewsCount = await reviewService.getReviewCount();
        const usersCount = await userService.getUserCount();

        res.json({
          featuredCampgrounds,
          stats: {
            campgrounds: campgroundsCount,
            reviews: reviewsCount,
            users: usersCount,
          },
        });
      } catch (error) {
        console.error(error);
        res.json({
          featuredCampgrounds: [],
          stats: { campgrounds: 0, reviews: 0, users: 0 },
        });
      }
    })
  );

  return router;
}
