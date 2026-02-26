/**
 * API endpoint functions
 */

import { apiClient } from './axios';
import {
  Campground,
  CampgroundFormData,
  Review,
  ReviewFormData,
  User,
  RegisterData,
  LoginData,
  HomePageData,
} from '@/types';

/**
 * Home API
 */
export const homeApi = {
  /**
   * Get home page data (featured campgrounds and stats)
   */
  getHomeData: async (): Promise<HomePageData> => {
    const response = await apiClient.get('/');
    return response.data;
  },
};

/**
 * Campgrounds API
 */
export const campgroundsApi = {
  /**
   * Get all campgrounds
   */
  getAll: async (): Promise<Campground[]> => {
    const response = await apiClient.get('/campgrounds');
    return response.data;
  },

  /**
   * Get a single campground by ID
   */
  getById: async (id: string): Promise<Campground> => {
    const response = await apiClient.get(`/campgrounds/${id}`);
    return response.data;
  },

  /**
   * Create a new campground
   */
  create: async (data: CampgroundFormData): Promise<Campground> => {
    const formData = new FormData();
    
    formData.append('campground[title]', data.title);
    formData.append('campground[location]', data.location);
    formData.append('campground[price]', data.price.toString());
    formData.append('campground[description]', data.description);

    // Add images if present
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await apiClient.post('/campgrounds', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update a campground
   */
  update: async (id: string, data: CampgroundFormData): Promise<Campground> => {
    const formData = new FormData();
    
    formData.append('campground[title]', data.title);
    formData.append('campground[location]', data.location);
    formData.append('campground[price]', data.price.toString());
    formData.append('campground[description]', data.description);

    // Add new images if present
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    // Add images to delete if present
    if (data.deleteImages && data.deleteImages.length > 0) {
      data.deleteImages.forEach((filename) => {
        formData.append('deleteImages[]', filename);
      });
    }

    const response = await apiClient.put(`/campgrounds/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete a campground
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/campgrounds/${id}`);
  },
};

/**
 * Reviews API
 */
export const reviewsApi = {
  /**
   * Create a review for a campground
   */
  create: async (campgroundId: string, data: ReviewFormData): Promise<Review> => {
    const response = await apiClient.post(`/campgrounds/${campgroundId}/reviews`, {
      review: data,
    });
    return response.data;
  },

  /**
   * Delete a review
   */
  delete: async (campgroundId: string, reviewId: string): Promise<void> => {
    await apiClient.delete(`/campgrounds/${campgroundId}/reviews/${reviewId}`);
  },
};

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post('/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginData): Promise<User> => {
    const response = await apiClient.post('/login', data);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.get('/logout');
  },

  /**
   * Get current user (check if logged in)
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await apiClient.get('/api/user/me');
      return response.data;
    } catch {
      return null;
    }
  },
};
