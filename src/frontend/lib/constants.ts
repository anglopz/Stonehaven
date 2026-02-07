/**
 * Application constants
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

export const ROUTES = {
  HOME: '/',
  CAMPGROUNDS: '/campgrounds',
  CAMPGROUND_NEW: '/campgrounds/new',
  CAMPGROUND_DETAIL: (id: string) => `/campgrounds/${id}`,
  CAMPGROUND_EDIT: (id: string) => `/campgrounds/${id}/edit`,
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  MY_CAMPGROUNDS: '/my-campgrounds',
} as const;

export const QUERY_KEYS = {
  CAMPGROUNDS: 'campgrounds',
  CAMPGROUND: 'campground',
  REVIEWS: 'reviews',
  USER: 'user',
  HOME_DATA: 'homeData',
} as const;
