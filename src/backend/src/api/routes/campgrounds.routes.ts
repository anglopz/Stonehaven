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
const upload = multer({ storage: storage as multer.StorageEngine });

/**
 * GET /campgrounds - List all campgrounds (JSON API)
 */
router.get(
  '/',
  catchAsync(async (_req: Request, res: Response) => {
    const campgrounds = await campgroundService.getAllCampgrounds();
    res.json(Array.isArray(campgrounds) ? campgrounds : []);
  })
);

/**
 * GET /campgrounds/new - 404 (React serves the form)
 */
router.get('/new', isLoggedIn, (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

/**
 * POST /campgrounds - Create new campground (JSON API)
 */
router.post(
  '/',
  isLoggedIn,
  upload.array('images'),
  validateRequest(campgroundSchema),
  catchAsync(async (req: Request, res: Response) => {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground?.location,
        limit: 1,
      })
      .send();

    const features = geoData.body?.features;
    if (!features?.length) {
      return res.status(400).json({ success: false, message: 'Could not geocode location' });
    }

    const geometry = features[0].geometry as {
      type: 'Point';
      coordinates: [number, number];
    };

    const files = (req.files as Express.Multer.File[]) ?? [];
    const campground = await campgroundService.createCampground(
      req.body.campground,
      files,
      geometry,
      req.user!._id.toString()
    );

    return res.status(201).json(campground);
  })
);

/**
 * GET /campgrounds/:id - Single campground (JSON API)
 */
router.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const campground = await campgroundService.getCampgroundById(req.params.id);

    if (!campground) {
      return res.status(404).json({ success: false, message: 'Campground not found' });
    }

    return res.json(campground);
  })
);

/**
 * GET /campgrounds/:id/edit - Campground for edit (JSON API)
 */
router.get(
  '/:id/edit',
  isLoggedIn,
  isAuthor,
  catchAsync(async (req: Request, res: Response) => {
    const campground = await campgroundService.getCampgroundById(req.params.id);

    if (!campground) {
      return res.status(404).json({ success: false, message: 'Campground not found' });
    }

    return res.json(campground);
  })
);

/**
 * PUT /campgrounds/:id - Update campground (JSON API)
 */
router.put(
  '/:id',
  isLoggedIn,
  isAuthor,
  upload.array('images'),
  validateRequest(campgroundSchema),
  catchAsync(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const campground = await campgroundService.updateCampground(
      req.params.id,
      req.body.campground,
      files,
      req.body.deleteImages
    );

    if (!campground) {
      return res.status(404).json({ success: false, message: 'Campground not found' });
    }

    if (req.body.deleteImages && Array.isArray(req.body.deleteImages)) {
      for (const filename of req.body.deleteImages) {
        await cloudinary.uploader.destroy(filename).catch(() => {});
      }
    }

    return res.json(campground);
  })
);

/**
 * DELETE /campgrounds/:id - Delete campground (JSON API)
 */
router.delete(
  '/:id',
  isLoggedIn,
  isAuthor,
  catchAsync(async (req: Request, res: Response) => {
    await campgroundService.deleteCampground(req.params.id);
    res.status(204).send();
  })
);

export default router;
