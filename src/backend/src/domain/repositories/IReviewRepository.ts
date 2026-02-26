import type { ReviewEntity } from '../entities';

export interface IReviewRepository {
  findById(id: string): Promise<ReviewEntity | null>;
  create(data: Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewEntity>;
  delete(id: string): Promise<boolean>;
  deleteMany(ids: string[]): Promise<number>;
  count(): Promise<number>;
}
