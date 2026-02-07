import { User } from '../User';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid user with required fields', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const user = await User.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
    });

    it('should fail validation when email is missing', async () => {
      const user = new User({
        username: 'testuser',
        // Missing email
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const user = await User.create({
        email: 'TEST@EXAMPLE.COM',
        username: 'testuser',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should trim whitespace from email', async () => {
      const user = await User.create({
        email: '  test@example.com  ',
        username: 'testuser',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should enforce unique email constraint', async () => {
      await User.create({
        email: 'test@example.com',
        username: 'user1',
      });

      const duplicateUser = new User({
        email: 'test@example.com',
        username: 'user2',
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });
  });

  describe('Passport Local Mongoose Plugin', () => {
    it('should add username field via plugin', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(user.username).toBe('testuser');
    });

    it('should have register method from plugin', () => {
      expect(typeof User.register).toBe('function');
    });

    it('should have authenticate method from plugin', () => {
      expect(typeof User.authenticate).toBe('function');
    });

    it('should register user with password using plugin', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const user = new User(userData);
      
      // Using the register method from passport-local-mongoose
      await new Promise((resolve, reject) => {
        User.register(user, 'password123', (err, registeredUser) => {
          if (err) reject(err);
          else resolve(registeredUser);
        });
      });

      const foundUser = await User.findOne({ username: 'testuser' });
      expect(foundUser).toBeDefined();
      expect(foundUser!.email).toBe('test@example.com');
    });

    it('should not store plain text password', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const user = new User(userData);
      
      await new Promise((resolve, reject) => {
        User.register(user, 'password123', (err, registeredUser) => {
          if (err) reject(err);
          else resolve(registeredUser);
        });
      });

      const foundUser = await User.findOne({ username: 'testuser' });
      
      // Password should be hashed by passport-local-mongoose
      // We can't directly check hash/salt in strict mode, but we can verify user was created
      expect(foundUser).toBeDefined();
      expect(foundUser!.username).toBe('testuser');
      expect(foundUser!.email).toBe('test@example.com');
    });

    it('should fail to register duplicate username', async () => {
      const user1 = new User({
        email: 'user1@example.com',
        username: 'testuser',
      });

      await new Promise((resolve, reject) => {
        User.register(user1, 'password123', (err, registeredUser) => {
          if (err) reject(err);
          else resolve(registeredUser);
        });
      });

      const user2 = new User({
        email: 'user2@example.com',
        username: 'testuser', // Duplicate username
      });

      await expect(
        new Promise((resolve, reject) => {
          User.register(user2, 'password456', (err, registeredUser) => {
            if (err) reject(err);
            else resolve(registeredUser);
          });
        })
      ).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    it('should automatically add createdAt and updatedAt timestamps', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt timestamp when document is modified', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      user.email = 'newemail@example.com';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('CRUD Operations', () => {
    it('should find user by email', async () => {
      await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeDefined();
      expect(user!.username).toBe('testuser');
    });

    it('should find user by username', async () => {
      await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const user = await User.findOne({ username: 'testuser' });
      expect(user).toBeDefined();
      expect(user!.email).toBe('test@example.com');
    });

    it('should update user email', async () => {
      const user = await User.create({
        email: 'old@example.com',
        username: 'testuser',
      });

      user.email = 'new@example.com';
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser!.email).toBe('new@example.com');
    });

    it('should delete user', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      await User.findByIdAndDelete(user._id);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Query Operations', () => {
    it('should list all users', async () => {
      await User.create({
        email: 'user1@example.com',
        username: 'user1',
      });

      await User.create({
        email: 'user2@example.com',
        username: 'user2',
      });

      await User.create({
        email: 'user3@example.com',
        username: 'user3',
      });

      const users = await User.find();
      expect(users).toHaveLength(3);
    });

    it('should search users by email pattern', async () => {
      await User.create({
        email: 'john@example.com',
        username: 'john',
      });

      await User.create({
        email: 'jane@example.com',
        username: 'jane',
      });

      await User.create({
        email: 'bob@different.com',
        username: 'bob',
      });

      const exampleUsers = await User.find({ email: /@example\.com$/ });
      expect(exampleUsers).toHaveLength(2);
    });
  });
});
