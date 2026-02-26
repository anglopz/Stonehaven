import type { IUserRepository } from '../domain/repositories';
import type { UserEntity } from '../domain/entities';
import { User } from '../models/User';
import type { IUser } from '../types';
import { MongooseUserRepository } from '../adapters/outbound/persistence';

/**
 * Service layer for User/Auth business logic
 *
 * Note: registerUser still returns the raw Mongoose document because
 * passport-local-mongoose's req.login() requires it for session serialization.
 * This will be replaced when auth migrates to JWT.
 */
export class UserService {
  constructor(private readonly userRepo: IUserRepository) {}

  async registerUser(
    email: string,
    username: string,
    password: string
  ): Promise<IUser> {
    const user = new User({ email, username });
    return User.register(user, password);
  }

  async getUserById(userId: string): Promise<UserEntity | null> {
    return this.userRepo.findById(userId);
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findByEmail(email);
  }

  async getUserByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepo.findByUsername(username);
  }

  async getUserCount(): Promise<number> {
    return this.userRepo.count();
  }
}

// Backward-compatible default instance
export const userService = new UserService(new MongooseUserRepository());
