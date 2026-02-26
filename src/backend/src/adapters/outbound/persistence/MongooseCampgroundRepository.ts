import { Campground } from '../../../models/Campground';
import type { ICampgroundRepository } from '../../../domain/repositories';
import type { CampgroundEntity, ImageVO } from '../../../domain/entities';
import { toDomain } from './mappers/campground.mapper';

export class MongooseCampgroundRepository implements ICampgroundRepository {
  async findAll(): Promise<CampgroundEntity[]> {
    const docs = await Campground.find({});
    return docs.map(toDomain);
  }

  async findById(id: string): Promise<CampgroundEntity | null> {
    const doc = await Campground.findById(id);
    return doc ? toDomain(doc) : null;
  }

  async findByIdWithRelations(id: string): Promise<CampgroundEntity | null> {
    const doc = await Campground.findById(id)
      .populate({
        path: 'reviews',
        populate: { path: 'author' },
      })
      .populate('author');
    return doc ? toDomain(doc) : null;
  }

  async create(
    data: Omit<CampgroundEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CampgroundEntity> {
    const doc = new Campground({
      title: data.title,
      images: data.images,
      geometry: data.geometry,
      price: data.price,
      description: data.description,
      location: data.location,
      author: data.authorId,
      reviews: data.reviewIds,
    });
    await doc.save();
    return toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<Omit<CampgroundEntity, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<CampgroundEntity | null> {
    // Map domain field names to Mongoose field names
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.geometry !== undefined) updateData.geometry = data.geometry;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.authorId !== undefined) updateData.author = data.authorId;
    if (data.reviewIds !== undefined) updateData.reviews = data.reviewIds;

    const doc = await Campground.findByIdAndUpdate(id, updateData, { new: true });
    return doc ? toDomain(doc) : null;
  }

  async addImages(id: string, images: ImageVO[]): Promise<CampgroundEntity | null> {
    const doc = await Campground.findById(id);
    if (!doc) return null;
    doc.images.push(...images);
    await doc.save();
    return toDomain(doc);
  }

  async removeImages(id: string, filenames: string[]): Promise<CampgroundEntity | null> {
    const doc = await Campground.findByIdAndUpdate(
      id,
      { $pull: { images: { filename: { $in: filenames } } } },
      { new: true }
    );
    return doc ? toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const doc = await Campground.findByIdAndDelete(id);
    return doc !== null;
  }

  async count(): Promise<number> {
    return Campground.countDocuments();
  }

  async findMany(limit: number): Promise<CampgroundEntity[]> {
    const docs = await Campground.find().limit(limit);
    return docs.map(toDomain);
  }
}
