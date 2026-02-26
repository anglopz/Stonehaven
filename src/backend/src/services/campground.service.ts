import type { ICampgroundRepository } from '../domain/repositories';
import type { CampgroundEntity, ImageVO } from '../domain/entities';
import type { GeometryVO } from '../domain/entities';
import { MongooseCampgroundRepository } from '../adapters/outbound/persistence';

const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';

/**
 * Service layer for Campground business logic
 */
export class CampgroundService {
  constructor(private readonly campgroundRepo: ICampgroundRepository) {}

  async getAllCampgrounds(): Promise<CampgroundEntity[]> {
    return this.campgroundRepo.findAll();
  }

  async getCampgroundById(id: string): Promise<CampgroundEntity | null> {
    return this.campgroundRepo.findByIdWithRelations(id);
  }

  async createCampground(
    campgroundData: { title: string; price: number; description: string; location: string },
    images: Array<{ path: string; filename: string }>,
    geometry: GeometryVO,
    authorId: string
  ): Promise<CampgroundEntity> {
    return this.campgroundRepo.create({
      title: campgroundData.title,
      price: campgroundData.price,
      description: campgroundData.description,
      location: campgroundData.location,
      images: images.map((file) => ({ url: file.path, filename: file.filename })),
      geometry,
      authorId,
      reviewIds: [],
    });
  }

  async updateCampground(
    id: string,
    campgroundData: { title?: string; price?: number; description?: string; location?: string },
    newImages?: Array<{ path: string; filename: string }>,
    deleteImages?: string[]
  ): Promise<CampgroundEntity | null> {
    const updated = await this.campgroundRepo.update(id, campgroundData);
    if (!updated) return null;

    let result = updated;

    if (newImages && newImages.length > 0) {
      const imgs: ImageVO[] = newImages.map((file) => ({
        url: file.path,
        filename: file.filename,
      }));
      const withImages = await this.campgroundRepo.addImages(id, imgs);
      if (withImages) result = withImages;
    }

    if (deleteImages && deleteImages.length > 0) {
      const withoutImages = await this.campgroundRepo.removeImages(id, deleteImages);
      if (withoutImages) result = withoutImages;
    }

    return result;
  }

  async deleteCampground(id: string): Promise<boolean> {
    return this.campgroundRepo.delete(id);
  }

  async getFeaturedCampgrounds(limit: number = 3): Promise<CampgroundEntity[]> {
    const campgrounds = await this.campgroundRepo.findMany(limit);

    return campgrounds.map((campground) => {
      if (!campground.images || campground.images.length === 0) {
        return {
          ...campground,
          images: [{ url: DEFAULT_IMAGE_URL, filename: 'default-campground' }],
        };
      }
      return campground;
    });
  }

  async getCampgroundCount(): Promise<number> {
    return this.campgroundRepo.count();
  }
}

// Backward-compatible default instance (removed once container is used everywhere)
export const campgroundService = new CampgroundService(new MongooseCampgroundRepository());
