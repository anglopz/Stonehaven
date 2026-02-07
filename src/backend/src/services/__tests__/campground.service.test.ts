import { CampgroundService } from '../campground.service';
import { Campground } from '../../models/Campground';
import { User } from '../../models/User';
import { mockCampgroundData } from '../../__tests__/fixtures/campground.fixture';
import { Types } from 'mongoose';

describe('CampgroundService', () => {
  let service: CampgroundService;
  let testUser: any;

  beforeEach(async () => {
    service = new CampgroundService();
    testUser = await User.create({
      email: 'test@example.com',
      username: 'testuser',
    });
  });

  describe('getAllCampgrounds', () => {
    it('should return all campgrounds', async () => {
      await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      await Campground.create({
        ...mockCampgroundData,
        title: 'Second Campground',
        author: testUser._id,
      });

      const campgrounds = await service.getAllCampgrounds();

      expect(campgrounds).toHaveLength(2);
      expect(campgrounds[0].title).toBe(mockCampgroundData.title);
      expect(campgrounds[1].title).toBe('Second Campground');
    });

    it('should return empty array when no campgrounds exist', async () => {
      const campgrounds = await service.getAllCampgrounds();
      expect(campgrounds).toEqual([]);
    });
  });

  describe('getCampgroundById', () => {
    it('should return a campground by ID with populated fields', async () => {
      const campground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      const found = await service.getCampgroundById(campground._id.toString());

      expect(found).toBeDefined();
      expect(found!._id.toString()).toBe(campground._id.toString());
      expect(found!.title).toBe(campground.title);
    });

    it('should populate author field', async () => {
      const campground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      const found = await service.getCampgroundById(campground._id.toString());

      expect(found).toBeDefined();
      expect(found!.author).toBeDefined();
      expect((found!.author as any).username).toBe('testuser');
    });

    it('should return null for non-existent campground', async () => {
      const fakeId = new Types.ObjectId();
      const found = await service.getCampgroundById(fakeId.toString());
      expect(found).toBeNull();
    });

    it('should populate reviews and their authors', async () => {
      const campground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      const { Review } = require('../../models/Review');
      const review = await Review.create({
        body: 'Great place!',
        rating: 5,
        author: testUser._id,
      });

      campground.reviews.push(review._id);
      await campground.save();

      const found = await service.getCampgroundById(campground._id.toString());

      expect(found).toBeDefined();
      expect(found!.reviews).toHaveLength(1);
      expect((found!.reviews[0] as any).body).toBe('Great place!');
    });
  });

  describe('createCampground', () => {
    it('should create a new campground', async () => {
      const images = [
        { path: 'https://example.com/image1.jpg', filename: 'image1' },
        { path: 'https://example.com/image2.jpg', filename: 'image2' },
      ];

      const geometry = {
        type: 'Point' as const,
        coordinates: [-122.4194, 37.7749] as [number, number],
      };

      const campground = await service.createCampground(
        {
          title: 'New Campground',
          price: 30,
          description: 'A brand new campground',
          location: 'New Location',
        },
        images,
        geometry,
        testUser._id
      );

      expect(campground._id).toBeDefined();
      expect(campground.title).toBe('New Campground');
      expect(campground.images).toHaveLength(2);
      expect(campground.images[0].url).toBe('https://example.com/image1.jpg');
      expect(campground.geometry.coordinates).toEqual([-122.4194, 37.7749]);
      expect(campground.author.toString()).toBe(testUser._id.toString());
    });

    it('should save campground to database', async () => {
      const images = [{ path: 'https://example.com/image1.jpg', filename: 'image1' }];
      const geometry = {
        type: 'Point' as const,
        coordinates: [-122.4194, 37.7749] as [number, number],
      };

      const campground = await service.createCampground(
        {
          title: 'Test Campground',
          price: 25,
          description: 'Test description',
          location: 'Test Location',
        },
        images,
        geometry,
        testUser._id
      );

      const found = await Campground.findById(campground._id);
      expect(found).toBeDefined();
      expect(found!.title).toBe('Test Campground');
    });
  });

  describe('updateCampground', () => {
    it('should update campground basic fields', async () => {
      const campground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      const updated = await service.updateCampground(campground._id.toString(), {
        title: 'Updated Title',
        price: 50,
      });

      expect(updated).toBeDefined();
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.price).toBe(50);
    });

    it('should add new images to campground', async () => {
      const campground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
        images: [{ url: 'https://example.com/old.jpg', filename: 'old' }],
      });

      const newImages = [{ path: 'https://example.com/new.jpg', filename: 'new' }];

      const updated = await service.updateCampground(
        campground._id.toString(),
        {},
        newImages
      );

      expect(updated).toBeDefined();
      expect(updated!.images).toHaveLength(2);
    });

    it('should delete specified images from campground', async () => {
      const campground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
        images: [
          { url: 'https://example.com/image1.jpg', filename: 'image1' },
          { url: 'https://example.com/image2.jpg', filename: 'image2' },
        ],
      });

      const updated = await service.updateCampground(
        campground._id.toString(),
        {},
        undefined,
        ['image1']
      );

      expect(updated).toBeDefined();
      
      // Refetch to get updated image list
      const refetched = await Campground.findById(campground._id);
      expect(refetched!.images).toHaveLength(1);
      expect(refetched!.images[0].filename).toBe('image2');
    });

    it('should return null for non-existent campground', async () => {
      const fakeId = new Types.ObjectId();
      const updated = await service.updateCampground(fakeId.toString(), {
        title: 'Updated',
      });
      expect(updated).toBeNull();
    });
  });

  describe('deleteCampground', () => {
    it('should delete a campground', async () => {
      const campground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      const deleted = await service.deleteCampground(campground._id.toString());

      expect(deleted).toBeDefined();
      expect(deleted!._id.toString()).toBe(campground._id.toString());

      const found = await Campground.findById(campground._id);
      expect(found).toBeNull();
    });

    it('should return null when deleting non-existent campground', async () => {
      const fakeId = new Types.ObjectId();
      const deleted = await service.deleteCampground(fakeId.toString());
      expect(deleted).toBeNull();
    });

    it('should trigger cascade delete for reviews', async () => {
      const campground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      const { Review } = require('../../models/Review');
      const review = await Review.create({
        body: 'Test review',
        rating: 5,
        author: testUser._id,
      });

      campground.reviews.push(review._id);
      await campground.save();

      await service.deleteCampground(campground._id.toString());

      const foundReview = await Review.findById(review._id);
      expect(foundReview).toBeNull();
    });
  });

  describe('getFeaturedCampgrounds', () => {
    it('should return limited number of campgrounds', async () => {
      // Create 5 campgrounds
      for (let i = 0; i < 5; i++) {
        await Campground.create({
          ...mockCampgroundData,
          title: `Campground ${i + 1}`,
          author: testUser._id,
        });
      }

      const featured = await service.getFeaturedCampgrounds(3);

      expect(featured).toHaveLength(3);
    });

    it('should add default image to campgrounds without images', async () => {
      await Campground.create({
        title: 'No Image Campground',
        price: 25,
        description: 'Test',
        location: 'Test Location',
        geometry: mockCampgroundData.geometry,
        author: testUser._id,
        images: [],
      });

      const featured = await service.getFeaturedCampgrounds(1);

      expect(featured[0].images).toHaveLength(1);
      expect(featured[0].images[0].filename).toBe('default-campground');
    });

    it('should not modify campgrounds that already have images', async () => {
      await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      const featured = await service.getFeaturedCampgrounds(1);

      expect(featured[0].images[0].url).toBe(mockCampgroundData.images[0].url);
    });
  });

  describe('getCampgroundCount', () => {
    it('should return correct count of campgrounds', async () => {
      await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      await Campground.create({
        ...mockCampgroundData,
        title: 'Second Campground',
        author: testUser._id,
      });

      const count = await service.getCampgroundCount();
      expect(count).toBe(2);
    });

    it('should return 0 when no campgrounds exist', async () => {
      const count = await service.getCampgroundCount();
      expect(count).toBe(0);
    });
  });
});
