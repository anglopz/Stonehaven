import type { CampgroundEntity, ImageVO } from '../entities';

export interface ICampgroundRepository {
  findAll(): Promise<CampgroundEntity[]>;
  findById(id: string): Promise<CampgroundEntity | null>;
  findByIdWithRelations(id: string): Promise<CampgroundEntity | null>;
  create(
    data: Omit<CampgroundEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CampgroundEntity>;
  update(
    id: string,
    data: Partial<Omit<CampgroundEntity, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<CampgroundEntity | null>;
  addImages(id: string, images: ImageVO[]): Promise<CampgroundEntity | null>;
  removeImages(id: string, filenames: string[]): Promise<CampgroundEntity | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  findMany(limit: number): Promise<CampgroundEntity[]>;
}
