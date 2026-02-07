import { Router, Request, Response } from 'express';
import multer from 'multer';
import { storage } from '../../config/cloudinary';
import { cloudinary } from '../../config/cloudinary';
import { geocoder } from '../../config/mapbox';
import { campgroundService } from '../../services';
import { isLoggedIn, isAuthor, validateRequest } from '../../middleware';
import { campgroundSchema } from '../../validation';
import { catchAsync } from '../../utils';

const router = Router();
const upload = multer({ storage });

/**
 * GET /campgrounds - List all campgrounds
 */
router.get(
  '/',
  catchAsync(async (_req: Request, res: Response) => {
    const campgrounds = await campgroundService.getAllCampgrounds();
    res.render('campgrounds/index', { campgrounds });
  })
);

/**
 * GET /campgrounds/new - Render new campground form
 */
router.get('/new', isLoggedIn, (_req: Request, res: Response) => {
  res.render('campgrounds/new');
});

/**
 * POST /campgrounds - Create new campground
 */
router.post(
  '/',
  isLoggedIn,
  upload.array('images'),
  validateRequest(campgroundSchema),
  catchAsync(async (req: Request, res: Response) => {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();

    const geometry = geoData.body.features[0].geometry as {
      type: 'Point';
      coordinates: [number, number];
    };

    const files = req.files as Express.Multer.File[];
    const campground = await campgroundService.createCampground(
      req.body.campground,
      files,
      geometry,
      req.user!._id
    );

    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

/**
 * GET /campgrounds/:id - Show single campground
 */
router.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const campground = await campgroundService.getCampgroundById(req.params.id);

    if (!campground) {
      req.flash('error', 'Cannot find that campground!');
      return res.redirect('/campgrounds');
    }

    res.render('campgrounds/show', { campground });
  })
);

/**
 * GET /campgrounds/:id/edit - Render edit form
 */
router.get(
  '/:id/edit',
  isLoggedIn,
  isAuthor,
  catchAsync(async (req: Request, res: Response) => {
    const campground = await campgroundService.getCampgroundById(req.params.id);

    if (!campground) {
      req.flash('error', 'Cannot find that campground!');
      return res.redirect('/campgrounds');
    }

    res.render('campgrounds/edit', { campground });
  })
);

/**
 * PUT /campgrounds/:id - Update campground
 */
router.put(
  '/:id',
  isLoggedIn,
  isAuthor,
  upload.array('images'),
  validateRequest(campgroundSchema),
  catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const campground = await campgroundService.updateCampground(
      req.params.id,
      req.body.campground,
      files,
      req.body.deleteImages
    );

    if (!campground) {
      req.flash('error', 'Cannot find that campground!');
      return res.redirect('/campgrounds');
    }

    // Delete images from Cloudinary if specified
    if (req.body.deleteImages) {
      for (const filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }
    }

    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

/**
 * DELETE /campgrounds/:id - Delete campground
 */
router.delete(
  '/:id',
  isLoggedIn,
  isAuthor,
  catchAsync(async (req: Request, res: Response) => {
    await campgroundService.deleteCampground(req.params.id);
    req.flash('success', 'Successfully deleted campground');
    res.redirect('/campgrounds');
  })
);

export default router;
