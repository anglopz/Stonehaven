import type { ICampground } from '../../../../types';
import type { CampgroundEntity } from '../../../../domain/entities';

/** Extract an ID string from a value that may be a populated document or an ObjectId. */
function extractId(value: unknown): string {
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return (value as { _id: { toString(): string } })._id.toString();
  }
  return String(value);
}

/** Map a Mongoose Campground document to a domain CampgroundEntity. */
export function toDomain(doc: ICampground): CampgroundEntity {
  return {
    id: doc._id.toString(),
    title: doc.title,
    images: doc.images.map((img) => ({ url: img.url, filename: img.filename })),
    geometry: {
      type: doc.geometry.type,
      coordinates: [doc.geometry.coordinates[0], doc.geometry.coordinates[1]],
    },
    price: doc.price,
    description: doc.description,
    location: doc.location,
    authorId: extractId(doc.author),
    reviewIds: doc.reviews.map((r) => extractId(r)),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
