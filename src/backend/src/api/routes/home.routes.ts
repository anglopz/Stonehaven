import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { campgroundService, reviewService, userService } from '../../services';
import { catchAsync } from '../../utils';

const router = Router();

/**
 * GET /health - Health check endpoint for deployment monitoring
 */
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

/**
 * GET / - Render home page
 */
router.get(
  '/',
  catchAsync(async (_req: Request, res: Response) => {
    try {
      const featuredCampgrounds = await campgroundService.getFeaturedCampgrounds(3);
      const campgroundsCount = await campgroundService.getCampgroundCount();
      const reviewsCount = await reviewService.getReviewCount();
      const usersCount = await userService.getUserCount();

      res.render('home', {
        featuredCampgrounds,
        stats: {
          campgrounds: campgroundsCount,
          reviews: reviewsCount,
          users: usersCount,
        },
      });
    } catch (error) {
      console.error(error);
      res.render('home', {
        featuredCampgrounds: [],
        stats: { campgrounds: 0, reviews: 0, users: 0 },
      });
    }
  })
);

export default router;
