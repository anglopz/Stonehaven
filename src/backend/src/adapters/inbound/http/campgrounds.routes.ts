import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { storage } from '../../../config/cloudinary';
import type { CampgroundService } from '../../../services/campground.service';
import type { IGeocoder } from '../../../application/ports';
import type { IImageStorage } from '../../../application/ports';
import { isLoggedIn, validateRequest } from '../../../middleware';
import type { ICampgroundRepository } from '../../../domain/repositories';
import { campgroundSchema } from '../../../validation';
import { catchAsync } from '../../../utils';

export interface CampgroundRouteDeps {
  campgroundService: CampgroundService;
  campgroundRepo: ICampgroundRepository;
  geocoder: IGeocoder;
  imageStorage: IImageStorage;
  isAuthor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createCampgroundRoutes(deps: CampgroundRouteDeps): Router {
  const { campgroundService, geocoder, imageStorage, isAuthor } = deps;
  const router = Router();
  const upload = multer({ storage: storage as multer.StorageEngine });

  router.get(
    '/',
    catchAsync(async (_req: Request, res: Response) => {
      const campgrounds = await campgroundService.getAllCampgrounds();
      res.json(Array.isArray(campgrounds) ? campgrounds : []);
    })
  );

  router.get('/new', isLoggedIn, (_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Not found' });
  });

  router.post(
    '/',
    isLoggedIn,
    upload.array('images'),
    validateRequest(campgroundSchema),
    catchAsync(async (req: Request, res: Response) => {
      const geometry = await geocoder.forwardGeocode(req.body.campground?.location);

      if (!geometry) {
        return res.status(400).json({ success: false, message: 'Could not geocode location' });
      }

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

  router.get(
    '/:id/edit',
    isLoggedIn,
    isAuthor as any,
    catchAsync(async (req: Request, res: Response) => {
      const campground = await campgroundService.getCampgroundById(req.params.id);
      if (!campground) {
        return res.status(404).json({ success: false, message: 'Campground not found' });
      }
      return res.json(campground);
    })
  );

  router.put(
    '/:id',
    isLoggedIn,
    isAuthor as any,
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
          await imageStorage.delete(filename);
        }
      }

      return res.json(campground);
    })
  );

  router.delete(
    '/:id',
    isLoggedIn,
    isAuthor as any,
    catchAsync(async (req: Request, res: Response) => {
      await campgroundService.deleteCampground(req.params.id);
      res.status(204).send();
    })
  );

  return router;
}
