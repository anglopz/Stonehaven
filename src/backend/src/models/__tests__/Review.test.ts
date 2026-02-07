import { Review } from '../Review';
import { User } from '../User';
import { mockReviewData } from '../../__tests__/fixtures/review.fixture';

describe('Review Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid review with required fields', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const review = await Review.create({
        ...mockReviewData,
        author: user._id,
      });

      expect(review.body).toBe(mockReviewData.body);
      expect(review.rating).toBe(mockReviewData.rating);
      expect(review.author.toString()).toBe(user._id.toString());
    });

    it('should fail validation when required fields are missing', async () => {
      const review = new Review({
        body: 'Great campground!',
        // Missing rating and author
      });

      await expect(review.save()).rejects.toThrow();
    });

    it('should fail validation when rating is below minimum (1)', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const review = new Review({
        ...mockReviewData,
        author: user._id,
        rating: 0,
      });

      await expect(review.save()).rejects.toThrow();
    });

    it('should fail validation when rating is above maximum (5)', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const review = new Review({
        ...mockReviewData,
        author: user._id,
        rating: 6,
      });

      await expect(review.save()).rejects.toThrow();
    });

    it('should accept valid ratings from 1 to 5', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      for (let rating = 1; rating <= 5; rating++) {
        const review = await Review.create({
          body: `Test review with rating ${rating}`,
          rating,
          author: user._id,
        });

        expect(review.rating).toBe(rating);
      }
    });

    it('should require review body', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const review = new Review({
        rating: 5,
        author: user._id,
        // Missing body
      });

      await expect(review.save()).rejects.toThrow();
    });
  });

  describe('Relationships', () => {
    it('should populate author field', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const review = await Review.create({
        ...mockReviewData,
        author: user._id,
      });

      const populatedReview = await Review.findById(review._id).populate('author');

      expect(populatedReview).toBeDefined();
      expect(populatedReview!.author).toBeDefined();
      expect((populatedReview!.author as any).username).toBe('testuser');
      expect((populatedReview!.author as any).email).toBe('test@example.com');
    });
  });

  describe('Timestamps', () => {
    it('should automatically add createdAt and updatedAt timestamps', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const review = await Review.create({
        ...mockReviewData,
        author: user._id,
      });

      expect(review.createdAt).toBeDefined();
      expect(review.updatedAt).toBeDefined();
      expect(review.createdAt).toBeInstanceOf(Date);
      expect(review.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt timestamp when document is modified', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const review = await Review.create({
        ...mockReviewData,
        author: user._id,
      });

      const originalUpdatedAt = review.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      review.body = 'Updated review text';
      await review.save();

      expect(review.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('CRUD Operations', () => {
    it('should create multiple reviews for the same author', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      await Review.create({
        body: 'First review',
        rating: 5,
        author: user._id,
      });

      await Review.create({
        body: 'Second review',
        rating: 4,
        author: user._id,
      });

      const userReviews = await Review.find({ author: user._id });
      expect(userReviews).toHaveLength(2);
    });

    it('should update review body and rating', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const review = await Review.create({
        body: 'Original review',
        rating: 3,
        author: user._id,
      });

      review.body = 'Updated review';
      review.rating = 5;
      await review.save();

      const updatedReview = await Review.findById(review._id);
      expect(updatedReview!.body).toBe('Updated review');
      expect(updatedReview!.rating).toBe(5);
    });

    it('should delete review', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const review = await Review.create({
        body: 'Test review',
        rating: 5,
        author: user._id,
      });

      await Review.findByIdAndDelete(review._id);

      const deletedReview = await Review.findById(review._id);
      expect(deletedReview).toBeNull();
    });
  });

  describe('Query Operations', () => {
    it('should find reviews by rating', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      await Review.create({
        body: 'Excellent!',
        rating: 5,
        author: user._id,
      });

      await Review.create({
        body: 'Good',
        rating: 4,
        author: user._id,
      });

      await Review.create({
        body: 'Amazing!',
        rating: 5,
        author: user._id,
      });

      const fiveStarReviews = await Review.find({ rating: 5 });
      expect(fiveStarReviews).toHaveLength(2);
    });

    it('should find reviews by author', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        username: 'user1',
      });

      const user2 = await User.create({
        email: 'user2@example.com',
        username: 'user2',
      });

      await Review.create({
        body: 'Review by user 1',
        rating: 5,
        author: user1._id,
      });

      await Review.create({
        body: 'Another review by user 1',
        rating: 4,
        author: user1._id,
      });

      await Review.create({
        body: 'Review by user 2',
        rating: 3,
        author: user2._id,
      });

      const user1Reviews = await Review.find({ author: user1._id });
      expect(user1Reviews).toHaveLength(2);
    });
  });
});
