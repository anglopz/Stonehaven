import { Campground } from '../models/Campground';
import { ICampground } from '../types';
import { Types } from 'mongoose';

/**
 * Service layer for Campground business logic
 */
export class CampgroundService {
  /**
   * Get all campgrounds
   */
  async getAllCampgrounds(): Promise<ICampground[]> {
    return await Campground.find({});
  }

  /**
   * Get a single campground by ID with populated reviews and author
   */
  async getCampgroundById(id: string): Promise<ICampground | null> {
    return await Campground.findById(id)
      .populate({
        path: 'reviews',
        populate: {
          path: 'author',
        },
      })
      .populate('author');
  }

  /**
   * Create a new campground
   */
  async createCampground(
    campgroundData: Partial<ICampground>,
    images: Array<{ path: string; filename: string }>,
    geometry: { type: 'Point'; coordinates: [number, number] },
    authorId: Types.ObjectId
  ): Promise<ICampground> {
    const campground = new Campground(campgroundData);
    campground.geometry = geometry;
    campground.images = images.map((file) => ({ url: file.path, filename: file.filename }));
    campground.author = authorId;
    await campground.save();
    return campground;
  }

  /**
   * Update a campground
   */
  async updateCampground(
    id: string,
    campgroundData: Partial<ICampground>,
    newImages?: Array<{ path: string; filename: string }>,
    deleteImages?: string[]
  ): Promise<ICampground | null> {
    const campground = await Campground.findByIdAndUpdate(id, campgroundData, { new: true });

    if (!campground) {
      return null;
    }

    // Add new images if provided
    if (newImages && newImages.length > 0) {
      const imgs = newImages.map((file) => ({ url: file.path, filename: file.filename }));
      campground.images.push(...imgs);
    }

    // Remove images if specified
    if (deleteImages && deleteImages.length > 0) {
      await campground.updateOne({ $pull: { images: { filename: { $in: deleteImages } } } });
    }

    await campground.save();
    return campground;
  }

  /**
   * Delete a campground
   */
  async deleteCampground(id: string): Promise<ICampground | null> {
    return await Campground.findByIdAndDelete(id);
  }

  /**
   * Get featured campgrounds for home page
   */
  async getFeaturedCampgrounds(limit: number = 3): Promise<ICampground[]> {
    const campgrounds = await Campground.find().limit(limit);

    // Ensure all campgrounds have at least one image
    return campgrounds.map((campground) => {
      if (!campground.images || campground.images.length === 0) {
        campground.images = [
          {
            url: 'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
            filename: 'default-campground',
          },
        ];
      }
      return campground;
    });
  }

  /**
   * Get count of all campgrounds
   */
  async getCampgroundCount(): Promise<number> {
    return await Campground.countDocuments();
  }
}

export const campgroundService = new CampgroundService();
