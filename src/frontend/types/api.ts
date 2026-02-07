/**
 * API Types - Request/Response types
 */

import { Campground } from './campground';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface HomePageData {
  featuredCampgrounds: Campground[];
  stats: {
    campgrounds: number;
    reviews: number;
    users: number;
  };
}

export interface FlashMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
