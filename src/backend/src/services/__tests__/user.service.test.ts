import { UserService } from '../user.service';
import { User } from '../../models/User';
import { MongooseUserRepository } from '../../adapters/outbound/persistence';
import { Types } from 'mongoose';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(new MongooseUserRepository());
  });

  describe('registerUser', () => {
    it('should register a new user', async () => {
      const user = await service.registerUser(
        'test@example.com',
        'testuser',
        'password123'
      );

      expect(user).toBeDefined();
      expect(user!.email).toBe('test@example.com');
      expect(user!.username).toBe('testuser');
    });

    it('should save user to database', async () => {
      const user = await service.registerUser(
        'test@example.com',
        'testuser',
        'password123'
      );

      const found = await User.findById(user!._id);
      expect(found).toBeDefined();
      expect(found!.email).toBe('test@example.com');
    });

    it('should hash password using passport-local-mongoose', async () => {
      const user = await service.registerUser(
        'test@example.com',
        'testuser',
        'password123'
      );

      const userObj = user!.toObject();

      // Should have hash and salt fields added by passport-local-mongoose
      expect((userObj).hash).toBeDefined();
      expect((userObj).salt).toBeDefined();
      expect((userObj).hash).not.toBe('password123');
    });

    it('should throw error for duplicate username', async () => {
      await service.registerUser('user1@example.com', 'testuser', 'password123');

      await expect(
        service.registerUser('user2@example.com', 'testuser', 'password456')
      ).rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      await service.registerUser('test@example.com', 'user1', 'password123');

      await expect(
        service.registerUser('test@example.com', 'user2', 'password456')
      ).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const user = await service.registerUser(
        'TEST@EXAMPLE.COM',
        'testuser',
        'password123'
      );

      expect(user!.email).toBe('test@example.com');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const registered = await service.registerUser(
        'test@example.com',
        'testuser',
        'password123'
      );

      const found = await service.getUserById(registered!._id.toString());

      expect(found).toBeDefined();
      expect(found!.id).toBe(registered!._id.toString());
      expect(found!.email).toBe('test@example.com');
      expect(found!.username).toBe('testuser');
    });

    it('should return null for non-existent user', async () => {
      const fakeId = new Types.ObjectId();
      const found = await service.getUserById(fakeId.toString());
      expect(found).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      await service.registerUser('test@example.com', 'testuser', 'password123');

      const found = await service.getUserByEmail('test@example.com');

      expect(found).toBeDefined();
      expect(found!.email).toBe('test@example.com');
      expect(found!.username).toBe('testuser');
    });

    it('should return null for non-existent email', async () => {
      const found = await service.getUserByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });

    it('should be case-insensitive', async () => {
      await service.registerUser('test@example.com', 'testuser', 'password123');

      const found = await service.getUserByEmail('TEST@EXAMPLE.COM');
      expect(found).toBeDefined();
      expect(found!.email).toBe('test@example.com');
    });
  });

  describe('getUserByUsername', () => {
    it('should return user by username', async () => {
      await service.registerUser('test@example.com', 'testuser', 'password123');

      const found = await service.getUserByUsername('testuser');

      expect(found).toBeDefined();
      expect(found!.email).toBe('test@example.com');
      expect(found!.username).toBe('testuser');
    });

    it('should return null for non-existent username', async () => {
      const found = await service.getUserByUsername('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('getUserCount', () => {
    it('should return correct count of users', async () => {
      await service.registerUser('user1@example.com', 'user1', 'password123');
      await service.registerUser('user2@example.com', 'user2', 'password123');
      await service.registerUser('user3@example.com', 'user3', 'password123');

      const count = await service.getUserCount();
      expect(count).toBe(3);
    });

    it('should return 0 when no users exist', async () => {
      const count = await service.getUserCount();
      expect(count).toBe(0);
    });

    it('should update count after user registration', async () => {
      let count = await service.getUserCount();
      expect(count).toBe(0);

      await service.registerUser('test@example.com', 'testuser', 'password123');

      count = await service.getUserCount();
      expect(count).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty username', async () => {
      await expect(
        service.registerUser('test@example.com', '', 'password123')
      ).rejects.toThrow();
    });

    it('should handle empty password', async () => {
      await expect(
        service.registerUser('test@example.com', 'testuser', '')
      ).rejects.toThrow();
    });
  });
});
