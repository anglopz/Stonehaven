import type { IUser } from '../../../../types';
import type { UserEntity } from '../../../../domain/entities';

/** Map a Mongoose User document to a domain UserEntity. */
export function toDomain(doc: IUser): UserEntity {
  return {
    id: doc._id.toString(),
    email: doc.email,
    username: doc.username,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
