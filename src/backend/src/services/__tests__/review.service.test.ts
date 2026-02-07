import { ReviewService } from '../review.service';
import { Review } from '../../models/Review';
import { Campground } from '../../models/Campground';
import { User } from '../../models/User';
import { mockCampgroundData } from '../../__tests__/fixtures/campground.fixture';
import { Types } from 'mongoose';

describe('ReviewService', () => {
  let service: ReviewService;
  let testUser: any;
  let testCampground: any;

  beforeEach(async () => {
    service = new ReviewService();
    
    testUser = await User.create({
      email: 'test@example.com',
      username: 'testuser',
    });

    testCampground = await Campground.create({
      ...mockCampgroundData,
      author: testUser._id,
    });
  });

  describe('createReview', () => {
    it('should create a new review for a campground', async () => {
      const reviewData = {
        body: 'Amazing campground!',
        rating: 5,
      };

      const review = await service.createReview(
        testCampground._id.toString(),
        reviewData,
        testUser._id
      );

      expect(review).toBeDefined();
      expect(review!.body).toBe(reviewData.body);
      expect(review!.rating).toBe(reviewData.rating);
      expect(review!.author.toString()).toBe(testUser._id.toString());
    });

    it('should add review reference to campground', async () => {
      const reviewData = {
        body: 'Great place!',
        rating: 4,
      };

      const review = await service.createReview(
        testCampground._id.toString(),
        reviewData,
        testUser._id
      );

      const updatedCampground = await Campground.findById(testCampground._id);
      
      expect(updatedCampground!.reviews).toHaveLength(1);
      expect(updatedCampground!.reviews[0].toString()).toBe(review!._id.toString());
    });

    it('should return null for non-existent campground', async () => {
      const fakeId = new Types.ObjectId();
      const reviewData = {
        body: 'Test review',
        rating: 5,
      };

      const review = await service.createReview(
        fakeId.toString(),
        reviewData,
        testUser._id
      );

      expect(review).toBeNull();
    });

    it('should save review to database', async () => {
      const reviewData = {
        body: 'Wonderful experience!',
        rating: 5,
      };

      const review = await service.createReview(
        testCampground._id.toString(),
        reviewData,
        testUser._id
      );

      const foundReview = await Review.findById(review!._id);
      
      expect(foundReview).toBeDefined();
      expect(foundReview!.body).toBe(reviewData.body);
      expect(foundReview!.rating).toBe(reviewData.rating);
    });

    it('should create multiple reviews for the same campground', async () => {
      const user2 = await User.create({
        email: 'user2@example.com',
        username: 'user2',
      });

      await service.createReview(
        testCampground._id.toString(),
        { body: 'First review', rating: 5 },
        testUser._id
      );

      await service.createReview(
        testCampground._id.toString(),
        { body: 'Second review', rating: 4 },
        user2._id
      );

      const updatedCampground = await Campground.findById(testCampground._id);
      expect(updatedCampground!.reviews).toHaveLength(2);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      const review = await Review.create({
        body: 'Test review',
        rating: 5,
        author: testUser._id,
      });

      testCampground.reviews.push(review._id);
      await testCampground.save();

      const result = await service.deleteReview(
        testCampground._id.toString(),
        review._id.toString()
      );

      expect(result).toBe(true);

      const foundReview = await Review.findById(review._id);
      expect(foundReview).toBeNull();
    });

    it('should remove review reference from campground', async () => {
      const review = await Review.create({
        body: 'Test review',
        rating: 5,
        author: testUser._id,
      });

      testCampground.reviews.push(review._id);
      await testCampground.save();

      await service.deleteReview(
        testCampground._id.toString(),
        review._id.toString()
      );

      const updatedCampground = await Campground.findById(testCampground._id);
      expect(updatedCampground!.reviews).toHaveLength(0);
    });

    it('should return false when deleting non-existent review', async () => {
      const fakeReviewId = new Types.ObjectId();
      const result = await service.deleteReview(
        testCampground._id.toString(),
        fakeReviewId.toString()
      );

      expect(result).toBe(false);
    });

    it('should handle deleting review with invalid campground ID', async () => {
      const review = await Review.create({
        body: 'Test review',
        rating: 5,
        author: testUser._id,
      });

      const fakeId = new Types.ObjectId();
      const result = await service.deleteReview(
        fakeId.toString(),
        review._id.toString()
      );

      // Should still delete the review even if campground doesn't exist
      expect(result).toBe(true);
      const foundReview = await Review.findById(review._id);
      expect(foundReview).toBeNull();
    });
  });

  describe('getReviewById', () => {
    it('should return a review by ID', async () => {
      const review = await Review.create({
        body: 'Test review',
        rating: 5,
        author: testUser._id,
      });

      const found = await service.getReviewById(review._id.toString());

      expect(found).toBeDefined();
      expect(found!._id.toString()).toBe(review._id.toString());
      expect(found!.body).toBe('Test review');
      expect(found!.rating).toBe(5);
    });

    it('should populate author field', async () => {
      const review = await Review.create({
        body: 'Test review',
        rating: 5,
        author: testUser._id,
      });

      const found = await service.getReviewById(review._id.toString());

      expect(found).toBeDefined();
      expect(found!.author).toBeDefined();
      expect((found!.author as any).username).toBe('testuser');
      expect((found!.author as any).email).toBe('test@example.com');
    });

    it('should return null for non-existent review', async () => {
      const fakeId = new Types.ObjectId();
      const found = await service.getReviewById(fakeId.toString());
      expect(found).toBeNull();
    });
  });

  describe('getReviewCount', () => {
    it('should return correct count of reviews', async () => {
      await Review.create({
        body: 'Review 1',
        rating: 5,
        author: testUser._id,
      });

      await Review.create({
        body: 'Review 2',
        rating: 4,
        author: testUser._id,
      });

      await Review.create({
        body: 'Review 3',
        rating: 5,
        author: testUser._id,
      });

      const count = await service.getReviewCount();
      expect(count).toBe(3);
    });

    it('should return 0 when no reviews exist', async () => {
      const count = await service.getReviewCount();
      expect(count).toBe(0);
    });
  });
});
