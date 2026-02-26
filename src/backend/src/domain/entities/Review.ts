export interface ReviewEntity {
  id: string;
  body: string;
  rating: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}
