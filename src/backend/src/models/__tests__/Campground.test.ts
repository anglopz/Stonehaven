import { Campground } from '../Campground';
import { Review } from '../Review';
import { User } from '../User';
import { mockCampgroundData } from '../../__tests__/fixtures/campground.fixture';

describe('Campground Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid campground with required fields', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      expect(campground.title).toBe(mockCampgroundData.title);
      expect(campground.price).toBe(mockCampgroundData.price);
      expect(campground.description).toBe(mockCampgroundData.description);
      expect(campground.location).toBe(mockCampgroundData.location);
      expect(campground.author.toString()).toBe(user._id.toString());
    });

    it('should fail validation when required fields are missing', async () => {
      const campground = new Campground({
        title: 'Test',
        // Missing required fields
      });

      await expect(campground.save()).rejects.toThrow();
    });

    it('should fail validation when price is negative', async () => {
      const campground = new Campground({
        ...mockCampgroundData,
        price: -10,
      });

      await expect(campground.save()).rejects.toThrow();
    });

    it('should trim whitespace from title and location', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
        title: '  Test Campground  ',
        location: '  Test Location  ',
      });

      expect(campground.title).toBe('Test Campground');
      expect(campground.location).toBe('Test Location');
    });

    it('should validate geometry type as Point', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = new Campground({
        ...mockCampgroundData,
        author: user._id,
        geometry: {
          type: 'Polygon', // Invalid type
          coordinates: [-122.4194, 37.7749],
        },
      });

      await expect(campground.save()).rejects.toThrow();
    });
  });

  describe('Virtual Properties', () => {
    it('should generate thumbnail URLs for images', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      const campgroundObj = campground.toJSON();
      expect(campgroundObj.images[0].thumbnail).toContain('w_200,h_200,c_fill,q_auto:low');
    });

    it('should generate small image URLs', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      const campgroundObj = campground.toJSON();
      expect(campgroundObj.images[0].small).toContain('w_400,q_auto:good');
    });

    it('should generate medium image URLs', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      const campgroundObj = campground.toJSON();
      expect(campgroundObj.images[0].medium).toContain('w_800,q_auto:good');
    });

    it('should generate popup markup with campground details', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      const campgroundObj = campground.toJSON();
      const markup = campgroundObj.properties?.popUpMarkup;

      expect(markup).toContain(campground.title);
      expect(markup).toContain(campground.location);
      expect(markup).toContain(`$${campground.price}/night`);
      expect(markup).toContain(`/campgrounds/${campground._id}`);
    });

    it('should use default image in popup markup when no images exist', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
        images: [],
      });

      const campgroundObj = campground.toJSON();
      const markup = campgroundObj.properties?.popUpMarkup;

      expect(markup).toContain('/images/default-campground.jpg');
    });
  });

  describe('Relationships', () => {
    it('should populate author field', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      const populatedCampground = await Campground.findById(campground._id).populate('author');

      expect(populatedCampground).toBeDefined();
      expect(populatedCampground!.author).toBeDefined();
      expect((populatedCampground!.author as any).username).toBe('testuser');
    });

    it('should populate reviews field', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      const review = await Review.create({
        body: 'Great campground!',
        rating: 5,
        author: user._id,
      });

      campground.reviews.push(review._id);
      await campground.save();

      const populatedCampground = await Campground.findById(campground._id).populate('reviews');

      expect(populatedCampground).toBeDefined();
      expect(populatedCampground!.reviews).toHaveLength(1);
      expect((populatedCampground!.reviews[0] as any).body).toBe('Great campground!');
    });
  });

  describe('Middleware', () => {
    it('should delete associated reviews when campground is deleted', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      // Create multiple reviews
      const review1 = await Review.create({
        body: 'Great!',
        rating: 5,
        author: user._id,
      });

      const review2 = await Review.create({
        body: 'Awesome!',
        rating: 5,
        author: user._id,
      });

      campground.reviews.push(review1._id, review2._id);
      await campground.save();

      // Verify reviews exist
      const reviewsBeforeDeletion = await Review.countDocuments();
      expect(reviewsBeforeDeletion).toBe(2);

      // Delete campground
      await Campground.findByIdAndDelete(campground._id);

      // Verify reviews were deleted
      const reviewsAfterDeletion = await Review.countDocuments();
      expect(reviewsAfterDeletion).toBe(0);
    });

    it('should not fail when deleting campground with no reviews', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      // Should not throw error
      await expect(Campground.findByIdAndDelete(campground._id)).resolves.toBeDefined();
    });
  });

  describe('Timestamps', () => {
    it('should automatically add createdAt and updatedAt timestamps', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      expect(campground.createdAt).toBeDefined();
      expect(campground.updatedAt).toBeDefined();
      expect(campground.createdAt).toBeInstanceOf(Date);
      expect(campground.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt timestamp when document is modified', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      const campground = await Campground.create({
        ...mockCampgroundData,
        author: user._id,
      });

      const originalUpdatedAt = campground.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      campground.title = 'Updated Title';
      await campground.save();

      expect(campground.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
