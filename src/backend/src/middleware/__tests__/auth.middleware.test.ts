import { Request, Response, NextFunction } from 'express';
import { isLoggedIn, storeReturnTo, isAuthor, isReviewAuthor } from '../auth.middleware';
import { Campground } from '../../models/Campground';
import { Review } from '../../models/Review';
import { User } from '../../models/User';
import { createMockRequest, createMockResponse, createMockNext } from '../../__tests__/helpers/test-utils';
import { mockCampgroundData } from '../../__tests__/fixtures/campground.fixture';

describe('Auth Middleware', () => {
  describe('isLoggedIn', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = createMockRequest({
        session: {},
        originalUrl: '/campgrounds/new',
      });
      mockRes = createMockResponse();
      mockNext = createMockNext();
    });

    it('should call next() if user is authenticated', () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(true) as any;

      isLoggedIn(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });

    it('should redirect to login if user is not authenticated', () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(false) as any;

      isLoggedIn(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith('/login');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should store returnTo URL in session', () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(false) as any;

      isLoggedIn(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.session!.returnTo).toBe('/campgrounds/new');
    });

    it('should flash error message when not authenticated', () => {
      mockReq.isAuthenticated = jest.fn().mockReturnValue(false) as any;

      isLoggedIn(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.flash).toHaveBeenCalledWith('error', 'You must be signed in');
    });
  });

  describe('storeReturnTo', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = createMockRequest({ session: {} });
      mockRes = { locals: {} } as Response;
      mockNext = createMockNext();
    });

    it('should store returnTo in res.locals if present in session', () => {
      mockReq.session!.returnTo = '/campgrounds/123';

      storeReturnTo(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.locals!.returnTo).toBe('/campgrounds/123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not set res.locals.returnTo if not in session', () => {
      storeReturnTo(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.locals!.returnTo).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should always call next()', () => {
      storeReturnTo(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('isAuthor', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let testUser: any;
    let testCampground: any;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      testCampground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      mockReq = createMockRequest({
        params: { id: testCampground._id.toString() },
        user: { _id: testUser._id },
      });
      mockRes = createMockResponse();
      mockNext = createMockNext();
    });

    it('should call next() if user is the author', async () => {
      await isAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });

    it('should redirect if user is not the author', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        username: 'otheruser',
      });

      mockReq.user = { _id: otherUser._id } as any;

      await isAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith(`/campgrounds/${testCampground._id}`);
      expect(mockReq.flash).toHaveBeenCalledWith('error', 'You do not have permission');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should redirect if campground does not exist', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }; // Non-existent ID

      await isAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith('/campgrounds');
      expect(mockReq.flash).toHaveBeenCalledWith('error', 'Cannot find that campground!');
    });

    it('should redirect if user is not logged in', async () => {
      mockReq.user = undefined;

      await isAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.redirect).toHaveBeenCalled();
      expect(mockReq.flash).toHaveBeenCalledWith('error', 'You do not have permission');
    });

    it('should call next with error if exception occurs', async () => {
      mockReq.params = { id: 'invalid-id' };

      await isAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('isReviewAuthor', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let testUser: any;
    let testCampground: any;
    let testReview: any;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test@example.com',
        username: 'testuser',
      });

      testCampground = await Campground.create({
        ...mockCampgroundData,
        author: testUser._id,
      });

      testReview = await Review.create({
        body: 'Test review',
        rating: 5,
        author: testUser._id,
      });

      mockReq = createMockRequest({
        params: {
          id: testCampground._id.toString(),
          reviewId: testReview._id.toString(),
        },
        user: { _id: testUser._id },
      });
      mockRes = createMockResponse();
      mockNext = createMockNext();
    });

    it('should call next() if user is the review author', async () => {
      await isReviewAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.redirect).not.toHaveBeenCalled();
    });

    it('should redirect if user is not the review author', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        username: 'otheruser',
      });

      mockReq.user = { _id: otherUser._id } as any;

      await isReviewAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith(`/campgrounds/${testCampground._id}`);
      expect(mockReq.flash).toHaveBeenCalledWith('error', 'You do not have permission');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should redirect if review does not exist', async () => {
      mockReq.params!.reviewId = '507f1f77bcf86cd799439011'; // Non-existent ID

      await isReviewAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.redirect).toHaveBeenCalledWith(`/campgrounds/${testCampground._id}`);
      expect(mockReq.flash).toHaveBeenCalledWith('error', 'Cannot find that review!');
    });

    it('should redirect if user is not logged in', async () => {
      mockReq.user = undefined;

      await isReviewAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.redirect).toHaveBeenCalled();
      expect(mockReq.flash).toHaveBeenCalledWith('error', 'You do not have permission');
    });

    it('should call next with error if exception occurs', async () => {
      mockReq.params = { id: testCampground._id.toString(), reviewId: 'invalid-id' };

      await isReviewAuthor(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
