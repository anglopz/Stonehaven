import { User } from '../models/User';
import { IUser } from '../types';

/**
 * Service layer for User/Auth business logic
 */
export class UserService {
  /**
   * Register a new user
   * Note: Password hashing is handled by passport-local-mongoose
   */
  async registerUser(
    email: string,
    username: string,
    password: string
  ): Promise<IUser | null> {
    try {
      const user = new User({ email, username });
      const registeredUser = await User.register(user, password);
      return registeredUser;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username });
  }

  /**
   * Get count of all users
   */
  async getUserCount(): Promise<number> {
    return await User.countDocuments();
  }
}

export const userService = new UserService();
