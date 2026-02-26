import type { IReview } from '../../../../types';
import type { ReviewEntity } from '../../../../domain/entities';

/** Map a Mongoose Review document to a domain ReviewEntity. */
export function toDomain(doc: IReview): ReviewEntity {
  // author may be a populated User object or an ObjectId
  const author = doc.author as unknown;
  const authorId =
    typeof author === 'object' && author !== null && '_id' in author
      ? (author as { _id: { toString(): string } })._id.toString()
      : String(author);

  return {
    id: doc._id.toString(),
    body: doc.body,
    rating: doc.rating,
    authorId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
