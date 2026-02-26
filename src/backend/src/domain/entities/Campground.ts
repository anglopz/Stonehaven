import type { ImageVO } from './Image';
import type { GeometryVO } from './Geometry';

export interface CampgroundEntity {
  id: string;
  title: string;
  images: ImageVO[];
  geometry: GeometryVO;
  price: number;
  description: string;
  location: string;
  authorId: string;
  reviewIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
