import { User } from '../../../models/User';
import type { IUserRepository } from '../../../domain/repositories';
import type { UserEntity } from '../../../domain/entities';
import { toDomain } from './mappers/user.mapper';

export class MongooseUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const doc = await User.findById(id);
    return doc ? toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await User.findOne({ email });
    return doc ? toDomain(doc) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const doc = await User.findOne({ username });
    return doc ? toDomain(doc) : null;
  }

  async count(): Promise<number> {
    return User.countDocuments();
  }
}
