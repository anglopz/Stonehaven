import { Review } from '../../../models/Review';
import type { IReviewRepository } from '../../../domain/repositories';
import type { ReviewEntity } from '../../../domain/entities';
import { toDomain } from './mappers/review.mapper';

export class MongooseReviewRepository implements IReviewRepository {
  async findById(id: string): Promise<ReviewEntity | null> {
    const doc = await Review.findById(id).populate('author');
    return doc ? toDomain(doc) : null;
  }

  async create(
    data: Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReviewEntity> {
    const doc = new Review({
      body: data.body,
      rating: data.rating,
      author: data.authorId,
    });
    await doc.save();
    return toDomain(doc);
  }

  async delete(id: string): Promise<boolean> {
    const doc = await Review.findByIdAndDelete(id);
    return doc !== null;
  }

  async deleteMany(ids: string[]): Promise<number> {
    const result = await Review.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  }

  async count(): Promise<number> {
    return Review.countDocuments();
  }
}
